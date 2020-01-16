import { Mod } from '../src/data'
const fs = require('fs')
const nfetch = require('node-fetch')

interface ApiStats {
  result: Array<{
    label: string,
    entries: Array<{
      id: string
      text: string
      type: string
      option?: {
        options: Array<{
          id: string | number
          text: string
        }>
      }
    }>
  }>
}

const SUPPORTED_MODS = ['pseudo', 'explicit', 'implicit', 'enchant', 'crafted']

;(async function () {
  const response = await nfetch('https://www.pathofexile.com/api/trade/data/stats')
  const { result }: ApiStats = await response.json()

  const dupes = new Set<string>()
  const MOD_BY_NAME = new Map<string, Mod>()

  for (const _ of result) {
    for (const rawMod of _.entries) {
      if (SUPPORTED_MODS.includes(rawMod.type)) {
        const mod = MOD_BY_NAME.get(rawMod.text)
        if (mod) {
          if (mod.types.find(type => type.name === rawMod.type)) {
            dupes.add(rawMod.text)
            // invalidate mod
            mod.types.find(type => type.name === rawMod.type)!.tradeId = undefined
          } else {
            mod.types.push({ name: rawMod.type, tradeId: rawMod.id })
          }
        } else {
          if (!rawMod.option) {
            MOD_BY_NAME.set(rawMod.text, {
              text: rawMod.text,
              types: [{
                name: rawMod.type,
                tradeId: rawMod.id
              }]
            })
          } else {
            for (const option of rawMod.option.options) {
              MOD_BY_NAME.set(rawMod.text.replace('#', option.text), {
                text: rawMod.text,
                types: [{
                  name: rawMod.type,
                  tradeId: rawMod.id
                }],
                option: {
                  text: option.text,
                  tradeId: option.id
                }
              })
            }
          }
        }
      }
    }
  }

  if (dupes.size) {
    console.warn('Dupe mods found, consider to report to GGG')
    console.warn(Array.from(dupes))
    console.warn('Dupe mods found, consider to report to GGG')
  }

  fs.writeFileSync('./src/data/mods.json', JSON.stringify(Array.from(MOD_BY_NAME), null, 2))
})()
