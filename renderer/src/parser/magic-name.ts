import { ITEM_BY_TRANSLATED } from '@/assets/data'

export function magicBasetype (name: string) {
  // Chinese and Japanese don't use spaces to separate words, so fallback to characters
  const separator = name.includes(' ') ? ' ' : ''
  const words = name.split(separator)

  const perm: string[] = words.flatMap((_, start) =>
    Array(words.length - start).fill(undefined)
      .map((_, idx) => words
        .slice(start, start + idx + 1)
        .join(separator)
      )
  )

  const result = perm
    .map(name => {
      const result = ITEM_BY_TRANSLATED('ITEM', name)
      return { name, found: (result && result[0].craftable) }
    })
    .filter(res => res.found)
    .sort((a, b) => b.name.length - a.name.length)

  return result.length ? result[0].name : undefined
}
