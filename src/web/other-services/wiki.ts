import { MainProcess } from '@/ipc/main-process-bindings'
import { parseClipboard, ItemRarity } from '@/parser'
import { Config } from '@/web/Config'
import { TRANSLATED_ITEM_NAME_BY_REF } from '@/assets/data'

const ENDPOINT_BY_LANG = {
  en: 'pathofexile.gamepedia.com',
  ru: 'pathofexile-ru.gamepedia.com'
}

export function openWiki (clipboard: string) {
  const item = parseClipboard(clipboard)
  if (!item) return

  let pageName = (item.rarity === ItemRarity.Unique)
    ? item.name
    : item.baseType || item.name

  pageName = TRANSLATED_ITEM_NAME_BY_REF.get(pageName) || pageName

  MainProcess.openSystemBrowser(`https://${ENDPOINT_BY_LANG[Config.store.language]}/${pageName}`)
}
