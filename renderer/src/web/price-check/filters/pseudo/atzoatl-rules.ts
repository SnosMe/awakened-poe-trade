import { stat } from '@/assets/data'
import { IncursionRoom } from '@/parser/ParsedItem'
import type { StatFilter } from '../interfaces'

interface FilterRule {
  ref: string
  disabled?: boolean
  remove?: boolean
  hidden?: string
  explosivesRoom?: boolean
}

const HIDDEN_GREEDY = 'filters.hide_greedy'

const RULES: FilterRule[] = [
  { ref: stat('Has Room: Banquet Hall'), remove: true },
  { ref: stat('Has Room: Antechamber'), remove: true },
  { ref: stat('Has Room: Passageways'), remove: true },
  { ref: stat('Has Room: Cloister'), remove: true },
  { ref: stat('Has Room: Tunnels'), remove: true },
  { ref: stat('Has Room: Cellar'), remove: true },
  { ref: stat('Has Room: Chasm'), remove: true },
  { ref: stat('Has Room: Halls'), remove: true },
  { ref: stat('Has Room: Tombs'), remove: true },
  { ref: stat('Has Room: Pits'), remove: true },
  { ref: stat('Has Room: Shrine of Empowerment (Tier 1)'), remove: true },
  { ref: stat('Has Room: Sanctum of Unity (Tier 2)'), remove: true },
  { ref: stat('Has Room: Temple Nexus (Tier 3)'), remove: true },
  { ref: stat('Has Room: Explosives Room (Tier 1)'), remove: true, explosivesRoom: true },
  { ref: stat('Has Room: Demolition Lab (Tier 2)'), remove: true, explosivesRoom: true },
  { ref: stat('Has Room: Shrine of Unmaking (Tier 3)'), remove: true, explosivesRoom: true },

  // TierApex
  { ref: stat('Has Room: Apex of Atzoatl'), disabled: false },

  // Tier0
  { ref: stat('Has Room: Corruption Chamber (Tier 1)'), remove: true },
  { ref: stat('Has Room: Catalyst of Corruption (Tier 2)'), remove: true },
  { ref: stat('Has Room: Locus of Corruption (Tier 3)'), disabled: false },

  // Tier0
  { ref: stat('Has Room: Gemcutter\'s Workshop (Tier 1)'), remove: true },
  { ref: stat('Has Room: Department of Thaumaturgy (Tier 2)'), remove: true },
  { ref: stat('Has Room: Doryani\'s Institute (Tier 3)'), disabled: false },

  // Tier0
  { ref: stat('Has Room: Sacrificial Chamber (Tier 1)'), remove: true },
  { ref: stat('Has Room: Hall of Offerings (Tier 2)'), remove: true },
  { ref: stat('Has Room: Apex of Ascension (Tier 3)'), disabled: false },

  // Tier1
  { ref: stat('Has Room: Vault (Tier 1)'), hidden: HIDDEN_GREEDY },
  { ref: stat('Has Room: Treasury (Tier 2)') },
  { ref: stat('Has Room: Wealth of the Vaal (Tier 3)'), disabled: false },

  // Tier1
  { ref: stat('Has Room: Surveyor\'s Study (Tier 1)'), hidden: HIDDEN_GREEDY },
  { ref: stat('Has Room: Office of Cartography (Tier 2)') },
  { ref: stat('Has Room: Atlas of Worlds (Tier 3)') },

  // Tier1
  { ref: stat('Has Room: Hall of Mettle (Tier 1)'), hidden: HIDDEN_GREEDY },
  { ref: stat('Has Room: Hall of Heroes (Tier 2)') },
  { ref: stat('Has Room: Hall of Legends (Tier 3)') },

  // Tier2
  { ref: stat('Has Room: Storage Room (Tier 1)'), remove: true },
  { ref: stat('Has Room: Warehouses (Tier 2)'), hidden: HIDDEN_GREEDY },
  { ref: stat('Has Room: Museum of Artefacts (Tier 3)') },

  // Tier2
  { ref: stat('Has Room: Guardhouse (Tier 1)'), remove: true },
  { ref: stat('Has Room: Barracks (Tier 2)'), hidden: HIDDEN_GREEDY },
  { ref: stat('Has Room: Hall of War (Tier 3)') },

  // Tier2
  { ref: stat('Has Room: Workshop (Tier 1)'), remove: true },
  { ref: stat('Has Room: Engineering Department (Tier 2)'), hidden: HIDDEN_GREEDY },
  { ref: stat('Has Room: Factory (Tier 3)') },

  // Tier2
  { ref: stat('Has Room: Royal Meeting Room (Tier 1)'), remove: true },
  { ref: stat('Has Room: Hall of Lords (Tier 2)'), hidden: HIDDEN_GREEDY },
  { ref: stat('Has Room: Throne of Atziri (Tier 3)') },

  // Tier2
  { ref: stat('Has Room: Torment Cells (Tier 1)'), remove: true },
  { ref: stat('Has Room: Torture Cages (Tier 2)'), hidden: HIDDEN_GREEDY },
  { ref: stat('Has Room: Sadist\'s Den (Tier 3)') },

  // Tier2
  { ref: stat('Has Room: Strongbox Chamber (Tier 1)'), remove: true },
  { ref: stat('Has Room: Hall of Locks (Tier 2)'), hidden: HIDDEN_GREEDY },
  { ref: stat('Has Room: Court of Sealed Death (Tier 3)') },

  // Tier2
  { ref: stat('Has Room: Jeweller\'s Workshop (Tier 1)'), remove: true },
  { ref: stat('Has Room: Jewellery Forge (Tier 2)'), hidden: HIDDEN_GREEDY },
  { ref: stat('Has Room: Glittering Halls (Tier 3)') },

  // Tier2
  { ref: stat('Has Room: Splinter Research Lab (Tier 1)'), remove: true },
  { ref: stat('Has Room: Breach Containment Chamber (Tier 2)'), hidden: HIDDEN_GREEDY },
  { ref: stat('Has Room: House of the Others (Tier 3)') },

  // Tier3
  { ref: stat('Has Room: Tempest Generator (Tier 1)'), remove: true },
  { ref: stat('Has Room: Hurricane Engine (Tier 2)'), remove: true },
  { ref: stat('Has Room: Storm of Corruption (Tier 3)'), hidden: HIDDEN_GREEDY },

  // Tier3
  { ref: stat('Has Room: Armourer\'s Workshop (Tier 1)'), remove: true },
  { ref: stat('Has Room: Armoury (Tier 2)'), remove: true },
  { ref: stat('Has Room: Chamber of Iron (Tier 3)'), hidden: HIDDEN_GREEDY },

  // Tier3
  { ref: stat('Has Room: Sparring Room (Tier 1)'), remove: true },
  { ref: stat('Has Room: Arena of Valour (Tier 2)'), remove: true },
  { ref: stat('Has Room: Hall of Champions (Tier 3)'), hidden: HIDDEN_GREEDY },

  // Tier3
  { ref: stat('Has Room: Poison Garden (Tier 1)'), remove: true },
  { ref: stat('Has Room: Cultivar Chamber (Tier 2)'), remove: true },
  { ref: stat('Has Room: Toxic Grove (Tier 3)'), hidden: HIDDEN_GREEDY },

  // Tier3
  { ref: stat('Has Room: Hatchery (Tier 1)'), remove: true },
  { ref: stat('Has Room: Automaton Lab (Tier 2)'), remove: true },
  { ref: stat('Has Room: Hybridisation Chamber (Tier 3)'), hidden: HIDDEN_GREEDY },

  // Tier3
  { ref: stat('Has Room: Trap Workshop (Tier 1)'), remove: true },
  { ref: stat('Has Room: Temple Defense Workshop (Tier 2)'), remove: true },
  { ref: stat('Has Room: Defense Research Lab (Tier 3)'), hidden: HIDDEN_GREEDY },

  // Tier3
  { ref: stat('Has Room: Flame Workshop (Tier 1)'), remove: true },
  { ref: stat('Has Room: Omnitect Forge (Tier 2)'), remove: true },
  { ref: stat('Has Room: Crucible of Flame (Tier 3)'), hidden: HIDDEN_GREEDY },

  // Tier3
  { ref: stat('Has Room: Lightning Workshop (Tier 1)'), remove: true },
  { ref: stat('Has Room: Omnitect Reactor Plant (Tier 2)'), remove: true },
  { ref: stat('Has Room: Conduit of Lightning (Tier 3)'), hidden: HIDDEN_GREEDY },

  // Tier3
  { ref: stat('Has Room: Pools of Restoration (Tier 1)'), remove: true },
  { ref: stat('Has Room: Sanctum of Vitality (Tier 2)'), remove: true },
  { ref: stat('Has Room: Sanctum of Immortality (Tier 3)'), hidden: HIDDEN_GREEDY }
]

export function applyRules (filters: StatFilter[]) {
  for (const filter of filters) {
    filter.disabled = true
  }

  const hasExplosives = RULES
    .filter(rule => rule.explosivesRoom)
    .some(rule => filters.some(filter =>
      filter.statRef === rule.ref &&
      filter.option!.value === IncursionRoom.Open))

  for (const rule of RULES) {
    const index = filters.findIndex(filter => filter.statRef === rule.ref)
    if (index === -1) continue

    const filter = filters[index]
    const isObstructed = (filter.option!.value === IncursionRoom.Obstructed)
    if (rule.remove || (isObstructed && !hasExplosives)) {
      filters.splice(index, 1)
      continue
    }

    if (rule.hidden !== undefined) {
      filter.hidden = rule.hidden
    }
    if (rule.disabled !== undefined) {
      filter.disabled = rule.disabled
    }
    if (isObstructed) {
      // search both Obstructed and Open rooms
      filter.option = undefined
    }
  }
}
