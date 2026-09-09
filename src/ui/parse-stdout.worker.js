// Worker-compatible parser (CommonJS only, no ESM exports, no TypeScript types)

function safeJsonParse(text) {
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

function asRecord(value) {
  if (typeof value !== "object" || value === null || Array.isArray(value)) return null;
  return value;
}

function asString(value, fallback) {
  fallback = fallback === undefined ? "" : fallback;
  return typeof value === "string" ? value : fallback;
}

function asNumber(value, fallback) {
  fallback = fallback === undefined ? 0 : fallback;
  return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}

function errorText(value) {
  if (typeof value === "string") return value;
  var rec = asRecord(value);
  if (!rec) return "";
  var data = asRecord(rec.data);
  var msg = asString(rec.message) || asString(data && data.message) || asString(rec.name) || "";
  if (msg) return msg;
  try { return JSON.stringify(rec); } catch { return ""; }
}

function parseToolUse(parsed, ts) {
  var part = asRecord(parsed.part);
  if (!part) return [{ kind: "system", ts: ts, text: "tool event" }];
  var toolName = asString(part.tool, "tool");
  var state = asRecord(part.state);
  var input = state && state.input ? state.input : {};
  var callEntry = {
    kind: "tool_call",
    ts: ts,
    name: toolName,
    toolUseId: asString(part.callID) || asString(part.id) || undefined,
    input: input,
  };
  var status = asString(state && state.status);
  if (status !== "completed" && status !== "error") return [callEntry];
  var rawOutput = asString(state && state.output) || asString(state && state.error) || asString(part.title) || (toolName + " " + status);
  var metadata = asRecord(state && state.metadata);
  var headerParts = ["status: " + status];
  if (metadata) {
    for (var key in metadata) {
      var value = metadata[key];
      if (value !== undefined && value !== null) headerParts.push(key + ": " + value);
    }
  }
  var content = headerParts.join("\n") + "\n\n" + rawOutput;
  return [
    callEntry,
    { kind: "tool_result", ts: ts, toolUseId: asString(part.callID) || asString(part.id, toolName), content: content, isError: status === "error" }
  ];
}

function parseOpenCodeStdoutLine(line, ts) {
  var parsed = asRecord(safeJsonParse(line));
  if (!parsed) return [{ kind: "stdout", ts: ts, text: line }];
  var type = asString(parsed.type);
  if (type === "text") {
    var part = asRecord(parsed.part);
    var text = asString(part && part.text).trim();
    if (!text) return [];
    return [{ kind: "assistant", ts: ts, text: text }];
  }
  if (type === "reasoning") {
    var part = asRecord(parsed.part);
    var text = asString(part && part.text).trim();
    if (!text) return [];
    return [{ kind: "thinking", ts: ts, text: text }];
  }
  if (type === "tool_use") return parseToolUse(parsed, ts);
  if (type === "step_start") {
    var sessionId = asString(parsed.sessionID);
    return [{ kind: "system", ts: ts, text: "step started" + (sessionId ? " (" + sessionId + ")" : "") }];
  }
  if (type === "step_finish") {
    var part = asRecord(parsed.part);
    var tokens = asRecord(part && part.tokens);
    var cache = asRecord(tokens && tokens.cache);
    var reason = asString(part && part.reason, "step");
    var output = asNumber(tokens && tokens.output, 0) + asNumber(tokens && tokens.reasoning, 0);
    return [{ kind: "result", ts: ts, text: reason, inputTokens: asNumber(tokens && tokens.input, 0), outputTokens: output, cachedTokens: asNumber(cache && cache.read, 0), costUsd: asNumber(part && part.cost, 0), subtype: reason, isError: false, errors: [] }];
  }
  if (type === "error") {
    var text = errorText(parsed.error || parsed.message);
    return [{ kind: "stderr", ts: ts, text: text || line }];
  }
  return [{ kind: "stdout", ts: ts, text: line }];
}

module.exports = { parseStdoutLine: parseOpenCodeStdoutLine };