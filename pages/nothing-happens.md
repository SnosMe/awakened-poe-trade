---
layout: page
title: Nothing happens
permalink: /nothing-happens
---

To understand why nothing is happening, you need to open the logs.
Most problems are easy to fix once you read them. But there is one that doesn't have a quick fix:
```
warn [clipboard]: No item text found. {"text":""}
```

The diagram below shows what APT does when the hotkey is pressed.

![](https://i.imgur.com/gujMSBG.png)

As you may have noticed, compared to other third-party PoE tools APT uses "Highlight" key.
![](https://i.imgur.com/7i1KbdF.png)

`Ctrl + Alt + C` is a frequent victim of global keyboard shortcuts. The sad part, if you are reading this, is that they used a dirty way to implement global shortcuts.

**Your goal is to make PoE copy the item to the clipboard when you press** `Ctrl + Highlight + C` (if it's already working, ignore this article, your problem is somewhere else).

As a starting point, common programs reported by players were:
- ASUS GPU Tweak II
- Radeon™ Software
- Display Pilot (BenQ)
- AHK scripts
