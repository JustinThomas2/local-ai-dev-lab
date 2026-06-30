# Local AI Dev Lab Active Plan

This is the current source of truth for project direction, sequencing, and scope.

The completed first planning arc is archived in [docs/plans/01-foundation.md](plans/01-foundation.md). That arc proved a local codebase assistant using Ollama, local generation, local embeddings, chunked retrieval, source output, and runtime tradeoff documentation.

## Current Purpose

This project is a local AI developer tooling sandbox.

The next phase arc has two connected goals:

* keep learning local/self-hosted LLM workflows through a real application
* evolve the repo-aware assistant into a useful developer tool that can scan and answer questions about other local repositories

The assistant is the test application for the infrastructure learning. Runtime and model work should support better codebase answers, not become abstract benchmarking.

## What Has Been Proven

The project currently proves this flow:

```text
local project files
  -> useful file selection
  -> chunked retrieval
  -> local embeddings
  -> local Ollama generation
  -> answer with source output
```

The foundation also documented practical runtime tradeoffs for Ollama, llama.cpp, vLLM, and cloud APIs in [docs/runtime-comparisons.md](runtime-comparisons.md). Ollama remains the only implemented runtime.

## Active Direction

Make the assistant repo-agnostic and more useful before adding agent behavior.

Near-term success means the CLI can be pointed at another local repo, build or reuse the right index for that repo, retrieve relevant context, and answer real developer questions with clear source output.

The strongest product direction is still local codebase Q&A evolving into an architecture explainer. Onboarding help, dependency boundary explanation, migration planning, and PR review can come later once the core retrieval answers are more reliable.

## Current Phase: Repo-Agnostic Assistant

Status: In Progress

Goal: make the assistant work reliably against local repositories other than this one.

This phase should answer:

* How does a user point the assistant at another repo?
* Where does each repo's retrieval index live?
* How does the assistant avoid mixing context from different repos?
* What docs and examples make the workflow obvious?

Expected work:

* document the intended `PROJECT_ROOT` workflow
* improve index handling for multiple local repos
* make stale or mismatched indexes easy to understand
* validate with at least one real question against another local repo when practical

## Next Major Phases

### Phase 1: Repo-Agnostic Usage

Make the assistant easy to run against other local repositories.

Possible improvements:

* document examples for `PROJECT_ROOT`
* make command output clearly show which repo is being read
* validate against at least one repo outside `local-ai-dev-lab`

### Phase 2: Multi-Repo Index Handling

Make retrieval storage safe and predictable across multiple repos.

Possible improvements:

* derive default index paths from the target repo
* include repo identity in index metadata
* make rebuild reasons visible
* prevent accidental context mixing between repos
* keep JSON storage unless it becomes a real limitation

### Phase 3: Lightweight Evals

Create a small set of real questions that can be reused across retrieval, prompt, and model changes.

The goal is not formal benchmarking. The goal is to compare changes against the same questions so regressions are visible.

Possible improvements:

* store a short list of representative questions
* define expected answer traits instead of exact golden text
* run the same questions after retrieval or prompt changes
* run the same questions when swapping Ollama models
* record notes about retrieval misses, unclear answers, and useful source output

Good initial questions:

* What does this repo do?
* How is retrieval implemented?
* Where does the assistant call the model?
* What are the main architectural boundaries?
* What information is missing from the current context?

### Phase 4: Retrieval Quality and Answer Structure

Improve answer usefulness before adding new capabilities.

Possible improvements:

* tune chunk size and overlap based on real questions
* improve prompts for architecture, onboarding, and implementation questions
* separate strong source evidence from weak retrieval matches
* make answers clearer about missing context

### Phase 5: Runtime and Model Learning Through the Assistant

Use the assistant workflow to learn local/self-hosted model behavior.

Possible work:

* swap Ollama generation models against the same eval questions
* compare embedding model behavior when there is a clear retrieval question
* document behavior differences between local models on the same questions
* document setup friction and model-specific limitations
* test llama.cpp or vLLM only when there is a concrete reason, such as model format control, CPU behavior, throughput, or serving constraints that Ollama does not answer
* record setup friction, answer quality observations, and hardware/runtime constraints

Do not make benchmarking claims without real measurements.

### Phase 6: Planning and Patch Suggestions

Only after the assistant is reliable for repo Q&A, consider developer workflows that move toward coding-agent behavior.

Possible later capabilities:

* change planning
* patch suggestions
* risk summaries
* PR review support

These should remain suggestions first. Direct file editing, commits, PR creation, and autonomous agent behavior are out of scope until explicitly planned.

## Constraints

Keep the repo intentionally small and practical.

Do not build yet:

* autonomous agents
* direct file editing
* automatic commits
* PR creation
* UI
* auth
* production deployment
* Kubernetes
* vector databases
* multi-runtime abstraction before a second runtime is actually tested
* benchmark claims without real measurements

## Validation

For docs-only changes, `npm run check` is optional.

For changes to retrieval, chunking, embeddings, prompts, model calls, or CLI behavior:

```bash
npm run check
npm run dev -- "What phase is this project currently on?"
```

When changing assistant behavior, also validate with at least one real question that matches the current phase.
