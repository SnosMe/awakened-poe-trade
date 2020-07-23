import findProcess from "find-process";
import { watchFile, stat, open, read } from "fs";
import { debounce } from "lodash";
import { EOL, platform } from "os";
import { clipboard, ipcRenderer, ipcMain } from "electron";
import { overlayWindow, assertPoEActive } from "./overlay-window";
import {
  NEW_INCOMING_OFFER,
  SEND_STILL_INTERESTED_WHISPER,
  SEND_PARTY_INVITE_CMD
} from "@/ipc/ipc-event";
import { typeInChat } from "./game-chat";

interface ProcessInfos {
  pid: number;
  ppid: number;
  bin: string;
  name: string;
  cmd: string;
}

interface Offer {
  id: number;
  item: string;
  price: string;
  player: string;
  league: string;
}

interface Parser {
  validate: any;
  parse: any;
}

const DEBOUNCE_READ_RATE_MS = 500;
const FILE_WATCH_RATE_MS = 1000;
const CLIPBOARD_POLLING_RATE_MS = 500;
const POE_PROCESS_RETRY_RATE_MS = 30000;

const PARSING = {
  eng: {
    incomingOffer: {
      validate: (text: string) => /@From .+:* Hi, I would like to buy your .+ listed for .+ in .+/gi.test(text),
      parse: (text: string) => {
        const AT_FROM = "@From ";
        const HI_I_WOULD_LIKE_TO_BUY_YOUR = ": Hi, I would like to buy your";
        const LISTED_FOR = " listed for ";
        const IN = " in ";
        const P_STASH_TAB = '(stash tab "';
        const POSITION_LEFT = '"; position: left ';
        const TOP = ", top ";
        const P = ")";

        const player = text.substring(
          text.indexOf(AT_FROM) + AT_FROM.length,
          text.indexOf(HI_I_WOULD_LIKE_TO_BUY_YOUR)
        );

        const item = text.substring(
          text.indexOf(HI_I_WOULD_LIKE_TO_BUY_YOUR) +
            HI_I_WOULD_LIKE_TO_BUY_YOUR.length,
          text.indexOf(LISTED_FOR)
        );

        const price = text.substring(
          text.indexOf(LISTED_FOR) + LISTED_FOR.length,
          text.indexOf(IN)
        );

        // eslint-disable-next-line camelcase
        const p_stash_tab_index = text.indexOf(P_STASH_TAB);
        const league = text.substring(
          text.indexOf(IN) + IN.length,
          // eslint-disable-next-line camelcase
          p_stash_tab_index !== -1 ? p_stash_tab_index : text.length
        );

        return {
          id: ++id,
          player,
          item,
          price,
          league
        } as Offer;
      }
    },
    outgoingOffer: {
      validate: (text: string) => /(?!@From)@.+ .+/gi.test(text),
      parse: (text: string) => {
        const AT_FROM = "@";
        const HI_I_WOULD_LIKE_TO_BUY_YOUR = " Hi, I would like to buy your";
        const LISTED_FOR = " listed for ";
        const IN = " in ";
        const P_STASH_TAB = '(stash tab "';
        const POSITION_LEFT = '"; position: left ';
        const TOP = ", top ";
        const P = ")";

        const player = text.substring(
          text.indexOf(AT_FROM) + AT_FROM.length,
          text.indexOf(HI_I_WOULD_LIKE_TO_BUY_YOUR)
        );

        const item = text.substring(
          text.indexOf(HI_I_WOULD_LIKE_TO_BUY_YOUR) +
            HI_I_WOULD_LIKE_TO_BUY_YOUR.length,
          text.indexOf(LISTED_FOR)
        );

        const price = text.substring(
          text.indexOf(LISTED_FOR) + LISTED_FOR.length,
          text.indexOf(IN)
        );

        // eslint-disable-next-line camelcase
        const p_stash_tab_index = text.indexOf(P_STASH_TAB);
        const league = text.substring(
          text.indexOf(IN) + IN.length,
          // eslint-disable-next-line camelcase
          p_stash_tab_index !== -1 ? p_stash_tab_index : text.length
        );

        return {
          player,
          item,
          price,
          league
        } as Offer;
      }
    }
  }
};

let id = 0;

class TradeManager {
  private retryInterval: any = null;
  private logFilePath: string = "";
  private lastFilePosition: number = 0;
  // eslint-disable-next-line camelcase
  private debounced_readLastLines: any = null;
  private lastClipboardValue: string = "";
  private isPollingClipboard: boolean = false;

  constructor() {
    ipcMain.on(SEND_STILL_INTERESTED_WHISPER, (_, offer) =>
      this.sendStillInterestedWhisper(offer)
    );

    ipcMain.on(SEND_PARTY_INVITE_CMD, (_, offer) =>
      this.sendPartyInvite(offer)
    );

    this.debounced_readLastLines = debounce(
      this.readLastLines,
      DEBOUNCE_READ_RATE_MS
    );
  }

  private sendPartyInvite(offer: Offer) {
    this.isPollingClipboard = false;

    assertPoEActive();

    typeInChat(`/invite ${offer.player}`);

    setTimeout(() => (this.isPollingClipboard = true), 500);
  }

  private sendStillInterestedWhisper(offer: Offer) {
    this.isPollingClipboard = false;

    assertPoEActive();

    typeInChat(
      `@${offer.player} Are you still interested in my ${offer.item} listed for ${offer.price}?`
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
          this.parse(text, false);
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

        const buffer: Buffer = Buffer.alloc(
          fileInfos.size - this.lastFilePosition
        );

        read(
          fd,
          buffer,
          0,
          buffer.length,
          this.lastFilePosition,
          (err, bytesRead, buffer) => {
            if (err) {
              console.error(err);
              return;
            }

            const lines: string = buffer.toString();
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
  ): { ok: boolean; offer: Offer } {
    if (parser.validate(line)) {
      return {
        ok: true,
        offer: parser.parse(line)
      };
    }

    return {
      ok: false,
      offer: {} as Offer
    };
  }

  private parse(line: string, fromLog: boolean = true): void {
    const result = this.parseLine(
      fromLog ? PARSING.eng.incomingOffer : PARSING.eng.outgoingOffer,
      line
    );

    if (result.ok) {
      console.log(
        fromLog ? "Incoming offer: " : "Outgoing offer: ",
        result.offer
      );

      overlayWindow!.webContents.send(NEW_INCOMING_OFFER, result.offer);
    }
  }
}

export default new TradeManager();
