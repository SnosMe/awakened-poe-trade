export enum TradeNumberColors {
  White = 0,
  Augmented = 1,
  Unmet = 2,
  Physical = 3,
  Fire = 4,
  Cold = 5,
  Lightning = 6,
  Chaos = 7,
  Unique = 8,
  Currency = 10,
  Divination = 12,
  Enchant = 8729,
  Fractured = 8730,
  Crafted = 8734
}

export type TradeRichText = string | number | {
  text?: TradeRichText
  value?: TradeRichText
  description?: TradeRichText
}

export interface TradeDataLine {
  name: TradeRichText
  values?: Array<[TradeRichText, TradeNumberColors]>
  displayMode: number
  type?: number
}

interface TradeModMetadata {
  name?: string
  tier?: string
  level?: number
  magnitudes: Array<{ hash?: string, min: string, max: string }>
}

export type TradeModHashes = [string, number[] | null]

interface FetchResultMod {
  description?: TradeRichText
  text?: TradeRichText
  value?: TradeRichText
  hash?: string
  flags?: {
    crafted?: true
    fractured?: true
  }
  mods?: TradeModMetadata[]
}

type FetchResultModLine = TradeRichText | FetchResultMod

export interface DisplayItemLine {
  text: string
  tier?: string
  value?: string | number
  color: TradeNumberColors
  modCategory?: 'fractured' | 'explicit' | 'crafted' | 'veiled'
}

export interface DisplaySocket {
  group: number
  attr?: string
  sColour?: string
}

export interface DisplayItem {
  title: string[]
  rarity: string
  frameType?: number
  nameBlock?: DisplayItemLine[]
  itemProps?: DisplayItemLine[]
  enchantMods?: DisplayItemLine[]
  implicitMods?: DisplayItemLine[]
  fracturedMods?: DisplayItemLine[]
  explicitMods?: DisplayItemLine[]
  craftedMods?: DisplayItemLine[]
  veiledMods?: DisplayItemLine[]
  itemTags?: DisplayItemLine[]
  sockets?: DisplaySocket[]
  icon?: {
    url: string
    w: number
    h: number
  }
}

export interface FetchItem {
  w?: number
  h?: number
  icon?: string
  name?: string
  typeLine?: string
  baseType?: string
  rarity?: string
  frameType?: number
  ilvl?: number
  identified?: boolean
  stackSize?: number
  corrupted?: boolean
  duplicated?: boolean
  split?: boolean
  synthesised?: boolean
  fractured?: boolean
  replica?: boolean
  sockets?: DisplaySocket[]
  properties?: TradeDataLine[]
  requirements?: TradeDataLine[]
  enchantMods?: FetchResultModLine[]
  implicitMods?: FetchResultModLine[]
  fracturedMods?: FetchResultModLine[]
  explicitMods?: FetchResultModLine[]
  craftedMods?: FetchResultModLine[]
  veiledMods?: FetchResultModLine[]
  extended?: {
    hashes?: Record<string, TradeModHashes[]>
    mods?: Record<string, TradeModMetadata[]>
    [key: string]: unknown
  }
  note?: string
}

export interface FetchResultForTooltip {
  item: FetchItem
}

export function findPropertyValue (item: FetchItem, type: number): string | undefined {
  const value = item.properties?.find(prop => prop.type === type)?.values?.[0]?.[0]
  return value != null ? parseTradeText(value) : undefined
}

export function parseFetchResult (result: FetchResultForTooltip): DisplayItem {
  const title: string[] = []
  if (result.item.name) title.push(result.item.name)
  if (result.item.typeLine) title.push(result.item.typeLine)

  return {
    title,
    rarity: result.item.rarity ?? 'Normal',
    frameType: result.item.frameType,
    nameBlock: buildNameBlock(result.item.properties),
    itemProps: buildItemProps(result.item.ilvl, result.item.requirements),
    ...parseMods(result),
    veiledMods: result.item.veiledMods?.map(parseVeiledMod),
    itemTags: buildItemTags(result.item),
    sockets: result.item.sockets,
    icon: result.item.icon
      ? {
          url: result.item.icon,
          w: result.item.w ?? 1,
          h: result.item.h ?? 1
        }
      : undefined
  }
}

