<template>
  <div class="outgoing-offer bg-gray-800 mx-1 rounded ripple">
    <table style="width: 100%;border-radius: 0.25; border: 1px solid #000">
      <tr class="bg-gray-900 outgoing-offer-header">
        <td colspan="4">
          <ui-popper
            trigger="hover"
            :options="{ placement: 'top' }"
            :delay-on-mouse-over="50"
          >
            <template slot="reference">
              <span class="text-gray-500" style="user-select: none">
                {{ offer.item | elipsis(30) }}
              </span>
            </template>

            <div class="popper outgoing-offer-header-tooltip">
              <p>
                {{ offer.item }}
              </p>
            </div>
          </ui-popper>
        </td>
      </tr>
      <tr>
        <td colspan="2" class="outgoing-offer-player text-gray-500">
          {{ offer.player | elipsis(18) }}
        </td>
        <td colspan="2" class="outgoing-offer-time text-gray-500">
          {{ offer.time }} ({{ elapsedTime }}s)
        </td>
      </tr>
      <tr class="outgoing-offer-content">
        <td class="text-gray-500">
          <span>{{ offer.price.value }}x</span>
          <img :src="offer.price.image" :alt="offer.price.currency" />
        </td>
        <td>
          <div
            class="outgoing-offer-action-hideout outgoing-offer-action"
            @click="sendJoinHideout"
          >
            <i class="fas fa-home text-gray-500"></i>
          </div>
        </td>
        <td>
          <div
            class="outgoing-offer-action-trade outgoing-offer-action"
            @click="sendTradeRequest"
          >
            <i class="fas fa-dollar-sign text-gray-500"></i>
          </div>
        </td>
        <td>
          <div
            class="outgoing-offer-action-dismiss outgoing-offer-action"
            @click="dismiss"
          >
            <i class="fas fa-times text-gray-500"></i>
          </div>
        </td>
      </tr>
    </table>
  </div>
</template>

<script>
import { MainProcess } from "../../../ipc/main-process-bindings";
export default {
  props: ["offer"],
  filters: {
    elipsis: function(value, length = 10) {
      if (!value) {
        return "";
      }

      const strValue = value.toString();
      return strValue.length >= length
        ? `${strValue.substring(0, length - 1)}...`
        : strValue;
    },
    time: function(value) {
      if (!value) {
        return "";
      }

      return value.substring(11);
    }
  },
  data: () => ({
    tradeRequestSent: false,
    hideoutJoined: false,
    elapsedTime: 0,
    time: null
  }),
  mounted() {
    this.checkIfExpired();
  },
  methods: {
    checkIfExpired() {
      const date = new Date();
      this.time = new Date(
        `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()} ${
          this.offer.time
        }`
      );

      setInterval(() => {
        const now = new Date();
        const value = (now.getTime() - this.time.getTime()) / 1000;

        if (value >= 60 && !this.hideoutJoined) {
          this.$emit("dismiss");
        }

        this.elapsedTime = value.toFixed(0);
      }, 1000);
    },
    sendJoinHideout() {
      MainProcess.focusGame();
      this.$emit("joinHideout");
      this.hideoutJoined = true;
    },
    sendTradeRequest() {
      MainProcess.focusGame();
      this.$emit("tradeRequest");
      this.tradeRequestSent = true;
    },
    dismiss() {
      MainProcess.focusGame();
      this.$emit("dismiss");
    }
  }
};
</script>

<style>
.outgoing-offer {
  height: 4.5rem;
  pointer-events: all;
  cursor: pointer;
  width: 100%;
  font-size: 0.9rem;
}

.outgoing-offer > table {
  border: 0.15rem solid #1a202c;
}

.outgoing-offer > table > tr > td {
  width: 25%;
}

.outgoing-offer-header {
  text-align: center;
  user-select: none;
}

.outgoing-offer-content > td > img {
  height: 1.3rem;
  display: inline;
  user-select: none;
}

.outgoing-offer-content > td > span {
  display: inline;
  margin-right: 3px;
  user-select: none;
}

.outgoing-offer-action-trade:hover {
  background-color: rgb(255, 153, 36);
}

.outgoing-offer-action-dismiss:hover {
  background-color: red;
}

.outgoing-offer-action-hideout:hover {
  background-color: rgb(21, 167, 21);
}

.outgoing-offer-action > i {
  font-size: 0.7rem;
  position: relative;
  left: 50%;
  top: 50%;
  transform: translateX(-50%) translateY(10%);
}

.outgoing-offer-player,
.outgoing-offer-time {
  text-align: center;
}

.outgoing-offer-header-tooltip > p {
  font-size: 1rem;
}

/* Ripple effect */
.ripple {
  background-position: center;
  transition: background 0.8s;
}
.ripple:hover {
  background: #2d3748 radial-gradient(circle, transparent 1%, #44526b 1%)
    center/15000%;
}
.ripple:active {
  background-color: #4b5a74;
  background-size: 100%;
  transition: background 0s;
}
</style>
