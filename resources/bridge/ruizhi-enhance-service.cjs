"use strict";

const crypto = require("node:crypto");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");

const DEFAULT_FEATURES = {
  menu: true,
  pluginEntryUnlock: true,
  forcePluginInstall: true,
  sessionDelete: true,
  markdownExport: true,
  projectMove: true,
  timeline: true,
  threadScrollRestore: true,
  threadSort: true,
  modelWhitelistUnlock: false,
  zedRemoteOpen: false,
  upstreamWorktreeCreate: false,
  serviceTierControls: false
};

function createRuizhiEnhanceService(options = {}) {
  const codexHome = options.codexHome || process.env.CODEX_HOME || path.join(os.homedir(), ".codex");
  const config = normalizeConfig(options.config);
  const settingsPath = path.join(codexHome, "ruizhi-page-enhance-settings.json");
  const dbPath = path.join(codexHome, "state_5.sqlite");
  const backupDir = path.join(codexHome, "backups", "ruizhi-page-enhance");
  const logPath = path.join(codexHome, "logs", "ruizhi-page-enhance.log");

  function settings() {
    return readSettings(settingsPath, config);
  }

  function writeSettings(patch) {
    const current = settings();
    const next = {
      ...current,
      ...(isRecord(patch) ? patch : {}),
      features: {
        ...current.features,
        ...(isRecord(patch?.features) ? patch.features : {})
      }
    };
    fs.mkdirSync(path.dirname(settingsPath), { recursive: true });
    fs.writeFileSync(settingsPath, `${JSON.stringify(next, null, 2)}\n`, "utf8");
    return next;
  }

  async function call(route, payload = {}) {
    try {
      switch (String(route || "")) {
        case "/backend/status":
          return { status: "ok", message: "增强服务已连接", version: "rj-v1" };
        case "/settings/get":
          return settings();
        case "/settings/set":
          return writeSettings(payload);
        case "/diagnostics/log":
          appendDiagnostic(logPath, payload);
          return { status: "ok", message: "日志已记录" };
        case "/delete":
          return withStorage(dbPath, backupDir, (storage) => storage.deleteThread(sessionFromPayload(payload)));
        case "/undo":
          return withStorage(dbPath, backupDir, (storage) => storage.undo(String(payload?.undo_token || "")));
        case "/export-markdown":
          return withStorage(dbPath, backupDir, (storage) => storage.exportMarkdown(sessionFromPayload(payload)));
        case "/archived-thread":
          return withStorage(dbPath, backupDir, (storage) => storage.findArchivedThread(String(payload?.title || "")));
        case "/move-thread-workspace":
          return withStorage(dbPath, backupDir, (storage) => storage.moveThreadWorkspace(sessionFromPayload(payload), String(payload?.target_cwd || "")));
        case "/thread-sort-key":
          return withStorage(dbPath, backupDir, (storage) => storage.threadSortKey(sessionFromPayload(payload)));
        case "/thread-sort-keys":
          return withStorage(dbPath, backupDir, (storage) => storage.threadSortKeys(Array.isArray(payload?.sessions) ? payload.sessions.map(sessionFromPayload) : []));
        default:
          return { status: "failed", message: `Unknown enhance route: ${route}` };
      }
    } catch (error) {
      appendDiagnostic(logPath, { event: "route_failed", route, error: errorMessage(error) });
      return {
        status: "failed",
        session_id: String(payload?.session_id || ""),
        message: errorMessage(error)
      };
    }
  }

  return { call, settings, writeSettings };
}

function normalizeConfig(config) {
  const pageEnhance = isRecord(config?.pageEnhance) ? config.pageEnhance : {};
  return {
    enabled: pageEnhance.enabled !== false,
    appVersion: typeof pageEnhance.appVersion === "string" ? pageEnhance.appVersion.trim() : "",
    features: {
      ...DEFAULT_FEATURES,
      ...(isRecord(pageEnhance.features) ? pageEnhance.features : {})
    }
  };
}

function readSettings(settingsPath, config) {
  let stored = {};
  try {
    stored = JSON.parse(fs.readFileSync(settingsPath, "utf8"));
  } catch {
    stored = {};
  }
  return {
    enabled: stored.enabled ?? config.enabled,
    appVersion: typeof stored.appVersion === "string" && stored.appVersion.trim() ? stored.appVersion.trim() : config.appVersion,
    features: {
      ...config.features,
      ...(isRecord(stored.features) ? stored.features : {})
    }
  };
}

