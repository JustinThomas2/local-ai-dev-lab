import "dotenv/config";

import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { readUsefulProjectFiles } from "./fileReader";
import { embedWithOllama, generateWithOllama } from "./ollamaClient";
import { buildPrompt } from "./prompt";
import {
  chunksToPromptFiles,
  loadOrBuildRetrievalIndex,
  retrieveRelevantChunks,
} from "./retrievalStore";

const defaultQuestion =
  "Summarize what this project does based only on the provided files.";
const defaultEmbeddingModel = "nomic-embed-text";
const defaultChunkSizeLines = 80;
const defaultChunkOverlapLines = 12;
const defaultRetrievedChunks = 6;

async function main(): Promise<void> {
  const projectRoot = path.resolve(process.env.PROJECT_ROOT ?? process.cwd());
  const model = process.env.OLLAMA_MODEL ?? "llama3.2";
  const embeddingModel = process.env.OLLAMA_EMBED_MODEL ?? defaultEmbeddingModel;
  const baseUrl = getOllamaBaseUrl();
  const indexPath = path.resolve(
    process.env.RETRIEVAL_INDEX_PATH ?? path.join(process.cwd(), "tmp", "retrieval-index.json"),
  );
  const chunkSizeLines = getPositiveIntegerEnv("CHUNK_SIZE_LINES", defaultChunkSizeLines);
  const chunkOverlapLines = getNonNegativeIntegerEnv(
    "CHUNK_OVERLAP_LINES",
    defaultChunkOverlapLines,
  );
  const retrievedChunks = getPositiveIntegerEnv("RETRIEVED_CHUNKS", defaultRetrievedChunks);
  const question = process.argv.slice(2).join(" ").trim() || defaultQuestion;

  if (chunkOverlapLines >= chunkSizeLines) {
    throw new Error("CHUNK_OVERLAP_LINES must be less than CHUNK_SIZE_LINES.");
  }

  const files = await readUsefulProjectFiles(projectRoot);
  console.log(`Read ${files.length} useful files from ${projectRoot}`);

  const embed = (text: string): Promise<number[]> =>
    embedWithOllama({ baseUrl, model: embeddingModel, prompt: text });
  const { index, rebuilt } = await loadOrBuildRetrievalIndex({
    indexPath,
    files,
    rootDirectory: projectRoot,
    embeddingModel,
    chunkSizeLines,
    chunkOverlapLines,
    embed,
  });
  console.log(`${rebuilt ? "Built" : "Loaded"} retrieval index with ${index.chunks.length} chunks`);

  const retrievalResults = await retrieveRelevantChunks(index, question, embed, retrievedChunks);
  console.log("Retrieved chunks:");
  for (const { chunk, score } of retrievalResults) {
    console.log(`- ${chunk.path}:${chunk.startLine}-${chunk.endLine} (${score.toFixed(3)})`);
  }

  const prompt = buildPrompt(chunksToPromptFiles(retrievalResults), question);
  await writeDebugPrompt(prompt);
  const answer = await generateWithOllama({ baseUrl, model, prompt });

  console.log(`Model: ${model}`);
  console.log(`Embedding model: ${embeddingModel}`);
  console.log("");
  console.log(answer.trim());
}

async function writeDebugPrompt(prompt: string): Promise<void> {
  const debugPromptPath = process.env.DEBUG_PROMPT_PATH;
  if (!debugPromptPath) {
    return;
  }

  await mkdir(path.dirname(debugPromptPath), { recursive: true });
  await writeFile(debugPromptPath, prompt);
}

function getOllamaBaseUrl(): string {
  if (process.env.OLLAMA_BASE_URL) {
    return process.env.OLLAMA_BASE_URL;
  }

  throw new Error(
    [
      "OLLAMA_BASE_URL is required.",
      "Example: OLLAMA_BASE_URL=http://127.0.0.1:11434 npm run dev",
    ].join(" "),
  );
}

function getPositiveIntegerEnv(name: string, fallback: number): number {
  const value = process.env[name];
  if (!value) {
    return fallback;
  }

  const parsedValue = Number.parseInt(value, 10);
  if (!Number.isInteger(parsedValue) || parsedValue <= 0) {
    throw new Error(`${name} must be a positive integer.`);
  }

  return parsedValue;
}

function getNonNegativeIntegerEnv(name: string, fallback: number): number {
  const value = process.env[name];
  if (!value) {
    return fallback;
  }

  const parsedValue = Number.parseInt(value, 10);
  if (!Number.isInteger(parsedValue) || parsedValue < 0) {
    throw new Error(`${name} must be a non-negative integer.`);
  }

  return parsedValue;
}

main().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : String(error);
  console.error(`Error: ${message}`);
  process.exitCode = 1;
});
