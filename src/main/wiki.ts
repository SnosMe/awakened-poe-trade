import { shell } from 'electron'
import { parseClipboard, ItemRarity } from '../components/parser'

const WIKI_URL = 'https://pathofexile.gamepedia.com'

export function openWiki (clipboard: string) {
  const item = parseClipboard(clipboard)
  if (!item) return

  const pageName = (item.rarity === ItemRarity.Unique)
    ? item.name
    : item.baseType || item.name

  shell.openExternal(`${WIKI_URL}/${pageName}`)
}
