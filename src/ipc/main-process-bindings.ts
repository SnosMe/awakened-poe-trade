import { RendererInterface } from "electron";
import * as ipcEvent from "@/ipc/ipc-event";
import { Config, League, defaultConfig } from "@/ipc/types";

let electron: RendererInterface | undefined;
try {
  electron = require("electron");
} catch {}

class MainProcessBinding extends EventTarget {
  constructor() {
    super();

    if (electron) {
      electron.ipcRenderer.on(ipcEvent.PRICE_CHECK, (e, data) => {
        this.selfEmitPriceCheck(data);
      });

      electron.ipcRenderer.on(ipcEvent.MAP_CHECK, (e, data) => {
        this.dispatchEvent(
          new CustomEvent(ipcEvent.MAP_CHECK, {
            detail: data
          })
        );
      });

      electron.ipcRenderer.on(ipcEvent.LEAGUE_SELECTED, (e, leagueId) => {
        this.dispatchEvent(
          new CustomEvent(ipcEvent.LEAGUE_SELECTED, {
            detail: leagueId
          })
        );
      });

      electron.ipcRenderer.on(ipcEvent.PUSH_CONFIG, (e, cfg) => {
        this.dispatchEvent(
          new CustomEvent(ipcEvent.PUSH_CONFIG, {
            detail: cfg
          })
        );
      });

      electron.ipcRenderer.on(ipcEvent.FOCUS_CHANGE, (e, data) => {
        this.dispatchEvent(
          new CustomEvent(ipcEvent.FOCUS_CHANGE, { detail: data })
        );
      });

      electron.ipcRenderer.on(ipcEvent.PRICE_CHECK_CANCELED, () => {
        this.dispatchEvent(new CustomEvent(ipcEvent.PRICE_CHECK_CANCELED));
      });

      electron.ipcRenderer.on(ipcEvent.UPDATE_AVAILABLE, (e, updateInfo) => {
        this.dispatchEvent(
          new CustomEvent(ipcEvent.UPDATE_AVAILABLE, {
            detail: updateInfo
          })
        );
      });

      electron.ipcRenderer.on(ipcEvent.VISIBILITY, (e, detail) => {
        this.dispatchEvent(new CustomEvent(ipcEvent.VISIBILITY, { detail }));
      });

      electron.ipcRenderer.on(ipcEvent.OPEN_WIKI, (e, detail) => {
        this.dispatchEvent(new CustomEvent(ipcEvent.OPEN_WIKI, { detail }));
      });
      
      electron.ipcRenderer.on(ipcEvent.TOGGLE_DELVE_GRID, (e) => {
        this.dispatchEvent(new CustomEvent(ipcEvent.TOGGLE_DELVE_GRID))
      })

      electron.ipcRenderer.on(ipcEvent.NEW_INCOMING_OFFER, (e, offer) => {
        this.dispatchEvent(
          new CustomEvent(ipcEvent.NEW_INCOMING_OFFER, { detail: offer })
        );
      });

      electron.ipcRenderer.on(ipcEvent.NEW_OUTGOING_OFFER, (e, offer) => {
        this.dispatchEvent(
          new CustomEvent(ipcEvent.NEW_OUTGOING_OFFER, { detail: offer })
        );
      });

      electron.ipcRenderer.on(ipcEvent.TRADE_ACCEPTED, () => {
        this.dispatchEvent(new CustomEvent(ipcEvent.TRADE_ACCEPTED));
      });

      electron.ipcRenderer.on(ipcEvent.TRADE_CANCELLED, () => {
        this.dispatchEvent(new CustomEvent(ipcEvent.TRADE_CANCELLED));
      });

      electron.ipcRenderer.on(ipcEvent.PLAYER_JOINED, (e, player) => {
        this.dispatchEvent(
          new CustomEvent(ipcEvent.PLAYER_JOINED, { detail: player })
        );
      });

      electron.ipcRenderer.on(ipcEvent.HIDEOUT_JOINED, (e) => {
        this.dispatchEvent(
          new CustomEvent(ipcEvent.HIDEOUT_JOINED)
        );
      });
    }
  }

  sendJoinHideout(offer: any){
    if (electron) {
      electron.ipcRenderer.send(ipcEvent.SEND_JOIN_HIDEOUT, offer);
    }
  }

  focusGame() {
    if (electron) {
      electron.ipcRenderer.send(ipcEvent.FOCUS_GAME);
    }
  }