function sessionFromPayload(payload) {
  return {
    session_id: normalizeThreadId(String(payload?.session_id || payload?.id || "")),
    title: String(payload?.title || "")
  };
}

function normalizeThreadId(value) {
  return String(value || "").replace(/^local:/, "");
}

function withStorage(dbPath, backupDir, callback) {
  if (!fs.existsSync(dbPath)) {
    return { status: "failed", message: `数据库不存在：${dbPath}` };
  }
  let sqlite;
  try {
    sqlite = require("node:sqlite");
  } catch {
    return { status: "failed", message: "当前 Electron/Node 运行时不支持 node:sqlite" };
  }
  const db = new sqlite.DatabaseSync(dbPath);
  try {
    return callback(new StorageAdapter(db, dbPath, backupDir));
  } finally {
    db.close();
  }
}

class StorageAdapter {
  constructor(db, dbPath, backupDir) {
    this.db = db;
    this.dbPath = dbPath;
    this.backupDir = backupDir;
  }

  deleteThread(session) {
    if (!session.session_id) return failed("", "缺少会话 ID");
    if (!this.hasCodexThreads()) return failed(session.session_id, "不支持当前本地存储结构");
    const thread = this.getThread(session.session_id);
    if (!thread) return failed(session.session_id, "未找到对应会话");

    const tables = {
      threads: [thread],
      thread_dynamic_tools: this.relatedRows("thread_dynamic_tools", "thread_id = ?", [session.session_id]),
      thread_goals: this.relatedRows("thread_goals", "thread_id = ?", [session.session_id]),
      thread_spawn_edges: this.relatedRows("thread_spawn_edges", "parent_thread_id = ? OR child_thread_id = ?", [session.session_id, session.session_id]),
      stage1_outputs: this.relatedRows("stage1_outputs", "thread_id = ?", [session.session_id]),
      agent_job_items: this.relatedRows("agent_job_items", "assigned_thread_id = ?", [session.session_id])
    };
    const rollout = fileBackup(thread.rollout_path);
    if (rollout) tables.__files = [rollout];

    const token = this.writeBackup(session.session_id, tables);
    const backupPath = this.backupPath(token);
    const tx = this.transaction();
    try {
      this.deleteRows("thread_dynamic_tools", "thread_id = ?", [session.session_id]);
      this.deleteRows("thread_goals", "thread_id = ?", [session.session_id]);
      this.deleteRows("thread_spawn_edges", "parent_thread_id = ? OR child_thread_id = ?", [session.session_id, session.session_id]);
      this.deleteRows("stage1_outputs", "thread_id = ?", [session.session_id]);
      if (this.hasTable("agent_job_items") && this.hasColumns("agent_job_items", ["assigned_thread_id"])) {
        this.run("UPDATE agent_job_items SET assigned_thread_id = NULL WHERE assigned_thread_id = ?", [session.session_id]);
      }
      this.run("DELETE FROM threads WHERE id = ?", [session.session_id]);
      tx.commit();
    } catch (error) {
      tx.rollback();
      return {
        status: "failed",
        session_id: session.session_id,
        message: errorMessage(error),
        undo_token: token,
        backup_path: backupPath
      };
    }

    if (rollout?.path) {
      try {
        fs.rmSync(rollout.path, { force: true });
      } catch (error) {
        return {
          status: "failed",
          session_id: session.session_id,
          message: `本地数据库已删除，但 rollout 删除失败：${errorMessage(error)}`,
          undo_token: token,
          backup_path: backupPath
        };
      }
    }

    return {
      status: "local_deleted",
      session_id: session.session_id,
      message: "已从本地存储删除",
      undo_token: token,
      backup_path: backupPath
    };
  }

  undo(token) {
    if (!token) return failed("", "缺少撤销 token");
    const backup = this.readBackup(token);
    const tables = isRecord(backup.tables) ? backup.tables : {};
    this.detectRestoreConflicts(tables);
    const tx = this.transaction();
    try {
      for (const [table, rows] of Object.entries(tables)) {
        if (table.startsWith("__") || !Array.isArray(rows)) continue;
        for (const row of rows) {
          if (table === "agent_job_items" && this.updateAgentJobItem(row)) continue;
          this.insertRow(table, row);
        }
      }
      tx.commit();
    } catch (error) {
      tx.rollback();
      return {
        status: "failed",
        session_id: String(backup.session_id || ""),
        message: errorMessage(error),
        undo_token: token
      };
    }

    for (const file of Array.isArray(tables.__files) ? tables.__files : []) {
      const target = String(file?.path || "");
      if (!target || fs.existsSync(target)) continue;
      fs.mkdirSync(path.dirname(target), { recursive: true });
      fs.writeFileSync(target, Buffer.from(String(file.content_b64 || ""), "base64"));
    }

    return {
      status: "undone",
      session_id: String(backup.session_id || ""),
      message: "已恢复本地会话",
      undo_token: token
    };
  }

