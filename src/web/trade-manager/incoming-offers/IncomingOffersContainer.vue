<template>
  <div
    id="incoming-offers-container"
    style="bottom: 20px; left: 0; height: 60px; width: 100%; position: absolute;"
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
      console.log("still interested ?");
    },
    sendPartyInvite(offer) {
      console.log("party invite");
    }
  }
};
</script>

<style>
.incoming-offers {
  position: absolute;
  bottom: 0;
  left: 50%;
  transform: translateX(-50%, -50%);
}
</style>
