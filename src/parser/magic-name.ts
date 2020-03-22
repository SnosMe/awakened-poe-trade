import { BaseTypes } from '@/assets/data'

export function magicBasetype (name: string) {
  const words = name.split(' ')

  const perm: string[] = words.flatMap((_, start) =>
    Array(words.length - start).fill(undefined)
      .map((_, idx) => words
        .slice(start, start + idx + 1)
        .join(' ')
      )
  )

  const result = perm
    .map(name => ({ name, found: BaseTypes.has(name) }))
    .filter(res => res.found)
    .sort((a, b) => b.name.length - a.name.length)

  return result.length ? result[0].name : undefined
}
