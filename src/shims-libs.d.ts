
declare module 'vue3-apexcharts' {
  import type { DefineComponent } from 'vue'
  const component: DefineComponent<{}, {}, any>
  export default component
}

declare module '*.json' {
  const value: any
  export default value
}

// eslint-disable-next-line @typescript-eslint/naming-convention
declare const __static: string
