# ZeroClue OpenCode Adapter - Changelog

## 0.1.4 (2026-09-11)

### Added
- Per-run git identity + credential bootstrap (`src/server/git-bootstrap.ts`): env-only
  (GIT_CONFIG_COUNT) injection of the run's bot identity and a credential-helper pair
  reading the fresh-per-rotation `/tmp/gh-token-cache/<role>.token`, so git pushes use the
  role's GH App token that stays fresh across mid-session cron rotations. No config-file
  writes — safe on linked worktrees; skipped for remote execution targets; warn-only.

### Removed
- `modelProfiles` / `buildOpenCodeModelProfiles` / `DEFAULT_OPENCODE_CHEAP_MODEL` exports
  and the `modelProfiles` adapter registration: Paperclip upstream removed the
  model-profiles/cheap-lane system (0236_remove_cheap_model_profiles) and now rejects the
  field. Status-only recovery turns now run on the agent's configured model.

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