import { AppConfig } from '@/web/Config';
import { ITEM_BY_TRANSLATED } from '@/assets/data'

export function magicBasetype (name: string) {
  const sep = (AppConfig().language === "zh_CN" || AppConfig().language === "cmn-Hant")? '' : ' '
  const words = name.split(sep)

  const perm: string[] = words.flatMap((_, start) =>
    Array(words.length - start).fill(undefined)
      .map((_, idx) => words
        .slice(start, start + idx + 1)
        .join(sep)
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
