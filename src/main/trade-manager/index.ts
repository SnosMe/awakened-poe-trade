import findProcess from "find-process";
import { watchFile, stat, open, read } from "fs";
import { debounce } from "lodash";
import { EOL, platform } from "os";
import { clipboard, ipcMain } from "electron";
import robotjs from "robotjs";

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

/**
 * Define the Trade Manager class
 * Handles the trading processes in PoE by looking at the Client.txt
 * log file and the clipboard content
 */
class TradeManager {
  /**
   * Unique ID for each new offers
   */
  private id: number = 0;
  /**
   * The Interval function when retying to find the PoE system process
   */
  private retryInterval: any = null;
  /**
   * File path to the Client.txt file
   */
  private logFilePath: string = "";
  /**
   * Last verified position in the Client.txt file
   */
  private lastFilePosition: number = 0;
  /**
   * The debounced version of the function readLastLines
   * Prevent calling the function multiple times if there are
   * multiples updates made to the file by the game
   */
  // eslint-disable-next-line camelcase
  private debounced_readLastLines: any = null;
  /**
   * Last known value in the clipboard
   * Prevent parsing the same value multiple times
   */
  private lastClipboardValue: string = "";
  /**
   * Enable/Disable the clipboard polling
   */
  private isPollingClipboard: boolean = false;
  /**
   * A list of queued commands that needs to be run
   */
  private commands = new Queue();
  /**
   * Determine if the commands of the "commands" member are currently being executed
   */
  private isExecuting: boolean = false;

  constructor() {
    this.handleEvents();

    this.debounced_readLastLines = debounce(
      this.readLastLines,
      DEBOUNCE_READ_RATE_MS
    );
  }

  /**
   * Setup the MainProcess events
   * Overlay -> Main
   */
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

  /**
   * Enqueue the function with its args in a queue, that needs to be executed
   * @param fn A function of "this" context
   * @param args Arguments of the "fn" function
   */
  private execute(fn: any, args: any[]): void {
    this.commands.enqueue({
      fn: fn.bind(this),
      args
    });

    this._execute();
  }

  /**
   * Dequeue the list of "commands" and execute them, if not already doing so
   */
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

  /**
   * Do a Key Up on the Ctrl, Alt and Shift keys.
   * Prevent problems and conflict while sending commands to the game
   */
  private clearKeyModifiers() {
    const MODIFIERS = ["Ctrl", "Alt", "Shift"];

    for (let m of MODIFIERS) {
      robotjs.keyToggle(m, "up");
    }
  }

  /**
   * Remove the item highlighting of the in-game Ctrl + F shortcut
   */
  private clearOfferItemHighlighting() {
    // // Select the text
    // robotjs.keyTap("F", ["Ctrl"]);
    // // Remove it
    // robotjs.keyTap("Delete");
    // // Clear the Ctrl + F command
    // robotjs.keyTap("Enter");
  }

