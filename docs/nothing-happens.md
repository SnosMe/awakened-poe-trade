---
title: Nothing happens when I try to price check
---

# Nothing happens when I try to price check

To understand why nothing is happening, you need to open the logs.
Most problems are easy to fix once you read them. But there is one that doesn't have a quick fix:
```
warn [ClipboardPoller] No item text found.
```

The diagram below shows what APT does when the hotkey is pressed.

![](https://i.imgur.com/gujMSBG.png)

As you may have noticed, compared to other third-party PoE tools APT uses "Advanced Descriptions" key.
![](https://i.imgur.com/fjLSIz9.png)

`Ctrl + Alt + C` is a frequent victim of global keyboard shortcuts. The sad part, if you are reading this, is that they used a dirty way to implement global shortcuts.

**Your goal is to make PoE copy the item to the clipboard when you press** `Ctrl + Highlight + C` (if it's already working, ignore this article, your problem is somewhere else).

<video controls loop>
  <source src="https://i.imgur.com/3qXPd6G.mp4" type="video/mp4">
</video>

As a starting point, common programs reported by players were:
- ASUS GPU Tweak II
- Radeon™ Software
- Display Pilot (BenQ)
- AHK scripts

Just for reference, this is what you should expect to see in the logs.
I'll remind once again that your goal is not to make it look exactly like on the screenshot,
but to make sure that **PoE copies the item to the clipboard with all mods**.

![](https://i.imgur.com/LmDhl1O.png)
