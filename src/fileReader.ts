import { readdir, readFile, stat } from "node:fs/promises";
import path from "node:path";
import type { ProjectFile } from "./types";

const maxFiles = 8;
const maxFileBytes = 20_000;

const ignoredDirectories = new Set([".git", "node_modules", "dist", "build"]);

const ignoredFiles = new Set([
  "agents.md",
  "package-lock.json",
  "yarn.lock",
  "pnpm-lock.yaml",
]);

const usefulExtensions = new Set([
  ".md",
  ".ts",
  ".tsx",
  ".js",
  ".jsx",
  ".json",
  ".env.example",
  ".gitignore",
]);

export async function readProjectFiles(
  rootDirectory: string,
  question: string,
): Promise<ProjectFile[]> {
  const files: ProjectFile[] = [];
  await collectFiles(rootDirectory, rootDirectory, files);
  const candidateFiles = getCandidateFiles(files, question);
  const scoredFiles = candidateFiles
    .map((file) => ({
      file,
      score: scoreFile(file, question),
    }))
    .filter((scoredFile) => scoredFile.score > 0);

  return scoredFiles
    .sort((first, second) => {
      const scoreDifference = second.score - first.score;

      if (scoreDifference !== 0) {
        return scoreDifference;
      }

      return first.file.path.localeCompare(second.file.path);
    })
    .slice(0, maxFiles)
    .map((scoredFile) => scoredFile.file);
}

async function collectFiles(
  rootDirectory: string,
  currentDirectory: string,
  files: ProjectFile[],
): Promise<void> {
  const entries = await readdir(currentDirectory, { withFileTypes: true });

  for (const entry of entries) {
    if (entry.isDirectory() && ignoredDirectories.has(entry.name)) {
      continue;
    }

    const absolutePath = path.join(currentDirectory, entry.name);

    if (entry.isDirectory()) {
      await collectFiles(rootDirectory, absolutePath, files);
      continue;
    }

    if (!entry.isFile() || !isUsefulFile(entry.name)) {
      continue;
    }

    const fileStat = await stat(absolutePath);
    if (fileStat.size === 0 || fileStat.size > maxFileBytes) {
      continue;
    }

    const content = await readFile(absolutePath, "utf8");
    files.push({
      path: path.relative(rootDirectory, absolutePath),
      content,
    });
  }
}

function isUsefulFile(fileName: string): boolean {
  const normalizedFileName = fileName.toLowerCase();

  if (ignoredFiles.has(normalizedFileName)) {
    return false;
  }

  return (
    usefulExtensions.has(path.extname(normalizedFileName)) ||
    usefulExtensions.has(normalizedFileName)
  );
}

function scoreFile(file: ProjectFile, question: string): number {
  const keywords = getQuestionKeywords(question);
  const searchablePath = normalizeFilePath(file.path);
  const searchableContent = file.content.toLowerCase();
  let score = 0;

  for (const keyword of keywords) {
    if (searchablePath.includes(keyword)) {
      score += 8;
    }

    if (searchableContent.includes(keyword)) {
      score += 2;
    }
  }

  if (isProjectDocsQuestion(question)) {
    score += getProjectDocsBoost(file.path);
  } else if (isSourceCodeQuestion(question)) {
    score += getSourceCodeBoost(file.path);
  } else {
    score += getBalancedBoost(file.path);
  }

  return score;
}

function getCandidateFiles(files: ProjectFile[], question: string): ProjectFile[] {
  if (isProjectDocsQuestion(question)) {
    return files.filter((file) => isPlanFile(file.path) || isReadmeFile(file.path) || isNotesFile(file.path));
  }

  if (isOllamaImplementationQuestion(question)) {
    return files.filter((file) => isOllamaImplementationFile(file.path, question));
  }

  return files.filter((file) => shouldIncludeCandidate(file.path, question));
}

function shouldIncludeCandidate(filePath: string, question: string): boolean {
  if (isProjectDocsQuestion(question)) {
    return isPlanFile(filePath) || isReadmeFile(filePath) || isNotesFile(filePath);
  }

  if (isSourceCodeQuestion(question)) {
    return isSourceFile(filePath) || isPackageFile(filePath) || isReadmeFile(filePath);
  }

  return true;
}

