# AGENTS.md

## Project Context

This repo is a local AI developer tooling sandbox focused on self-hosted LLM workflows, local inference, codebase understanding, embeddings, RAG, and internal developer productivity tools.

Always read `PLAN.md` before making changes. The plan defines the project phases, current goals, constraints, and what should not be built yet.

## Working Style

Implement the current phase only.

Prefer the smallest working version that proves the concept. Do not overbuild.

Favor simple, readable TypeScript over clever abstractions.

Prefer functions over classes unless a class is clearly justified.

Keep code easy to explain file-by-file.

## Current Constraints

Do not add these unless the plan explicitly says to:

* UI
* auth
* agents
* tool calling
* embeddings
* vector databases
* source citations
* Dockerized Ollama
* Kubernetes
* multi-model benchmarking
* unnecessary dependencies

## Codebase Assistant Direction

The first codebase assistant should prove this pipeline:

```text
local files
  -> selected prompt context
  -> Ollama
  -> answer
```

Maintain clear file responsibilities:

```text
fileReader.ts
  Reads useful project files.

prompt.ts
  Formats files and questions into a model prompt.

ollamaClient.ts
  Calls the Ollama HTTP API.

index.ts
  Wires the flow together.

types.ts
  Stores shared TypeScript types.
```

## Before Finishing

Run `npm run check` before finishing code changes.

When changing context selection or prompt behavior, validate the final prompt with `DEBUG_PROMPT_PATH`.

After making changes, summarize:

1. What changed.
2. How to run it.
3. What limitations remain.
4. Which phase of `PLAN.md` the work corresponds to.
