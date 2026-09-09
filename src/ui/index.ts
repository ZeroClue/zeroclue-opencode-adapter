import { parseOpenCodeStdoutLine } from "./parse-stdout.js";
import { buildOpenCodeConfig } from "./build-config.js";

// Re-export for the UI bundle (ESM)
export { parseOpenCodeStdoutLine, buildOpenCodeConfig };

// CommonJS export for the sandboxed parser worker
module.exports = { parseOpenCodeStdoutLine, buildOpenCodeConfig };