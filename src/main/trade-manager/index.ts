import findProcess from "find-process";
import { watchFile, stat, open, read } from "fs";
import { debounce } from "lodash";
import { EOL, platform } from "os";
import { clipboard, ipcMain } from "electron";
import { overlayWindow, assertPoEActive } from "../overlay-window";
import {
  NEW_INCOMING_OFFER,
  SEND_STILL_INTERESTED_WHISPER,
  SEND_PARTY_INVITE_CMD,
  SEND_PARTY_KICK_CMD,
  SEND_SOLD_WHISPER,
  SEND_THANKS_WHISPER,
  SEND_BUSY_WHISPER,
  TRADE_ACCEPTED,
  TRADE_CANCELLED,
  SEND_TRADE_REQUEST_CMD,
  HIGHLIGHT_OFFER_ITEM,
  PLAYER_JOINED
} from "@/ipc/ipc-event";
import { typeInChat } from "../game-chat";
import robotjs from "robotjs";
import {
  DEBOUNCE_READ_RATE_MS,
  POE_PROCESS_RETRY_RATE_MS,
  FILE_WATCH_RATE_MS,
  CLIPBOARD_POLLING_RATE_MS
} from "./Config";
import { ProcessInfos } from "./models/ProcessInfos";
import { Parser } from "./models/Parser";
import { parsing } from "./Parsers";
import { Queue } from "./models/Queue";
import { Offer } from "./models/Offer";

class TradeManager {
  private id: number = 0;
  private retryInterval: any = null;
  private logFilePath: string = "";
  private lastFilePosition: number = 0;
  // eslint-disable-next-line camelcase
  private debounced_readLastLines: any = null;
  private lastClipboardValue: string = "";
  private isPollingClipboard: boolean = false;
  private commands = new Queue();
  private isExecuting: boolean = false;

  constructor() {
    this.handleEvents();

    this.debounced_readLastLines = debounce(
      this.readLastLines,
      DEBOUNCE_READ_RATE_MS
    );
  }

  private handleEvents() {
    ipcMain.on(SEND_STILL_INTERESTED_WHISPER, (_, offer) =>
      this.execute(this.sendStillInterestedWhisper, [offer])
    );

    ipcMain.on(SEND_PARTY_INVITE_CMD, (_, offer) =>
      this.execute(this.sendPartyInvite, [offer])
    );

    ipcMain.on(SEND_PARTY_KICK_CMD, (_, offer) =>
      this.execute(this.sendPartyKick, [offer])
    );

    ipcMain.on(SEND_SOLD_WHISPER, (_, offer) =>
      this.execute(this.sendSoldWhisper, [offer])
    );

    ipcMain.on(SEND_THANKS_WHISPER, (_, offer, kickPlayer) =>
      this.execute(this.sendThanksWhisper, [offer, kickPlayer])
    );

    ipcMain.on(SEND_TRADE_REQUEST_CMD, (_, offer) =>
      this.execute(this.sendTradeRequest, [offer])
    );

    ipcMain.on(SEND_BUSY_WHISPER, (_, offer) =>
      this.execute(this.sendBusyWhisper, [offer])
    );

    ipcMain.on(HIGHLIGHT_OFFER_ITEM, (_, offer) =>
      this.execute(this.highlightOfferItem, [offer])
    );
  }

  private execute(fn: any, args: any[]): void {
    this.commands.enqueue({
      fn: fn.bind(this),
      args
    });

    this._execute();
  }

  private _execute() {
    if (!this.isExecuting) {
      this.isExecuting = true;

      let item: any;

      while ((item = this.commands.dequeue())) {
        const _ = item.fn(...item.args);
      }

      this.isExecuting = false;
    }
  }

  private clearKeyModifiers() {
    const MODIFIERS = ["Ctrl", "Alt", "Shift"];

    for (let m of MODIFIERS) {
      robotjs.keyToggle(m, "up");
    }
  }

  private clearOfferItemHighlighting() {
    // Select the text
    robotjs.keyTap("F", ["Ctrl"]);
    // Remove it
    robotjs.keyTap("Delete");
    // Clear the Ctrl + F command
    robotjs.keyTap("Enter");
  }

