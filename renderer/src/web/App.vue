<template>
  <div id="app" class="text-sm font-poe-sc">
    <OverlayWindow />
  </div>
</template>

<script setup lang="ts">
import OverlayWindow from './overlay/OverlayWindow.vue'
</script>

<style lang="postcss">
@import url('@fortawesome/fontawesome-free/css/all.min.css');
@import url('animate.css/animate.css');
@import url('../assets/font.css');
@tailwind base;
@tailwind components;
@tailwind utilities;

/* Color tokens. Values are space-separated sRGB channel triplets so Tailwind's
   `<alpha-value>` placeholder resolves and opacity modifiers keep working.
   In hand-written CSS use `rgb(var(--c-foo))`, never a bare `var(--c-foo)`. */
/* Warm Ash — near-black warm neutrals (hue ~30deg, very low chroma) so the overlay
   recedes against the game, with a bone-white text ramp and PoE gold as the single
   accent so typography and semantic color stay loud. */
:root,
:root[data-theme="warm-ash"] {
  /* surfaces */
  --c-surface-deep:     20  18  15; /* #14120F  window / behind panels         */
  --c-surface-base:     28  25  22; /* #1C1916  main panel body                */
  --c-surface-raised:   38  34  29; /* #26221D  cards, headers, inputs         */
  --c-surface-hover:    51  45  38; /* #332D26  hover / pressed / .btn face    */
  --c-surface-overlay:  12  11   9; /* #0C0B09  floating actions panel         */

  /* lines */
  --c-border:           66  58  49; /* #423A31  hairlines, dividers            */
  --c-border-strong:    92  81  69; /* #5C5145  active / focused outline       */

  /* text */
  --c-text-primary:    242 235 221; /* #F2EBDD  values, item names             */
  --c-text-body:       214 205 188; /* #D6CDBC  default body copy              */
  --c-text-muted:      163 153 138; /* #A3998A  labels, secondary, icon chrome */
  --c-text-faint:      110 101  88; /* #6E6558  placeholder / disabled only    */
  --c-text-inverse:     20  18  15; /* #14120F  text on gold / light chips     */

  /* accent — PoE gold */
  --c-accent:          200 170 110; /* #C8AA6E                                 */
  --c-accent-strong:   224 196 137; /* #E0C489  hover / active                 */
  --c-accent-dim:      140 118  69; /* #8C7645  gold borders, rest state       */
  --c-accent-contrast:  20  18  15; /* #14120F  text on a gold fill            */

  /* semantic */
  --c-danger:          142  58  51; /* #8E3A33 */
  --c-danger-text:     217 115 106; /* #D9736A */
  --c-warn:            138  90  34; /* #8A5A22 */
  --c-warn-text:       217 160  85; /* #D9A055 */
  --c-good:             63 107  60; /* #3F6B3C */
  --c-good-text:       134 179 107; /* #86B36B */
  --c-info:             51  86 110; /* #33566E */
  --c-info-text:       127 168 196; /* #7FA8C4 */

  /* utility */
  --c-shadow:            0   0   0;
  --c-scrim:            18  16  13;
}

/* Legacy Slate — the pre-refactor look, kept as an opt-out. */
:root[data-theme="legacy-slate"] {
  /* surfaces */
  --c-surface-deep:     26  32  44;
  --c-surface-base:     26  32  44;
  --c-surface-raised:   45  55  72;
  --c-surface-hover:    74  85 104;
  --c-surface-overlay:   0   0   0;

  /* lines */
  --c-border:          113 128 150;
  --c-border-strong:   160 174 192;

  /* text */
  --c-text-primary:    247 250 252;
  --c-text-body:       226 232 240;
  --c-text-muted:      160 174 192;
  --c-text-faint:      113 128 150;
  --c-text-inverse:     26  32  44;

  /* accent */
  --c-accent:          203 213 224;
  --c-accent-strong:   237 242 247;
  --c-accent-dim:       49 130 206;
  --c-accent-contrast:  26  32  44;

  /* semantic */
  --c-danger:          229  62  62;
  --c-danger-text:     252 129 129;
  --c-warn:            221 107  32;
  --c-warn-text:       246 173  85;
  --c-good:             56 161 105;
  --c-good-text:       104 211 145;
  --c-info:             49 130 206;
  --c-info-text:        99 179 237;

  /* utility */
  --c-shadow:            0   0   0;
  --c-scrim:           129 139 149;
}

/* MIGRATION AUDIT: uncomment to turn every remaining legacy palette class magenta. */
/* :root { --c-legacy-debug: 255 0 255; } */

.table-stripped tbody tr:nth-child(odd) {
  background: rgb(var(--c-surface-raised));
}

#app {
  height: 100vh;
  display: flex;
  flex-direction: column;
  /* align-items: center; */
  overflow: hidden;
  justify-content: space-between;

  :focus {
    outline: 0;
  }
}

.layout-column {
  display: flex;
  flex-direction: column;
  height: 100%;
}

::-webkit-scrollbar {
  width: 0.875rem;
}

::-webkit-scrollbar-track {
  -webkit-box-shadow: inset 0 0 0.375rem rgb(var(--c-shadow) / 0.3);
}

::-webkit-scrollbar-thumb {
  -webkit-box-shadow: inset 0 0 0.375rem rgb(var(--c-shadow) / 0.5);
}

input[type=number]::-webkit-inner-spin-button,
input[type=number]::-webkit-outer-spin-button {
  -webkit-appearance: none;
}

.btn {
  @apply bg-surface-hover;
  @apply px-2 py-1;
  @apply text-content-muted;
  @apply leading-none;
  @apply rounded;
}

.btn-icon {
  @apply text-xs text-content-muted;
}

@keyframes ring {
  0% {
    -webkit-transform: rotate(-15deg);
    -ms-transform: rotate(-15deg);
    transform: rotate(-15deg);
  }

  2% {
    -webkit-transform: rotate(15deg);
    -ms-transform: rotate(15deg);
    transform: rotate(15deg);
  }

  4% {
    -webkit-transform: rotate(-18deg);
    -ms-transform: rotate(-18deg);
    transform: rotate(-18deg);
  }

  6% {
    -webkit-transform: rotate(18deg);
    -ms-transform: rotate(18deg);
    transform: rotate(18deg);
  }

  8% {
    -webkit-transform: rotate(-22deg);
    -ms-transform: rotate(-22deg);
    transform: rotate(-22deg);
  }

  10% {
    -webkit-transform: rotate(22deg);
    -ms-transform: rotate(22deg);
    transform: rotate(22deg);
  }

  12% {
    -webkit-transform: rotate(-18deg);
    -ms-transform: rotate(-18deg);
    transform: rotate(-18deg);
  }

  14% {
    -webkit-transform: rotate(18deg);
    -ms-transform: rotate(18deg);
    transform: rotate(18deg);
  }

  16% {
    -webkit-transform: rotate(-12deg);
    -ms-transform: rotate(-12deg);
    transform: rotate(-12deg);
  }

  18% {
    -webkit-transform: rotate(12deg);
    -ms-transform: rotate(12deg);
    transform: rotate(12deg);
  }

  20% {
    -webkit-transform: rotate(0deg);
    -ms-transform: rotate(0deg);
    transform: rotate(0deg);
  }
}

.faa-ring {
  animation: ring 2s ease;
  transform-origin-x: 50%;
  transform-origin-y: 0px;
  transform-origin-z: initial;
}
</style>
