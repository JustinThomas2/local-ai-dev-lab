# AGENTS.md

## Project Context

This repo is a local AI developer tooling sandbox for self-hosted LLM workflows, local inference, codebase understanding, embeddings, retrieval, RAG, and internal developer productivity tools.

The current goal is to build a small local codebase assistant that can read a project, retrieve relevant context, and answer questions through Ollama.

## Source of Truth

Always read `docs/plan.md` before making changes.

`docs/plan.md` defines:

- the current phase
- what should be built now
- what should not be built yet
- project constraints and sequencing

If this file and `docs/plan.md` disagree, follow `docs/plan.md`.

## Current Pipeline

The assistant is evolving toward this flow:

```text
local files
  -> read useful content
  -> chunk content
  -> embed chunks
  -> retrieve relevant chunks for a question
  -> format prompt context
  -> call Ollama
  -> answer
```

## Current Repo Boundaries

Do not add these unless `docs/plan.md` explicitly calls for them:

- UI
- auth
- autonomous agents
- tool calling
- vector database
- Dockerized Ollama
- Kubernetes
- multi-model benchmarking
- production deployment infrastructure

Embeddings and retrieval are allowed because they are part of the current project direction.

## Expected File Responsibilities

Preserve clear module boundaries.

```text
fileReader.ts
  Reads useful project files.

chunker.ts
  Splits files into retrievable chunks.

embeddingClient.ts
  Calls the local embedding model.

retriever.ts
  Selects relevant chunks for a question.

prompt.ts
  Formats retrieved chunks and the user question into a model prompt.

ollamaClient.ts
  Calls the Ollama HTTP API.

index.ts
  Wires the flow together.

types.ts
  Stores shared TypeScript types.
```

Names can differ if the repo already uses different names. Do not rename files just to match this list.

## Commands

Run the assistant:

```bash
npm run dev -- "<question>"
```

Run project checks:

```bash
npm run check
```

Useful validation questions:

```bash
npm run dev -- "What phase is this project currently on?"
npm run dev -- "How does retrieval work in this project?"
npm run dev -- "How does the assistant call Ollama?"
npm run dev -- "What database does this project use?"
```

## Before Finishing

When changing retrieval, chunking, embedding, or prompt behavior, validate with at least one real question.

After changes, summarize:

1. What changed.
2. How to run it.
3. What limitations remain.
4. Which phase of `docs/plan.md` the work corresponds to.
