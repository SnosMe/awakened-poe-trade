const fs = require('fs')
const nfetch = require('node-fetch')

interface ApiItems {
  result: Array<{
    label: string,
    entries: Array<{
      name: string
    }>
  }>
}

(async function () {
  const response = await nfetch('https://www.pathofexile.com/api/trade/data/items')
  const { result }: ApiItems = await response.json()
  const prophecies = result
    .find(category => category.label === 'Prophecies')!
    .entries
    .map(proph => proph.name)

  fs.writeFileSync('./src/data/prophecies.json', JSON.stringify(prophecies, null, 2))
})()
