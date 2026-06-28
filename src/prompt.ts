import type { ProjectFile } from "./types";

export function buildPrompt(files: ProjectFile[], question: string): string {
  const formattedFiles = files
    .map((file) => {
      return [
        `<file path="${file.path}">`,
        file.content.trim(),
        "</file>",
      ].join("\n");
    })
    .join("\n\n");

  return [
    "You are a codebase assistant.",
    "This is a question-answering task, not a code modification task.",
    "Answer the question using only the provided files.",
    "If the files do not contain enough information, say what is missing.",
    "Keep the answer focused on the question. Do not suggest changes unless asked.",
    "Return only the direct answer. Do not repeat the prompt, include examples, or output code.",
    "Do not include source citations or a Sources section.",
    "",
    `Question: ${question}`,
    "",
    "Provided files:",
    formattedFiles,
    "",
    "Answer:",
  ].join("\n");
}
