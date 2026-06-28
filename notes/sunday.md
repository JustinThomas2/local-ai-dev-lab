Confirmed local inference from WSL to Ollama running on Windows.

WSL discovers the Windows host IP using:
ip route | awk '/default/ {print $3; exit}'

Ollama API is reachable at:
http://<windows-host-ip>:11434
