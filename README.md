# Llamacpp-UI

A React + TypeScript + Vite interface for interacting with `llama.cpp` server.

## Setting up the Backend

To run this application, you need to have a `llama.cpp` server (`llama-server`) running separately.

### 1. Download the Model
Download the required model file using the `hf` (Hugging Face) CLI tool:

```bash
hf download google/gemma-4-E2B-it-qat-q4_0-gguf --local-dir gemma-4-E2B-it-qat-q4_0-gguf
```

### 2. Run the `llama-server`
Launch the `llama-server` with the following command, ensuring the path to the model is correct:

```bash
llama-server \
  --model /path/to/your/downloaded/gemma-4-E2B_q4_0-it.gguf \
  -ngl 10 \
  -c 76800 \
  -ctk q4_0 \
  -ctv q4_0 \
  -fa on \
  --host 0.0.0.0 \
  --port 8080
```

### 3. Start the Frontend
Once the backend is running, start the frontend application:

```bash
bun run start
```

## Development

This project was bootstrapped with a minimal React + TypeScript + Vite template.

### React Compiler
The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

### Oxlint
If you are developing a production application, we recommend enabling type-aware lint rules by installing `oxlint-tsgolint` and editing `.oxlintrc.json`. See the [Oxlint rules documentation](https://oxc.rs/docs/guide/usage/linter/rules) for the full list of rules and categories.

## License

Copyright (c) 2026 Veridian Zenith. All rights reserved.

This software is licensed under the OSL V3 (Open Software License 3.0).
