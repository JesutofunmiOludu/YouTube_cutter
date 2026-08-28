/**
 * dev.mjs — CWD-casing normaliser for Next.js development on Windows
 *
 * Problem:
 *   On Windows, if the repo folder is named "Frontend\youtube" on disk
 *   but the user opens their terminal and types:
 *     cd frontend\youtube   (lowercase)
 *     npm run dev
 *   then Node.js sets process.cwd() to the lowercase variant.
 *   Webpack inherits this CWD and creates two module-graph entries for the
 *   same physical file (one per casing), splitting RouterContext into two
 *   objects and causing "NextRouter was not mounted" on every page.
 *
 * Fix:
 *   fs.realpathSync.native('.') calls the Win32 GetFinalPathNameByHandle
 *   API, which always returns the true disk casing regardless of how the
 *   path was typed. We chdir() to the normalised path BEFORE spawning the
 *   Next.js dev server so Webpack inherits a single, correct CWD.
 */

import { realpathSync } from 'fs';
import { spawnSync }    from 'child_process';

// Resolve the true casing from the Windows NTFS metadata.
const realCwd = realpathSync.native('.');
process.chdir(realCwd);

console.log(`[dev.mjs] CWD normalised → ${realCwd}`);

// Spawn the actual Next.js dev server.
// We call `npm run dev:next` with explicit normalized cwd so that Webpack and
// child node processes inherit the identical disk casing on Windows.
const result = spawnSync('npm', ['run', 'dev:next'], {
  stdio: 'inherit',
  shell: true,
  cwd: realCwd,
  env: {
    ...process.env,
    INIT_CWD: realCwd,
    PWD: realCwd,
  },
});

process.exit(result.status ?? 0);
