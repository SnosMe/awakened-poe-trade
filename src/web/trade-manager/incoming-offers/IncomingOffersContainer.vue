<template>
  <div
    id="incoming-offers-container"
    style="bottom: 20px; left: 0; height: 60px; width: 100%; position: absolute; justify-content: center;"
    class="flex-grow flex h-full"
  >
    <IncomingOffer
      class="incoming-offers"
      :key="offer.id"
      v-for="offer of offers"
      :offer="offer"
      @dismiss="dismiss(offer)"
      @stillInterested="sendStillInterestedWhisper(offer)"
      @partyInvite="sendPartyInvite(offer)"
      @remove="remove(offer)"
      @sold="sendSoldWhisper(offer)"
      @busy="sendBusyWhisper(offer)"
    />
  </div>
</template>

<script>
import { MainProcess } from "@/ipc/main-process-bindings";
import { NEW_INCOMING_OFFER } from "@/ipc/ipc-event";

import IncomingOffer from "./IncomingOffer";

export default {
  components: {
    IncomingOffer
  },
  created() {
    MainProcess.addEventListener(NEW_INCOMING_OFFER, ({ detail: offer }) => {
      console.log(offer);
      this.offers.push(offer);
    });
  },
  data() {
    return {
      offers: []
    };
  },
  watch: {},
  computed: {},
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
