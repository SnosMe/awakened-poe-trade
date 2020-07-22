import findProcess from "find-process";
import { watchFile, stat, open, read } from "fs";
import { debounce } from "lodash";
import { EOL, platform } from "os";
import { clipboard, ipcRenderer, ipcMain } from "electron";
import { overlayWindow } from "./overlay-window";
import { NEW_INCOMING_OFFER } from "@/ipc/ipc-event";

interface ProcessInfos {
  pid: number;
  ppid: number;
  bin: string;
  name: string;
  cmd: string;
}

interface Offer {
  id: number,
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

const PARSING = {
  eng: {
    incomingOffer: {
      validate: (text: string) => /@From .+:* /gi.test(text),
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
  private logFilePath: string = "";
  private lastFilePosition: number = 0;
  // eslint-disable-next-line camelcase
  private debounced_readLastLines: any = null;
  private lastClipboardValue: string = "";

  constructor() {
    this.debounced_readLastLines = debounce(
      this.readLastLines,
      DEBOUNCE_READ_RATE_MS
    );
  }

  private async findPoEProcess(): Promise<ProcessInfos | undefined> {
    const procs = await findProcess("name", /pathofexile|wine64-preloader/gi);
    return procs.length > 0 ? <ProcessInfos>procs[0] : undefined;
  }

  async start(): Promise<boolean> {
    const poeProc = await this.findPoEProcess();

    if (!poeProc) {
      console.warn("Unable to find PoE process, make sure the game is running");
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
    setInterval(() => {
      const text = this.pollClipboard();

      if (text && text.trim().length > 0) {
        this.parse(text, false);
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
