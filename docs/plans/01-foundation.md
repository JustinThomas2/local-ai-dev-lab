# Planning Arc 01: Foundation

Status: Complete

This planning arc captured the first version of `local-ai-dev-lab`: a small local AI developer tooling sandbox focused on proving that local files can be sent through a local/self-hosted LLM workflow and produce useful answers.

This document is historical. The active plan now lives in [../plan.md](../plan.md).

## Project Goal

Build a small, credible foundation that proves:

```text
local files
  -> selected context
  -> local/self-hosted LLM
  -> useful answer
```

The first version was not meant to be a polished product. It was meant to show that local inference is running, callable from code, and extendable into a codebase assistant.

## Phase 1: Setup

Status: Done

Goal: create the repo structure and install the first local inference runtime.

What this phase proved:

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

What this phase proved:

* A local model can run through Ollama.
* Ollama exposes an HTTP API.
* A client running in WSL can call Ollama running on Windows.
* The model can return generated text from a local inference request.

Key lesson:

The model does not know about Ollama, the local machine, or the current project by default. The application must provide relevant context in the prompt.

## Phase 3: Tiny Codebase Assistant

Status: Done

Goal: build the smallest useful codebase assistant slice.

What this phase proved:

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

Avoided in this phase:

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

The README explained:

* what the project is
* why local AI developer tooling is useful
* how Ollama is being used
* how to run the codebase assistant
* what the current limitations are
* what future phases will add

The notes captured:

* setup decisions
* WSL and Windows networking lessons
* model behavior observations
* tradeoffs between local inference and cloud APIs

## Phase 5: Basic Context Improvements

Status: Done

Goal: improve the quality of file context sent to the model.

Improvements considered:

* limit file count
* limit file size
* prioritize README and source files
* skip binary files
* add basic chunking
* improve prompt formatting
* include file paths clearly
* ask the model to say when information is missing

This phase still avoided embeddings and vector search.

## Phase 6: Embeddings and Retrieval

Status: Done

Goal: move from "send selected files" to basic retrieval.

What this phase proved:

* files can be chunked
* chunks can be embedded
* embeddings can be stored
* a user question can retrieve relevant chunks
* only relevant context is sent to the model

Storage used:

* local JSON retrieval index

Embedding path used:

* Ollama embeddings

## Phase 7: Source Citations

Status: Done

Goal: make answers traceable back to source files.

What this phase proved:

* the assistant can cite which files informed its answer
* answers are easier to trust
* hallucinations are easier to detect

Example output shape:

```text
This project is a local AI developer tooling sandbox focused on Ollama and codebase understanding.

Sources:
- README.md
- notes/sunday.md
- src/index.ts
```

## Phase 8: Runtime Comparisons

Status: Done

Goal: compare Ollama with other inference/runtime options.

Compared options:

* Ollama
* llama.cpp
* vLLM
* cloud APIs

Comparison criteria:

* setup complexity
* API ergonomics
* model support
* speed
* hardware requirements
* deployment story
* fit for internal developer tools

The practical comparison lives in [../runtime-comparisons.md](../runtime-comparisons.md).

## Phase 9: Developer Tooling Direction

Status: Done

Goal: decide what this sandbox could become as a more complete internal developer tool.

Possible directions considered:

* codebase Q&A assistant
* architecture explainer
* onboarding assistant
* PR review helper
* dependency boundary explainer
* migration planning assistant
* internal docs assistant

Decision:

* continue with a local codebase Q&A assistant
* evolve it into an architecture explainer
* treat onboarding, dependency boundaries, migration planning, and PR review as later extensions
* improve answer quality and evaluation before adding UI, agents, or production infrastructure

## Foundation Outcome

The first planning arc proved this workflow:

```text
local files
  -> useful file reading
  -> chunked retrieval context
  -> local embeddings
  -> local Ollama generation
  -> answer with source output
```

The repo now has a working local codebase assistant and enough documentation to explain the early runtime choices. The next arc should use that assistant as the test application for learning local/self-hosted AI infrastructure, while making it useful against other local repositories.
