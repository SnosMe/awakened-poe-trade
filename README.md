# ![Awakener's Orb](https://web.poecdn.com/image/Art/2DItems/Currency/TransferOrb.png) Awakened PoE Trade

[Download for Windows v0.1.1](https://github.com/SnosMe/awakened-poe-trade/releases/download/v0.1.1/Awakened-PoE-Trade-Setup-0.1.1.exe)

## Tool showcase

**DISCLAIMER** Not the final desired results are shown, but what you will see using the tool today.

| Gem | Rare | Unique | Currency |
|-----|------|--------|----------|
| ![](./showcase/gem.png?raw=true) | ![](./showcase/rare.png?raw=true) | ![](./showcase/unique.png?raw=true) | ![](./showcase/currency.png?raw=true) |

| [YouTube] Speed comparison with PoE-TradeMacro |
|-----|
| [![](http://img.youtube.com/vi/PCohkEmWRT8/0.jpg)](http://www.youtube.com/watch?v=PCohkEmWRT8 "") |

## What types of items are supported?
First I want to rephrase this question in "The tool shows a bunch of numbers, which of these can I trust?"
- Rare items
  - :heavy_check_mark: Price prediction
  - :heavy_multiplication_x: Trade results
  - :heavy_multiplication_x: Rare Maps
- Currency, Fragments, Fossils...
  - :heavy_check_mark: poe.ninja instant prices and trends
  - :heavy_check_mark: Trade results
- Unique items
  - :warning: poe.ninja instant prices and trends
    - :heavy_check_mark: 5, 6 Linked sockets
    - :heavy_check_mark: Item
    - :heavy_multiplication_x: Uniques with variants (Doryani's Invitation, Atziri's Splendour, Vessel of Vinktar)
  - :warning: Trade results
    - :warning: ordered by min price (without applying +/- 20% mod rolls)
    - :heavy_check_mark: 5, 6 Linked sockets
    - :heavy_multiplication_x: Has 2 Abyssal Sockets...
    - :heavy_multiplication_x: Corrupted implicits
- Gems
  - :heavy_check_mark: poe.ninja instant prices and trends
    - :heavy_check_mark: Level, Quality, Corrupted
  - :warning: Trade results
    - :heavy_check_mark: Level
    - :heavy_check_mark: Quality
    - :warning: Corrupted

### Requirements
- Supported OS: Windows
- Run as Administrator

That’s all, no Java, no .NET Framework, no AHK . . .

### Tool end goals
- One Tool To Rule Them All
  - TradeMacro
  - MercuryTrade
  - Win, Linux, Mac
  - Multi-language (difficult to achieve, may be denied)

## FAQ

- **Typing `Awakened PoE Trade` tires**\
Type `APT` ?

- **How much memory does it need?**

|    | On program load | After some time |
|----|-----------------|-----------------|
| APT | 115 MB         | 68 MB |
| TradeMacro | 60 MB   | 24 MB |

- **Any chance of Linux support**\
Yes it is absolutely possible. (Wishing to help: a problem in the `node-window-manager` library)

- **My mouse and computer freeze when I start the program**\
Bad news: It is unavoidable, some app on your computer uses the same library as APT https://github.com/wilix-team/iohook/issues/93 \
Good news: this only happens for a few seconds


### Acknowledgments

- [vue-cli-plugin-electron-builder](https://github.com/nklayman/vue-cli-plugin-electron-builder)
- [iohook](https://github.com/wilix-team/iohook)
- [node-window-manager](https://github.com/sentialx/node-window-manager)
- [robotjs](https://github.com/octalmage/robotjs)
- [poeprices.info](https://www.poeprices.info/)
- [poe.ninja](https://poe.ninja/)
