<template>
  <div class="incoming-offer bg-gray-800 mx-1 rounded ripple">
    <table style="width: 100%;border-radius: 0.25; border: 1px solid #000">
      <tr
        class="bg-gray-900 incoming-offer-header"
        @click.exact="offerClicked"
        @click.ctrl.exact="sendSoldWhisper"
        @click.ctrl.shift.exact="sendStillInterestedWhisper"
        @click.alt.exact="highlightItem"
      >
        <td colspan="2">
          <ui-popper
            trigger="hover"
            :options="{ placement: 'top' }"
            :delay-on-mouse-over="50"
          >
            <template slot="reference">
              <span class="text-gray-500" style="user-select: none">
                {{ offer.item | elipsis(playerJoined ? 7 : 9) }}
                <i
                  class="fas fa-user"
                  style="font-size: 0.8rem"
                  v-if="playerJoined"
                ></i>
              </span>
            </template>

            <div class="popper incoming-offer-header-tooltip">
              <p>
                {{ offer.item }}<br />
                {{ offer.player }}<br />
                {{ offer.time | time }}
              </p>
            </div>
          </ui-popper>
        </td>
      </tr>
      <tr
        class="incoming-offer-content text-gray-500"
        @click.exact="offerClicked"
        @click.ctrl.exact="sendSoldWhisper"
        @click.ctrl.shift.exact="sendStillInterestedWhisper"
        @click.alt.exact="highlightItem"
      >
        <td>
          <img :src="offer.price.image" :alt="offer.price.currency" />
        </td>
        <td>
          <p class="text-gray-500">{{ offer.price.value }}</p>
        </td>
      </tr>
      <tr class="incoming-offer-actions" v-if="!partyInviteSent">
        <td>
          <div
            class="incoming-offer-action-busy incoming-offer-action"
            @click="sendBusyWhisper"
          >
            <i class="fas fa-clock text-gray-500"></i>
          </div>
        </td>
        <td>
          <div
            class="incoming-offer-action-dismiss incoming-offer-action"
            @click="dismiss"
          >
            <i class="fas fa-times text-gray-500"></i>
          </div>
        </td>
      </tr>
      <tr class="incoming-offer-actions" v-else>
        <td>
          <div
            class="incoming-offer-action-party-invite incoming-offer-action"
            @click="sendPartyInvite(true)"
          >
            <i class="fas fa-user-plus text-gray-500"></i>
          </div>
        </td>
        <td>
          <div
            class="incoming-offer-action-dismiss incoming-offer-action"
            @click="remove"
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
    partyInviteSent: false,
    tradeRequestSent: false,
    playerJoined: false,
    showDetails: false
  }),
  methods: {
    setPlayerJoined() {
      this.playerJoined = true;
    },
    setTradeRequestSent(state) {
      this.tradeRequestSent = state;
    },
    offerClicked() {
      MainProcess.focusGame();

      if (this.partyInviteSent) {
        this.sendTradeRequest();
      } else {
        this.sendPartyInvite();
      }
    },
    sendTradeRequest() {
      this.$emit("tradeRequest");
      this.tradeRequestSent = true;
    },
    sendPartyInvite(focusGame = false) {
      if (focusGame) {
        MainProcess.focusGame();
      }

      this.$emit("partyInvite");
      this.partyInviteSent = true;
    },
    sendStillInterestedWhisper() {
      MainProcess.focusGame();
      this.$emit("stillInterested");
    },
    dismiss() {
      MainProcess.focusGame();
      this.$emit("dismiss");
    },
    remove() {
      MainProcess.focusGame();
      this.$emit("remove");
    },
    sendSoldWhisper() {
      MainProcess.focusGame();
      this.$emit("sold");
    },
    sendBusyWhisper() {
      MainProcess.focusGame();
      this.$emit("busy");
    },
    highlightItem() {
      MainProcess.focusGame();
      this.$emit("highlightItem");
    }
  }
};
</script>

<style>
.incoming-offer {
  width: 5rem;
  height: 5rem;
  pointer-events: all;
  cursor: pointer;
}

.incoming-offer > table {
  border: 0.15rem solid #1a202c;
}

.incoming-offer > table > tr > td {
  width: 50%;
}

.incoming-offer-header {
  text-align: center;
  user-select: none;
}

.incoming-offer-content > td > img {
  height: 2rem;
  margin: auto;
  user-select: none;
}

.incoming-offer-content > td > p {
  text-align: center;
  user-select: none;
}

.incoming-offer-action-busy:hover {
  background-color: rgb(47, 113, 255);
}

.incoming-offer-action-dismiss:hover {
  background-color: red;
}

.incoming-offer-action-party-invite:hover {
  background-color: rgb(21, 167, 21);
}

.incoming-offer-action > i {
  font-size: 0.7rem;
  position: relative;
  left: 50%;
  top: 50%;
  transform: translateX(-50%) translateY(-95%);
}

.incoming-offer-action {
  height: 1rem;
}

.incoming-offer-actions > td > span > span > .popper {
  font-size: 0.6rem !important;
}

.incoming-offer-highlight {
  background-color: #a0aec0;
  color: #1a202c;
}

.incoming-offer-header-tooltip > p {
  font-size: 0.7rem;
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
