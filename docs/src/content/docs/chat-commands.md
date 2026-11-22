---
title: Chat commands
---

Allows you to send arbitrary text to the chat.

#### List of available commands ####
[https://www.poewiki.net/wiki/Chat_console](https://www.poewiki.net/wiki/Chat_console)

#### Special rules ####
- Text that starts with `@last`, will be sent to the character of the last whisper received/sent.
   ```
   Last whisper received: @From UltraSkillPlayer: Thank you.
   Command: @last Good luck!
   Sent text: @UltraSkillPlayer Good luck!
   ```
- Text that ends with `@last`, `@last` will be replaced with the character name of the last whisper received/sent.
   ```
   Last whisper received: @From UltraSkillPlayer: Can I visit your Toucan hideout?
   Command: /invite @last
   Sent text: /invite UltraSkillPlayer
   ```

#### FAQ ####
1. - Q: Something doesn't work, what text was sent to the game?
   - A: Open chat with `Enter`, and then press `ArrowUp` key two times.
2. - Q: How to leave party?
   - A: Use `/kick MyCharacterName`, don't forget to update character name each time you create or change it.
3. - Q: I want to chain commands and send them by one hotkey.
   - A: This is not allowed by PoE ToS.
