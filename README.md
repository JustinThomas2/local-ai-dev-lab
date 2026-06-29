# local-ai-dev-lab

A local AI developer tooling sandbox for experimenting with self-hosted LLM workflows, starting with an Ollama-powered TypeScript CLI that reads project files and answers questions about them.

## Why

Local AI developer tooling is useful when code, notes, or internal documentation should stay on the local machine. It also gives me a way to explore inference servers, prompt context, embeddings, retrieval, and codebase-understanding workflows before adding more infrastructure.

## What This Proves

The current prototype proves this flow:

```text
local files
  -> selected prompt context
  -> local Ollama model
  -> answer
```

The model does not know the codebase by default. The CLI reads selected project files, formats them into prompt context, sends that prompt to Ollama through its HTTP API, and prints the generated response.

## Current Tool

The current tool is a small TypeScript CLI codebase assistant.

It can:

* read useful files from a local project
* ignore generated folders like `node_modules`, `.git`, `dist`, and `build`
* build a grounded prompt from local file contents
* call an Ollama model through `OLLAMA_BASE_URL`
* answer questions using the provided file context

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
```

When running the CLI from WSL while Ollama is running on Windows, `localhost` may not point to the Windows Ollama server. In that case, get the Windows host IP from WSL:

```bash
ip route | awk '/default/ {print $3; exit}'
```

Then use that IP in `.env`:

```env
OLLAMA_BASE_URL=http://<windows-host-ip>:11434
OLLAMA_MODEL=llama3.2
```

Ollama must be running before starting the CLI.

## Run

Ask the default question:

```bash
npm run dev
```

Ask a custom question:

```bash
npm run dev -- "What TypeScript files make up this assistant?"
```

## Quality Gate

Run the TypeScript and ESLint checks:

```bash
npm run check
```

## Current Limitations

The assistant sends selected file contents directly in the prompt. It does not yet use embeddings, vector search, chunking, source citations, agents, tool calling, or a UI.

This means answer quality depends heavily on which files are selected and how much relevant context fits into the prompt.

## Future Phases

Future phases will improve context selection, add retrieval with embeddings, make answers traceable to source files, and compare local runtime options like Ollama, llama.cpp, vLLM, and cloud APIs.
