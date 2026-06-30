# local-ai-dev-lab

A local AI developer tooling sandbox for experimenting with self-hosted LLM workflows, starting with an Ollama-powered TypeScript CLI that reads project files and answers questions about them.

## Why

Local AI developer tooling is useful when code, notes, or internal documentation should stay on the local machine. It also gives me a way to explore inference servers, prompt context, embeddings, retrieval, and codebase-understanding workflows before adding more infrastructure.

## What This Proves

The current prototype proves this flow:

```text
local files
  -> chunked and embedded retrieval context
  -> local Ollama model
  -> answer with sources
```

The model does not know the codebase by default. The CLI reads useful project files, chunks them, stores chunk embeddings in a local JSON index, retrieves chunks relevant to the question, sends those chunks to Ollama as prompt context, and prints the generated response with the retrieved chunks listed as sources.

## Current Tool

The current tool is a small TypeScript CLI codebase assistant.

It can:

* read useful files from a local project
* ignore generated folders like `node_modules`, `.git`, `dist`, and `build`
* chunk files into small retrieval units
* embed chunks with Ollama
* store embeddings in a local JSON index
* retrieve relevant chunks for a question
* build a grounded prompt from retrieved context
* call an Ollama model through `OLLAMA_BASE_URL`
* answer questions using retrieved local context
* list the retrieved source chunks that informed the answer

## Setup

Install dependencies:

```bash
npm install
```

Create a local environment file:

```bash
cp .env.example .env
```

Set `OLLAMA_BASE_URL` in `.env` to your Ollama API URL.

Example `.env`:

```env
OLLAMA_BASE_URL=http://127.0.0.1:11434
OLLAMA_MODEL=llama3.2
OLLAMA_EMBED_MODEL=nomic-embed-text
PROJECT_ROOT=.
```

When running the CLI from WSL while Ollama is running on Windows, `localhost` may not point to the Windows Ollama server. In that case, get the Windows host IP from WSL:

```bash
ip route | awk '/default/ {print $3; exit}'
```

Then use that IP in `.env`:

```env
OLLAMA_BASE_URL=http://<windows-host-ip>:11434
OLLAMA_MODEL=llama3.2
OLLAMA_EMBED_MODEL=nomic-embed-text
```

Ollama must be running before starting the CLI. The embedding model must also be available locally, for example:

```bash
ollama pull nomic-embed-text
```

## Run

Ask the default question:

```bash
npm run dev
```

Ask a custom question:

```bash
npm run dev -- "What TypeScript files make up this assistant?"
```

Run against another local repo:

```bash
npm run dev -- --repo /home/justin/projects/other-repo "What does this repo do?"
```

The CLI prints the project root, repository id, and retrieval index path before answering so it is clear which repo is being read.

Override models for one run:

```bash
npm run dev -- --model qwen2.5-coder:7b --embed-model nomic-embed-text "How is retrieval implemented?"
```

## Debug Prompt

To inspect the exact prompt sent to Ollama, pass `--debug-prompt`:

```bash
npm run dev -- --debug-prompt tmp/prompt.txt "What phase is this project in?"
```

The file is only written when `--debug-prompt` or `DEBUG_PROMPT_PATH` is set.

## Retrieval Settings

The assistant stores embeddings in `tmp/retrieval-indexes/` by default. The default index filename is derived from the target `PROJECT_ROOT`, so different local repos do not share the same retrieval index.

It rebuilds the index when useful file contents, the target repo, the embedding model, or chunk settings change. When it rebuilds, the CLI prints the reason.

Optional settings:

```env
CHUNK_SIZE_LINES=80
CHUNK_OVERLAP_LINES=12
RETRIEVED_CHUNKS=6
# Override only when you intentionally want a specific index file.
# RETRIEVAL_INDEX_PATH=tmp/retrieval-index.json
```

For one-off runs, prefer CLI flags over changing `.env`:

```bash
npm run dev -- --chunks 8 "What are the main architectural boundaries?"
```

## Runtime Comparisons

Phase 8 documents runtime tradeoffs in [docs/runtime-comparisons.md](docs/runtime-comparisons.md). The assistant still uses Ollama as its only implemented runtime while other options are compared on setup, API ergonomics, model support, speed, hardware needs, deployment story, and fit for internal developer tools.

## Planning

The active plan lives in [docs/plan.md](docs/plan.md). Completed planning arcs are archived under [docs/plans/](docs/plans/), starting with [docs/plans/01-foundation.md](docs/plans/01-foundation.md).

The current direction is to add lightweight evals so retrieval, prompt, and model changes can be compared against the same real questions before adding agent behavior.

## Quality Gate

Run the TypeScript and ESLint checks:

```bash
npm run check
```

## Current Limitations

The assistant uses basic JSON-backed retrieval, not a production vector database. It does not include agents, tool calling, auth, or a UI.

Sources are the retrieved chunks sent to the model, not proof that every listed chunk was used in the final wording. Answer quality depends on chunk size, embedding quality, and whether the relevant chunks rank highly enough to fit into the prompt.

## Future Phases

Future phases will improve multi-repo usage, retrieval quality, answer structure, lightweight evaluations, and model/runtime learning through the assistant workflow.
