// POST /api/analyze-lease
// Accepts a PDF upload, extracts text via pdfjs, sends it to Claude for analysis,
// and saves the result (summary + flagged clauses) to the lease_analyses table.
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { anthropic, MODEL } from "@/lib/anthropic";
import { pathToFileURL } from "url";
import { resolve } from "path";

export const runtime = "nodejs";

type AiLeaseFlag = {
  clause: string;
  text: string;
  severity: "high" | "medium" | "low";
  explanation: string;
};

type AiLeaseAnalysis = {
  summary: string;
  flags: AiLeaseFlag[];
};

function normalizeFlag(flag: Partial<AiLeaseFlag>): AiLeaseFlag {
  const severity = flag.severity === "high" || flag.severity === "medium" || flag.severity === "low"
    ? flag.severity
    : "medium";

  return {
    clause: String(flag.clause ?? "Lease issue").slice(0, 120),
    text: String(flag.text ?? "").slice(0, 240),
    severity,
    explanation: String(flag.explanation ?? "Review this clause carefully before signing.").slice(0, 500),
  };
}

function normalizeFlags(aiFlags: unknown[]): AiLeaseFlag[] {
  const merged: AiLeaseFlag[] = [];
  const seen = new Set<string>();

  aiFlags.forEach((flag) => {
    if (!flag || typeof flag !== "object") return;

    const normalized = normalizeFlag(flag as Partial<AiLeaseFlag>);
    const key = `${normalized.clause.toLowerCase()}:${normalized.text.slice(0, 80).toLowerCase()}`;
    if (seen.has(key)) return;
    seen.add(key);
    merged.push(normalized);
  });

  return merged.slice(0, 12);
}

// Strips markdown fences and any preamble/postamble text Claude sometimes adds,
// leaving just the raw JSON object.
function extractJsonBlob(raw: string): string {
  let s = raw.replace(/^```(?:json)?\s*/i, "").replace(/\s*```\s*$/i, "").trim();
  const start = s.indexOf("{");
  const end = s.lastIndexOf("}");
  if (start !== -1 && end > start) s = s.slice(start, end + 1);
  return s;
}

// If the response was cut off by max_tokens, walks the JSON char by char to
// close any unclosed arrays/objects so it can still be parsed.
function repairTruncated(blob: string): string {
  // Close any open arrays/objects
  const stack: string[] = [];
  let inString = false;
  let escape = false;
  for (const ch of blob) {
    if (escape) { escape = false; continue; }
    if (ch === "\\" && inString) { escape = true; continue; }
    if (ch === '"') { inString = !inString; continue; }
    if (inString) continue;
    if (ch === "{" || ch === "[") stack.push(ch === "{" ? "}" : "]");
    else if (ch === "}" || ch === "]") stack.pop();
  }
  // Remove trailing comma before we close
  let repaired = blob.trimEnd().replace(/,\s*$/, "");
  // Close open structures in reverse order
  for (let i = stack.length - 1; i >= 0; i--) repaired += stack[i];
  return repaired;
}

function parseAiResponse(raw: string, stopReason: string | null): AiLeaseAnalysis | null {
  const blob = extractJsonBlob(raw);

  // First try: parse as-is
  try {
    const j = JSON.parse(blob) as Partial<AiLeaseAnalysis>;
    return {
      summary: typeof j.summary === "string" ? j.summary : "",
      flags: Array.isArray(j.flags) ? normalizeFlags(j.flags) : [],
    };
  } catch { /* fall through */ }

  // Second try: if truncated by max_tokens, attempt structural repair
  if (stopReason === "max_tokens") {
    try {
      const j = JSON.parse(repairTruncated(blob)) as Partial<AiLeaseAnalysis>;
      return {
        summary: typeof j.summary === "string" ? j.summary : "",
        flags: Array.isArray(j.flags) ? normalizeFlags(j.flags) : [],
      };
    } catch { /* fall through */ }
  }

  return null;
}

// Extracts plain text from a PDF buffer page by page using pdfjs-dist.
// Dynamic import avoids Next.js module hoisting issues with the worker path.
async function extractPdfText(buffer: ArrayBuffer): Promise<string> {
  // pdfjs references DOMMatrix which doesn't exist in Node.js — stub it out.
  if (typeof globalThis.DOMMatrix === "undefined") {
    // @ts-expect-error — intentional Node.js polyfill for pdfjs
    globalThis.DOMMatrix = class DOMMatrix {
      constructor() { return this; }
    };
  }

  const pdfjs = await import("pdfjs-dist/legacy/build/pdf.mjs");

  pdfjs.GlobalWorkerOptions.workerSrc = pathToFileURL(
    resolve(process.cwd(), "node_modules/pdfjs-dist/legacy/build/pdf.worker.min.mjs")
  ).href;

  const doc = await pdfjs.getDocument({ data: new Uint8Array(buffer) }).promise;
  const pages: string[] = [];

  for (let i = 1; i <= doc.numPages; i++) {
    const page = await doc.getPage(i);
    const content = await page.getTextContent();
    const pageText = content.items
      .map((item) => ("str" in item ? item.str : ""))
      .join(" ");
    pages.push(pageText);
    page.cleanup();
  }

  await doc.destroy();
  return pages.join("\n\n");
}

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const form = await req.formData();
    const file = form.get("file") as File | null;
    if (!file) return NextResponse.json({ error: "No file provided" }, { status: 400 });

    const buffer = await file.arrayBuffer();

    let text: string;
    try {
      text = await extractPdfText(buffer);
    } catch (pdfErr) {
      console.error("PDF parse error:", pdfErr);
      return NextResponse.json(
        { error: `Failed to read PDF: ${(pdfErr as Error).message}` },
        { status: 422 }
      );
    }

    if (!text.trim()) {
      return NextResponse.json(
        { error: "No text could be extracted. The PDF may be a scanned image — try a text-based PDF." },
        { status: 422 }
      );
    }

    const message = await anthropic.messages.create({
      model: MODEL,
      max_tokens: 8192,
      system: `You are a tenant-rights assistant specializing in Champaign-Urbana, Illinois leases.

Return a JSON object with exactly two fields:
- "summary": a 2-3 sentence plain-English summary of the lease
- "flags": an array of the TOP 10 most important issues, each with:
  - "clause": short name of the clause (e.g. "Early Termination Fee")
  - "text": the exact problematic excerpt (max 150 chars)
  - "severity": one of "high" | "medium" | "low"
  - "explanation": 1-2 sentences explaining why this is a concern for CU tenants

Return at most 10 flags, prioritizing the most severe. Respond with ONLY the raw JSON object, no markdown fences.`,
      messages: [{ role: "user", content: `Lease text:\n\n${text.slice(0, 80000)}` }],
    });

    const raw = message.content[0].type === "text" ? message.content[0].text : "";

    // Attempt to parse, with progressive fallbacks for common Claude quirks
    const parsed = parseAiResponse(raw, message.stop_reason);
    if (!parsed) {
      console.error("Raw AI response:", raw);
      return NextResponse.json({ error: "AI returned invalid JSON", raw }, { status: 502 });
    }

    const { data: analysis, error } = await supabase
      .from("lease_analyses")
      .insert({
        user_id: user.id,
        filename: file.name,
        flags: parsed.flags,
        summary: parsed.summary ?? "",
      })
      .select()
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    return NextResponse.json(analysis);
  } catch (err) {
    console.error("analyze-lease error:", err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