  /**
   * Highlight the item in the "offer" using the in-game search tool
   * @param offer The offer to be highlighted
   */
  private highlightOfferItem(offer: Offer) {
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

  /**
   * Send a party invite in-game to player in the offer
   * @param offer The offer related to the party invite command
   */
  private sendPartyInvite(offer: Offer) {
    this.isPollingClipboard = false;

    assertPoEActive();

    this.clearOfferItemHighlighting();

    typeInChat(`/invite ${offer.player}`);

    setTimeout(() => (this.isPollingClipboard = true), 500);
  }

  /**
   * Kick out of the party the player in the "offer"
   * @param offer The offer realted to the kick command
   */
  private sendPartyKick(offer: Offer) {
    this.isPollingClipboard = false;

    assertPoEActive();

    this.clearOfferItemHighlighting();

    typeInChat(`/kick ${offer.player}`);

    setTimeout(() => (this.isPollingClipboard = true), 500);
  }

  /**
   * Send a trade request to the player in the "offer"
   * @param offer The offer related to the trade request command
   */
  private sendTradeRequest(offer: Offer) {
    this.isPollingClipboard = false;

    assertPoEActive();

    this.clearOfferItemHighlighting();

    typeInChat(`/tradewith ${offer.player}`);

    setTimeout(() => (this.isPollingClipboard = true), 500);
  }

  /**
   * Send a "Thanks" whisper to the player in the "offer"
   * @param offer The offer related to the whisper
   * @param kickPlayer Kick out of the party the player in the offer, if needed.
   */
  private sendThanksWhisper(offer: Offer, kickPlayer: boolean = true) {
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

  /**
   * Sedn a "I'm busy" whisper to the player in the "offer"
   * @param offer The offer related to the whisper
   */
  private sendBusyWhisper(offer: Offer) {
    this.isPollingClipboard = false;

    assertPoEActive();

    this.clearOfferItemHighlighting();

    typeInChat(
      `@${offer.player} I'm busy right now, but I will send you a party invite when I'm ready`
    );

    setTimeout(() => (this.isPollingClipboard = true), 500);
  }

  /**
   * Send a "It's sold" to the player in the "offer"
   * @param offer The offer related to the whisper
   */
  private sendSoldWhisper(offer: Offer) {
    this.isPollingClipboard = false;

    assertPoEActive();

    this.clearOfferItemHighlighting();

    this.clearKeyModifiers();

    typeInChat(`@${offer.player} Sorry, my ${offer.item} is already sold`);

    setTimeout(() => (this.isPollingClipboard = true), 500);
  }

  /**
   * Send a "Are you still interested?" whisper to the player in the "offer"
   * @param offer The offer related to the whisper
   */
  private sendStillInterestedWhisper(offer: Offer) {
    this.isPollingClipboard = false;

    assertPoEActive();

    this.clearOfferItemHighlighting();

    this.clearKeyModifiers();

    typeInChat(
      `@${offer.player} Are you still interested in my ${offer.item} listed for ${offer.price.value} ${offer.price.currency}?`
    );

    setTimeout(() => (this.isPollingClipboard = true), 500);
  }

  /**
   * Find the informations about the Path of Exile system process, if possible
   */
  private async findPoEProcess(): Promise<ProcessInfos | undefined> {
    const procs = await findProcess("name", /pathofexile|wine64-preloader/gi);
    return procs.length > 0 ? <ProcessInfos>procs[0] : undefined;
  }

  /**
   * Start the trade manager.
   */
  async start(): Promise<boolean> {
    const poeProc = await this.findPoEProcess();

    if (!poeProc) {
      console.warn(
        `Unable to find PoE process, make sure the game is running. Retrying in ${POE_PROCESS_RETRY_RATE_MS /
          1000} second(s)...`
      );

      if (!this.retryInterval) {
        this.retryInterval = setTimeout(async () => {
          if (await this.start()) {
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
    this.listenOutgoingTradeOffers();

    return true;
  }

  /**
   * Start looking for changes in the Client.txt log
   * file of Path of Exile. Read the new lines if any.
   */
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

  /**
   * Gets the newest value in the clipbord, if any
   */
  private pollClipboard(): string {
    const text = clipboard.readText();

    if (this.lastClipboardValue === null) {
      this.lastClipboardValue = text;
    } else if (text && text !== "�" && text !== this.lastClipboardValue) {
      this.lastClipboardValue = text;
      return text;
    }

    return "";
  }

  /**
   * Start looking for outgoing trade whisper in the clipboard
   */
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

  /**
   * Find the last position (EOF) in the Client.txt file
   */
  private moveFilePositionToEOF(): void {
    stat(this.logFilePath, (err, infos) => {
      if (err) {
        console.info("Cannot get Client.txt stats.");
        return;
      }

      this.lastFilePosition = infos.size;
    });
  }

  /**
   * Read all the newest lines in the file from the last
   * position red
   */
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
              lines = buffer.toString();
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

  /**
   * Parse the "line" according the "parser" provided
   * @param parser The functions used to parse the "line"
   * @param line The log/clipboard text line that need to be parsed
   */
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

  /**
   * Parse the "line" if it's content is content has any usage for the trade manager
   * @param line The text line that need to be parsed
   * @param type If known, the type of text line provided
   */
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
