import { MainProcess } from '@/web/background/IPC'
import { parseClipboard } from '@/parser'

const COE_URL = 'https://craftofexile.com/'

export function openCOE (clipboard: string) {
  const item = parseClipboard(clipboard)
  if (!item) return

  const encodedClipboard = encodeURIComponent(clipboard)
  MainProcess.openSystemBrowser(`${COE_URL}?eimport=${encodedClipboard}`)
}
