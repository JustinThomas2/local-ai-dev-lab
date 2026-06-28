import { readdir, readFile, stat } from "node:fs/promises";
import path from "node:path";
import type { ProjectFile } from "./types";

const ignoredDirectories = new Set([
  ".git",
  "node_modules",
  "dist",
  "build",
]);

const ignoredFiles = new Set([
  "AGENTS.md",
  "PLAN.md",
  "plan.md",
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
  ".gitignore",
]);

export async function readProjectFiles(rootDirectory: string): Promise<ProjectFile[]> {
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
    if (fileStat.size === 0) {
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
  if (ignoredFiles.has(fileName)) {
    return false;
  }

  return usefulExtensions.has(path.extname(fileName)) || usefulExtensions.has(fileName);
}
