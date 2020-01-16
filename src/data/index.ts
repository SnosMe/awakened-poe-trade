import prophecies from './prophecies.json'
import monsters from './itemised-monsters.json'
import mods from './mods.json'

export interface Mod {
  text: string
  types: Array<{
    name: string
    tradeId?: string
    // undefined when dupe mod found. Alternative impl is to store
    // all tradeIds in array, and apply Logical OR with "min: 1 matched"
  }>
  option?: {
    text: string
    tradeId: string | number
  }
}

export const Prophecies = new Set(prophecies as string[])
export const ItemisedMonsters = new Set(monsters as string[])
export const Mods = new Map<string, Mod>(mods)
