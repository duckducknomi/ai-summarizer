const FALLBACK_SUMMARY =
  "This is a placeholder summary generated locally. Provide an OpenAI API key to enable live summarization.";

function mockSummarize(input: string) {
  const trimmed = input.trim().replace(/\s+/g, " ");
  if (!trimmed) return FALLBACK_SUMMARY;

  const sentences = trimmed.split(/(?<=[.?!])\s+/).slice(0, 3);
  const candidate = sentences.join(" ");
  return candidate.length > 0 ? candidate : FALLBACK_SUMMARY;
}

type OpenAIResponse =
  | {
      output_text?: string;
    }
  | {
      choices?: Array<{ message?: { content?: string } }>;
    };

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
        input: `Summarize the following text in 2-3 sentences:\n\n${text}`,
      }),
    });

    if (!res.ok) {
      throw new Error(`OpenAI request failed: ${res.status}`);
    }

    const json = (await res.json()) as OpenAIResponse;

    const directText = typeof (json as any)?.output_text === "string"
      ? (json as any).output_text
      : undefined;

    const choiceText = json && "choices" in json
      ? json.choices?.[0]?.message?.content
      : undefined;

    const responseText = directText || choiceText;

    return responseText?.trim() || mockSummarize(text);
  } catch (error) {
    console.error("Failed to summarize with OpenAI", error);
    return mockSummarize(text);
  }
}
