import { readdir, readFile, stat } from "node:fs/promises";
import path from "node:path";
import type { ProjectFile } from "./types";

const maxFileBytes = 20_000;

const ignoredDirectories = new Set([
  ".angular",
  ".cache",
  ".git",
  ".gradle",
  ".idea",
  ".mvn",
  ".next",
  ".turbo",
  "build",
  "coverage",
  "dist",
  "node_modules",
  "out",
  "target",
  "tmp",
]);

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

export async function readUsefulProjectFiles(rootDirectory: string): Promise<ProjectFile[]> {
  const files: ProjectFile[] = [];
  await collectFiles(rootDirectory, rootDirectory, files);
  return files.sort((first, second) => first.path.localeCompare(second.path));
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
