---
title: Download
---

<script setup>
import { useData } from 'vitepress'

const { theme } = useData()
</script>
<div style="background-color: #7c2d12; color: white; padding: 10px; text-align: center; font-weight: bold; border-radius: 5px;">
  ⚠️ This is in beta for PoE2. <br/> Please be aware that there may be bugs or issues.
</div>
You can download Exiled Exchange 2 here. Any other mirrors are not known
to the developer, downloading from them may be unsafe or malicious.

| Download link                                                                                                                                      | Automatic updates | Startup time |
| -------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------- | ------------ |
| <a :href="`${theme.github.releasesUrl}/download/v${theme.appVersion}/exiled-exchange-2-Setup-${theme.appVersion}.exe`">Windows 10+ (installer)</a> | ✔                 | Fast         |
| <a :href="`${theme.github.releasesUrl}/download/v${theme.appVersion}/exiled-exchange-2-${theme.appVersion}.exe`">Windows 10+ (portable)</a>        | ❌                 | Slower       |
| <a :href="`${theme.github.releasesUrl}/download/v${theme.appVersion}/exiled-exchange-2-${theme.appVersion}.AppImage`">Linux (AppImage)</a>         | ✔                 | n/a          |
| <a :href="`${theme.github.releasesUrl}/download/v${theme.appVersion}/exiled-exchange-2-${theme.appVersion}-universal.dmg`">macOS (dmg)</a>         | ❌                 | n/a          |

Latest version is <span class="bg-gray-100 border rounded px-1">{{ theme.appVersion }}</span>

*The app is unsigned, which means you'll have to bypass security
warnings on Windows to open it.{:.text-sm}


---

### Requirements

- PoE display mode
  - ✔ Windowed Fullscreen, Windowed
  - ❌ Fullscreen
- PoE language
  - ✔ English
  - ❌ Russian, Portuguese, Thai, French, German, Spanish, Korean

No Administrator rights required, but\
⚠ **If you run PoE client as Admin, OS security boundaries take effect.
In order for Exiled Exchange 2 to have access to the PoE window, it must be started with Administrator rights.**

❌ **Not compatible with "GeForce Now" or any other cloud gaming service that do not forward clipboard data.**

---

### Moving from POE1/Awakened PoE Trade

**IMPORTANT:** If you are following this, all steps are required. Most problems occur with not doing step 7.

1. Download latest release from above
2. Run installer
3. Run Exiled Exchange 2
4. Launch PoE2 to generate correct files
5. Quit PoE2 and EE2 after seeing the banner popup that EE2 loaded
6. Copy `apt-data` from `%APPDATA%\awakened-poe-trade` to `%APPDATA%\exiled-exchange-2` to copy your previous settings
  - Resulting directory structure should look like this:
  - `%APPDATA%\exiled-exchange-2\apt-data\`
    - `config.json`
7. **IMPORTANT:** Edit `config.json` and change the value of "windowTitle": "Path of Exile" to instead be "Path of Exile 2", otherwise it will open only for poe1
8. Start Exiled Exchange 2 and PoE2

