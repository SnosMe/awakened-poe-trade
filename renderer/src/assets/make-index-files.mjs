// @ts-check

import fnv1a from '@sindresorhus/fnv1a'
import fs from 'fs'
import path from 'path'

const LANGUAGES = ['en', 'ru', 'cmn-Hant', 'zh_CN']

for (const lang of LANGUAGES) {
  const lineStarts = {
    /** @type{Array<{ hash: number, start: number }>} */
    statsByRef: [],
    /** @type{Array<{ hash: number, start: number }>} */
    matchers: []
  }

  {
    const ndjson = fs.readFileSync(`./public/data/${lang}/stats.ndjson`, { encoding: 'utf-8' })
    let start = 0
    while (start !== ndjson.length) {
      const end = ndjson.indexOf('\n', start)
      /** @type {import('./data/interfaces').Stat} */
      const stat = JSON.parse(ndjson.slice(start, end))
      lineStarts.statsByRef.push({ start, hash: Number(fnv1a(stat.ref, { size: 32 })) })
      for (const matcher of stat.matchers) {
        lineStarts.matchers.push({ start, hash: Number(fnv1a(matcher.string, { size: 32 })) })
        if (matcher.advanced) {
          lineStarts.matchers.push({ start, hash: Number(fnv1a(matcher.advanced, { size: 32 })) })
        }
      }
      start = (end + 1)
    }
  }

  {
    const indexData = new Uint32Array(lineStarts.statsByRef.length * 2)
    lineStarts.statsByRef.sort((a, b) => a.hash - b.hash)
    for (let i = 0; i < lineStarts.statsByRef.length; i += 1) {
      indexData[i * 2 + 0] = lineStarts.statsByRef[i].hash
      indexData[i * 2 + 1] = lineStarts.statsByRef[i].start
    }
    fs.writeFileSync(
      path.join('./public/data', lang, 'stats-ref.index.bin'),
      indexData
    )
  }

  {
    const indexData = new Uint32Array(lineStarts.matchers.length * 2)
    lineStarts.matchers.sort((a, b) => a.hash - b.hash)
    for (let i = 0; i < lineStarts.matchers.length; i += 1) {
      indexData[i * 2 + 0] = lineStarts.matchers[i].hash
      indexData[i * 2 + 1] = lineStarts.matchers[i].start
    }
    fs.writeFileSync(
      path.join('./public/data', lang, 'stats-matcher.index.bin'),
      indexData
    )
  }
}

for (const lang of LANGUAGES) {
  /** @type{Array<{ hashName: number, hashRefName: number, start: number }>} */
  let lineStarts
  {
    const ndjson = fs.readFileSync(`./public/data/${lang}/items.ndjson`, { encoding: 'utf-8' })
    let start = 0
    /** @type{Map<string, typeof lineStarts[number]>} */
    const startsByName = new Map()
    while (start !== ndjson.length) {
      const end = ndjson.indexOf('\n', start)
      /** @type {import('./data/interfaces').BaseType} */
      const item = JSON.parse(ndjson.slice(start, end))
      const key = `${item.namespace}::${item.refName}`
      if (!startsByName.has(key)) {
        startsByName.set(key, {
          hashName: Number(fnv1a(`${item.namespace}::${item.name}`, { size: 32 })),
          hashRefName: Number(fnv1a(`${item.namespace}::${item.refName}`, { size: 32 })),
          start: start
        })
      }
      start = (end + 1)
    }
    lineStarts = Array.from(startsByName.values())
  }

  {
    const indexData = new Uint32Array(lineStarts.length * 2)
    lineStarts.sort((a, b) => a.hashName - b.hashName)
    for (let i = 0; i < lineStarts.length; i += 1) {
      indexData[i * 2 + 0] = lineStarts[i].hashName
      indexData[i * 2 + 1] = lineStarts[i].start
    }
    fs.writeFileSync(
      path.join('./public/data', lang, 'items-name.index.bin'),
      indexData
    )
  }

  {
    const indexData = new Uint32Array(lineStarts.length * 2)
    lineStarts.sort((a, b) => a.hashRefName - b.hashRefName)
    for (let i = 0; i < lineStarts.length; i += 1) {
      indexData[i * 2 + 0] = lineStarts[i].hashRefName
      indexData[i * 2 + 1] = lineStarts[i].start
    }
    fs.writeFileSync(
      path.join('./public/data', lang, 'items-ref.index.bin'),
      indexData
    )
  }
}