function parseMods (result: FetchResultForTooltip): Pick<DisplayItem,
  'enchantMods' | 'implicitMods' | 'fracturedMods' | 'explicitMods' | 'craftedMods'> {
  const modMetadata = result.item.extended?.mods
  const modHashes = result.item.extended?.hashes

  return {
    enchantMods: parseModBlock(
      result.item.enchantMods,
      TradeNumberColors.Enchant,
      modMetadata?.enchant,
      modHashes?.enchant
    ),
    implicitMods: parseModBlock(
      result.item.implicitMods,
      TradeNumberColors.Augmented,
      modMetadata?.implicit,
      modHashes?.implicit
    ),
    fracturedMods: parseModBlock(
      result.item.fracturedMods,
      TradeNumberColors.Fractured,
      modMetadata?.fractured,
      modHashes?.fractured,
      'fractured'
    ),
    explicitMods: parseModBlock(
      result.item.explicitMods,
      TradeNumberColors.Augmented,
      modMetadata?.explicit,
      modHashes?.explicit,
      'explicit'
    ),
    craftedMods: parseModBlock(
      result.item.craftedMods,
      TradeNumberColors.Crafted,
      modMetadata?.crafted,
      modHashes?.crafted,
      'crafted'
    )
  }
}

function parseModBlock (
  lines: FetchResultModLine[] | undefined,
  color: TradeNumberColors,
  mods?: TradeModMetadata[],
  hashes?: TradeModHashes[],
  modCategory?: DisplayItemLine['modCategory']
): DisplayItemLine[] | undefined {
  if (!lines) return undefined

  return lines.map((line, index) => ({
    text: parseTradeText(line),
    color: getModColor(line, color),
    tier: getRichTier(line) ?? getLegacyTier(index, mods, hashes),
    modCategory: getModCategory(line, modCategory)
  }))
}

function getModCategory (
  line: FetchResultModLine,
  fallback: DisplayItemLine['modCategory']
): DisplayItemLine['modCategory'] {
  if (typeof line !== 'object' || line == null) return fallback
  const flags = 'flags' in line ? line.flags : undefined
  const hash = 'hash' in line ? line.hash : undefined
  if (flags?.fractured || hash?.includes('.fractured.')) return 'fractured'
  if (flags?.crafted || hash?.includes('.crafted.')) return 'crafted'
  return fallback
}

function parseVeiledMod (mod: FetchResultModLine): DisplayItemLine {
  const sourceText = parseTradeText(mod)
  const hash = typeof mod === 'object' && mod != null && 'hash' in mod ? mod.hash : undefined
  const isPrefix = hash?.toLowerCase().includes('prefix') || /^prefix\b/i.test(sourceText)
  const isSuffix = hash?.toLowerCase().includes('suffix') || /^suffix\b/i.test(sourceText)
  return {
    text: isPrefix ? 'Unrevealed Prefix' : isSuffix ? 'Unrevealed Suffix' : sourceText,
    color: TradeNumberColors.Augmented,
    modCategory: 'veiled'
  }
}

export function orderDisplayAffixes (groups: Array<DisplayItemLine[] | undefined>): DisplayItemLine[] {
  const categoryOrder: Record<NonNullable<DisplayItemLine['modCategory']>, number> = {
    fractured: 0,
    explicit: 1,
    crafted: 2,
    veiled: 3
  }
  const sideOrder = (line: DisplayItemLine) => line.tier?.startsWith('P')
    ? 0
    : line.tier?.startsWith('S') ? 1 : 2

  return groups
    .flatMap(group => group ?? [])
    .map((line, index) => ({ line, index }))
    .sort((a, b) => {
      return sideOrder(a.line) - sideOrder(b.line) ||
        categoryOrder[a.line.modCategory ?? 'explicit'] - categoryOrder[b.line.modCategory ?? 'explicit'] ||
        a.index - b.index
    })
    .map(({ line }) => line)
}

