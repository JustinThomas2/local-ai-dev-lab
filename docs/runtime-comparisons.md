# Runtime Comparisons

Phase 8 compares inference/runtime options for this local codebase assistant.

Ollama remains the only implemented runtime in this project. This document is a practical comparison, not a benchmark harness and not a runtime abstraction plan.

## Summary

| Runtime | Good fit | Main downsides |
| --- | --- | --- |
| Ollama | Local prototypes, simple self-hosted workflows, developer laptops | Less production-oriented, performance depends on local hardware, less low-level control |
| llama.cpp | Low-level local inference, CPU-friendly experiments, GGUF/model-format control | More hands-on setup, API/server ergonomics are less polished, tuning burden is higher |
| vLLM | High-throughput serving, batching, larger GPU-backed deployments | Heavier infrastructure, GPU expectations, premature for a small local CLI |
| Cloud APIs | Best model quality, simple hosted APIs, baseline comparison against local models | Sends context outside the machine, ongoing cost, vendor/data-handling concerns |

## Criteria

| Criterion | Ollama | llama.cpp | vLLM | Cloud APIs |
| --- | --- | --- | --- | --- |
| Setup complexity | Low: install Ollama and pull models | Medium: build/install runtime, choose model files, tune flags | High: server stack, GPU/CUDA-oriented setup | Low: API key and SDK/HTTP client |
| API ergonomics | Simple local HTTP API | Usable, but more runtime-specific | OpenAI-compatible serving is possible, but deployment is heavier | Usually very polished HTTP/SDK APIs |
| Model support | Good catalog for common local models | Broad GGUF ecosystem and quantization control | Strong for supported transformer models on GPUs | Strong hosted proprietary and open models |
| Speed | Good enough for local experiments; hardware-bound | Can be efficient locally, especially quantized models | Strong for throughput and concurrent serving | Often fast and scalable, network-dependent |
| Hardware needs | Developer laptop or workstation, depending on model | Can run on CPU; improves with GPU/Metal/CUDA | GPU-focused, best with serious accelerator capacity | No local model hardware required |
| Deployment story | Good for local/dev machines; not a full production platform | Flexible but more DIY | Better fit for server deployment | Hosted by provider; app only calls API |
| Internal dev-tool fit | Strong for privacy-preserving local prototypes | Good when control matters more than polish | Good only if many users or high throughput justify it | Good for quality comparisons; weaker for sensitive code |

## Runtime Notes

### Ollama

Use Ollama when the goal is to prove a local assistant quickly, keep code and notes on the machine, and call a model through a simple HTTP API. It is the best fit for this project right now because the assistant already works through Ollama for generation and embeddings.

The tradeoff is that Ollama is mainly a local developer runtime. It is not the right thing to optimize first if the project needs high-throughput serving, detailed inference controls, or production operations.

### llama.cpp

Use llama.cpp when local control matters: model files, quantization, CPU-friendly inference, and low-level runtime tuning. It is useful for understanding what is happening below a friendlier tool like Ollama.

The tradeoff is operational friction. Setup, model selection, server flags, and performance tuning require more hands-on work, and the API experience is less immediately clean for this TypeScript CLI.

### vLLM

Use vLLM when serving performance matters: batching, concurrency, larger models, and GPU-backed inference for multiple users or heavier workloads. It is a better fit for a service than for a single-machine prototype.

The tradeoff is complexity. vLLM assumes a more serious serving environment and hardware profile. Adding it now would overbuild this project before there is evidence that throughput is the bottleneck.

### Cloud APIs

Use cloud APIs when the priority is model quality, latency, reliability, and a polished API surface. They are useful as a comparison point for answer quality and developer experience.

The tradeoff is that project context leaves the local machine. That raises privacy, policy, cost, and vendor-dependence questions, especially for internal codebase tools.

## Current Direction

Keep Ollama as the working runtime. Compare other runtimes on paper first, then test one only when there is a clear question the current Ollama path cannot answer.
