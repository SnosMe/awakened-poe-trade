import { execSync } from 'node:child_process'
import * as assert from 'node:assert/strict'

/** @param {import('app-builder-lib').ArtifactCreated} ctx */
export default function (ctx) {
  if (ctx.target.name !== 'appImage') return

  const stdout = execSync(`
    chmod +x '${ctx.file}' && \
    '${ctx.file}' --appimage-extract AppRun && \
    grep 'args=' squashfs-root/AppRun
  `, { encoding: 'utf-8' })

  assert.equal(
    stdout,
    'args=("$@" "--ozone-platform=x11")\n',
    "AppImage contains non patched AppRun file.")
}
