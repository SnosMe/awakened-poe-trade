import type { Logger } from "../RemoteLogger";
import type { ServerEvents } from "../server";
import { type IRawFilter } from "./data/IFilter";
import getFiltersContent from "./utils/builder";
import getFilters from "./utils/parseRawFilters";
import path from "node:path";
import fs from "node:fs/promises";
import { GameConfig } from "../host-files/GameConfig";

export class FilterGenerator {
  private get docsPath() {
    return path.dirname(this.gameConfig.actualPath ?? "");
  }
  private logger: Logger;
  private gameConfig: GameConfig;
  private server: ServerEvents;

  constructor(logger: Logger, gameConfig: GameConfig, server: ServerEvents) {
    this.logger = logger;
    this.gameConfig = gameConfig;
    this.server = server;

    this.server.onEventAnyClient("CLIENT->MAIN::user-action", (e) => {
      switch (e.action) {
        case "filter-generator:update": {
          this.updateFilterFile(
            JSON.parse(e.text) as {
              folder: string;
              file: string;
              strategy: "before" | "after";
              rules: Array<IRawFilter>;
            }
          );
          return;
        }
        case "filter-generator:list": {
          this.sendListOfFilters(e.text);
          return;
        }
      }
    });
  }

  async updateFilterFile(event: {
    folder: string;
    file: string;
    strategy: "before" | "after";
    rules: Array<IRawFilter>;
  }) {
    this.logger.write(
      "info  [FilterGenerator] Received filter generation request"
    );

    const targetPath = path.join(event.folder, event.file);

    if (!path.isAbsolute(targetPath)) {
      this.logger.write(
        "error [FilterGenerator] Target filter paths could not be properly resolved, received: " +
          targetPath
      );
      return;
    }

    let oldFilterFileContent;
    let newFilterFileContent;

    try {
      oldFilterFileContent = await fs.readFile(targetPath, "utf-8");
    } catch (e) {
      const errMsg = (e as Error)?.message || (e as string);
      this.logger.write(
        `error [FilterGenerator] Could not read selected file: ${errMsg}`
      );
      return;
    }

    try {
      const customFilters = getFilters(event.rules);
      newFilterFileContent = getFiltersContent(
        event.strategy,
        oldFilterFileContent,
        customFilters
      );
    } catch (e) {
      const errMsg = (e as Error)?.message || (e as string);
      this.logger.write(
        `error [FilterGenerator] Error generating filter file: ${errMsg}`
      );
      return;
    }

    try {
      await fs.writeFile(targetPath, newFilterFileContent);
    } catch (e) {
      const errMsg = (e as Error)?.message || (e as string);
      this.logger.write(
        `error  [FilterGenerator] Filter file was generated but there was problem to write to disk: ${errMsg}`
      );
      return;
    }

    this.logger.write("info  [FilterGenerator] Filter file was updated");
  }

  async sendListOfFilters(folder: string) {
    try {
      const listOfFilters = (await fs.readdir(folder || this.docsPath)).filter(
        (fileName: string) => fileName.endsWith(".filter")
      );
      this.server.sendEventTo("last-active", {
        name: "MAIN->CLIENT::filter-generator:list",
        payload: {
          folder: folder || this.docsPath,
          files: listOfFilters,
        },
      });
    } catch (e) {
      const errMsg = (e as Error)?.message || (e as string);
      this.logger.write(
        `error  [FilterGenerator] Failed to list filter files: ${errMsg}`
      );
    }
  }
}
