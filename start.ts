import { spawn } from "child_process";
import { dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));

const TERM_PORT = 8081;
const VITE_PORT = 3000;

function log(tag: string, msg: string) {
  const ts = new Date().toLocaleTimeString();
  console.log(`\x1b[90m${ts}\x1b[0m \x1b[36m${tag}\x1b[0m ${msg}`);
}

function killOnPort(port: number) {
  try {
    const proc = spawn("bash", ["-c", `lsof -ti:${port} | xargs kill -9 2>/dev/null`]);
    return new Promise<void>((r) => proc.on("close", () => r()));
  } catch {
    return Promise.resolve();
  }
}

async function main() {
  console.log("\x1b[1m\x1b[33m⚡ llama.cpp UI\x1b[0m\n");

  // Kill anything on our ports
  await killOnPort(TERM_PORT);
  await killOnPort(VITE_PORT);

  // Start terminal server
  const termServer = spawn("bun", ["run", "server/terminal-server.ts"], {
    cwd: __dirname,
    stdio: "pipe",
    env: { ...process.env },
  });

  termServer.stdout?.on("data", (d: Buffer) => {
    log("term", d.toString().trim());
  });
  termServer.stderr?.on("data", (d: Buffer) => {
    log("term", d.toString().trim());
  });
  termServer.on("error", (e) => log("term", `error: ${e.message}`));

  // Wait for terminal server to be ready
  await new Promise<void>((resolve) => {
    const check = async () => {
      try {
        const res = await fetch(`http://127.0.0.1:${TERM_PORT}/health`);
        if (res.ok) { resolve(); return; }
      } catch {}
      setTimeout(check, 100);
    };
    check();
  });
  log("term", `ready on :${TERM_PORT}`);

  // Start Vite dev server
  const vite = spawn("bun", ["run", "vite", "--port", String(VITE_PORT)], {
    cwd: __dirname,
    stdio: "pipe",
    env: { ...process.env },
  });

  vite.stdout?.on("data", (d: Buffer) => {
    const line = d.toString().trim();
    if (line) log("vite", line);
  });
  vite.stderr?.on("data", (d: Buffer) => {
    const line = d.toString().trim();
    if (line) log("vite", line);
  });
  vite.on("error", (e) => log("vite", `error: ${e.message}`));

  // Cleanup on exit
  const cleanup = () => {
    log("sys", "shutting down...");
    termServer.kill("SIGTERM");
    vite.kill("SIGTERM");
    process.exit(0);
  };

  process.on("SIGINT", cleanup);
  process.on("SIGTERM", cleanup);

  console.log("");
  console.log(`  \x1b[32m➜\x1b[0m  Local:   \x1b[1mhttp://localhost:${VITE_PORT}/\x1b[0m`);
  console.log(`  \x1b[32m➜\x1b[0m  Server:  \x1b[1mhttp://localhost:${TERM_PORT}/\x1b[0m`);
  console.log(`  \x1b[90m➜\x1b[0m  llama:   \x1b[1mhttp://localhost:8080/\x1b[0m`);
  console.log("");
}

main();
