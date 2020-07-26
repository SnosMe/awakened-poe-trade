export const DEBOUNCE_READ_RATE_MS = 500;
export const FILE_WATCH_RATE_MS = 1000;
export const CLIPBOARD_POLLING_RATE_MS = 500;
export const POE_PROCESS_RETRY_RATE_MS = 30000;

export const CURRENCY_TO_IMAGE: any = {
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

export function normalizeCurrency(text: string): string {
  switch (text) {
    case "Chaos Orb":
      return "chaos";

    case "Orb of Alteration":
      return "alt";

    case "Orb of Alchemy":
      return "alc";

    case "Gemcutter's Prism":
      return "gcp";

    case "Exalted Orb":
      return "exalted";

    case "Chromatic Orb":
      return "chrome";

    case "Jeweller's Orb":
      return "jewellers";

    case "Orb of Chance":
      return "chance";

    case "Cartographer's Chisel":
      return "chisel";

    case "Vaal Orb":
      return "vaal";

    case "Blessed Orb":
      return "blessed";

    case "Perandus Coin":
      return "p";

    case "Mirror of Kalandra":
      return "mirror";

    case "Orb of Transmutation":
      return "transmute";

    case "Silver Coin":
      return "silver";

    default:
      return text;
  }
}
