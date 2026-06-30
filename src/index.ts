import "dotenv/config";

import { createHash } from "node:crypto";
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

type CliOptions = {
  repo?: string;
  model?: string;
  embedModel?: string;
  debugPrompt?: string;
  chunks?: string;
  question: string;
};

async function main(): Promise<void> {
  const cliOptions = parseCliOptions(process.argv.slice(2));
  const projectRoot = normalizeProjectRoot(cliOptions.repo ?? process.env.PROJECT_ROOT);
  const model = cliOptions.model ?? process.env.OLLAMA_MODEL ?? "llama3.2";
  const embeddingModel =
    cliOptions.embedModel ?? process.env.OLLAMA_EMBED_MODEL ?? defaultEmbeddingModel;
  const baseUrl = getOllamaBaseUrl();
  const repositoryId = getRepositoryId(projectRoot);
  const indexPath = getRetrievalIndexPath(projectRoot, repositoryId);
  const chunkSizeLines = getPositiveIntegerEnv("CHUNK_SIZE_LINES", defaultChunkSizeLines);
  const chunkOverlapLines = getNonNegativeIntegerEnv(
    "CHUNK_OVERLAP_LINES",
    defaultChunkOverlapLines,
  );
  const retrievedChunks = getPositiveIntegerValue(
    "RETRIEVED_CHUNKS",
    cliOptions.chunks ?? process.env.RETRIEVED_CHUNKS,
    defaultRetrievedChunks,
  );
  const question = cliOptions.question || defaultQuestion;
  const debugPromptPath = cliOptions.debugPrompt ?? process.env.DEBUG_PROMPT_PATH;

  if (chunkOverlapLines >= chunkSizeLines) {
    throw new Error("CHUNK_OVERLAP_LINES must be less than CHUNK_SIZE_LINES.");
  }

  const files = await readUsefulProjectFiles(projectRoot);
  console.log(`Project root: ${projectRoot}`);
  console.log(`Repository id: ${repositoryId}`);
  console.log(`Retrieval index: ${indexPath}`);
  console.log(`Read ${files.length} useful files`);

  const embed = (text: string): Promise<number[]> =>
    embedWithOllama({ baseUrl, model: embeddingModel, prompt: text });
  const { index, rebuilt, rebuildReasons } = await loadOrBuildRetrievalIndex({
    indexPath,
    files,
    rootDirectory: projectRoot,
    repositoryId,
    embeddingModel,
    chunkSizeLines,
    chunkOverlapLines,
    embed,
  });
  console.log(
    `${rebuilt ? "Built" : "Loaded"} retrieval index with ${index.chunks.length} chunks`,
  );
  if (rebuilt) {
    console.log(`Rebuild reasons: ${formatRebuildReasons(rebuildReasons)}`);
  }

  const retrievalResults = await retrieveRelevantChunks(index, question, embed, retrievedChunks);
  console.log("Retrieved chunks:");
  for (const { chunk, score } of retrievalResults) {
    console.log(`- ${chunk.path}:${chunk.startLine}-${chunk.endLine} (${score.toFixed(3)})`);
  }

  const prompt = buildPrompt(chunksToPromptFiles(retrievalResults), question);
  await writeDebugPrompt(prompt, debugPromptPath);
  const answer = await generateWithOllama({ baseUrl, model, prompt });

  console.log(`Model: ${model}`);
  console.log(`Embedding model: ${embeddingModel}`);
  console.log("");
  console.log(answer.trim());
  console.log("");
  console.log(formatSources(retrievalResults));
}

async function writeDebugPrompt(prompt: string, debugPromptPath: string | undefined): Promise<void> {
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

function normalizeProjectRoot(projectRoot: string | undefined): string {
  return path.resolve(projectRoot ?? process.cwd());
}

function parseCliOptions(args: string[]): CliOptions {
  const options: Omit<CliOptions, "question"> = {};
  const positional: string[] = [];

  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];

    if (!arg?.startsWith("--")) {
      if (arg) {
        positional.push(arg);
      }
      continue;
    }

    const value = args[index + 1];
    if (!value || value.startsWith("--")) {
      throw new Error(`${arg} requires a value.`);
    }

    switch (arg) {
      case "--repo":
        options.repo = value;
        break;
      case "--model":
        options.model = value;
        break;
      case "--embed-model":
        options.embedModel = value;
        break;
      case "--debug-prompt":
        options.debugPrompt = value;
        break;
      case "--chunks":
        options.chunks = value;
        break;
      default:
        throw new Error(`Unknown option: ${arg}`);
    }

    index += 1;
  }

  return {
    ...options,
    question: positional.join(" ").trim(),
  };
}

function getRetrievalIndexPath(projectRoot: string, repositoryId: string): string {
  if (process.env.RETRIEVAL_INDEX_PATH) {
    return path.resolve(process.env.RETRIEVAL_INDEX_PATH);
  }

  return path.join(
    process.cwd(),
    "tmp",
    "retrieval-indexes",
    `${path.basename(projectRoot)}-${repositoryId}.json`,
  );
}

function getRepositoryId(projectRoot: string): string {
  return createHash("sha256").update(projectRoot).digest("hex").slice(0, 12);
}

function formatRebuildReasons(rebuildReasons: string[]): string {
  if (rebuildReasons.length === 0) {
    return "none";
  }

  return rebuildReasons.join(", ");
}

function formatSources(
  retrievalResults: Awaited<ReturnType<typeof retrieveRelevantChunks>>,
): string {
  const sources = Array.from(
    new Set(
      retrievalResults.map(
        ({ chunk }) => `${chunk.path}#L${chunk.startLine}-L${chunk.endLine}`,
      ),
    ),
  );

  return ["Sources:", ...sources.map((source) => `- ${source}`)].join("\n");
}

function getPositiveIntegerEnv(name: string, fallback: number): number {
  return getPositiveIntegerValue(name, process.env[name], fallback);
}

function getPositiveIntegerValue(
  name: string,
  value: string | undefined,
  fallback: number,
): number {
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
