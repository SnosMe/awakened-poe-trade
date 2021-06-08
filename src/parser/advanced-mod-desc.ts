import { CLIENT_STRINGS as _$ } from '@/assets/data'

// TODO "— Unscalable Value"

interface ModifierInfo {
  generation?: 'suffix' | 'prefix'
  name?: string
  tier?: number
  rank?: number
  tags?: string[]
  catalystIncr?: number
}

export function parseModInfoLine (line: string): ModifierInfo {
  const [modText, tagsText, catalystText] = line
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
  const catalystIncr = parseInt(catalystText, 10) || undefined

  return { generation, name, tier, rank, tags, catalystIncr }
}