function getProjectDocsBoost(filePath: string): number {
  if (isPlanFile(filePath)) {
    return 40;
  }

  if (isReadmeFile(filePath)) {
    return 30;
  }

  if (isNotesFile(filePath)) {
    return 20;
  }

  return 0;
}

function getSourceCodeBoost(filePath: string): number {
  if (isSourceFile(filePath)) {
    return 40;
  }

  if (isPackageFile(filePath)) {
    return 20;
  }

  if (isReadmeFile(filePath)) {
    return 10;
  }

  return 0;
}

function getBalancedBoost(filePath: string): number {
  if (isReadmeFile(filePath)) {
    return 20;
  }

  if (isPlanFile(filePath)) {
    return 16;
  }

  if (isSourceFile(filePath)) {
    return 14;
  }

  if (isNotesFile(filePath)) {
    return 12;
  }

  if (isPackageFile(filePath)) {
    return 8;
  }

  if (getFileName(filePath) === ".env.example") {
    return 6;
  }

  return 0;
}

function getQuestionKeywords(question: string): string[] {
  const ignoredWords = new Set([
    "about",
    "does",
    "from",
    "how",
    "project",
    "that",
    "the",
    "this",
    "what",
    "when",
    "where",
    "which",
    "with",
  ]);

  return Array.from(
    new Set(
      question
        .toLowerCase()
        .match(/[a-z0-9]+/g)
        ?.filter((word) => word.length > 2 && !ignoredWords.has(word)) ?? [],
    ),
  );
}

function isProjectDocsQuestion(question: string): boolean {
  const normalizedQuestion = question.toLowerCase();
  const projectTerms = [
    "phase",
    "status",
    "roadmap",
    "plan",
    "planned",
    "next",
    "current goal",
    "future",
    "long-term direction",
    "next planned phases",
    "should not be built",
    "avoid",
    "overbuild",
    "limitation",
    "limitations",
    "constraint",
    "constraints",
  ];

  return projectTerms.some((term) => normalizedQuestion.includes(term));
}

function isSourceCodeQuestion(question: string): boolean {
  const normalizedQuestion = question.toLowerCase();
  const sourceTerms = [
    "implementation",
    "source",
    "code",
    "function",
    "class",
    "bug",
    "error",
    "typescript",
    "src",
  ];

  return sourceTerms.some((term) => normalizedQuestion.includes(term));
}

function isOllamaImplementationQuestion(question: string): boolean {
  return question.toLowerCase().includes("ollama") && isSourceCodeQuestion(question);
}

function isOllamaImplementationFile(filePath: string, question: string): boolean {
  const normalizedPath = normalizeFilePath(filePath);

  return (
    normalizedPath === "src/ollamaclient.ts" ||
    normalizedPath === "src/index.ts" ||
    (isPromptQuestion(question) && normalizedPath === "src/prompt.ts") ||
    isReadmeFile(filePath) ||
    getFileName(filePath) === ".env.example"
  );
}

function isPromptQuestion(question: string): boolean {
  const normalizedQuestion = question.toLowerCase();
  return normalizedQuestion.includes("prompt") || normalizedQuestion.includes("context construction");
}

function isPlanFile(filePath: string): boolean {
  const normalizedPath = normalizeFilePath(filePath);
  return normalizedPath === "docs/plan.md" || getFileName(filePath) === "plan.md";
}

function isReadmeFile(filePath: string): boolean {
  return getFileName(filePath) === "readme.md";
}

function isNotesFile(filePath: string): boolean {
  return normalizeFilePath(filePath).startsWith("notes/") && getFileName(filePath).endsWith(".md");
}

function isPackageFile(filePath: string): boolean {
  return getFileName(filePath) === "package.json";
}

function isSourceFile(filePath: string): boolean {
  return normalizeFilePath(filePath).startsWith("src/");
}

function normalizeFilePath(filePath: string): string {
  return filePath.toLowerCase().split(path.sep).join("/");
}

function getFileName(filePath: string): string {
  return path.basename(filePath).toLowerCase();
}
