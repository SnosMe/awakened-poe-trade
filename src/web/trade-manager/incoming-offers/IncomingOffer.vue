<template>
  <div
    class="incoming-offer bg-gray-800 mt-2 mx-4 rounded capture-mouse"
  >
    <div class="bg-gray-900 offer-header">
      <ui-popper trigger="hover" :options="{ placement: 'top' }">
        <template slot="reference">
          <p class="text-gray-500">{{ offer.item | elipsis }}</p>
        </template>

        <div class="popper">
          <p>{{ offer.item }}</p>
        </div>
      </ui-popper>
    </div>
  </div>
</template>

<script>
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
  }
};
</script>

<style>
.incoming-offer {
  width: 80px;
  height: 50px;
}

.offer-header {
  width: 100%;
  text-align: center;
  border-top-left-radius: 0.25rem;
  border-top-right-radius: 0.25rem;
}
</style>
