const itemVariants: Record<string, ItemVariant> = require('../data/itemVariants')
const gemVariants: Array<GemVariant> = require('../data/gemVariants')
const parserTypes: Record<string, ParserType[]> = require('../data/parserTypes')
const mapAffixes: { prefix: string[], suffix: string[] } = require('../data/mapAffixes')

interface ItemVariant {
  regex?: {
    pattern: string
    matches: {
      [match: string]: string
    }
  }
  mods?: Array<{
    regex: string[]
    variant: string
  }>
}

interface GemVariant {
  variant: string
  name: string | null
  levelFrom: number
  qualityFrom: number
  levelTo: number
  qualityTo: number
  corrupted: boolean | null
}

interface ParserType {
  regex: string
  type: string
}
