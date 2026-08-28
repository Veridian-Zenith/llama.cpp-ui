# llamacpp-ui — Veridian Zenith

Agentic chat UI for `llama.cpp` (`llama-server`) — React 19 + Vite 8 + Tailwind 4 + Zustand, glass/red + vzdev rune theming, Firebase Hosting (`vz-ai`).

## Architecture

```
Firebase Hosting (static)  ── https://vz-ai.web.app  (site: vz-ai, public: dist)
        │  https://verz.nx.kg:9972  (llama-server, public)
        └─ http://127.0.0.1:8081   (terminal sidecar, LOCAL ONLY)
```

* **Llama** — `verz.nx.kg:9972` (public, TLS via reverse proxy). Used for `/completion`, `/models`, `/health`, streaming. Configured via `VITE_LLAMA_URL` / `src/lib/config.ts:6` (`http://127.0.0.1:8080` on localhost → `https://verz.nx.kg:9972` in prod). **Not mixed with terminal.**
* **Terminal sidecar** — `bun run server/terminal-server.ts` → `http://127.0.0.1:8081` (`/exec`, `/read`, `/write`, `/search`, `/fetch`, `/lsp/*`). **Local-only** (`src/lib/config.ts:10` always `127.0.0.1:8081`); in prod those tools use baked fallback (`src/lib/terminal-baked.ts`) while chat stays alive.
* **Vite proxy** — `vite.config.ts:11` proxies `/api` → `https://verz.nx.kg:9972` in dev only; prod uses direct `https://verz.nx.kg:9972` (no Hosting rewrite proxy — static only).

## Quick start

### 1. Model
```bash
mkdir ~/llama
hf download google/gemma-4-E2B-it-qat-q4_0-gguf --local-dir ~/llama/gemma-4-E2B-it-qat-q4_0-gguf
```

### 2a. Llama server — local
```bash
llama-server \
  --model ~/llama/gemma-4-E2B_it_qat_q4_0-gguf/gemma-4-E2B_q4_0-it.gguf \
  -ngl 10 -c 8192 -ctk q4_0 -ctv q8_0 -fa on \
  --host 0.0.0.0 --port 8080
```

### 2b. Llama server — public (verz.nx.kg)
```bash
llama-server \
  --model ~/llama/gemma-4-E2B_it_qat_q4_0-gguf/gemma-4-E2B_q4_0-it.gguf \
  -ngl 10 -c 8192 -ctk q4_0 -ctv q8_0 -fa on \
  --host 0.0.0.0 --port 9972
# expose via nginx/caddy with TLS so https://verz.nx.kg:9972 works (Firebase is https → http is blocked as mixed-content)
# ensure CORS: llama-server allows Origin https://vz-ai.web.app, https://vz-ai.firebaseapp.com, https://vz-ai.ryzn.pro
```

### 3. Frontend (local, with sidecar)
```bash
bun i
bun run start   # spawns terminal-server :8081 + vite :3000
# or bun run dev (same)
```
Open `http://localhost:3000` → Settings `https://verz.nx.kg:9972` or `http://127.0.0.1:8080` auto-detected.

### 4. Build & deploy (Firebase Hosting `vz-ai`)
```bash
bun run build          # → dist/
bunx firebase deploy --only hosting:vz-ai
# or firebase deploy --only hosting (site vz-ai in firebase.json:2)
```

## Env

Create `.env` (see `.env.example`):
```
VITE_LLAMA_URL=https://verz.nx.kg:9972
VITE_TERMINAL_URL=http://127.0.0.1:8081
VITE_FIREBASE_API_KEY=...
VITE_FIREBASE_AUTH_DOMAIN=...
...
```

`src/lib/config.ts` handles `isLocal` fallback; `src/firebase.ts` uses `VITE_FIREBASE_*`.

## Firebase

* Project `main-website-ba2da` (`.firebaserc:2`)
* Hosting site `vz-ai` `public: dist` (`firebase.json:2`) + SPA rewrites + security headers (CSP allows verz.nx.kg). **Do not** set `public` to `public` (Vite `public/` is static assets, not build output).
* `src/firebase.ts:1` — `initializeApp` + `getAnalytics` (lazy via `void import('./firebase.ts')` in `main.tsx:6`, chunk `firebase`).

```bash
bunx firebase login
bunx firebase use main-website-ba2da
bun run build && bunx firebase deploy --only hosting:vz-ai
```

## Docs

* `vite.config.ts:17` — code-split `firebase`/`framer`/`markdown`/`icons`, `publicDir` default.
* `src/components/BackgroundEffect.tsx` — rune background (reduced on mobile / `prefers-reduced-motion`).
* Terminal/file/search/fetch are local-only; prod chat degrades gracefully via `terminal-baked.ts` without them.

## License

Copyright (c) 2026 Veridian Zenith — OSL-3.0.
