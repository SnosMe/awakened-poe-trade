import { BaseTypes, translatedItemNameByRef } from '@/assets/data'

let baseTypes: Set<string>

export function magicBasetype (name: string) {
  if (!baseTypes) {
    baseTypes = new Set(
      Array.from(BaseTypes.keys()).map(b => translatedItemNameByRef.get(b)!)
    )
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
