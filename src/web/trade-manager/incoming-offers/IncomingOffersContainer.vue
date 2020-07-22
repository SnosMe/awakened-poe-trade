<template>
  <div
    id="incoming-offers-container"
    style="top: 0; left: 0; height: 100%; width: 100%; position: absolute;"
    class="flex-grow flex h-full"
  >
    <IncomingOffer
      class="incoming-offers"
      :key="offer.id"
      v-for="offer of offers"
      :offer="offer"
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
  methods: {}
};
</script>

<style>
.incoming-offers {
  position: absolute;
  bottom: 20px;
  left: 50%;
  transform: translateX(-50%, -50%);
}
</style>
