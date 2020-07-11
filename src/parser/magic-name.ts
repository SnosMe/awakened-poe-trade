import { BASE_TYPES, TRANSLATED_ITEM_NAME_BY_REF, CLIENT_STRINGS } from '@/assets/data'
import { ItemCategory } from './meta'

let baseTypes: Set<string>

export function magicBasetype (name: string) {
  if (!baseTypes) {
    baseTypes = new Set<string>()
    for (let [name, info] of BASE_TYPES.entries()) {
      name = TRANSLATED_ITEM_NAME_BY_REF.get(name)!
      baseTypes.add(name)
      if (info.category === ItemCategory.Map) {
        baseTypes.add(
          CLIENT_STRINGS['Blighted {0}'].replace('{0}', name)
        )
      }
    }
  }

  const words = name.split(' ')

  const perm: string[] = words.flatMap((_, start) =>
    Array(words.length - start).fill(undefined)
      .map((_, idx) => words
        .slice(start, start + idx + 1)
        .join(' ')
      )
  )

  const result = perm
    .map(name => ({ name, found: baseTypes.has(name) }))
    .filter(res => res.found)
    .sort((a, b) => b.name.length - a.name.length)

  return result.length ? result[0].name : undefined
}
