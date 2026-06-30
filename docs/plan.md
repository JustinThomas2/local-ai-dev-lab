# Local AI Dev Lab Plan

This repo is a local AI developer tooling sandbox. The goal is to explore self-hosted LLM workflows, local inference, codebase understanding, embeddings, RAG, and internal developer productivity tools.

The project is intentionally built in small phases. Each phase should prove one concept without overbuilding.

## Project Goal

Build a small, credible foundation that proves:

```text
local files
  -> selected context
  -> local/self-hosted LLM
  -> useful answer
```

The first version is not meant to be a polished product. It is meant to show that local inference is running, callable from code, and extendable into a codebase assistant.

## Current Architecture

```text
local-ai-dev-lab/
  README.md
  PLAN.md
  notes/
    sunday.md
  experiments/
    ollama/
  projects/
    codebase-assistant/
```

## Phase 1: Setup

Status: Done

Goal: create the repo structure and install the first local inference runtime.

What this phase proves:

* The repo exists as a public sandbox.
* Ollama is installed locally.
* The project has a basic structure for notes, experiments, and small tooling projects.

Current setup:

* Ollama is installed natively on Windows.
* Development happens inside WSL.
* The first local model is `llama3.2`.

## Phase 2: Local Inference

Status: Done

Goal: prove that a local model can be called through an HTTP API.

What this phase proves:

* A local model can run through Ollama.
* Ollama exposes an HTTP API.
* A client running in WSL can call Ollama running on Windows.
* The model can return generated text from a local inference request.

Current setup:

* Ollama runs natively on Windows.
* Development happens inside WSL.
* WSL discovers the Windows host IP with:

```bash
ip route | awk '/default/ {print $3; exit}'
```

Example API base URL:

```text
http://<windows-host-ip>:11434
```

Example request:

```bash
WINDOWS_HOST=$(ip route | awk '/default/ {print $3; exit}')

curl "http://$WINDOWS_HOST:11434/api/generate" -d '{
  "model": "llama3.2",
  "prompt": "Say hello from local Ollama.",
  "stream": false
}'
```

Key lesson:

The model does not know about Ollama, the local machine, or the current project by default. The application must provide relevant context in the prompt.

## Phase 3: Tiny Codebase Assistant

Status: Done

Goal: build the smallest useful codebase assistant slice.

What this phase should prove:

* The app can read files from a local project.
* The app can ignore irrelevant folders like `node_modules`, `.git`, `dist`, and `build`.
* The app can build a prompt using selected file contents.
* The app can send that prompt to Ollama.
* The app can answer a question using local codebase context.

Minimum success:

```text
local files
  -> prompt context
  -> Ollama
  -> answer
```

Initial target question:

```text
Summarize what this project does based only on the provided files.
```

Planned source structure:

```text
projects/codebase-assistant/src/
  index.ts
  fileReader.ts
  prompt.ts
  ollamaClient.ts
  types.ts
```

Responsibilities:

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

Avoid in this phase:

* embeddings
* vector databases
* agents
* tool calling
* UI
* auth
* complex chunking
* source citations

## Phase 4: README and Notes

Status: Done

Goal: document what exists clearly enough that someone else can understand the project.

The README should explain:

* what the project is
* why local AI developer tooling is useful
* how Ollama is being used
* how to run the codebase assistant
* what the current limitations are
* what future phases will add

The notes should capture:

* setup decisions
* WSL and Windows networking lessons
* model behavior observations
* tradeoffs between local inference and cloud APIs

## Phase 5: Basic Context Improvements

Status: Done

Goal: improve the quality of file context sent to the model.

Possible improvements:

* limit file count
* limit file size
* prioritize README and source files
* skip binary files
* add basic chunking
* improve prompt formatting
* include file paths clearly
* ask the model to say when information is missing

This phase should still avoid embeddings and vector search.

## Phase 6: Embeddings and Retrieval

Status: Done

Goal: move from “send selected files” to basic retrieval.

What this phase should prove:

* files can be chunked
* chunks can be embedded
* embeddings can be stored
* a user question can retrieve relevant chunks
* only relevant context is sent to the model

Possible storage options:

* JSON file
* SQLite
* Chroma
* pgvector

Possible embedding options:

* Ollama embeddings
* sentence-transformers
* cloud embedding API for comparison

## Phase 7: Source Citations

Status: In Progress

Goal: make answers traceable back to source files.

What this phase should prove:

* the assistant can cite which files informed its answer
* answers are easier to trust
* hallucinations are easier to detect

Example output:

```text
This project is a local AI developer tooling sandbox focused on Ollama and codebase understanding.

Sources:
- README.md
- notes/sunday.md
- projects/codebase-assistant/src/index.ts
```

## Phase 8: Runtime Comparisons

Status: Not started

Goal: compare Ollama with other inference/runtime options.

Possible comparisons:

* Ollama
* llama.cpp
* vLLM
* cloud APIs

Compare on:

* setup complexity
* API ergonomics
* model support
* speed
* hardware requirements
* deployment story
* fit for internal developer tools

## Phase 9: Developer Tooling Direction

Status: Not started

Goal: decide what this sandbox could become as a more complete internal developer tool.

Possible directions:

* codebase Q&A assistant
* architecture explainer
* onboarding assistant
* PR review helper
* dependency boundary explainer
* migration planning assistant
* internal docs assistant

The project should remain focused on local/self-hosted AI workflows and developer productivity.

## Current Constraints

This repo should stay intentionally small.

Avoid overbuilding early with:

* Dockerized Ollama
* Kubernetes
* auth
* agents
* complex UI
* multi-model benchmarking
* advanced orchestration
* production deployment work

The near-term goal is understanding and proving the workflow, not building a finished product.

## Monday Outreach Angle

Once the foundation exists, this is the honest summary:

```text
I started building a local AI developer tooling sandbox focused on codebase understanding. Right now I have local inference running through Ollama and I’m working toward a small codebase assistant that can ingest project files and answer architectural questions. It got me thinking more seriously about self-hosted LLM workflows and internal dev tools.
```
