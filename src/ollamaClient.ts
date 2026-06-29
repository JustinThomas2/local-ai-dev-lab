import type { OllamaGenerateResponse } from "./types";

type GenerateOptions = {
  baseUrl: string;
  model: string;
  prompt: string;
};

export async function generateWithOllama({
  baseUrl,
  model,
  prompt,
}: GenerateOptions): Promise<string> {
  const response = await fetch(`${baseUrl.replace(/\/$/, "")}/api/generate`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model,
      prompt,
      options: {
        temperature: 0.1,
        num_predict: 300,
      },
      stream: false,
    }),
  });

  const body = (await response.json()) as OllamaGenerateResponse;

  if (!response.ok) {
    throw new Error(body.error ?? `Ollama request failed with ${response.status}`);
  }

  if (!body.response) {
    throw new Error("Ollama returned an empty response.");
  }

  return body.response;
}
