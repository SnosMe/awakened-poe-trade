---
title: OCR Guide
---

This guide will help you to setup and perform OCR using Awakened PoE Trade.

### OCR Setup ###

1. Download a 6MB archive with OCR files from [here](https://github.com/SnosMe/awakened-poe-trade/releases/download/v3.20.10007/cv-ocr.zip).

2. Open the folder with configuration file.
   ![](https://i.imgur.com/z5WI9Fx.png)

3. Extract "cv-ocr" folder, inside the archive, into it.\
   You should have the following structure:

   ```
   apt-data/
   ├── config.json
   └── cv-ocr/
      ├── eng.traineddata
      ├── ... more files ...
      └── tesseract-core-simd.wasm
   ```

4. Restart the application.

### Widget configuration ###

1. Open the widget by clicking near the Settings button.
   ![](https://i.imgur.com/Y0RJune.png)

   I prefer to place it at the bottom.
   ![](https://i.imgur.com/bkNDKYg.png)

2. Edit the widget and assign a hotkey.
   ![](https://i.imgur.com/GeOMcal.png)

### Rules to follow before pressing the hotkey ###

1. Both icons should be fully visible.
   ![](https://i.imgur.com/Mu6B6it.png)

2. The text should not be occluded by health bar or other elements.
   ![](https://i.imgur.com/cM2i3Rk.png)

Happy hunting!
