import { parseClipboard } from '@/parser'

export function openWiki (clipboard: string) {
  const item = parseClipboard(clipboard)
  if (!item) return

  window.open(`https://www.poewiki.net/wiki/${item.info.refName}`)
}
