Confirmed local inference from WSL to Ollama running on Windows.

WSL discovers the Windows host IP using:
```bash
ip route | awk '/default/ {print $3; exit}'
```

Ollama API is reachable at:
```text
http://<windows-host-ip>:11434
```

Setup decisions:

* Keep Ollama installed natively on Windows for now.
* Keep the TypeScript CLI in this repo small and focused on reading local files, building one prompt, and calling Ollama.
* Load local configuration from `.env`, with `OLLAMA_BASE_URL` required so the app is explicit about which Ollama server it calls.

Model observations:

* The model only knows about the project when the app includes file contents in the prompt.
* Answers depend heavily on which files are included and how clearly the question is phrased.

Tradeoffs:

* Local inference keeps project context on the machine and avoids cloud API costs.
* Local models can be slower or less capable than cloud models, so better context selection will matter in later phases.

Phase 5 update:

Added basic context guardrails.

* Limit how many files and how much file content gets sent to the model.
* Log selected files so I can see what context the model received.
* Use question-aware context selection:

  * phase/status questions use planning docs
  * implementation questions use source files
  * general questions use a balanced set
* Added `DEBUG_PROMPT_PATH` to inspect the exact prompt sent to Ollama.

Main lesson:

Context selection matters a lot, but model quality matters too. `llama3.2` proved the pipeline but struggled with structured reasoning. `qwen2.5-coder:7b` handled the same prompts much better.
