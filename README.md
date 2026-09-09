# ZeroClue OpenCode Adapter

Paperclip adapter for OpenCode with explicit `--dir` binding (fixes `session.directory` inheriting the server process PWD).

## Features

- Explicit `--dir` flag binding for correct working directory
- `env.PWD` set to execution CWD for consistency
- Worker-compatible UI transcript parser (CommonJS)
- OpenCode session resume via `--session`

## Install

```bash
pnpm add @zeroclue/zeroclue-opencode-adapter
```

## Usage

Register in Paperclip adapter registry or install as external adapter:

```bash
paperclipai plugin install /path/to/zeroclue-opencode-adapter
```

## Build

```bash
pnpm build
```