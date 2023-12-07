---
title: Download
---

<script setup>
import { useData } from 'vitepress'

const { theme } = useData()
</script>

You can download Awakened Poe Trade here. Any other mirrors are not known
to the developer, downloading from them may be unsafe.

| Download link | Automatic updates | Startup time |
|---------------|-------------------|--------------|
| <a :href="`${theme.github.releasesUrl}/download/v${theme.appVersion}/Awakened-PoE-Trade-Setup-${theme.appVersion}.exe`">Windows 10+ (installer)</a> | ✔ | Fast |
| <a :href="`${theme.github.releasesUrl}/download/v${theme.appVersion}/Awakened-PoE-Trade-${theme.appVersion}.exe`">Windows 10+ (portable)</a> | ❌ | Slower |
| <a :href="`${theme.github.releasesUrl}/download/v${theme.appVersion}/Awakened-PoE-Trade-${theme.appVersion}.AppImage`">Linux (AppImage)</a> | ✔ | n/a |
| <a :href="`${theme.github.releasesUrl}/download/v${theme.appVersion}/Awakened-PoE-Trade-${theme.appVersion}-universal.dmg`">macOS (dmg)</a> | ❌ | n/a |

Latest version is <span class="bg-gray-100 border rounded px-1">{{ theme.appVersion }}</span>

*The app is unsigned, which means you'll have to bypass security
warnings on Windows and [macOS](https://support.apple.com/en-us/HT202491#openanyway) to open it.{:.text-sm}

---

### Requirements

- PoE display mode
  - ✔ Windowed Fullscreen, Windowed
  - ❌ Fullscreen
- PoE language
  - ✔ English, Russian
  - ❌ Portuguese, Thai, French, German, Spanish, Korean

No Administrator rights required, but\
⚠ **If you run PoE client as Admin, OS security boundaries take effect.
In order for Awakened PoE Trade to have access to the PoE window, it must be started with Administrator rights.**

❌ **Not compatible with "GeForce Now" or any other cloud gaming service that do not forward clipboard data.**
