# ![Perfect Jewelers Orb](./renderer/public/images/jeweler.png) Exiled Exchange 2

![GitHub Downloads (specific asset, latest release)](https://img.shields.io/github/downloads/kvan7/exiled-exchange-2/latest/Exiled-Exchange-2-Setup-0.10.0.exe?style=plastic&link=https%3A%2F%2Ftooomm.github.io%2Fgithub-release-stats%2F%3Fusername%3Dkvan7%26repository%3DExiled-Exchange-2)
![GitHub Tag](https://img.shields.io/github/v/tag/kvan7/exiled-exchange-2?style=plastic&label=latest%20version)
![GitHub commits since latest release (branch)](https://img.shields.io/github/commits-since/kvan7/exiled-exchange-2/latest/dev?style=plastic)

Path of Exile 2 overlay program for price checking items, among many other loved features.

Fork of [Awakened PoE Trade](https://github.com/SnosMe/awakened-poe-trade).

The ONLY official download sites are <https://kvan7.github.io/Exiled-Exchange-2/download> or <https://github.com/Kvan7/Exiled-Exchange-2/releases>, any other locations are not official and may be malicious.

## Moving from POE1/Awakened PoE Trade

1. Download latest release from [releases](https://github.com/Kvan7/exiled-exchange-2/releases)
2. Run installer
3. Run Exiled Exchange 2
4. Launch PoE2 to generate correct files
5. Quit PoE2 and EE2 after seeing the banner popup that EE2 loaded
6. Copy `apt-data` from `%APPDATA%\awakened-poe-trade` to `%APPDATA%\exiled-exchange-2` to copy your previous settings
  - Resulting directory structure should look like this:
  - `%APPDATA%\exiled-exchange-2\apt-data\`
    - `config.json`
7. Edit `config.json` and change the value of "windowTitle": "Path of Exile" to instead be "Path of Exile 2", otherwise it will open only for poe1
8. Start Exiled Exchange 2 and PoE2

## FAQ

<https://kvan7.github.io/Exiled-Exchange-2/faq>

## Tool showcase

| Gem                                                | Rare                                                 | Unique                                                   | Currency                                                     |
| -------------------------------------------------- | ---------------------------------------------------- | -------------------------------------------------------- | ------------------------------------------------------------ |
| ![Gem Check](./docs/reference-images/GemCheck.png) | ![Rare Check](./docs/reference-images/RareCheck.png) | ![Unique Check](./docs/reference-images/UniqueCheck.png) | ![Currency Check](./docs/reference-images/CurrencyCheck.png) |

### Development

See [DEVELOPING.md](./DEVELOPING.md)

### Acknowledgments

- [awakened-poe-trade](https://github.com/SnosMe/awakened-poe-trade)
- [libuiohook](https://github.com/kwhat/libuiohook)
- [RePoE](https://github.com/brather1ng/RePoE)
- [poeprices.info](https://www.poeprices.info/)
- [poe.ninja](https://poe.ninja/)

![graph](https://i.imgur.com/MATqhv7.png)
