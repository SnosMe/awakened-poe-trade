<template>
  <div class="incoming-offer bg-gray-800 mx-1 rounded ripple">
    <table style="width: 100%;">
      <tr class="bg-gray-900 incoming-offer-header" @click="sendParyInvite">
        <td colspan="2">
          <ui-popper trigger="hover" :options="{ placement: 'top' }">
            <template slot="reference">
              <p class="text-gray-500">{{ offer.item | elipsis }}</p>
            </template>

            <div class="popper">
              <p>{{ offer.item }}</p>
            </div>
          </ui-popper>
        </td>
      </tr>
      <tr class="incoming-offer-content text-gray-500" @click="sendParyInvite">
        <td>
          <img
            src="https://gamepedia.cursecdn.com/pathofexile_gamepedia/9/9c/Chaos_Orb_inventory_icon.png?version=e197f9fd3de58b1ebaa95ef9160af106"
          />
        </td>
        <td>
          <p class="text-gray-500">50x</p>
        </td>
      </tr>
      <tr class="incoming-offer-actions">
        <td>
          <div
            class="incoming-offer-action-still-interested incoming-offer-action"
            @click="sendStillInterestedWhisper"
          >
            <i class="fas fa-question text-gray-500"></i>
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
    </table>
  </div>
</template>

<script>
import { MainProcess } from "../../../ipc/main-process-bindings";
export default {
  props: {
    offer: {
      type: Object,
      required: true
    }
  },
  filters: {
    elipsis: function(value) {
      if (!value) {
        return "";
      }

      const strValue = value.toString();
      return strValue.length >= 10
        ? `${strValue.substring(0, 9)}...`
        : strValue;
    }
  },
  data: () => ({
    //
  }),
  created() {},
  methods: {
    sendParyInvite() {
      MainProcess.focusGame();
      this.$emit("partyInvite");
      this.offer.partyInviteSent = true;
    },
    sendStillInterestedWhisper() {
      MainProcess.focusGame();
      this.$emit("stillInterested");
    },
    dismiss() {
      MainProcess.focusGame();
      this.$emit("dismiss");
    }
  }
};
</script>

<style>
.incoming-offer {
  width: 5rem;
  height: 5rem;
  pointer-events: all;
}

.incoming-offer > table {
  border: 0.2rem solid #1a202c;
}

.incoming-offer > table > tr > td {
  width: 50%;
}

.incoming-offer-header {
  text-align: center;
}

.incoming-offer-content > td > img {
  height: 2rem;
  margin: auto;
}

.incoming-offer-content > td > p {
  text-align: center;
}

.incoming-offer-action-still-interested:hover {
  background-color: rgb(47, 113, 255);
}

.incoming-offer-action-dismiss:hover {
  background-color: red;
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
