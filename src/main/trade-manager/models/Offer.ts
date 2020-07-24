export interface Offer {
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
  }