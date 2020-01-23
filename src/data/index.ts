import prophecies from './prophecies.json'
import monsters from './itemised-monsters.json'
import mods from './mods.json'

export interface StatMatcher {
  string: string
  negate?: true
  condition?: {
    min?: number
    max?: number
  }
  option?: {
    text: string
    tradeId: string | number
  }
}

export interface Mod {
  text: string
  types: Array<{
    name: string
    tradeId?: string
  }>
}

export const Prophecies = new Set(prophecies as string[])
export const ItemisedMonsters = new Set(monsters as string[])
export const Mods = new Map<string, Mod>(mods)
