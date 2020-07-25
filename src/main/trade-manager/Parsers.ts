import { normalizeCurrency, CURRENCY_TO_IMAGE } from "./Config";
import { Offer } from "./models/Offer";

/**
 * Defines the way to parse different types messages/whispers/etc. based on the language
 */
export const parsing: any = {
  en: {
    incomingOffer: {
      validate: (text: string) =>
        /@From .+:* Hi, (I would|I'd) like to buy your .+ (listed for|for my) .+ in .+/gi.test(
          text
        ),
      parse: (text: string, id: number) => {
        const TIME_END_INDEX = 19;
        const TIME_START_INDEX = 0;
        const AT_FROM = "@From ";
        const CHEV_SPACE = "> ";
        const IN = " in ";
        const P_STASH_TAB = '(stash tab "';
        const POSITION_LEFT = '"; position: left ';
        const TOP = ", top ";
        const P = ")";

        // There are multiple whisper templates, so we need multiple parsing functions
        const reg1 = /@From .+:* Hi, I would like to buy your .+ listed for .+ in .+/gi;
        function parse1(text: string) {
          const HI_I_WOULD_LIKE_TO_BUY_YOUR = ": Hi, I would like to buy your ";
          const LISTED_FOR = " listed for ";

          const time = text.substring(TIME_START_INDEX, TIME_END_INDEX);

          let player = "";
          if (/@From <.+> .+: Hi/gi.test(text)) {
            player = text.textBetween(CHEV_SPACE, HI_I_WOULD_LIKE_TO_BUY_YOUR);
          } else {
            player = text.textBetween(AT_FROM, HI_I_WOULD_LIKE_TO_BUY_YOUR);
          }

          const item = text.textBetween(
            HI_I_WOULD_LIKE_TO_BUY_YOUR,
            LISTED_FOR
          );

          const price = text.textBetween(LISTED_FOR, IN);

          let currency = "",
            priceImage = "",
            priceValue = "";
          const priceSplit = price.split(" ");
          if (priceSplit && priceSplit.length == 2) {
            currency = normalizeCurrency(priceSplit[1]);
            priceImage = CURRENCY_TO_IMAGE[currency];
            priceValue = priceSplit[0];
          }

          // eslint-disable-next-line camelcase
          const p_stash_tab_index = text.indexOf(P_STASH_TAB);
          const league = text.substring(
            text.indexOf(IN) + IN.length,
            // eslint-disable-next-line camelcase
            p_stash_tab_index !== -1 ? p_stash_tab_index : text.length
          );

          let tab = "",
            left = "",
            top = "";
          if (p_stash_tab_index !== -1) {
            tab = text.textBetween(P_STASH_TAB, POSITION_LEFT);
            left = text.textBetween(POSITION_LEFT, TOP);
            top = text.textBetween(TOP, P);
          }

          return {
            id,
            player,
            item,
            time,
            price: {
              image: priceImage,
              currency,
              value: priceValue
            },
            league,
            location: {
              tab,
              left,
              top
            }
          } as Offer;
        }

        const reg2 = /@From .+:* Hi, I'd like to buy your .+ for my .+ in .+/gi;
        function parse2(text: string) {
          const HI_ID_LIKE_TO_BUY_YOUR = ": Hi, I'd like to buy your ";
          const FOR_MY = " for my ";

          const time = text.substring(TIME_START_INDEX, TIME_END_INDEX);

          let player = "";
          if (/@From <.+> .+: Hi/gi.test(text)) {
            player = text.textBetween(CHEV_SPACE, HI_ID_LIKE_TO_BUY_YOUR);
          } else {
            player = text.textBetween(AT_FROM, HI_ID_LIKE_TO_BUY_YOUR);
          }

          const item = text.textBetween(HI_ID_LIKE_TO_BUY_YOUR, FOR_MY);

          const price = text.textBetween(FOR_MY, IN);

          let currency = "",
            priceImage = "",
            priceValue = "";

          priceValue = price.substring(0, price.indexOf(" "));
          currency = normalizeCurrency(price.substring(price.indexOf(" ") + 1));
          priceImage = CURRENCY_TO_IMAGE[currency];

          // eslint-disable-next-line camelcase
          const p_stash_tab_index = text.indexOf(P_STASH_TAB);
          const league = text.substring(
            text.indexOf(IN) + IN.length,
            // eslint-disable-next-line camelcase
            p_stash_tab_index !== -1 ? p_stash_tab_index : text.length
          );

          let tab = "",
            left = "",
            top = "";
          if (p_stash_tab_index !== -1) {
            tab = text.textBetween(P_STASH_TAB, POSITION_LEFT);
            left = text.textBetween(POSITION_LEFT, TOP);
            top = text.textBetween(TOP, P);
          }

          return {
            id: ++id,
            player,
            item,
            time,
            price: {
              image: priceImage,
              currency,
              value: priceValue
            },
            league,
            location: {
              tab,
              left,
              top
            }
          } as Offer;
        }

        if (reg1.test(text)) {
          return parse1(text);
        } else if (reg2.test(text)) {
          return parse2(text);
        } else {
          return null;
        }
      }
    },
    outgoingOffer: {
      validate: (text: string) => /(?!@From)@.+ .+/gi.test(text),
      parse: (text: string, id: number) => {
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
          id,
          player,
          item,
          time: "",
          price: {
            image: priceImage,
            currency,
            value: priceValue
          },
          league
        } as Offer;
      }
    },
    tradeAccepted: {
      validate: (text: string) => /Trade accepted/gi.test(text),
      parse: (text: string) => text
    },
    tradeCancelled: {
      validate: (text: string) =>
        /Trade cancelled|Player not found in this area/gi.test(text),
      parse: (text: string) => text
    },
    playerJoined: {
      validate: (text: string) => /.+ has joined the area/gi.test(text),
      parse: (text: string) =>
        text.substring(
          text.indexOf("] : ") + 4,
          text.indexOf(" has joined the area")
        )
    }
  }
};
