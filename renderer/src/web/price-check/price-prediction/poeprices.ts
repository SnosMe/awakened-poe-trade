import { ParsedItem } from '@/parser'
import { selected as league } from '@/web/background/Leagues'
import { MainProcess } from '@/web/background/IPC'
import { Cache } from '../trade/Cache'

const cache = new Cache()

interface PoepricesApiResponse { /* eslint-disable camelcase */
  currency: 'chaos' | 'divine'
  error: number
  error_msg: string
  warning_msg: string
  max: number
  min: number
  pred_confidence_score: number
  pred_explanation: Array<[string, number]>
}

export interface RareItemPrice {
  max: number
  min: number
  confidence: number
  currency: 'chaos' | 'div'
  explanation: Array<{
    name: string
    contrib: number
  }>
}

export async function requestPoeprices (item: ParsedItem): Promise<RareItemPrice> {
  const query = querystring({
    i: utf8ToBase64(transformItemText(item.rawText)),
    l: league.value,
    s: 'awakened-poe-trade'
  })

  let data = cache.get<PoepricesApiResponse>(query)
  if (!data) {
    const response = await fetch(`${MainProcess.CORS}https://www.poeprices.info/api?${query}`)
    try {
      data = await response.json() as PoepricesApiResponse
    } catch (e) {
      throw new Error(`${response.status}, poeprices.info API is under load or down.`)
    }

    if (data.error !== 0) {
      throw new Error(data.error_msg)
    }

    cache.set<PoepricesApiResponse>(query, data, 300)
  }

  if (data.currency !== 'divine' && data.currency !== 'chaos') {
    throw new Error('poeprices.info gave the price in Exalted Orbs.')
  }

  return {
    currency: (data.currency === 'divine') ? 'div' : 'chaos',
    min: data.min,
    max: data.max,
    confidence: Math.round(data.pred_confidence_score),
    explanation: data.pred_explanation.map(expl => ({
      name: expl[0],
      contrib: Math.round(expl[1] * 100)
    }))
  }
}

export function getExternalLink (item: ParsedItem): string {
  const query = querystring({
    i: utf8ToBase64(transformItemText(item.rawText)),
    l: league.value,
    s: 'awakened-poe-trade',
    w: 1
  })
  return `https://www.poeprices.info/api?${query}`
}

export async function sendFeedback (
  feedback: { text: string, option: 'fair' | 'low' | 'high' },
  prediction: Pick<PoepricesApiResponse, 'min' | 'max' | 'currency'>,
  item: ParsedItem
): Promise<void> {
  const body = new FormData()
  body.append('selector', feedback.option)
  body.append('feedbacktxt', feedback.text)
  body.append('qitem_txt', utf8ToBase64(transformItemText(item.rawText)))
  body.append('source', 'awakened-poe-trade')
  body.append('min', String(prediction.min))
  body.append('max', String(prediction.max))
  body.append('currency', prediction.currency)
  body.append('league', league.value!)
  // body.append('debug', String(1))

  const response = await fetch('https://www.poeprices.info/send_feedback', {
    method: 'POST',
    body
  })
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const text = await response.text()
  // console.assert(text === `"${feedback.option}"`)
}

function utf8ToBase64 (value: string) {
  return btoa(unescape(encodeURIComponent(value)))
}

function querystring (q: Record<string, any>) {
  return Object.entries(q)
    .map(pair => pair.map(encodeURIComponent).join('='))
    .join('&')
}

/**
 * @deprecated TODO blocked by poeprices.info not supporting advanced text
 */
function transformItemText (rawText: string) {
  // this may not account for all cases
  return rawText
    .replace(/(?<=\d)(\([^)]+\))/gm, '')
    .replace(/^\{.+\}$\n/gm, '')
}