  exportMarkdown(session) {
    if (!session.session_id) return exportFailed("", "缺少会话 ID");
    if (!this.hasCodexThreads()) return exportFailed(session.session_id, "不支持当前本地存储结构");
    const thread = this.getThread(session.session_id);
    if (!thread) return exportFailed(session.session_id, "未找到对应会话");
    const rolloutPath = String(thread.rollout_path || "");
    if (!rolloutPath || !fs.existsSync(rolloutPath)) return exportFailed(session.session_id, "会话缺少 rollout 文件");
    const title = displayTitle(thread.title || session.title || "Untitled session");
    const messages = rolloutMessages(rolloutPath);
    if (messages.length === 0) return exportFailed(session.session_id, "未找到可导出的用户或助手消息");
    const markdown = renderMarkdown(title, messages);
    const filename = `${safeFilename(title)}-${safeFilename(session.session_id)}.md`;
    return {
      status: "exported",
      session_id: session.session_id,
      message: `已导出为 Markdown：${filename}`,
      filename,
      markdown
    };
  }

  findArchivedThread(title) {
    if (!this.hasCodexThreads() || !this.hasColumns("threads", ["archived"])) {
      return { session_id: "", title: "" };
    }
    const row = this.get(
      "SELECT id, title FROM threads WHERE archived = 1 AND (title = ? OR title LIKE ? OR ? LIKE '%' || title || '%') ORDER BY archived_at DESC LIMIT 1",
      [title, `%${title}%`, title]
    );
    return row ? { session_id: String(row.id || ""), title: String(row.title || title) } : { session_id: "", title: "" };
  }

  moveThreadWorkspace(session, targetCwd) {
    const target = String(targetCwd || "").trim();
    if (!session.session_id) return failed("", "缺少会话 ID");
    if (!this.hasCodexThreads() || !this.hasColumns("threads", ["cwd", "rollout_path"])) {
      return failed(session.session_id, "不支持当前本地存储结构");
    }
    const thread = this.getThread(session.session_id);
    if (!thread) return failed(session.session_id, "未找到对应会话");
    this.run("UPDATE threads SET cwd = ? WHERE id = ?", [target, session.session_id]);
    const rolloutResult = updateRolloutCwd(String(thread.rollout_path || ""), target);
    return {
      status: "moved",
      session_id: session.session_id,
      message: target ? "已移动对话" : "已移动到普通对话",
      previous_cwd: String(thread.cwd || ""),
      target_cwd: target,
      rollout_updated: rolloutResult.updated,
      rollout_error: rolloutResult.error,
      ...timestampPayload(thread)
    };
  }

  threadSortKey(session) {
    const thread = session.session_id ? this.getThread(session.session_id) : null;
    if (!thread) return failed(session.session_id, "未找到对应会话");
    return { status: "ok", session_id: session.session_id, ...timestampPayload(thread) };
  }

  threadSortKeys(sessions) {
    const sortKeys = [];
    for (const session of sessions.slice(0, 200)) {
      if (!session.session_id) continue;
      const thread = this.getThread(session.session_id);
      if (thread) sortKeys.push({ session_id: session.session_id, ...timestampPayload(thread) });
    }
    return { status: "ok", sort_keys: sortKeys };
  }

  hasCodexThreads() {
    return this.hasTable("threads") && this.hasColumns("threads", ["id", "title", "rollout_path"]);
  }

  getThread(threadId) {
    return this.get("SELECT * FROM threads WHERE id = ?", [normalizeThreadId(threadId)]);
  }

  relatedRows(table, whereClause, params) {
    if (!this.hasTable(table)) return [];
    return this.all(`SELECT * FROM ${quoteIdent(table)} WHERE ${whereClause}`, params);
  }

  deleteRows(table, whereClause, params) {
    if (!this.hasTable(table)) return;
    this.run(`DELETE FROM ${quoteIdent(table)} WHERE ${whereClause}`, params);
  }

  hasTable(table) {
    return !!this.get("SELECT 1 AS ok FROM sqlite_master WHERE type = 'table' AND name = ? LIMIT 1", [table]);
  }

