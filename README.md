# ![Awakener's Orb](https://web.poecdn.com/image/Art/2DItems/Currency/TransferOrb.png) Awakened PoE Trade

![](https://img.shields.io/github/downloads/SnosMe/awakened-poe-trade/total?color=%23000&label=Players%20using%20this%20tool%20%28Downloads%29&style=flat-square)


| Download | Automatic update | Startup time |
|----------|------------------|--------------|
| [Windows (installer)](https://github.com/SnosMe/awakened-poe-trade/releases/download/v0.9.0/Awakened-PoE-Trade-Setup-0.9.0.exe) | :heavy_check_mark: | Fast |
| [Windows (portable)](https://github.com/SnosMe/awakened-poe-trade/releases/download/v0.9.0/Awakened-PoE-Trade-0.9.0.exe) | :heavy_multiplication_x: | Slow |
| [Linux](https://github.com/SnosMe/awakened-poe-trade/releases/download/v0.9.0/Awakened-PoE-Trade-0.9.0.AppImage) | :heavy_check_mark: | Fast |

## Tool showcase

**DISCLAIMER** Not the final desired results are shown, but what you will see using the tool today.

| Gem | Rare | Unique | Currency |
|-----|------|--------|----------|
| ![](./showcase/gem.png?raw=true) | ![](./showcase/rare.png?raw=true) | ![](./showcase/unique.png?raw=true) | ![](./showcase/currency.png?raw=true) |

| [YouTube] Speed comparison with PoE-TradeMacro |
|-----|
| Video shows the very first release, now a lot of features have been added, but this did not affect the speed. The video is still relevant. |
| [![](http://img.youtube.com/vi/PCohkEmWRT8/0.jpg)](http://www.youtube.com/watch?v=PCohkEmWRT8 "") |

## Trade tool checklist

- Poe.ninja
  - :heavy_check_mark: Currency, Fragments, Oils, Incubators, Scarabs, Fossils, Resonators, Essences, Divination Cards, Prophecies
  - :heavy_multiplication_x: Watchstones
  - :heavy_check_mark: Gems
    - :heavy_check_mark: Level(20, 21), Quality(0, 20, 23), Corrupted
    - :heavy_check_mark: Empower, Enlighten, Enhance: Level(1-4)
    - :heavy_check_mark: Awakened Gems
    - :heavy_check_mark: "Brand Recall", "Blood and Sand", "Portal"
  - :heavy_check_mark: Base types (Item Level, Influence)
  - :heavy_check_mark: Maps (Map Tier)
    - :heavy_check_mark: Blighted
    - :heavy_check_mark: Unique maps
  - :heavy_check_mark: Unique Jewels
  - :heavy_check_mark: Unique Flasks
    - :heavy_multiplication_x: "Vessel of Vinktar"
  - :heavy_check_mark: Unique Weapons
    - :heavy_check_mark: Links (1-4, 5, 6)
  - :heavy_check_mark: Unique Armours
    - :heavy_check_mark: Links (1-4, 5, 6)
    - :heavy_multiplication_x: "Atziri's Splendour", "Bubonic Trail", "Lightpoacher", "Shroud of the Lightless", "Volkuur's Guidance", "Yriel's Fostering"
  - :heavy_check_mark: Unique Accessories
    - :heavy_multiplication_x: "Doryani's Invitation", "Impresence"
  - :heavy_check_mark: Beasts

- Rare items
  - :heavy_check_mark: Price prediction (poeprices.info)

- Trade
  - Items
    - :heavy_check_mark: Item Level
    - :heavy_check_mark: Corrupted
    - :heavy_check_mark: Influence
    - :heavy_check_mark: 5, 6 Linked sockets
    - :heavy_check_mark: Item base/Item category
    - :heavy_check_mark: Q20 props (Armour, Evasion, ES, Physical Damage)
  - :heavy_check_mark: +-10% Rare rolls
  - :heavy_check_mark: Unique item roll range
  - :heavy_multiplication_x: Pseudo stats
  - Gems
    - :heavy_check_mark: Level, Quality, Corrupted
    - :heavy_multiplication_x: Gem experience
  - :heavy_multiplication_x: Currency bulk search
  - :heavy_check_mark: Grouping results from one account (protection against "pricefixing")

### Requirements

- Run PoE in "Windowed" or "Windowed Fullscreen" mode
- PoE language must be English

Neither Java nor the .NET Framework nor AHK are required\
No Administrator rights required

### Usage
- Press `Ctrl + D` to check the price of the item\
  *Hold `Ctrl` if you do not want the window to close. As soon as the cursor is within the window, you can release `Ctrl`.*
- Press `Ctrl + Alt + D` to check the price of the item\
  *Opens a window, but does not hide it automatically when moving the mouse*
- Press `F5` to go to hideout

### Tool end goals
- One Tool To Rule Them All
  - TradeMacro
  - MercuryTrade
  - Win, Linux, Mac
  - Multi-language (difficult to achieve, may be denied)

## FAQ

- **How much memory does it need?**

|    | On program load | After some time |
|----|-----------------|-----------------|
| APT | 115 MB         | 78 MB |
| TradeMacro | 60 MB   | 24 MB |


### Acknowledgments

- [vue-cli-plugin-electron-builder](https://github.com/nklayman/vue-cli-plugin-electron-builder)
- [iohook](https://github.com/wilix-team/iohook)
- [node-window-manager](https://github.com/sentialx/node-window-manager)
- [robotjs](https://github.com/octalmage/robotjs)
- [poeprices.info](https://www.poeprices.info/)
- [poe.ninja](https://poe.ninja/)
