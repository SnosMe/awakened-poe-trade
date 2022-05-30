---
layout: page
title: Nothing happens
permalink: /nothing-happens
---

你需要打開日誌才能知道為什麼會什麼都沒發生。
大多數的問題在你閱讀完後都很容易解決，但有一個問題沒辦法：

```
warn [clipboard]: No item text found. {"text":""}
```

下面這張圖解釋了，當你按下查價快捷鍵時，APT 是如何運作的

![](https://i.imgur.com/gujMSBG.png)

你可能已經注意到，對比其它第三方工具，APT 使用 `Highlight` 鍵

![](https://i.imgur.com/7i1KbdF.png)

`Ctrl + Alt + C` 是全局快捷鍵的常客。若是被其它應用程式佔用 APT 將無法正常使用。

**你的目標是當你按下 `Ctrl + Highlight + C` 時能將 PoE 的物品資訊複製到剪貼簿** （如果它能正常複製，請忽略此文章，你的問題不在這裡）。

以下為經常被反饋占用快捷鍵的應用程式：
- ASUS GPU Tweak II
- Radeon™ Software
- Display Pilot (BenQ)
- AHK scripts
