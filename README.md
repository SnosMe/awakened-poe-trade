# ![Awakener's Orb](https://web.poecdn.com/image/Art/2DItems/Currency/TransferOrb.png) Awakened PoE Trade

[![](https://img.shields.io/github/downloads/SnosMe/awakened-poe-trade/total?color=%23000&label=Players%20using%20this%20tool%20%28Downloads%29&style=flat-square)](https://github.com/SnosMe/awakened-poe-trade/releases/download/v0.6.1/Awakened-PoE-Trade-Setup-0.6.1.exe "")

[Download for Windows v0.6.1](https://github.com/SnosMe/awakened-poe-trade/releases/download/v0.6.1/Awakened-PoE-Trade-Setup-0.6.1.exe)

[Download for Linux v0.6.1](https://github.com/SnosMe/awakened-poe-trade/releases/download/v0.6.1/Awakened-PoE-Trade-0.6.1.AppImage)

## Tool showcase

**DISCLAIMER** Not the final desired results are shown, but what you will see using the tool today.

| Gem | Rare | Unique | Currency |
|-----|------|--------|----------|
| ![](./showcase/gem.png?raw=true) | ![](./showcase/rare.png?raw=true) | ![](./showcase/unique.png?raw=true) | ![](./showcase/currency.png?raw=true) |

| [YouTube] Speed comparison with PoE-TradeMacro |
|-----|
| Video shows the very first release, now a lot of features have been added, but this did not affect the speed. The video is still relevant. |
| [![](http://img.youtube.com/vi/PCohkEmWRT8/0.jpg)](http://www.youtube.com/watch?v=PCohkEmWRT8 "") |

## What types of items are supported?

- Rare items
  - :heavy_check_mark: Price prediction
  - :warning: Advanced search by modifiers
- Maps
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
    - :heavy_check_mark: Corrupted
    - :heavy_check_mark: Empower, Enlighten, Enhance
    - :heavy_multiplication_x: Gem experience
  - :heavy_check_mark: Vaal gems

### Requirements
- Supported OS: Windows
- Run as Administrator

That’s all, no Java, no .NET Framework, no AHK . . .

### Usage
- Press `Ctrl + D` to check the price of the item
- Press `F5` to go to hideout
- Hold `Ctrl` if you do not want the window to close. As soon as the cursor is within the window, you can release `Ctrl`. Now, to close the window, press `Esc` or the cross icon in title bar.

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
| APT | 115 MB         | 78 MB |
| TradeMacro | 60 MB   | 24 MB |

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
