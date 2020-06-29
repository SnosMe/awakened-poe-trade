declare module 'vue-trend-chart' {
  export default function install(): void
}

declare module 'vue-virtual-scroller' {
  export default function install(): void
}

declare module 'vue-popperjs' {
  import Vue from 'vue'
  export default Vue
}

declare module '*.json' {
  const value: any
  export default value
}

declare const __static: string
