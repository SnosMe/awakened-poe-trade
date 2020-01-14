const fs = require('fs')
const nfetch = require('node-fetch')

interface ApiItems {
  result: Array<{
    label: string,
    entries: Array<{
      name?: string
      type?: string
    }>
  }>
}

(async function () {
  const response = await nfetch('https://www.pathofexile.com/api/trade/data/items')
  const { result }: ApiItems = await response.json()
  const prophecies = result
    .find(category => category.label === 'Prophecies')!
    .entries
    .map(item => item.name)

  fs.writeFileSync('./src/data/prophecies.json', JSON.stringify(prophecies, null, 2))

  const itemisedMonsters = result
    .find(category => category.label === 'Itemised Monsters')!
    .entries
    .map(item => item.type)

  fs.writeFileSync('./src/data/itemised-monsters.json', JSON.stringify(itemisedMonsters, null, 2))
})()
