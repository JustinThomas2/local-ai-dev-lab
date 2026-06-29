import "dotenv/config";

import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { readProjectFiles } from "./fileReader";
import { generateWithOllama } from "./ollamaClient";
import { buildPrompt } from "./prompt";

const defaultQuestion =
  "Summarize what this project does based only on the provided files.";

async function main(): Promise<void> {
  const projectRoot = process.env.PROJECT_ROOT ?? process.cwd();
  const model = process.env.OLLAMA_MODEL ?? "llama3.2";
  const baseUrl = getOllamaBaseUrl();
  const question = process.argv.slice(2).join(" ").trim() || defaultQuestion;

  const files = await readProjectFiles(projectRoot, question);
  console.log(`Read ${files.length} files from ${projectRoot}`);
  console.log("Selected files:");
  for (const file of files) {
    console.log(`- ${file.path}`);
  }

  const prompt = buildPrompt(files, question);
  await writeDebugPrompt(prompt);
  const answer = await generateWithOllama({ baseUrl, model, prompt });

  console.log(`Model: ${model}`);
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

main().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : String(error);
  console.error(`Error: ${message}`);
  process.exitCode = 1;
});
