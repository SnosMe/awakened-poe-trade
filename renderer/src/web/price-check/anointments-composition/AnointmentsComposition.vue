<template>
  <div v-if="composition" class="flex items-center justify-center gap-1 pb-1 pt-1">
    <div v-for="(anointment, k) in composition" :key="k" class="w-6 h-6 flex items-center justify-center flex-shrink-0">
      <img :src="anointment.icon" class="max-w-full max-h-full">
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, PropType, computed } from 'vue'
import { ParsedItem } from '@/parser'
import { BaseType, ITEM_BY_REF, ITEM_DROP, ANOINTMENTS } from '@/assets/data'
import { findPriceByQuery, autoCurrency } from '../../background/Prices'

function findItemByQueryId (queryId: string): BaseType | undefined {
  const [ns, encodedName] = queryId.split('::')
  const [name, variant] = encodedName.split(' // ')
  let found = ITEM_BY_REF(ns as unknown as BaseType['namespace'], name)
  if (found && ns === 'UNIQUE') {
    const filtered = found.filter(unique => unique.unique!.base === variant)
    if (filtered.length) found = filtered
  }
  // return any first item
  if (found && found.length) return found[0]
}

function findPriceByQueryId (queryId: string) {
  const [ns, encodedName] = queryId.split('::')
  const [name, variant] = encodedName.split(' // ')
  const priceEntry = findPriceByQuery({ ns, name, variant })
  if (priceEntry) {
    return autoCurrency(priceEntry.chaos, 'chaos')
  }
}

function getItemPrices (queryId: string) {
  const dropEntry = ITEM_DROP.find(entry => entry.query.includes(queryId))
  if (!dropEntry) return null

  const out = [] as Array<{ name: string, icon: string, price: ReturnType<typeof findPriceByQueryId>}>

  for (const itemId of dropEntry.query) {
    const dbItem = findItemByQueryId(itemId)
    if (!dbItem) return null

    out.push({
      icon: dbItem.icon,
      name: dbItem.name,
      price: findPriceByQueryId(itemId)
    })
  }

  return out
}

function getAnointmentsComposition (name: string, additionalName?: string) {
  if (additionalName) return ANOINTMENTS.find(a => a.name === name.trim() && a.additionalName === additionalName.trim())?.oils
  return ANOINTMENTS.find(a => a.name === name.trim())?.oils
}

export default defineComponent({
  name: 'AnointmentsComposition',

  props: {
    item: {
      type: Object as PropType<ParsedItem | null>,
      default: null
    }
  },

  setup (props) {
    const oils = getItemPrices('ITEM::Golden Oil')

    function getOilForAnointment (anointmentName: string) {
      return oils?.find(({ name }) => anointmentName === name)
    }

    function getOilsForComposition (composition: string[]) {
      return composition.map(anointment => getOilForAnointment(anointment))
    }

    const composition = computed(() => {
      if (!props.item) return

      const category = props.item.category
      if (!category) return

      if (category !== 'Amulet' && category !== 'Ring') return

      const enchants = props.item.newMods.filter(({ info }) => info.type === 'enchant')
      if (!enchants || enchants.length === 0) return

      const parsedStat = enchants[0].stats[0]
      if (!parsedStat) return

      const additionalParsedStat = enchants[0].stats[1]

      const stat = parsedStat.stat
      if (!stat) return

      const additionalStat = additionalParsedStat ? additionalParsedStat.stat : undefined

      let anointmentName = parsedStat.translation.string
      if (!anointmentName) return

      let additionalAnointmentName = additionalParsedStat ? additionalParsedStat.translation.string : undefined

      const roll = parsedStat.roll
      if (roll) {
        if (category === 'Amulet') {
          const matchers = stat.matchers
          if (!matchers) return

          const allocateObject = matchers.find(m => m.value === roll.value)
          if (!allocateObject) return

          anointmentName = allocateObject.string.replace('Allocates ', '')
        } else if (props.item.category === 'Ring') {
          anointmentName = anointmentName.replace('#', `${roll.value}`)
        }
      }

      const additionalRoll = additionalParsedStat ? additionalParsedStat.roll : undefined
      if (additionalAnointmentName && additionalRoll && additionalStat) {
        if (category === 'Amulet') {
          const matchers = additionalStat.matchers
          if (!matchers) return

          const allocateObject = matchers.find(m => m.value === additionalRoll.value)
          if (!allocateObject) return

          additionalAnointmentName = allocateObject.string.replace('Allocates ', '')
        } else if (props.item.category === 'Ring') {
          additionalAnointmentName = additionalAnointmentName.replace('#', `${additionalRoll.value}`)
        }
      }

      const composition = getAnointmentsComposition(anointmentName, additionalAnointmentName)
      if (!composition) return

      return getOilsForComposition(composition)
    })

    return { composition }
  }
})
</script>