  highlightOfferItem(offer: any){
    if (electron) {
      electron.ipcRenderer.send(ipcEvent.HIGHLIGHT_OFFER_ITEM, offer);
    }
  }

  sendPartyKick(offer: any) {
    if (electron) {
      electron.ipcRenderer.send(ipcEvent.SEND_PARTY_KICK_CMD, offer);
    }
  }

  sendSoldWhisper(offer: any) {
    if (electron) {
      electron.ipcRenderer.send(ipcEvent.SEND_SOLD_WHISPER, offer);
    }
  }

  sendTradeRequest(offer: any) {
    if (electron) {
      electron.ipcRenderer.send(ipcEvent.SEND_TRADE_REQUEST_CMD, offer);
    }
  }

  sendThanksWhisper(offer: any, kickPlayer: boolean) {
    if (electron) {
      electron.ipcRenderer.send(ipcEvent.SEND_THANKS_WHISPER, offer, kickPlayer);
    }
  }

  sendBusyWhisper(offer: any) {
    if (electron) {
      electron.ipcRenderer.send(ipcEvent.SEND_BUSY_WHISPER, offer);
    }
  }

  sendStillInterestedWhisper(offer: any) {
    if (electron) {
      electron.ipcRenderer.send(ipcEvent.SEND_STILL_INTERESTED_WHISPER, offer);
        this.dispatchEvent(new CustomEvent(ipcEvent.OPEN_WIKI, { detail }))
      })
    }
  }

  sendPartyInvite(offer: any) {
    if (electron) {
      electron.ipcRenderer.send(ipcEvent.SEND_PARTY_INVITE_CMD, offer);
    }
  }

  selfEmitPriceCheck(e: ipcEvent.IpcPriceCheck) {
    this.dispatchEvent(
      new CustomEvent(ipcEvent.PRICE_CHECK, {
        detail: e
      })
    );
  }

  readyReceiveEvents() {
    if (electron) {
      electron.ipcRenderer.send(ipcEvent.OVERLAY_READY);
    }
  }

  dprChanged(dpr: number) {
    if (electron) {
      electron.ipcRenderer.send(ipcEvent.DPR_CHANGE, dpr);
    }
  }

  closeOverlay() {
    if (electron) {
      electron.ipcRenderer.send(ipcEvent.CLOSE_OVERLAY);
    }
  }

  priceCheckWidgetIsHidden() {
    if (electron) {
      electron.ipcRenderer.send(ipcEvent.PRICE_CHECK_HIDE);
    }
  }

  getConfig(): Config {
    if (electron) {
      return electron.ipcRenderer.sendSync(ipcEvent.GET_CONFIG);
    } else {
      return defaultConfig;
    }
  }

  sendLeaguesReady(leagues: League[]) {
    if (electron) {
      electron.ipcRenderer.send(ipcEvent.LEAGUES_READY, leagues);
    }
  }

  openSystemBrowser(url: string) {
    if (electron) {
      electron.ipcRenderer.send(ipcEvent.OPEN_SYSTEM_BROWSER, {
        url
      } as ipcEvent.IpcOpenSystemBrowser);
    }
  }

  openAppBrowser(opts: ipcEvent.IpcShowBrowser) {
    if (electron) {
      electron.ipcRenderer.send(ipcEvent.SHOW_BROWSER, opts);
    } else if (opts.url) {
      window.open(opts.url);
    }
  }

  hideAppBrowser(opts: ipcEvent.IpcHideBrowser) {
    if (electron) {
      electron.ipcRenderer.send(ipcEvent.HIDE_BROWSER, opts);
    }
  }

  closeSettingsWindow(config?: Config) {
    if (electron) {
      electron.ipcRenderer.send(ipcEvent.CLOSE_SETTINGS_WINDOW, config);
    }
  }

  stashSearch(text: string) {
    if (electron) {
      electron.ipcRenderer.send(ipcEvent.STASH_SEARCH, { text });
    }
  }

  saveConfig(config: Config) {
    if (electron) {
      electron.ipcRenderer.send(ipcEvent.PUSH_CONFIG, config);
    }
  }

  importFile(filePath: string) {
    if (electron) {
      return electron.ipcRenderer.sendSync(ipcEvent.IMPORT_FILE, filePath);
    }
  }

  get CORS() {
    return !electron ? "https://apt-cors.snos.workers.dev/?" : "";
  }

  get isElectron() {
    return electron != null;
  }
}

export const MainProcess = new MainProcessBinding();
