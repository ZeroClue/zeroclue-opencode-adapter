import { promises as fs } from "node:fs";
import path from "node:path";

const CACHE_DIR = "/tmp/gh-token-cache";

// Persistent git-root config used for the global `!gh` reset comparison.
const GLOBAL_HELPER_KEYS = [
  "credential.https://github.com.helper",
  "credential.https://gist.github.com.helper",
];

// Write the GitHub App installation token to a well-known per-role cache file
// so the credential helper can read it on every git op (mid-run freshness).
// Atomic tmp+rename write; chmod 0600.
async function writeTokenCache(role: string, token: string): Promise<void> {
  await fs.mkdir(CACHE_DIR, { recursive: true, mode: 0o711 });
  const tmp = path.join(CACHE_DIR, `.${role}.tmp.${process.pid}`);
  const target = path.join(CACHE_DIR, `${role}.token`);
  await fs.writeFile(tmp, token, { mode: 0o600 });
  await fs.rename(tmp, target);
}

// Credential helper script that reads the cached token on every invocation.
async function writeCredentialHelper(role: string): Promise<string> {
  const helperPath = path.join(CACHE_DIR, `cred-helper-${role}.sh`);
  const content = `#!/bin/sh
# Per-run credential helper — reads the token cache written by
# refresh-gh-token.sh (cron, every 20 min) and by the adapter at run start.
echo "username=x-access-token"
echo "password=$(cat ${CACHE_DIR}/${role}.token 2>/dev/null || echo '')"
`;
  await fs.writeFile(helperPath, content, { mode: 0o755 });
  return helperPath;
}

/**
 * Bootstrap per-run git identity + a dynamic credential helper so that:
 *  1. Git commit author is the agent bot, not the human user.
 *  2. git fetch/push read the *latest* cached token from /tmp/gh-token-cache
 *     on every op — not the frozen env GH_TOKEN resolved at run start.
 *
 * Implemented purely via env injection (GIT_CONFIG_COUNT/GIT_CONFIG_KEY_n/
 * GIT_CONFIG_VALUE_n) so it is session-scoped and writes NO config files
 * (avoiding pollution of the shared worktree common config).  An empty helper
 * value first "resets" the accumulated helper list, which removes the global
 * `!gh auth git-credential` helper (that would otherwise present the human
 * zero-user token when GH_TOKEN is absent).
 *
 * Called in execute() after env is finalized.  Best-effort: failures log a
 * warning via onLog but never abort the run.
 */
export async function bootstrapGitIdentityAndCredentials(opts: {
  env: Record<string, string>;
  executionTargetIsRemote: boolean;
  onLog: (stream: "stderr" | "stdout", chunk: string) => Promise<void>;
}): Promise<void> {
  if (opts.executionTargetIsRemote) return;

  const role = opts.env.PAPERCLIP_GH_ROLE;
  const token = opts.env.GH_TOKEN;
  const identityName = opts.env.PAPERCLIP_GIT_IDENTITY_NAME;
  const identityEmail = opts.env.PAPERCLIP_GIT_IDENTITY_EMAIL;

  try {
    if (role && token) {
      await writeTokenCache(role, token);
      const helperPath = await writeCredentialHelper(role);

      const entries: Array<[string, string]> = [
        // Empty value first resets the inherited helper list (drops global `!gh`),
        // then ours — so the human token is never reachable via git.
        [GLOBAL_HELPER_KEYS[0], ""],
        [GLOBAL_HELPER_KEYS[0], helperPath],
        [GLOBAL_HELPER_KEYS[1], ""],
        [GLOBAL_HELPER_KEYS[1], helperPath],
      ];
      if (identityName) entries.push(["user.name", identityName]);
      if (identityEmail) entries.push(["user.email", identityEmail]);

      entries.forEach(([k, v], i) => {
        opts.env[`GIT_CONFIG_KEY_${i}`] = k;
        opts.env[`GIT_CONFIG_VALUE_${i}`] = v;
      });
      opts.env.GIT_CONFIG_COUNT = String(entries.length);
    }
  } catch (err) {
    await opts.onLog(
      "stderr",
      `[paperclip] Warning: git bootstrap failed (${err instanceof Error ? err.message : String(err)}); continuing without identity/helper override.\n`,
    );
  }
}