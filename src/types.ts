export type ProjectFile = {
  path: string;
  content: string;
};

export type ProjectChunk = {
  id: string;
  path: string;
  startLine: number;
  endLine: number;
  content: string;
};

export type EmbeddedChunk = ProjectChunk & {
  embedding: number[];
};

export type RetrievalIndex = {
  version: number;
  rootDirectory: string;
  repositoryId: string;
  embeddingModel: string;
  chunkSizeLines: number;
  chunkOverlapLines: number;
  filesHash: string;
  chunks: EmbeddedChunk[];
};

export type OllamaGenerateResponse = {
  response?: string;
  error?: string;
};

export type OllamaEmbeddingResponse = {
  embeddings?: number[][];
  embedding?: number[];
  error?: string;
};
