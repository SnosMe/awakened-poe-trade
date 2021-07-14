import { CLIENT_STRINGS as _$ } from '@/assets/data'

interface ModifierInfo {
  generation?: 'suffix' | 'prefix'
  name?: string
  tier?: number
  rank?: number
  tags?: string[]
  rollIncr?: number
}

export function parseModInfoLine (line: string): ModifierInfo {
  const [modText, tagsText, incrText] = line
    .slice(1, -1)
    .split('\u2014')
    .map(_ => _.trim())

  const match = modText.match(_$.MODIFIER_LINE)
  if (!match) {
    throw new Error('Invalid regex for mod info line')
  }

  let generation: ModifierInfo['generation']
  switch (match.groups!.type) {
    case _$.PREFIX_MODIFIER:
    case _$.CRAFTED_PREFIX:
      generation = 'prefix'; break
    case _$.SUFFIX_MODIFIER:
    case _$.CRAFTED_SUFFIX:
      generation = 'suffix'; break
  }

  const name = match.groups!.name || undefined
  const tier = Number(match.groups!.tier) || undefined
  const rank = Number(match.groups!.rank) || undefined
  const tags = tagsText ? tagsText.split(', ') : []
  const rollIncr = parseInt(incrText, 10) || undefined

  return { generation, name, tier, rank, tags, rollIncr }
}

export function isModInfoLine (line: string): boolean {
  return line.startsWith('{') && line.endsWith('}')
}

interface GroupedModLines {
  info: ModifierInfo
  lines: string[]
}

export function * groupLinesByMod (lines: string[]): Generator<GroupedModLines, void> {
  if (!lines.length || !isModInfoLine(lines[0])) {
    throw new Error()
  }

  let last: GroupedModLines | undefined
  for (const line of lines) {
    if (!isModInfoLine(line)) {
      last!.lines.push(line)
    } else {
      if (last) { yield last }
      last = { info: parseModInfoLine(line), lines: [] }
    }
  }
  yield last!
}
