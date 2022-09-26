/* eslint-disable camelcase */
import { CLIENT_STRINGS as _$ } from '@/assets/data'
import { AppConfig } from '@/web/Config'

const enum MessageChannel {
  SYSTEM = 'system',
  TRADE = 'trade',
  GLOBAL = 'global',
  PARTY = 'party',
  GUILD = 'guild',
  WHISPER_FROM = 'whisper.from',
  WHISPER_TO = 'whisper.to'
}

interface LogEntry {
  сhannel: MessageChannel
  guildTag?: string
  charName?: string
  body: string
  trade?: {
    item: {
      name: string
      amount?: number
      gem?: { level: number, quality: number }
    }
    price: {
      name: string
      amount: number
    }
    tab?: {
      name: string
      left: number
      top: number
    }
  }
}

export function handleLine (line: string) {
  const text = line.split('] ').slice(1).join('] ')
  if (!text) return

  const entry = {} as LogEntry
  let match: RegExpMatchArray | null
  if ((match = text.match(_$.CHAT_GLOBAL))) {
    entry.сhannel = MessageChannel.GLOBAL
  } else if ((match = text.match(_$.CHAT_TRADE))) {
    entry.сhannel = MessageChannel.TRADE
  } else if ((match = text.match(_$.CHAT_SYSTEM))) {
    entry.сhannel = MessageChannel.SYSTEM
  } else if ((match = text.match(_$.CHAT_WHISPER_TO))) {
    entry.сhannel = MessageChannel.WHISPER_TO
  } else if ((match = text.match(_$.CHAT_WHISPER_FROM))) {
    entry.сhannel = MessageChannel.WHISPER_FROM
  } else if ((match = text.match(_$.CHAT_PARTY))) {
    entry.сhannel = MessageChannel.PARTY
  } else if ((match = text.match(_$.CHAT_GUILD))) {
    entry.сhannel = MessageChannel.GUILD
  } else {
    return
  }

  entry.guildTag = match.groups!.guild_tag
  entry.charName = match.groups!.char_name
  entry.body = match.groups!.body

  if (entry.сhannel === MessageChannel.WHISPER_FROM) {
    if ((match = entry.body.match(TRADE_WHISPER[AppConfig().language]))) {
      const [pAmount, pTag] = [
        match.groups!.price.split(' ', 1).toString(),
        match.groups!.price.split(' ').slice(1).join(' ')
      ]
      const gemMatch = match.groups!.item.match(_$.CHAT_WEBTRADE_GEM)
      if (gemMatch) {
        match.groups!.item = gemMatch.groups!.gem_name
      }

      entry.trade = {
        item: {
          name: match.groups!.item
        },
        price: {
          amount: Number(pAmount),
          name: pTag
        },
        tab: {
          name: match.groups!.tab_name,
          top: Number(match.groups!.tab_top),
          left: Number(match.groups!.tab_left)
        }
      }

      if (gemMatch) {
        entry.trade.item.gem = {
          level: Number(gemMatch.groups!.gem_lvl),
          quality: Number(gemMatch.groups!.gem_qual)
        }
      }

      // console.log(entry)
    } else if ((match = entry.body.match(TRADE_BULK_WHISPER[AppConfig().language]))) {
      const [pAmount, pName] = [
        match.groups!.price.split(' ', 1).toString(),
        match.groups!.price.split(' ').slice(1).join(' ')
      ]
      const [iAmount, iName] = [
        match.groups!.item.split(' ', 1).toString(),
        match.groups!.item.split(' ').slice(1).join(' ')
      ]

      entry.trade = {
        item: {
          amount: Number(iAmount),
          name: iName
        },
        price: {
          amount: Number(pAmount),
          name: pName
        }
      }

      // console.log(entry)
    }
  }
}

const TRADE_WHISPER = {
  'en': /^Hi, I would like to buy your (?<item>.+) listed for (?<price>.+) in (?<league>.+) \(stash tab "(?<tab_name>.*)"; position: left (?<tab_left>\d+), top (?<tab_top>\d+)\)(?<message>.+)?$/,
  'ru': /^Здравствуйте, хочу купить у вас (?<item>.+) за (?<price>.+) в лиге (?<league>.+) \(секция "(?<tab_name>.*)"; позиция: (?<tab_left>\d+) столбец, (?<tab_top>\d+) ряд\)(?<message>.+)?$/,
  'ko': /^안녕하세요, (?<league>.+)\(보관함 탭 "(?<tab_name>.*)", 위치: 왼쪽 (?<tab_left>\d+), 상단 (?<tab_top>\d+)\)에 (?<price>.+)\(으\)로 올려놓은 (?<item>.+)\(을\)를 구매하고 싶습니다(?<message>.+)?$/,
  'de': /^Hi, ich möchte '(?<item>.+)' zum angebotenen Preis von (?<price>.+) in der (?<league>.+)-Liga kaufen \(Truhenfach "(?<tab_name>.*)"; Position: (?<tab_left>\d+) von links, (?<tab_top>\d+) von oben\)(?<message>.+)?$/,
  'fr': /^Bonjour, je souhaiterais t'acheter (?<item>.+) pour (?<price>.+) dans la ligue (?<league>.+) \(onglet de réserve "(?<tab_name>.*)" ; (?<tab_left>\d+)e en partant de la gauche, (?<tab_top>\d+)e en partant du haut\)(?<message>.+)?$/,
  'es': /^Hola, quisiera comprar tu (?<item>.+) listado por (?<price>.+) en (?<league>.+) \(pestaña de alijo "(?<tab_name>.*)"; posición: izquierda(?<tab_left>\d+), arriba (?<tab_top>\d+)\)(?<message>.+)?$/,
  'pt': /^Olá, eu gostaria de comprar o seu item (?<item>.+) listado por (?<price>.+) na (?<league>.+) \(aba do baú: "(?<tab_name>.*)"; posição: esquerda (?<tab_left>\d+), topo (?<tab_top>\d+)\)(?<message>.+)?$/,
  'th': /^สวัสดี, เราต้องการจะชื้อของคุณ (?<item>.+) ใน ราคา (?<price>.+) ใน (?<league>.+) \(stash tab "(?<tab_name>.*)"; ตำแหน่ง: ซ้าย (?<tab_left>\d+), บน (?<tab_top>\d+)\)(?<message>.+)?$/,
  'cmn-Hant': /^你好，我想購買 (?<item>.+) 標價 (?<price>.+) 在 (?<league>.+) \(倉庫頁 "(?<tab_name>.*)"; 位置: 左 (?<tab_left>\d+), 上 (?<tab_top>\d+)\)(?<message>.+)?$/,
  'zh_CN': /^你好，我想購買 (?<item>.+) 標價 (?<price>.+) 在 (?<league>.+) \(倉庫頁 "(?<tab_name>.*)"; 位置: 左 (?<tab_left>\d+), 上 (?<tab_top>\d+)\)(?<message>.+)?$/
}

const TRADE_BULK_WHISPER = {
  'en': /^Hi, I'd like to buy your (?<item>.+) for my (?<price>.+) in (?<league>.+)\.(?<message>.+)?$/,
  'ru': /^Здравствуйте, хочу купить у вас (?<item>.+) за (?<price>.+) в лиге (?<league>.+)\.(?<message>.+)?$/,
  'cmn-Hant': /^你好，我想用 (?<price>.+) 購買 (?<item>.+) in (?<league>.+)\.(?<message>.+)?$/,
  'zh_CN': /^你好，我想用 (?<price>.+) 購買 (?<item>.+) in (?<league>.+)\.(?<message>.+)?$/
}