  hasColumns(table, columns) {
    const existing = new Set(this.all(`PRAGMA table_info(${quoteIdent(table)})`).map((row) => row.name));
    return columns.every((column) => existing.has(column));
  }

  all(sql, params = []) {
    return this.db.prepare(sql).all(...params);
  }

  get(sql, params = []) {
    return this.db.prepare(sql).get(...params);
  }

  run(sql, params = []) {
    return this.db.prepare(sql).run(...params);
  }

  transaction() {
    this.db.exec("BEGIN IMMEDIATE");
    let closed = false;
    return {
      commit: () => {
        if (!closed) {
          closed = true;
          this.db.exec("COMMIT");
        }
      },
      rollback: () => {
        if (!closed) {
          closed = true;
          this.db.exec("ROLLBACK");
        }
      }
    };
  }

  backupPath(token) {
    return path.join(this.backupDir, `${token}.json`);
  }

  writeBackup(sessionId, tables) {
    const token = `${Date.now().toString(36)}-${crypto.randomBytes(8).toString("hex")}`;
    fs.mkdirSync(this.backupDir, { recursive: true });
    fs.writeFileSync(
      this.backupPath(token),
      `${JSON.stringify({ session_id: sessionId, source_db: this.dbPath, tables, created_at: new Date().toISOString() }, null, 2)}\n`,
      "utf8"
    );
    return token;
  }

  readBackup(token) {
    const backupPath = this.backupPath(token);
    if (!fs.existsSync(backupPath)) throw new Error("撤销备份不存在或已过期");
    return JSON.parse(fs.readFileSync(backupPath, "utf8"));
  }

  detectRestoreConflicts(tables) {
    const files = Array.isArray(tables.__files) ? tables.__files : [];
    for (const file of files) {
      const target = String(file?.path || "");
      if (target && fs.existsSync(target)) throw new Error(`restore conflict: rollout file already exists: ${target}`);
    }
    for (const [table, rows] of Object.entries(tables)) {
      if (table.startsWith("__") || !Array.isArray(rows) || !this.hasTable(table)) continue;
      for (const row of rows) {
        const key = restoreKey(table, row);
        if (!key) continue;
        const where = key.columns.map((column) => `${quoteIdent(column)} = ?`).join(" AND ");
        if (this.get(`SELECT 1 AS ok FROM ${quoteIdent(table)} WHERE ${where} LIMIT 1`, key.values)) {
          throw new Error(`restore conflict: ${table} row already exists`);
        }
      }
    }
  }

  updateAgentJobItem(row) {
    if (!isRecord(row) || !this.hasTable("agent_job_items") || row.id == null) return false;
    const existing = this.get("SELECT * FROM agent_job_items WHERE id = ?", [row.id]);
    if (!existing) return false;
    this.run("UPDATE agent_job_items SET assigned_thread_id = ? WHERE id = ?", [row.assigned_thread_id ?? null, row.id]);
    return true;
  }

  insertRow(table, row) {
    if (!isRecord(row)) return;
    const columns = Object.keys(row);
    if (columns.length === 0) return;
    const placeholders = columns.map(() => "?").join(", ");
    const sql = `INSERT INTO ${quoteIdent(table)} (${columns.map(quoteIdent).join(", ")}) VALUES (${placeholders})`;
    this.run(sql, columns.map((column) => row[column]));
  }
}

function restoreKey(table, row) {
  if (!isRecord(row)) return null;
  const candidates = {
    threads: ["id"],
    thread_dynamic_tools: ["thread_id", "tool_name"],
    thread_goals: ["thread_id", "goal_id"],
    thread_spawn_edges: ["parent_thread_id", "child_thread_id"],
    stage1_outputs: ["thread_id"],
    agent_job_items: ["id"]
  }[table] || ["id"];
  const columns = candidates.filter((column) => row[column] != null);
  return columns.length ? { columns, values: columns.map((column) => row[column]) } : null;
}

function fileBackup(filePath) {
  const target = String(filePath || "");
  if (!target || !fs.existsSync(target)) return null;
  return { path: target, content_b64: fs.readFileSync(target).toString("base64") };
}

function rolloutMessages(rolloutPath) {
  const messages = [];
  for (const line of fs.readFileSync(rolloutPath, "utf8").split(/\r?\n/)) {
    if (!line.trim()) continue;
    let event;
    try {
      event = JSON.parse(line);
    } catch {
      continue;
    }
    if (event.type !== "response_item" || event.payload?.type !== "message") continue;
    const role = event.payload.role;
    const speaker = role === "user" ? "User" : role === "assistant" ? "Assistant" : null;
    if (!speaker) continue;
    const body = serializeMessageContent(event.payload.content);
    if (!body) continue;
    messages.push({ speaker, timestamp: formatTimestamp(event.timestamp), body });
  }
  return messages;
}

