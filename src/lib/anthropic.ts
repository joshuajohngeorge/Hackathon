// Shared Anthropic client and model name — import these in any API route that calls Claude.
import Anthropic from "@anthropic-ai/sdk";

export const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
export const MODEL = "claude-sonnet-4-6";
