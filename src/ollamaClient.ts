import type { OllamaEmbeddingResponse, OllamaGenerateResponse } from "./types";

type GenerateOptions = {
  baseUrl: string;
  model: string;
  prompt: string;
};

type EmbeddingOptions = {
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

export async function embedWithOllama({
  baseUrl,
  model,
  prompt,
}: EmbeddingOptions): Promise<number[]> {
  const response = await fetch(`${baseUrl.replace(/\/$/, "")}/api/embed`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model,
      input: prompt,
    }),
  });

  const body = (await response.json()) as OllamaEmbeddingResponse;

  if (!response.ok) {
    throw new Error(body.error ?? `Ollama embedding request failed with ${response.status}`);
  }

  const embedding = body.embeddings?.[0] ?? body.embedding;

  if (!embedding || embedding.length === 0) {
    throw new Error("Ollama returned an empty embedding.");
  }

  return embedding;
}