function serializeMessageContent(content) {
  if (!Array.isArray(content)) return "";
  return content.map((block) => {
    const type = block?.type;
    if (type === "input_text" || type === "output_text") return normalizeNewlines(block.text || "").trim();
    if (type === "input_image") {
      const url = String(block.image_url || "").trim();
      return url && !url.startsWith("data:") ? `> Image attachment\n[Image link](<${url}>)` : "> Image attachment";
    }
    return "";
  }).filter(Boolean).join("\n\n").trim();
}

function renderMarkdown(title, messages) {
  const lines = [`# ${title}`, ""];
  for (const message of messages) {
    lines.push(`### ${message.speaker}`);
    if (message.timestamp) lines.push(`_${message.timestamp}_`);
    lines.push("", message.body.trimEnd(), "");
  }
  return `${lines.join("\n").trimEnd()}\n`;
}

function updateRolloutCwd(rolloutPath, targetCwd) {
  if (!rolloutPath || !fs.existsSync(rolloutPath)) return { updated: false, error: "rollout 文件不存在" };
  try {
    const lines = fs.readFileSync(rolloutPath, "utf8").split(/\r?\n/);
    for (let index = 0; index < Math.min(lines.length, 8); index += 1) {
      if (!lines[index].trim()) continue;
      const event = JSON.parse(lines[index]);
      if (event.payload && isRecord(event.payload)) event.payload.cwd = targetCwd;
      if (Object.prototype.hasOwnProperty.call(event, "cwd")) event.cwd = targetCwd;
      lines[index] = JSON.stringify(event);
      fs.writeFileSync(rolloutPath, lines.join("\n"), "utf8");
      return { updated: true, error: "" };
    }
    return { updated: false, error: "未找到可更新的 rollout metadata" };
  } catch (error) {
    return { updated: false, error: errorMessage(error) };
  }
}

function timestampPayload(row) {
  const updatedAtMs = numberOrNull(row.updated_at_ms) ?? numberOrNull(row.updated_at) ?? numberOrNull(row.archived_at);
  return {
    updated_at_ms: updatedAtMs,
    updated_at: row.updated_at ?? null,
    archived_at: row.archived_at ?? null
  };
}

function numberOrNull(value) {
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}

function displayTitle(value) {
  return String(value || "Untitled session").replace(/\s+/g, " ").trim() || "Untitled session";
}

function safeFilename(value) {
  const cleaned = displayTitle(value).replace(/[<>:"/\\|?*\x00-\x1f]+/g, " ").replace(/\s+/g, " ").trim().slice(0, 80);
  return cleaned || "Untitled session";
}

function formatTimestamp(value) {
  const date = value ? new Date(value) : null;
  return date && Number.isFinite(date.getTime()) ? date.toLocaleString() : null;
}

function normalizeNewlines(value) {
  return String(value || "").replace(/\r\n/g, "\n").replace(/\r/g, "\n");
}

function quoteIdent(value) {
  return `"${String(value).replace(/"/g, "\"\"")}"`;
}

function isRecord(value) {
  return !!value && typeof value === "object" && !Array.isArray(value);
}

function failed(sessionId, message) {
  return { status: "failed", session_id: sessionId, message };
}

function exportFailed(sessionId, message) {
  return { status: "failed", session_id: sessionId, message, filename: null, markdown: null };
}

function appendDiagnostic(logPath, payload) {
  try {
    fs.mkdirSync(path.dirname(logPath), { recursive: true });
    fs.appendFileSync(logPath, `${JSON.stringify({ at: new Date().toISOString(), ...sanitizePayload(payload) })}\n`, "utf8");
  } catch {
  }
}

function sanitizePayload(payload) {
  if (!isRecord(payload)) return { payload_type: typeof payload };
  const safe = {};
  for (const [key, value] of Object.entries(payload)) {
    if (/token|key|authorization|secret/i.test(key)) {
      safe[key] = "[redacted]";
    } else if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") {
      safe[key] = value;
    } else {
      safe[key] = Array.isArray(value) ? `[array:${value.length}]` : "[object]";
    }
  }
  return safe;
}

function errorMessage(error) {
  return error && typeof error.message === "string" ? error.message : String(error);
}

module.exports = {
  DEFAULT_FEATURES,
  createRuizhiEnhanceService
};