function getModColor (line: FetchResultModLine, fallback: TradeNumberColors): TradeNumberColors {
  if (typeof line !== 'object' || line == null) return fallback
  const flags = 'flags' in line ? line.flags : undefined
  const hash = 'hash' in line ? line.hash : undefined
  if (flags?.fractured || hash?.includes('.fractured.')) return TradeNumberColors.Fractured
  if (flags?.crafted || hash?.includes('.crafted.')) return TradeNumberColors.Crafted
  return fallback
}

function getRichTier (line: FetchResultModLine): string | undefined {
  if (typeof line !== 'object' || line == null || !('mods' in line)) return undefined
  const tiers = line.mods?.map(mod => mod.tier).filter((tier): tier is string => Boolean(tier))
  return tiers?.length ? tiers.join(' + ') : undefined
}

function getLegacyTier (
  displayIndex: number,
  mods?: TradeModMetadata[],
  hashes?: TradeModHashes[]
): string | undefined {
  const indexes = hashes?.[displayIndex]?.[1]
  if (!indexes?.length || !mods?.length) return undefined
  const tiers = indexes.map(index => mods[index]?.tier).filter((tier): tier is string => Boolean(tier))
  return tiers.length ? tiers.join(' + ') : undefined
}

function buildNameBlock (properties: TradeDataLine[] | undefined): DisplayItemLine[] | undefined {
  if (!properties?.length) return undefined

  return properties.flatMap(property => {
    const name = parseTradeText(property.name)
    const values = (property.values ?? []).map(([value]) => parseTradeText(value))
    if (!name && !values.length) return []
    const color = property.values?.[0]?.[1] ?? TradeNumberColors.White
    if (name.includes('{0}')) {
      let text = name
      values.forEach((value, index) => { text = text.replace(`{${index}}`, value) })
      return [{ text, color }]
    }
    return [{
      text: name ? `${name}: ` : '',
      value: values.join(', '),
      color
    }]
  })
}

function buildItemProps (itemLevel: number | undefined, requirements: TradeDataLine[] | undefined): DisplayItemLine[] | undefined {
  const block: DisplayItemLine[] = []
  if (itemLevel != null) {
    block.push({ text: 'Item Level: ', value: itemLevel, color: TradeNumberColors.White })
  }
  if (requirements?.length) {
    const level = requirements.find(req => req.type === 62 || parseTradeText(req.name).toLowerCase() === 'level')
    const attributes = requirements
      .filter(req => req !== level)
      .map(req => `${parseTradeText(req.values?.[0]?.[0] ?? '')} ${parseTradeText(req.name)}`.trim())
    const levelValue = level ? parseTradeText(level.values?.[0]?.[0] ?? '') : ''
    const levelLabel = level ? parseTradeText(level.name) : ''
    block.push({
      text: level ? `Requires ${levelLabel} ` : 'Requires ',
      value: [levelValue, ...attributes].filter(Boolean).join(', '),
      color: TradeNumberColors.White
    })
  }
  return block.length ? block : undefined
}

function buildItemTags (item: FetchItem): DisplayItemLine[] | undefined {
  const tags: DisplayItemLine[] = []
  if (item.identified === false) tags.push({ text: 'Unidentified', color: TradeNumberColors.Unmet })
  if (item.corrupted) tags.push({ text: 'Corrupted', color: TradeNumberColors.Unmet })
  if (item.duplicated) tags.push({ text: 'Mirrored', color: TradeNumberColors.Augmented })
  if (item.split) tags.push({ text: 'Split', color: TradeNumberColors.Augmented })
  if (item.synthesised) tags.push({ text: 'Synthesised', color: TradeNumberColors.Augmented })
  if (item.fractured) tags.push({ text: 'Fractured Item', color: TradeNumberColors.Fractured })
  if (item.replica) tags.push({ text: 'Replica', color: TradeNumberColors.Unique })
  return tags.length ? tags : undefined
}

function parseTradeText (text: TradeRichText | FetchResultMod): string {
  if (typeof text === 'string' || typeof text === 'number') return String(text)
  if (text == null || typeof text !== 'object') return ''
  if ('description' in text && text.description != null) return parseTradeText(text.description)
  if ('text' in text && text.text != null) return parseTradeText(text.text)
  if ('value' in text && text.value != null) return parseTradeText(text.value)
  return ''
}

export const testExports = {
  parseFetchResult,
  orderDisplayAffixes
}
