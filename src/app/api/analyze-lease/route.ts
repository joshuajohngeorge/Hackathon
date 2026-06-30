import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { anthropic, MODEL } from "@/lib/anthropic";
import { pathToFileURL } from "url";
import { resolve } from "path";

export const runtime = "nodejs";

async function extractPdfText(buffer: ArrayBuffer): Promise<string> {
  // Import pdfjs dynamically so the module-level worker setup runs after
  // the workerSrc is assigned (avoids Next.js module hoisting issues)
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
Analyze the provided lease text and return a JSON object with exactly two fields:
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
    // Strip markdown fences if Claude wrapped the JSON in ```json ... ```
    const cleaned = raw.replace(/^```(?:json)?\s*/i, "").replace(/\s*```\s*$/i, "").trim();
    let parsed: { summary: string; flags: unknown[] };
    try {
      parsed = JSON.parse(cleaned);
    } catch {
      console.error("Raw AI response:", raw);
      return NextResponse.json({ error: "AI returned invalid JSON", raw }, { status: 502 });
    }

    const { data: analysis, error } = await supabase
      .from("lease_analyses")
      .insert({
        user_id: user.id,
        filename: file.name,
        flags: parsed.flags ?? [],
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
