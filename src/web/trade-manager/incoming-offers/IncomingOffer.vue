<template>
  <div class="incoming-offer bg-gray-800 mx-1 rounded">
    <div class="bg-gray-900 incoming-offer-header" @click="sendParyInvite">
      <ui-popper trigger="hover" :options="{ placement: 'top' }">
        <template slot="reference">
          <p class="text-gray-500">{{ offer.item | elipsis }}</p>
        </template>

        <div class="popper">
          <p>{{ offer.item }}</p>
        </div>
      </ui-popper>
    </div>
    <div class="incoming-offer-content text-gray-500" @click="sendParyInvite">
      <img
        src="https://gamepedia.cursecdn.com/pathofexile_gamepedia/9/9c/Chaos_Orb_inventory_icon.png?version=e197f9fd3de58b1ebaa95ef9160af106"
      />
    </div>
    <div class="incoming-offer-actions">
      <div
        class="incoming-offer-action-still-interested  incoming-offer-action"
        @click="sendStillInterestedWhisper"
      >
        <i class="fas fa-question text-gray-500"></i>
      </div>
      <div
        class="incoming-offer-action-dismiss incoming-offer-action"
        @click="dismiss"
      >
        <i class="fas fa-times text-gray-500"></i>
      </div>
    </div>
  </div>
</template>

<script>
import { MainProcess } from '../../../ipc/main-process-bindings';
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

.incoming-offer-header {
  width: 100%;
  height: 1.5rem;
  text-align: center;
  border-top-left-radius: 0.25rem;
  border-top-right-radius: 0.25rem;
}

.incoming-offer-content {
  width: 100%;
  margin: auto;
}

.incoming-offer-content > img {
  height: 2.5rem;
  width: 2.5rem;
  margin: auto;
}

.incoming-offer-actions {
  height: 1rem;
}

.incoming-offer-action-still-interested {
  height: 1rem;
  width: 50%;
  float: left;
  border-bottom-left-radius: 0.25rem;
}

.incoming-offer-action-dismiss {
  height: 1rem;
  margin-left: 50%;
  width: 50%;
  border-bottom-right-radius: 0.25rem;
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
</style>
