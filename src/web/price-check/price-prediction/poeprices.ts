import { stringify } from 'querystring'
import { ParsedItem } from '@/parser'
import { Leagues } from '../Leagues'
import { MainProcess } from '@/ipc/main-process-bindings'

interface PoepricesApiResponse { /* eslint-disable camelcase */
  currency: 'chaos' | 'exalted'
  error: number
  error_msg: string
  warning_msg: string
  max: number
  min: number
  pred_confidence_score: number
  pred_explanation: Array<[string, number]>
}

interface RareItemPrice {
  max: number
  min: number
  confidence: number
  currency: string
  explanation: Array<{
    name: string
    contrib: number
  }>
}

export async function requestPoeprices (item: ParsedItem): Promise<RareItemPrice | null> {
  const query = stringify({
    i: Buffer.from(item.rawText).toString('base64'),
    l: Leagues.selected,
    s: 'awakened-poe-trade'
  })
  const response = await fetch(`${MainProcess.CORS}https://www.poeprices.info/api?${query}`)
  const data: PoepricesApiResponse = await response.json()

  if (data.error !== 0) {
    throw new Error(data.error_msg)
  }

  return {
    currency: (data.currency === 'chaos') ? 'c' : 'e',
    min: data.min,
    max: data.max,
    confidence: Math.round(data.pred_confidence_score),
    explanation: data.pred_explanation.map(expl => ({
      name: expl[0],
      contrib: Math.round(expl[1] * 100)
    }))
  }
}
