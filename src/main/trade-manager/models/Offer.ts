/**
 * Define the Offer class
 * Is a logical representation of a trading whisper
 */
export interface Offer {
  /**
   * Unique in-app ID
   */
  id: number;
  item: string;
  time: string;
  price: {
    value: string;
    currency: string;
    image: string;
  };
  player: string;
  league: string;
  location: {
    tab: string;
    left: string;
    top: string;
  }
}
