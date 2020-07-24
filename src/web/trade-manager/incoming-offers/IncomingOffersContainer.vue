<template>
  <div
    id="incoming-offers-container"
    style="bottom: 20px; left: 50%; height: 60px; width: 43%; position: absolute; transform: translateX(-50%);"
    class="flex-grow flex h-full"
  >
    <IncomingOffer
      v-for="offer of offers"
      ref="offers"
      class="incoming-offers"
      :key="offer.id"
      :offer="offer"
      @dismiss="dismiss(offer)"
      @stillInterested="sendStillInterestedWhisper(offer)"
      @partyInvite="sendPartyInvite(offer)"
      @remove="remove(offer)"
      @sold="sendSoldWhisper(offer)"
      @busy="sendBusyWhisper(offer)"
      @tradeRequest="sendTradeRequest(offer)"
      @highlightItem="highlightItem(offer)"
    />
  </div>
</template>

<script>
import { MainProcess } from "@/ipc/main-process-bindings";
import {
  NEW_INCOMING_OFFER,
  TRADE_ACCEPTED,
  TRADE_CANCELLED,
  PLAYER_JOINED
} from "@/ipc/ipc-event";

import IncomingOffer from "./IncomingOffer";

export default {
  components: {
    IncomingOffer
  },
  created() {
    MainProcess.addEventListener(NEW_INCOMING_OFFER, ({ detail: offer }) => {
      this.offers.push(offer);
    });

    MainProcess.addEventListener(TRADE_ACCEPTED, () => {
      const offer = this.offers.find(o => o.tradeRequestSent);
      console.debug("Trade accepted for ", offer);

      if (offer) {
        MainProcess.sendThanksWhisper(offer, true);
      }
    });

    MainProcess.addEventListener(TRADE_CANCELLED, () => {
      for (let i = 0; i < this.$refs.offers.length; ++i) {
        this.$refs.offers[i].setTradeRequestSent(false);
      }
    });

    MainProcess.addEventListener(PLAYER_JOINED, ({ detail: player }) => {
      for (let i = 0; i < this.offers.length; ++i) {
        if (this.offers[i].player == player) {
          for (let vo of this.$refs.offers) {
            if (this.offers[i].id == vo.offer.id) {
              vo.setPlayerJoined();
            }
          }
        }
      }
    });
  },
  data() {
    return {
      offers: []
    };
  },
  watch: {},
  computed: {},
  mounted() {
    console.log(this.$refs);
  },
  methods: {
    dismiss(offer) {
      const index = this.offers.findIndex(o => o.id === offer.id);

      if (index !== -1) {
        this.offers.splice(index, 1);
      }
    },
    sendStillInterestedWhisper(offer) {
      MainProcess.sendStillInterestedWhisper(offer);
    },
    sendPartyInvite(offer) {
      MainProcess.sendPartyInvite(offer);
    },
    remove(offer) {
      this.dismiss(offer);
      MainProcess.sendPartyKick(offer);
    },
    sendSoldWhisper(offer) {
      this.dismiss(offer);
      MainProcess.sendSoldWhisper(offer);
    },
    sendBusyWhisper(offer) {
      MainProcess.sendBusyWhisper(offer);
    },
    sendTradeRequest(offer) {
      const index = this.offers.findIndex(o => o.id === offer.id);

      if (index !== -1) {
        this.offers[index].tradeRequestSent = true;
      }

      MainProcess.sendTradeRequest(offer);
    },
    highlightItem(offer) {
      MainProcess.highlightOfferItem(offer);
    }
  }
};
</script>

<style>
.incoming-offers {
  position: relative;
  bottom: 25px;
}
</style>
