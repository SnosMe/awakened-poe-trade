import { Mods } from '../../data'

function mod (name: string) {
  const mod = Mods.get(name)
  if (!mod) {
    throw new Error(`Cannot find stat: ${name}`)
  }
  return mod.mod.text
}

export const QUALITY_STATS = {
  ARMOUR: {
    flat: mod('# to Armour'),
    incr: [
      mod('#% increased Armour'),
      mod('#% increased Armour and Energy Shield'),
      mod('#% increased Armour and Evasion'),
      mod('#% increased Armour, Evasion and Energy Shield')
    ]
  },
  EVASION: {
    flat: mod('# to Evasion Rating'),
    incr: [
      mod('#% increased Evasion Rating'),
      mod('#% increased Armour and Evasion'),
      mod('#% increased Evasion and Energy Shield'),
      mod('#% increased Armour, Evasion and Energy Shield')
    ]
  },
  ENERGY_SHIELD: {
    flat: mod('# to maximum Energy Shield'),
    incr: [
      mod('#% increased Energy Shield'),
      mod('#% increased Armour and Energy Shield'),
      mod('#% increased Evasion and Energy Shield'),
      mod('#% increased Armour, Evasion and Energy Shield')
    ]
  },
  PHYSICAL_DAMAGE: {
    flat: mod('Adds # to # Physical Damage'),
    incr: [
      mod('#% increased Physical Damage')
    ]
  }
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
  mod('#% Chance to Block'),
  mod('#% increased Attack Speed'),

  mod('Adds # to # Chaos Damage'),
  mod('Adds # to # Lightning Damage'),
  mod('Adds # to # Cold Damage'),
  mod('Adds # to # Fire Damage'),

  // NOTE: atm it is better to include it in this list to avoid bugs
  // \/\/\/\/
  mod('#% increased Critical Strike Chance'),
  mod('#% chance to Poison on Hit')
  // /\/\/\/\
])
