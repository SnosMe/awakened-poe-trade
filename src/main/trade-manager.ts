import findProcess from "find-process";
import { watchFile, stat, open, read } from "fs";
import { debounce } from "lodash";
import { EOL, platform } from "os";
import { clipboard, ipcRenderer, ipcMain } from "electron";
import { overlayWindow, assertPoEActive } from "./overlay-window";
import {
  NEW_INCOMING_OFFER,
  SEND_STILL_INTERESTED_WHISPER,
  SEND_PARTY_INVITE_CMD,
  SEND_PARTY_KICK_CMD,
  SEND_SOLD_WHISPER,
  SEND_THANKS_WHISPER,
  SEND_BUSY_WHISPER
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
  price: {
    value: string;
    currency: string;
    image: string;
  };
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

// Most used currencies
const CURRENCY_TO_IMAGE: any = {
  alt:
    "https://web.poecdn.com/image/Art/2DItems/Currency/CurrencyRerollMagic.png?v=6d9520174f6643e502da336e76b730d3",
  fuse:
    "https://web.poecdn.com/image/Art/2DItems/Currency/CurrencyRerollSocketLinks.png?v=0ad7134a62e5c45e4f8bc8a44b95540f",
  alch:
    "https://web.poecdn.com/image/Art/2DItems/Currency/CurrencyUpgradeToRare.png?v=89c110be97333995522c7b2c29cae728",
  chaos:
    "https://web.poecdn.com/image/Art/2DItems/Currency/CurrencyRerollRare.png?v=c60aa876dd6bab31174df91b1da1b4f9",
  gcp:
    "https://web.poecdn.com/image/Art/2DItems/Currency/CurrencyGemQuality.png?v=f11792b6dbd2f5f869351151bc3a4539",
  exalted:
    "https://web.poecdn.com/image/Art/2DItems/Currency/CurrencyAddModToRare.png?v=1745ebafbd533b6f91bccf588ab5efc5",
  chrome:
    "https://web.poecdn.com/image/Art/2DItems/Currency/CurrencyRerollSocketColours.png?v=9d377f2cf04a16a39aac7b14abc9d7c3",
  jewellers:
    "https://web.poecdn.com/image/Art/2DItems/Currency/CurrencyRerollSocketNumbers.png?v=2946b0825af70f796b8f15051d75164d",
  chance:
    "https://web.poecdn.com/image/Art/2DItems/Currency/CurrencyUpgradeRandomly.png?v=e4049939b9cd61291562f94364ee0f00",
  chisel:
    "https://web.poecdn.com/image/Art/2DItems/Currency/CurrencyMapQuality.png?v=f46e0a1af7223e2d4cae52bc3f9f7a1f",
  vaal:
    "https://web.poecdn.com/image/Art/2DItems/Currency/CurrencyVaal.png?v=64114709d67069cd665f8f1a918cd12a",
  blessed:
    "https://web.poecdn.com/image/Art/2DItems/Currency/CurrencyImplicitMod.png?v=472eeef04846d8a25d65b3d4f9ceecc8",
  p:
    "https://web.poecdn.com/image/Art/2DItems/Currency/CurrencyCoin.png?v=b971d7d9ea1ad32f16cce8ee99c897cf",
  mirror:
    "https://web.poecdn.com/image/Art/2DItems/Currency/CurrencyDuplicate.png?v=6fd68c1a5c4292c05b97770e83aa22bc",
  transmute:
    "https://web.poecdn.com/image/Art/2DItems/Currency/CurrencyUpgradeToMagic.png?v=333b8b5e28b73c62972fc66e7634c5c8",
  silver:
    "https://web.poecdn.com/image/Art/2DItems/Currency/SilverObol.png?v=93c1b204ec2736a2fe5aabbb99510bcf"
};

const PARSING = {
  eng: {
    incomingOffer: {
      validate: (text: string) =>
        /@From .+:* Hi, I would like to buy your .+ listed for .+ in .+/gi.test(
          text
        ),
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

        let currency = "",
          priceImage = "",
          priceValue = "";
        const priceSplit = price.split(" ");
        if (priceSplit && priceSplit.length == 2) {
          priceImage = CURRENCY_TO_IMAGE[priceSplit[1]];
          currency = priceSplit[1];
          priceValue = priceSplit[0];
        }

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
          price: {
            image: priceImage,
            currency,
            value: priceValue
          },
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

        let currency = "",
          priceImage = "",
          priceValue = "";
        const priceSplit = price.split(" ");
        if (priceSplit && priceSplit.length == 2) {
          priceImage = CURRENCY_TO_IMAGE[priceSplit[1]];
          currency = priceSplit[1];
          priceValue = priceSplit[0];
        }

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
          price: {
            image: priceImage,
            currency,
            value: priceValue
          },
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

    ipcMain.on(SEND_PARTY_KICK_CMD, (_, offer) => this.sendPartyKick(offer));

    ipcMain.on(SEND_SOLD_WHISPER, (_, offer) => this.sendSoldWhisper(offer));

    ipcMain.on(SEND_THANKS_WHISPER, (_, offer) =>
      this.sendThanksWhisper(offer)
    );

    ipcMain.on(SEND_BUSY_WHISPER, (_, offer) => this.sendBusyWhisper(offer));

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

  private sendPartyKick(offer: Offer) {
    this.isPollingClipboard = false;

    assertPoEActive();

    typeInChat(`/kick ${offer.player}`);

    setTimeout(() => (this.isPollingClipboard = true), 500);
  }

  private sendThanksWhisper(offer: Offer) {
    this.isPollingClipboard = false;

    assertPoEActive();

    typeInChat(`@${offer.player} Thanks`);

    setTimeout(() => (this.isPollingClipboard = true), 500);
  }

  private sendBusyWhisper(offer: Offer) {
    this.isPollingClipboard = false;

    assertPoEActive();

    typeInChat(
      `@${offer.player} I'm busy right now, but I will send you a party invite when I'm ready`
    );

    setTimeout(() => (this.isPollingClipboard = true), 500);
  }

  private sendSoldWhisper(offer: Offer) {
    this.isPollingClipboard = false;

    assertPoEActive();

    typeInChat(`@${offer.player} Sorry, my ${offer.item} is already sold`);

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
