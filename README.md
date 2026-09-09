# ZeroClue OpenCode Adapter

Paperclip adapter for OpenCode with explicit `--dir` binding (fixes `session.directory` inheriting the server process PWD).

## Features

- Explicit `--dir` flag binding for correct working directory
- `env.PWD` set to execution CWD for consistency
- Worker-compatible UI transcript parser (CommonJS)
- OpenCode session resume via `--session`

## Install

This is a local Paperclip adapter, not an npm package. Install via Paperclip CLI:

```bash
# From Paperclip repo root
pnpm paperclipai plugin install /path/to/zeroclue-opencode-adapter
```

The adapter is loaded from the local path. No npm publish needed.

## Usage

Register in Paperclip adapter registry or install as external adapter:

```bash
paperclipai plugin install /path/to/zeroclue-opencode-adapter
```

## Build

```bash
pnpm build
```