  private highlightOfferItem(offer: Offer) {
    console.debug("Highlight offer", offer);

    this.isPollingClipboard = false;

    assertPoEActive();

    const savedText = clipboard.readText();
    clipboard.writeText(offer.item);

    this.clearKeyModifiers();

    robotjs.keyTap("F", ["Ctrl"]);
    robotjs.keyTap("V", ["Ctrl"]);

    setTimeout(() => clipboard.writeText(savedText), 120);

    setTimeout(() => (this.isPollingClipboard = true), 500);
  }

  private sendPartyInvite(offer: Offer) {
    console.debug("Sending party invite:", `"/invite ${offer.player}"`);

    this.isPollingClipboard = false;

    assertPoEActive();

    //this.clearOfferItemHighlighting();

    typeInChat(`/invite ${offer.player}`);

    setTimeout(() => (this.isPollingClipboard = true), 500);
  }

  private sendPartyKick(offer: Offer) {
    console.debug("Sending party kick:", `"/kick ${offer.player}"`);

    this.isPollingClipboard = false;

    assertPoEActive();

    this.clearOfferItemHighlighting();

    typeInChat(`/kick ${offer.player}`);

    setTimeout(() => (this.isPollingClipboard = true), 500);
  }

  private sendTradeRequest(offer: Offer) {
    console.debug("Sending trade request:", `"/tradewith ${offer.player}"`);

    this.isPollingClipboard = false;

    assertPoEActive();

    this.clearOfferItemHighlighting();

    typeInChat(`/tradewith ${offer.player}`);

    setTimeout(() => (this.isPollingClipboard = true), 500);
  }

  private sendThanksWhisper(offer: Offer, kickPlayer: boolean = true) {
    console.debug("Sending thanks whisper:", `"@${offer.player} Thanks"`);

    this.isPollingClipboard = false;

    assertPoEActive();

    this.clearOfferItemHighlighting();

    typeInChat(`@${offer.player} Thanks`);

    if (kickPlayer) {
      setTimeout(() => {
        this.sendPartyKick(offer);
      }, 120);
    }

    setTimeout(() => (this.isPollingClipboard = true), 500);
  }

  private sendBusyWhisper(offer: Offer) {
    console.debug(
      "Sending busy whisper:",
      `"@${offer.player} I'm busy right now, but I will send you a party invite when I'm ready"`
    );

    this.isPollingClipboard = false;

    assertPoEActive();

    this.clearOfferItemHighlighting();

    typeInChat(
      `@${offer.player} I'm busy right now, but I will send you a party invite when I'm ready`
    );

    setTimeout(() => (this.isPollingClipboard = true), 500);
  }

  private sendSoldWhisper(offer: Offer) {
    console.debug(
      "Sending sold whisper:",
      `"@${offer.player} Sorry, my ${offer.item} is already sold"`
    );

    this.isPollingClipboard = false;

    assertPoEActive();

    this.clearOfferItemHighlighting();

    this.clearKeyModifiers();

    typeInChat(`@${offer.player} Sorry, my ${offer.item} is already sold`);

    setTimeout(() => (this.isPollingClipboard = true), 500);
  }

  private sendStillInterestedWhisper(offer: Offer) {
    console.debug(
      "Sending still interested whisper:",
      `"@${offer.player} Are you still interested in my ${offer.item} listed for ${offer.price.value} ${offer.price.currency}?"`
    );

    this.isPollingClipboard = false;

    assertPoEActive();

    this.clearOfferItemHighlighting();

    this.clearKeyModifiers();

    typeInChat(
      `@${offer.player} Are you still interested in my ${offer.item} listed for ${offer.price.value} ${offer.price.currency}?`
    );

    setTimeout(() => (this.isPollingClipboard = true), 500);
  }

  private async findPoEProcess(): Promise<ProcessInfos | undefined> {
    const procs = await findProcess("name", /pathofexile|wine64-preloader/gi);
    return procs.length > 0 ? <ProcessInfos>procs[0] : undefined;
  }

