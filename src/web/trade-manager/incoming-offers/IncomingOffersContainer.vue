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
    this.handleEvents();
  },
  data() {
    return {
      offers: []
    };
  },
  methods: {
    /**
     * Handles the events from the MainProcess
     */
    handleEvents() {
      /**
       * Any new incoming offers from the Client.txt file
       */
      MainProcess.addEventListener(NEW_INCOMING_OFFER, ({ detail: offer }) => {
        this.offers.push(offer);
      });

      /**
       * Any "Trade accepted" message that might help removing completed offers
       */
      MainProcess.addEventListener(TRADE_ACCEPTED, () => {
        const offer = this.offers.find(o => o.tradeRequestSent);

        if (offer) {
          MainProcess.sendThanksWhisper(offer, true);
          this.dismiss(offer);
        }
      });

      /**
       * Any "Trade cancelled" or "Player not found in the area" message that reset the trading status of the offers
       */
      MainProcess.addEventListener(TRADE_CANCELLED, () => {
        for (let i = 0; i < this.$refs.offers.length; ++i) {
          this.$refs.offers[i].setTradeRequestSent(false);
        }
      });

      /**
       * Any "Player has joined the area" message to display a notification in the view
       */
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
    /**
     * Remove an offer from the view
     */
    dismiss(offer) {
      const index = this.offers.findIndex(o => o.id === offer.id);

      if (index !== -1) {
        this.offers.splice(index, 1);
      }
    },
    /**
     * Ask the MainProcess to send a "Are you still interested?"
     * whisper using the offer provided
     */
    sendStillInterestedWhisper(offer) {
      MainProcess.sendStillInterestedWhisper(offer);
    },
    /**
     * Ask the MainProcess to send a Party Invite command
     * using the offer provided
     */
    sendPartyInvite(offer) {
      MainProcess.sendPartyInvite(offer);
    },
    /**
     * Call the Dismiss function and ask the MainProcess to send
     * a Party Kick command using the offer provided
     */
    remove(offer) {
      this.dismiss(offer);
      MainProcess.sendPartyKick(offer);
    },
    /**
     * Ask the MainProcess to send a "It's sold"
     * whisper using the offer provided
     */
    sendSoldWhisper(offer) {
      this.dismiss(offer);
      MainProcess.sendSoldWhisper(offer);
    },
    /**
     * Ask the MainProcess to send a "I'm busy"
     * whisper using the offer provided
     */
    sendBusyWhisper(offer) {
      MainProcess.sendBusyWhisper(offer);
    },
    /**
     * Ask the MainProcess to send
     * a Trade Request command using the offer provided
     */
    sendTradeRequest(offer) {
      const index = this.offers.findIndex(o => o.id === offer.id);

      if (index !== -1) {
        this.offers[index].tradeRequestSent = true;
      }

      MainProcess.sendTradeRequest(offer);
    },
    /**
     * Ask the MainProcess to send a
     * item highlighting command using the offer provided
     */
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
