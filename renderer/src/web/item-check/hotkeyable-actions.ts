import { Host } from '@/web/background/IPC'
import { AppConfig } from '@/web/Config'
import { ParsedItem, parseClipboard } from '@/parser'

const POEDB_LANGS = { 'en': 'us', 'ru': 'ru', 'cmn-Hant': 'tw', 'zh_CN': 'cn' }

export function registerActions () {
  Host.onEvent('MAIN->CLIENT::item-text', (e) => {
    if (!['open-wiki', 'open-craft-of-exile', 'open-poedb', 'search-similar'].includes(e.target)) return
    const item = parseClipboard(e.clipboard)
    if (!item) return

    if (e.target === 'open-wiki') {
      openWiki(item)
    } else if (e.target === 'open-craft-of-exile') {
      openCoE(item)
    } else if (e.target === 'open-poedb') {
      openPoedb(item)
    } else if (e.target === 'search-similar') {
      findSimilarItems(item)
    }
  })
}

export function openWiki (item: ParsedItem) {
  window.open(`https://www.poewiki.net/wiki/${item.info.refName}`)
}
export function openPoedb (item: ParsedItem) {
  window.open(`https://poedb.tw/${POEDB_LANGS[AppConfig().language]}/search?q=${item.info.refName}`)
}
export function openCoE (item: ParsedItem) {
  const encodedClipboard = encodeURIComponent(item.rawText)
  window.open(`https://craftofexile.com/?eimport=${encodedClipboard}`)
}

export function findSimilarItems (item: ParsedItem) {
  const text = JSON.stringify(item.info.name)
  Host.sendEvent({
    name: 'CLIENT->MAIN::user-action',
    payload: { action: 'stash-search', text }
  })
}
