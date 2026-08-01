// Fails the build if any source file still uses the deprecated Tailwind palette
// (`bg-gray-800`, `text-red-400`, ...) or the `theme('colors.*')` helper.
//
// Colors come from the semantic tokens declared in `src/web/App.vue` and mapped in
// `tailwind.config.js`. The legacy palette keys are kept only as a safety net so a
// missed usage renders a sensible color instead of no CSS at all — this check is
// what stops new ones from creeping in.
import { readFileSync, readdirSync } from 'fs'
import { join, relative } from 'path'

const ROOT = new URL('..', import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1')
const SRC = join(ROOT, 'src')

const CHECKS = [
  {
    re: /\b(?:bg|text|border|placeholder|ring|divide|from|via|to)-(?:gray|red|orange|yellow|green|teal|blue|indigo|purple|pink)-[1-9]00\b/g,
    msg: 'deprecated palette class — use a semantic token (bg-surface-*, text-content-*, border-line, accent, danger/warn/good/info)'
  },
  {
    re: /theme\('colors\.[^']*'\)/g,
    msg: "theme('colors.*') — use rgb(var(--c-token)) instead"
  }
]

function walk (dir) {
  const out = []
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const p = join(dir, entry.name)
    if (entry.isDirectory()) out.push(...walk(p))
    else if (/\.(vue|ts)$/.test(entry.name)) out.push(p)
  }
  return out
}

let failures = 0
for (const file of walk(SRC)) {
  const lines = readFileSync(file, 'utf8').split('\n')
  lines.forEach((line, i) => {
    for (const { re, msg } of CHECKS) {
      re.lastIndex = 0
      for (const m of line.matchAll(re)) {
        console.error(`${relative(ROOT, file)}:${i + 1}  ${m[0]}  — ${msg}`)
        failures++
      }
    }
  })
}

if (failures) {
  console.error(`\ncheck-colors: ${failures} problem(s) found.`)
  process.exit(1)
}
console.log('check-colors: clean')
