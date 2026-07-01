// POST /api/dispute-chat
// Inline chat tied to a specific lease analysis. Loads the flagged clauses and
// conversation history from Supabase, sends them to Claude, and saves both turns.
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { anthropic, MODEL } from "@/lib/anthropic";

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { analysisId, message } = await req.json() as { analysisId: string; message: string };
  if (!analysisId || !message) {
    return NextResponse.json({ error: "Missing analysisId or message" }, { status: 400 });
  }

  // Verify the analysis belongs to this user
  const { data: analysis, error: analysisErr } = await supabase
    .from("lease_analyses")
    .select("id, summary, flags")
    .eq("id", analysisId)
    .eq("user_id", user.id)
    .single();

  if (analysisErr || !analysis) {
    return NextResponse.json({ error: "Analysis not found" }, { status: 404 });
  }

  // Fetch prior messages for context
  const { data: priorMessages } = await supabase
    .from("chat_messages")
    .select("role, content")
    .eq("analysis_id", analysisId)
    .order("created_at", { ascending: true });

  // Save user message
  await supabase.from("chat_messages").insert({
    analysis_id: analysisId,
    user_id: user.id,
    role: "user",
    content: message,
  });

  const history = (priorMessages ?? []).map((m) => ({
    role: m.role as "user" | "assistant",
    content: m.content,
  }));

  const response = await anthropic.messages.create({
    model: MODEL,
    max_tokens: 1024,
    system: `You are a tenant-rights assistant for Champaign-Urbana, Illinois.
The user's lease has been analyzed. Summary: ${analysis.summary}
Flagged issues: ${JSON.stringify(analysis.flags)}

Help the user understand their rights, draft dispute letters, or negotiate with their landlord.
Be concise, practical, and specific to Illinois tenant law where relevant.`,
    messages: [
      ...history,
      { role: "user", content: message },
    ],
  });

  const reply = response.content[0].type === "text" ? response.content[0].text : "";

  // Save assistant message
  await supabase.from("chat_messages").insert({
    analysis_id: analysisId,
    user_id: user.id,
    role: "assistant",
    content: reply,
  });

  return NextResponse.json({ reply });
}
