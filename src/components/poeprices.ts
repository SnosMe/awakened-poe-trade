import { stringify } from 'querystring'
import { ParsedItem, ItemRarity, ItemCategory } from './Parser'
import { Leagues } from './Leagues'

/* eslint-disable camelcase */
interface PoepricesApiResponse {
  currency: 'chaos' | 'exalted'
  error: number
  error_msg: string
  warning_msg: string
  max: number
  min: number
  pred_confidence_score: number
  pred_explanation: Array<[string, number]>
}
/* eslint-enable camelcase */

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
  console.assert(item.rarity === ItemRarity.Rare && item.computed.category !== ItemCategory.Map)

  const query = stringify({
    i: Buffer.from(item.rawText).toString('base64'),
    l: Leagues.selected,
    s: 'awakened-poe-trade'
  })
  const response = await fetch(`https://www.poeprices.info/api?${query}`)
  const data: PoepricesApiResponse = await response.json()

  if (data.error !== 0) {
    throw new Error(data.error_msg)
  }

  return {
    currency: data.currency === 'chaos' ? 'chaos-orb' : 'exalted-orb',
    max: Number(data.max.toFixed(1)),
    min: Number(data.min.toFixed(1)),
    confidence: Number(data.pred_confidence_score.toFixed(0)),
    explanation: data.pred_explanation.map(expl => ({
      name: expl[0],
      contrib: Number((expl[1] * 100).toFixed(0))
    }))
  }
}
