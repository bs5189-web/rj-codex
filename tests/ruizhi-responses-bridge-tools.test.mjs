import assert from "node:assert/strict";
import fs from "node:fs";
import http from "node:http";
import net from "node:net";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
import { createRequire } from "node:module";

const __filename = fileURLToPath(import.meta.url);
const projectRoot = path.resolve(path.dirname(__filename), "..");
const require = createRequire(import.meta.url);
const { startRuizhiResponsesBridge } = require(path.join(projectRoot, "resources", "bridge", "ruizhi-responses-bridge.cjs"));

function bodyText(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on("data", (chunk) => chunks.push(Buffer.from(chunk)));
    req.on("end", () => resolve(Buffer.concat(chunks).toString("utf8")));
    req.on("error", reject);
  });
}

function listen(server, port = 0) {
  return new Promise((resolve, reject) => {
    server.once("error", reject);
    server.listen(port, "127.0.0.1", () => {
      server.off("error", reject);
      resolve(server.address().port);
    });
  });
}

async function freePort() {
  const server = net.createServer();
  const port = await listen(server);
  await new Promise((resolve) => server.close(resolve));
  return port;
}

test("Qwen Responses requests with tools are routed through chat completions", async () => {
  const upstreamRequests = [];
  const upstream = http.createServer(async (req, res) => {
    const text = await bodyText(req);
    upstreamRequests.push({ path: req.url, body: JSON.parse(text) });
    res.writeHead(200, { "content-type": "application/json" });
    res.end(JSON.stringify({
      id: "chatcmpl_test",
      choices: [{ message: { role: "assistant", content: "ok" } }],
      usage: { prompt_tokens: 1, completion_tokens: 1, total_tokens: 2 },
    }));
  });
  const upstreamPort = await listen(upstream);
  const authHome = fs.mkdtempSync(path.join(os.tmpdir(), "ruizhi-bridge-auth-"));
  fs.writeFileSync(path.join(authHome, "auth.json"), JSON.stringify({ OPENAI_API_KEY: "test-key" }));

  const bridge = startRuizhiResponsesBridge({
    host: "127.0.0.1",
    port: await freePort(),
    upstreamBaseUrl: `http://127.0.0.1:${upstreamPort}/v1`,
    authHome,
    routes: { "qwen3.6-plus": "responses" },
  });

  try {
    const response = await fetch(`${bridge.baseUrl}/responses`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        model: "qwen3.6-plus",
        stream: false,
        input: "Use the browser plugin",
        tools: [{
          type: "function",
          name: "mcp__node_repl__js",
          description: "Run trusted Node REPL JavaScript",
          parameters: { type: "object", properties: {} },
        }],
      }),
    });

    assert.equal(response.status, 200);
    assert.equal(upstreamRequests.length, 1);
    assert.equal(upstreamRequests[0].path, "/v1/chat/completions");
    assert.equal(upstreamRequests[0].body.model, "qwen3.6-plus");
    assert.equal(upstreamRequests[0].body.tools?.[0]?.function?.name, "mcp__node_repl__js");
  } finally {
    await bridge.close();
    await new Promise((resolve) => upstream.close(resolve));
    fs.rmSync(authHome, { recursive: true, force: true });
  }
});
