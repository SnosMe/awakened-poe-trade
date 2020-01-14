import prophecies from './prophecies.json'
import monsters from './itemised-monsters.json'

export const Prophecies = new Set(prophecies as string[])
export const ItemisedMonsters = new Set(monsters as string[])
