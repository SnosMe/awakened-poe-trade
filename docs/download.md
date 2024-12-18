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
to the developer, downloading from them may be unsafe.

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
