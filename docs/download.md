---
title: Download
---

<script setup>
import { useData } from 'vitepress'

const { theme } = useData()
</script>

You can download Awakened Poe Trade here. Any other mirrors are not known
to the developer, downloading from them may be unsafe.

| Download | Automatic update | Startup time |
|----------|------------------|--------------|
| <a :href="`${theme.github.releasesUrl}/download/v${theme.appVersion}/Awakened-PoE-Trade-Setup-${theme.appVersion}.exe`">Windows 11 (installer)</a> | ✔ | Fast |
| <a :href="`${theme.github.releasesUrl}/download/v${theme.appVersion}/Awakened-PoE-Trade-${theme.appVersion}.exe`">Windows 11 (portable)</a> | ❌ | Slow |
| <a :href="`${theme.github.releasesUrl}/download/v${theme.appVersion}/Awakened-PoE-Trade-${theme.appVersion}.AppImage`">Ubuntu 20.04</a> | ✔ | Fast |

Latest version is <span class="bg-gray-100 border rounded px-1">{{ theme.appVersion }}</span>
{:.text-sm}

---

### Requirements

- PoE display mode
  - ✔ Windowed
  - ✔ Windowed Fullscreen
  - ❌ Fullscreen
- PoE language
  - ✔ English
  - ✔ Russian
  - ❌ Portuguese, Thai, French, German, Spanish, Korean

No Administrator rights required, but\
⚠ **If you run PoE client as Admin, OS security boundaries take effect.
In order for Awakened PoE Trade to have access to the PoE window, it must be started with Administrator rights.**

❌ **Not compatible with "GeForce Now" or any other cloud gaming service that do not forward clipboard data.**
