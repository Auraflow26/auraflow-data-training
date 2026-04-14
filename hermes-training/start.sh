#!/bin/bash
# AuraFlow — Hermes Training LLM Startup
# Starts Ollama server, pulls Hermes model, keeps alive for inference

ollama serve &
OLLAMA_PID=$!

echo "Waiting for Ollama to start..."
until curl -s http://localhost:11434/api/tags > /dev/null 2>&1; do
  sleep 2
done
echo "Ollama ready. Pulling Hermes..."

ollama pull nous-hermes2:13b

echo "Model ready. Hermes Training LLM is live on port 11434."

wait $OLLAMA_PID
