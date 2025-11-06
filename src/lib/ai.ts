const FALLBACK_SUMMARY =
  "This is a placeholder summary generated locally. Provide an OpenAI API key to enable live summarization.";

function mockSummarize(input: string) {
  const trimmed = input.trim().replace(/\s+/g, " ");
  if (!trimmed) return FALLBACK_SUMMARY;
  const sentences = trimmed.split(/(?<=[.?!])\s+/).slice(0, 3);
  const candidate = sentences.join(" ");
  return candidate.length > 0 ? candidate : FALLBACK_SUMMARY;
}

type OpenAIChoiceMessage = { content?: string };
type OpenAIChoice = { message?: OpenAIChoiceMessage };
type OpenAIResponse = { output_text?: string } | { choices?: OpenAIChoice[] };

function hasOutputText(x: unknown): x is { output_text: string } {
  return (
    typeof x === "object" &&
    x !== null &&
    "output_text" in x &&
    typeof (x as Record<string, unknown>).output_text === "string"
  );
}

function hasChoices(x: unknown): x is { choices: OpenAIChoice[] } {
  if (typeof x !== "object" || x === null || !("choices" in x)) return false;
  const c = (x as Record<string, unknown>).choices;
  if (!Array.isArray(c)) return false;
  // We only care that choices[0]?.message?.content is string if present
  const first = c[0];
  const msg = first?.message;
  return (
    msg === undefined ||
    (typeof msg === "object" &&
      (msg?.content === undefined || typeof msg?.content === "string"))
  );
}

export async function summarizeText(text: string): Promise<string> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return mockSummarize(text);
  }

  try {
    const res = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        input: `Provide a clear, coherent summary of the following text:\n\n${text}`,
      }),
    });

    if (!res.ok) {
      // Surface upstream failure as a controlled error; caller maps to user-friendly text
      throw new Error(`OpenAI request failed: ${res.status}`);
    }

    const json: unknown = await res.json();

    // Prefer output_text (Responses API), else fall back to choices[0].message.content
    const directText = hasOutputText(json) ? json.output_text : undefined;
    const choiceText =
      hasChoices(json) &&
      typeof json.choices?.[0]?.message?.content === "string"
        ? json.choices[0]!.message!.content
        : undefined;

    const responseText = (directText ?? choiceText)?.trim();
    return responseText && responseText.length > 0
      ? responseText
      : mockSummarize(text);
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Unknown error";
    console.error("Failed to summarize with OpenAI:", msg);
    return mockSummarize(text);
  }
}
