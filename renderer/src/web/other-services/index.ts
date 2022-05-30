import { MainProcess } from '@/web/background/IPC'
import { openWiki } from './wiki'
import { openNinja } from './ninja'
import { openCOE } from './craft-of-exile'
import { handleLine } from '../client-log/client-log'

export function registerOtherServices () {
  MainProcess.onEvent('MAIN->OVERLAY::open-wiki', (e) => {
    openWiki(e.clipboard)
  })

  MainProcess.onEvent('MAIN->OVERLAY::open-ninja', (e) => {
    openNinja(e.clipboard)
  })

  MainProcess.onEvent('MAIN->OVERLAY::client-log', (e) => {
    for (const line of e.lines) {
      handleLine(line)
    }
  })

  MainProcess.onEvent('MAIN->OVERLAY::open-craft-of-exile', (e) => {
    openCOE(e.clipboard)
  })
}