  async start(): Promise<boolean> {
    const poeProc = await this.findPoEProcess();

    if (!poeProc) {
      console.warn(
        `Unable to find PoE process, make sure the game is running. Retrying in ${POE_PROCESS_RETRY_RATE_MS /
          1000} second(s)...`
      );
      if (!this.retryInterval) {
        this.retryInterval = setTimeout(() => {
          if (this.start()) {
            clearInterval(this.retryInterval);
            this.retryInterval = null;
          }
        }, POE_PROCESS_RETRY_RATE_MS);
      }
      return false;
    }

    if (platform() === "win32") {
      this.logFilePath = `${poeProc.bin.substring(
        0,
        poeProc.bin.lastIndexOf("\\")
      )}\\logs\\Client.txt`;
    } else {
      this.logFilePath = `${poeProc.bin.substring(
        0,
        poeProc.bin.lastIndexOf("/")
      )}/logs/Client.txt`;
    }

    this.moveFilePositionToEOF();

    this.listenIncomingTradeOffers();
    // this.listenOutgoingTradeOffers();

    return true;
  }

  private listenIncomingTradeOffers(): void {
    watchFile(
      this.logFilePath,
      {
        persistent: true,
        interval: FILE_WATCH_RATE_MS
      },
      () => {
        this.debounced_readLastLines();
      }
    );
  }

  private pollClipboard(): string {
    const text = clipboard.readText();

    if (
      text &&
      text !== "�" &&
      (this.lastClipboardValue === null || text !== this.lastClipboardValue)
    ) {
      this.lastClipboardValue = text;
      return text;
    }

    return "";
  }

  private listenOutgoingTradeOffers(): void {
    this.isPollingClipboard = true;

    setInterval(() => {
      if (this.isPollingClipboard) {
        const text = this.pollClipboard();

        if (text && text.trim().length > 0) {
          this.parse(text, "outgoingOffer");
        }
      }
    }, CLIPBOARD_POLLING_RATE_MS);
  }

  private moveFilePositionToEOF(): void {
    stat(this.logFilePath, (err, infos) => {
      if (err) {
        console.info("Cannot get Client.txt stats.");
        return;
      }

      this.lastFilePosition = infos.size;
    });
  }

  private readLastLines(): void {
    stat(this.logFilePath, (err, fileInfos) => {
      if (err) {
        console.error(err);
        return;
      }

      open(this.logFilePath, "r", (err, fd) => {
        if (err) {
          console.error(err);
          return;
        }

        let buffer: Buffer;

        try {
          buffer = Buffer.alloc(fileInfos.size - this.lastFilePosition);
        } catch (e) {
          console.error("TradeManager: Error allocating buffer", e);
          return;
        }

        read(
          fd,
          buffer,
          0,
          buffer.length,
          this.lastFilePosition,
          (err, _, buffer) => {
            if (err) {
              console.error(err);
              return;
            }

            let lines: string = "";

            try {
              const lines: string = buffer.toString();
            } catch (e) {
              console.error("TradeManager: Error while parsing the buffer");
              return;
            }

            this.lastFilePosition = fileInfos.size;

            lines.split(EOL).forEach(l => this.parse(l));
          }
        );
      });
    });
  }

  private parseLine(
    parser: Parser,
    line: string
  ): { ok: boolean; value: Offer | undefined } {
    if (parser.validate(line)) {
      const value = parser.parse(line, ++this.id);

      return {
        ok: !!value,
        value
      };
    }

    return {
      ok: false,
      value: {} as Offer
    };
  }

  private parse(line: string, type: string = "log"): void {
    console.log("Line: ", line);

    if (type === "log") {
      if (parsing.en.incomingOffer.validate(line)) {
        type = "incomingOffer";
      } else if (parsing.en.tradeAccepted.validate(line)) {
        type = "tradeAccepted";
      } else if (parsing.en.tradeCancelled.validate(line)) {
        type = "tradeCancelled";
      } else if (parsing.en.playerJoined.validate(line)) {
        type = "playerJoined";
      } else {
        return;
      }
    }

    const result = this.parseLine(parsing.en[type], line);

    if (result.ok) {
      console.debug("Parsing: ", type, result.value);

      switch (type) {
        case "incomingOffer":
          overlayWindow!.webContents.send(NEW_INCOMING_OFFER, result.value);
          break;

        case "tradeAccepted":
          overlayWindow!.webContents.send(TRADE_ACCEPTED);
          break;

        case "tradeCancelled":
          overlayWindow!.webContents.send(TRADE_CANCELLED);
          break;

        case "playerJoined":
          overlayWindow!.webContents.send(PLAYER_JOINED, result.value);
          break;
      }
    }
  }
}

export default new TradeManager();
