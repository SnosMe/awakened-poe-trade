<template>
  <div class="py-2 border-b border-gray-700">
    <div class="pb-px flex items-baseline justify-between">
      <button class="flex items-baseline text-left min-w-0" @click="toggleFilter">
        <i class="w-5" :class="{
          'far fa-square text-gray-500': filter.disabled,
          'fas fa-check-square': !filter.disabled
        }"></i>
        <div class="search-text flex-1 mr-1 relative flex min-w-0" style="line-height: 1rem;">
          <span class="truncate">{{ filter.text }}</span>
          <span class="search-text-full">{{ filter.text }}</span>
        </div>
      </button>
      <div class="flex">
        <input-debounced class="search-num-input rounded-tl mr-px" placeholder="min" type="number" :class="{ 'rounded-bl': filter.roll == null }"
          v-if="showMinmaxInput"
          v-model.number="filter.min" @focus="inputFocus($event, 'min')" />
        <input-debounced class="search-num-input rounded-tr" placeholder="max" type="number" :class="{ 'rounded-br': filter.roll == null }"
          v-if="showMinmaxInput"
          v-model.number="filter.max" @focus="inputFocus($event, 'max')" />
        <div v-if="filter.option"
          class="search-option">{{ filter.option.text }}</div>
      </div>
    </div>
    <div class="flex">
      <div class="w-5 flex items-start">
        <ui-popper v-if="filter.hidden" tag-name="div" class="flex" :options="{ placement: 'right-start' }">
          <template slot="reference">
            <span class="text-xs leading-none text-gray-600 cursor-pointer">
              <i class="fas fa-eye-slash"></i>
            </span>
          </template>
          <div class="popper">
            <div>{{ filter.hidden }}</div>
          </div>
        </ui-popper>
      </div>
      <div class="flex-1 flex items-start">
        <span v-if="showTypeTags"
          class="text-xs leading-none px-1 rounded" :class="`mod-type-${filter.type}`">{{ filter.type }}</span>
        <span v-if="filter.variant"
          class="text-xs leading-none px-1 rounded mod-type-variant">variant</span>
      </div>
      <div class="flex-1 mr-4">
        <div style="width: 200px;">
          <ui-slider v-if="filter.boundMin !== undefined"
            class="search-slider-rail" style="padding: 0;" :dotSize="[0, 20]" :height="20"
            :railStyle="{ background: 'transparent' }" :processStyle="{ background: '#cbd5e0', borderRadius: 0 }"
            drag-on-click lazy adsorb :enable-cross="false"

            v-model="sliderValue"
            :marks="{
              [filter.boundMin]: { label: 'min' },
              [filter.boundMax]: { label: 'max' },
              [filter.roll]: { label: 'roll' }
            }"
            :min="filter.boundMin"
            :max="filter.boundMax"
            :interval="(filter.boundMax - filter.boundMin) < 1 ? 0.01 : 1"
          >
          <template v-slot:mark="{ pos, label, active }">
            <div class="custom-mark" :class="{ active, [label]: true }" :style="{ flex: pos }">
              <div class="custom-mark-tick" :style="{ 'left': `calc(${pos}% - 1px)` }"></div>
              {{ label === 'min' ? filter.boundMin : label === 'max' ? filter.boundMax
                : (filter.roll === filter.boundMin || filter.roll === filter.boundMax ? filter.roll : '') }}
            </div>
          </template>
          </ui-slider>
        </div>
      </div>
      <div v-if="showQ20Notice"
        class="bg-gray-700 text-gray-500 text-center rounded-l px-1 mr-px">Q 20%</div>
      <div v-if="filter.roll != null"
        class="bg-gray-700 text-gray-500 text-center rounded-br" style="width: 97px" :class="{ 'rounded-bl': !showQ20Notice }">{{ filter.roll }}</div>
    </div>
  </div>
</template>

<script>
import InputDebounced from '../InputDebounced'

export default {
  props: {
    filter: {
      type: Object,
      required: true
    }
  },
  components: { InputDebounced },
  computed: {
    showMinmaxInput () {
      if (
        this.filter.option != null ||
        (this.filter.roll == null && this.filter.min == null && this.filter.max == null)
      ) return false

      return true
    },
    showTypeTags () {
      if (this.filter.boundMin !== undefined || this.filter.variant) {
        return false
      }
      return this.filter.type !== 'armour' &&
        this.filter.type !== 'weapon'
    },
    showQ20Notice () {
      return this.filter.type === 'armour' ||
        this.filter.type === 'weapon'
    },
    sliderValue: {
      get () {
        return [
          typeof this.filter.min === 'number' ? this.filter.min : this.filter.boundMin,
          typeof this.filter.max === 'number' ? this.filter.max : this.filter.boundMax
        ]
      },
      set (value) {
        this.filter.min = value[0]
        this.filter.max = value[1]
        this.filter.disabled = false
      }
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
.mod-type-implicit, .mod-type-variant {
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

.mod-type-pseudo {
  @apply bg-gray-700 text-gray-900
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
    font-size: 13px;
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

.search-text-full {
  position: absolute;
  left: 0px;
  top: 0px;
  padding-bottom: 1px;
  z-index: 10;

  .search-text:not(:hover) & {
    display: none;
  }

  .search-text:hover & {
    @apply bg-gray-700;
  }
}

.search-slider-rail { @apply rounded bg-gray-700; }
.vue-slider-marks { display: flex; }
.custom-mark {
  text-align: right;
  white-space: nowrap;
  padding: 0 4px;
  @apply text-gray-500;

  &.active {
    z-index: 1;
    @apply text-gray-900;
  }

  &.roll .custom-mark-tick {
    position: absolute;
    height: 100%;

    &::before, &::after {
      content: ' ';
      display: block;
      position: absolute;
      height: 4px;
      width: 2px;
      @apply bg-gray-900;
    }

    &::before { top: 0; }
    &::after { bottom: 0; }
  }
}
</style>
