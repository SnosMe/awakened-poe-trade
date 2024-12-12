# ![Exalted Orb](./renderer/public/images/exa.png) Exiled Exchange 2

## Moving from POE1/Awakened PoE Trade

1. Download latest release from [releases](https://github.com/Kvan7/exiled-exchange-2/releases)
  - Currently only Windows is supported
  - Only available as pre-release right now
2. Run installer
3. Run Exiled Exchange 2
4. Launch PoE2 to generate correct files
5. Copy `apt-data` from `%APPDATA%\awakened-poe-trade` to `%APPDATA%\exiled-exchange-2` to copy your previous settings
  - Resulting directory structure should look like this:
  - `%APPDATA%\exiled-exchange-2\apt-data\`
    - `config.json`
6. Restart Exiled Exchange 2

#### Updating from 0.0.1 -> 0.0.10

Follow same steps as tranfering from PoE1, instead of copying from `%APPDATA%\awakened-poe-trade` to `%APPDATA%\exiled-exchange-2` instead copy from `%APPDATA%\awakened-poe2-trade` or `%APPDATA%\awakened-poe2-trade2` to `%APPDATA%\exiled-exchange-2`. After copying files feel free to run the uninstaller for `awakened-poe2-trade` to remove old executables, or delete `%APPDATA%\awakened-poe2-trade` and `Local\Programs\awakened-poe2-trade`

## Tool showcase

| Gem                                  | Rare                                 | Unique                               | Currency                             |
| ------------------------------------ | ------------------------------------ | ------------------------------------ | ------------------------------------ |
| ![](https://i.imgur.com/LTsH2DZ.png) | ![](https://i.imgur.com/2XL5Wl8.png) | ![](https://i.imgur.com/UTV6prE.png) | ![](https://i.imgur.com/dQ9Sns6.png) |

### Development

See [DEVELOPING.md](./DEVELOPING.md)

### Acknowledgments

- [awakened-poe-trade](https://github.com/SnosMe/awakened-poe-trade)
- [libuiohook](https://github.com/kwhat/libuiohook)
- [RePoE](https://github.com/brather1ng/RePoE)
- [poeprices.info](https://www.poeprices.info/)
- [poe.ninja](https://poe.ninja/)

![](https://i.imgur.com/MATqhv7.png)
