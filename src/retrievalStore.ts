import { createHash } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { chunkFiles, type ChunkFilesOptions } from "./chunker";
import type { EmbeddedChunk, ProjectChunk, ProjectFile, RetrievalIndex } from "./types";

type BuildRetrievalIndexOptions = ChunkFilesOptions & {
  rootDirectory: string;
  repositoryId: string;
  embeddingModel: string;
  embed: (text: string) => Promise<number[]>;
};

type LoadOrBuildRetrievalIndexOptions = BuildRetrievalIndexOptions & {
  indexPath: string;
  files: ProjectFile[];
};

type SearchResult = {
  chunk: EmbeddedChunk;
  score: number;
};

const indexVersion = 2;

type IndexMismatchReason =
  | "missing"
  | "version"
  | "rootDirectory"
  | "repositoryId"
  | "embeddingModel"
  | "chunkSizeLines"
  | "chunkOverlapLines"
  | "filesHash";

export async function loadOrBuildRetrievalIndex({
  indexPath,
  files,
  rootDirectory,
  repositoryId,
  embeddingModel,
  chunkSizeLines,
  chunkOverlapLines,
  embed,
}: LoadOrBuildRetrievalIndexOptions): Promise<{
  index: RetrievalIndex;
  rebuilt: boolean;
  rebuildReasons: IndexMismatchReason[];
}> {
  const filesHash = hashFiles(files);
  const cachedIndex = await readCachedIndex(indexPath);
  const rebuildReasons = getIndexMismatchReasons(cachedIndex, {
    rootDirectory,
    repositoryId,
    embeddingModel,
    chunkSizeLines,
    chunkOverlapLines,
    filesHash,
  });

  if (cachedIndex && rebuildReasons.length === 0) {
    return { index: cachedIndex, rebuilt: false, rebuildReasons };
  }

  const index = await buildRetrievalIndex(files, {
    rootDirectory,
    repositoryId,
    embeddingModel,
    chunkSizeLines,
    chunkOverlapLines,
    embed,
  });

  await mkdir(path.dirname(indexPath), { recursive: true });
  await writeFile(indexPath, `${JSON.stringify(index, null, 2)}\n`);

  return { index, rebuilt: true, rebuildReasons };
}

export async function retrieveRelevantChunks(
  index: RetrievalIndex,
  question: string,
  embed: (text: string) => Promise<number[]>,
  limit: number,
): Promise<SearchResult[]> {
  const questionEmbedding = await embed(question);

  return index.chunks
    .map((chunk) => ({
      chunk,
      score: cosineSimilarity(questionEmbedding, chunk.embedding),
    }))
    .sort((first, second) => second.score - first.score)
    .slice(0, limit);
}

export function chunksToPromptFiles(results: SearchResult[]): ProjectFile[] {
  return results.map(({ chunk }) => ({
    path: `${chunk.path}#L${chunk.startLine}-L${chunk.endLine}`,
    content: chunk.content,
  }));
}

async function buildRetrievalIndex(
  files: ProjectFile[],
  {
    rootDirectory,
    repositoryId,
    embeddingModel,
    chunkSizeLines,
    chunkOverlapLines,
    embed,
  }: BuildRetrievalIndexOptions,
): Promise<RetrievalIndex> {
  const chunks = chunkFiles(files, { chunkSizeLines, chunkOverlapLines });
  const embeddedChunks: EmbeddedChunk[] = [];

  for (const chunk of chunks) {
    embeddedChunks.push({
      ...chunk,
      embedding: await embed(formatChunkForEmbedding(chunk)),
    });
  }

  return {
    version: indexVersion,
    rootDirectory,
    repositoryId,
    embeddingModel,
    chunkSizeLines,
    chunkOverlapLines,
    filesHash: hashFiles(files),
    chunks: embeddedChunks,
  };
}

function getIndexMismatchReasons(
  cachedIndex: RetrievalIndex | undefined,
  expected: {
    rootDirectory: string;
    repositoryId: string;
    embeddingModel: string;
    chunkSizeLines: number;
    chunkOverlapLines: number;
    filesHash: string;
  },
): IndexMismatchReason[] {
  if (!cachedIndex) {
    return ["missing"];
  }

  const reasons: IndexMismatchReason[] = [];

  if (cachedIndex.version !== indexVersion) {
    reasons.push("version");
  }

  if (cachedIndex.rootDirectory !== expected.rootDirectory) {
    reasons.push("rootDirectory");
  }

  if (cachedIndex.repositoryId !== expected.repositoryId) {
    reasons.push("repositoryId");
  }

  if (cachedIndex.embeddingModel !== expected.embeddingModel) {
    reasons.push("embeddingModel");
  }

  if (cachedIndex.chunkSizeLines !== expected.chunkSizeLines) {
    reasons.push("chunkSizeLines");
  }

  if (cachedIndex.chunkOverlapLines !== expected.chunkOverlapLines) {
    reasons.push("chunkOverlapLines");
  }

  if (cachedIndex.filesHash !== expected.filesHash) {
    reasons.push("filesHash");
  }

  return reasons;
}

async function readCachedIndex(indexPath: string): Promise<RetrievalIndex | undefined> {
  try {
    const rawIndex = await readFile(indexPath, "utf8");
    return JSON.parse(rawIndex) as RetrievalIndex;
  } catch (error: unknown) {
    if (error instanceof Error && "code" in error && error.code === "ENOENT") {
      return undefined;
    }

    throw error;
  }
}

function hashFiles(files: ProjectFile[]): string {
  const hash = createHash("sha256");

  for (const file of files) {
    hash.update(file.path);
    hash.update("\0");
    hash.update(file.content);
    hash.update("\0");
  }

  return hash.digest("hex");
}

function formatChunkForEmbedding(chunk: ProjectChunk): string {
  return [`Path: ${chunk.path}`, `Lines: ${chunk.startLine}-${chunk.endLine}`, "", chunk.content].join(
    "\n",
  );
}

function cosineSimilarity(first: number[], second: number[]): number {
  if (first.length !== second.length) {
    throw new Error("Cannot compare embeddings with different dimensions.");
  }

  let dotProduct = 0;
  let firstMagnitude = 0;
  let secondMagnitude = 0;

  for (let index = 0; index < first.length; index += 1) {
    const firstValue = first[index] ?? 0;
    const secondValue = second[index] ?? 0;
    dotProduct += firstValue * secondValue;
    firstMagnitude += firstValue * firstValue;
    secondMagnitude += secondValue * secondValue;
  }

  if (firstMagnitude === 0 || secondMagnitude === 0) {
    return 0;
  }

  return dotProduct / (Math.sqrt(firstMagnitude) * Math.sqrt(secondMagnitude));
}
