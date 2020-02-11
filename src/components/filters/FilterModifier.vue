<template>
  <div class="py-2 border-b border-gray-700">
    <div class="pb-px flex items-baseline justify-between">
      <button class="flex items-baseline text-left min-w-0" @click="toggleFilter">
        <i class="w-5" :class="{
          'far fa-square text-gray-500': filter.disabled,
          'fas fa-check-square': !filter.disabled
        }"></i>
        <span class="truncate flex-1 pr-1">{{ filter.text }}</span>
      </button>
      <div class="flex">
        <input class="search-num-input rounded-tl mr-px" placeholder="min" type="number" :class="{ 'rounded-bl': filter.roll == null }"
          v-if="showMinmaxInput"
          v-model.number="filter.min" @focus="inputFocus($event, 'min')">
        <input class="search-num-input rounded-tr" placeholder="max" type="number" :class="{ 'rounded-br': filter.roll == null }"
          v-if="showMinmaxInput"
          v-model.number="filter.max" @focus="inputFocus($event, 'max')">
        <div v-if="filter.option"
          class="search-option">{{ filter.option.text }}</div>
      </div>
    </div>
    <div class="flex">
      <div class="w-5"></div>
      <div class="flex-1 flex items-start">
        <span v-if="showTypeTags"
          class="text-xs leading-none px-1 rounded" :class="`mod-type-${filter.type}`">{{ filter.type }}</span>
      </div>
      <div v-if="showQ20Notice"
        class="bg-gray-700 text-gray-500 text-center rounded-l px-1 mr-px">Q 20%</div>
      <div v-if="filter.roll != null"
        class="bg-gray-700 text-gray-500 text-center rounded-br" style="width: 97px" :class="{ 'rounded-bl': !showQ20Notice }">{{ filter.roll }}</div>
    </div>
  </div>
</template>

<script>
export default {
  props: {
    filter: {
      type: Object,
      required: true
    }
  },
  computed: {
    showMinmaxInput () {
      if (
        this.filter.option != null ||
        (this.filter.roll == null && this.filter.min == null && this.filter.max == null)
      ) return false

      return true
    },
    showTypeTags () {
      return this.filter.type !== 'armour' &&
        this.filter.type !== 'weapon'
    },
    showQ20Notice () {
      return this.filter.type === 'armour' ||
        this.filter.type === 'weapon'
    }
  },
  methods: {
    inputFocus (e, type) {
      if (e.target.value === '') {
        if (type === 'max') {
          this.filter.max = this.filter.defaultMax
        } else if (type === 'min') {
          this.filter.min = this.filter.defaultMin
        }
        this.$nextTick(() => {
          e.target.select()
        })
      } else {
        e.target.select()
      }
      this.filter.disabled = false
    },
    toggleFilter () {
      this.filter.disabled = !this.filter.disabled
    }
  }
}
</script>

<style lang="postcss">
.mod-type-implicit {
  @apply bg-yellow-700 text-yellow-100
}

.mod-type-crafted {
  @apply bg-blue-600 text-blue-100
}

.mod-type-explicit {
  @apply -mx-1 text-gray-600
}

.mod-type-enchant {
  @apply bg-purple-600 text-purple-100
}

.search-num-input {
  @apply bg-gray-900;
  @apply text-gray-300;
  @apply text-center;
  @apply w-12;
  @apply px-1;
  @apply border border-transparent;

  &::placeholder {
    @apply text-gray-700;
  }

  /* &:not(:placeholder-shown) { @apply border-gray-600; } */

  &:focus {
    @apply border-gray-500;
  }

  &::-webkit-outer-spin-button,
  &::-webkit-inner-spin-button {
    -webkit-appearance: none;
  }
}

.search-option {
  @apply bg-gray-900;
  @apply text-gray-300 text-center truncate;
  @apply w-48;
  @apply px-1;
  @apply border border-transparent;
  @apply rounded;
}
</style>
