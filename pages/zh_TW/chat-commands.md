---
layout: page
title: 聊天指令
permalink: /chat-commands
---


允許你發送任何文字到聊天

#### 聊天指令列表 ####
[https://www.poewiki.net/wiki/Chat_console](https://www.poewiki.net/wiki/Chat_console)

#### 特殊規則 ####
- 文字開頭為 `@last` 時，會將訊息發送到最後一個發送/接收私訊的對象。
```
最後收到的私訊: @From UltraSkillPlayer: 謝謝
指令: @last 不客氣！
發送的文字: @UltraSkillPlayer 不客氣！
```
- 如果在文字後面填加 `@last` 時，會替換成最後一個發送/接收私訊的對象。
```
最後收到的私訊: @From UltraSkillPlayer: 我能去參觀你的藏身處嗎？
指令: /invite @last
發送的文字: /invite UltraSkillPlayer
```

#### FAQ ####
1. - Q: 好像沒用，我要怎麼看我發送的文字？
   - A: 用 `Enter` 打開聊天, 然後按方向鍵 `上` 兩次。
2. - Q: 如何離開隊伍？
   - A: 使用 `/kick 我的角色名稱`, 你需要再創建或更換角色的時候更改 `我的角色名稱`。
3. - Q: 我可以用一個快捷鍵觸發多個指令嗎。
   - A: 不行，這不符合 PoE ToS 政策。