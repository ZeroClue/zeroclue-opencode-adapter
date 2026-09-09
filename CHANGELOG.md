# ZeroClue OpenCode Adapter - Changelog

## 0.1.3 (2026-09-09)

### Fixed
- UI transcript parser now works in dashboard and run views
- Fixed sandboxed parser worker `indexedDB` getter-only error
- Fixed nested `<a>` hydration error in IssueLinkQuicklook popover

### Added
- Worker-compatible transcript parser (`parse-stdout.worker.js`)
- Export `parseStdoutLine` for sandboxed worker bootstrap

## 0.1.2 (2026-09-08)

### Fixed
- Explicit `--dir` binding for correct session directory
- `env.PWD` set to execution CWD

## 0.1.1 (2026-09-08)

### Added
- Plugin manifest for Paperclip plugin loader

## 0.1.0 (2026-09-08)

### Added
- Initial release: fork of opencode_local with explicit `--dir` binding