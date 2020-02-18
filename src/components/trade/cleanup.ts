import { Mods } from '../../data'
import { QUALITY_STATS } from './calc-q20'

// assertion, to avoid regressions in mods.json
export function assertStat (name: string) {
  const mod = Mods.get(name)
  if (!mod) {
    throw new Error(`Cannot find stat: ${name}`)
  }
  return mod.mod.text
}

export const localStats = new Set<string>([
  QUALITY_STATS.ARMOUR.flat,
  QUALITY_STATS.EVASION.flat,
  QUALITY_STATS.ENERGY_SHIELD.flat,
  QUALITY_STATS.PHYSICAL_DAMAGE.flat,
  ...QUALITY_STATS.ARMOUR.incr,
  ...QUALITY_STATS.EVASION.incr,
  ...QUALITY_STATS.ENERGY_SHIELD.incr,
  ...QUALITY_STATS.PHYSICAL_DAMAGE.incr,
  assertStat('#% Chance to Block'),
  assertStat('#% increased Attack Speed'),
  assertStat('#% increased Critical Strike Chance'),

  assertStat('Adds # to # Chaos Damage'),
  assertStat('Adds # to # Lightning Damage'),
  assertStat('Adds # to # Cold Damage'),
  assertStat('Adds # to # Fire Damage')
])
