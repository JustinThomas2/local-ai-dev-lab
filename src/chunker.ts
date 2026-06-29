import type { ProjectChunk, ProjectFile } from "./types";

export type ChunkFilesOptions = {
  chunkSizeLines: number;
  chunkOverlapLines: number;
};

export function chunkFiles(
  files: ProjectFile[],
  { chunkSizeLines, chunkOverlapLines }: ChunkFilesOptions,
): ProjectChunk[] {
  if (chunkSizeLines <= 0) {
    throw new Error("chunkSizeLines must be greater than zero.");
  }

  if (chunkOverlapLines < 0 || chunkOverlapLines >= chunkSizeLines) {
    throw new Error("chunkOverlapLines must be zero or less than chunkSizeLines.");
  }

  const chunks: ProjectChunk[] = [];

  for (const file of files) {
    chunks.push(...chunkFile(file, chunkSizeLines, chunkOverlapLines));
  }

  return chunks;
}

function chunkFile(
  file: ProjectFile,
  chunkSizeLines: number,
  chunkOverlapLines: number,
): ProjectChunk[] {
  const lines = file.content.split(/\r?\n/);
  const chunks: ProjectChunk[] = [];
  const stepSize = chunkSizeLines - chunkOverlapLines;

  for (let startIndex = 0; startIndex < lines.length; startIndex += stepSize) {
    const chunkLines = lines.slice(startIndex, startIndex + chunkSizeLines);
    const content = chunkLines.join("\n").trim();

    if (!content) {
      continue;
    }

    const startLine = startIndex + 1;
    const endLine = startIndex + chunkLines.length;
    chunks.push({
      id: `${file.path}:${startLine}-${endLine}`,
      path: file.path,
      startLine,
      endLine,
      content,
    });

    if (startIndex + chunkSizeLines >= lines.length) {
      break;
    }
  }

  return chunks;
}
