import type { ComputedRef, Ref } from 'vue'
import type { Widget } from '@/web/overlay/widgets'
export * from '@/web/overlay/widgets'

export interface WidgetManager {
  poePanelWidth: ComputedRef<number>
  size: Ref<{ width: number, height: number }>
  active: Ref<boolean>
  widgets: ComputedRef<Widget[]>
  show: (wmId: number) => void
  hide: (wmId: number) => void
  remove: (wmId: number) => void
  bringToTop: (wmId: number) => void
  create: (wmType: string) => void
  setFlag: (wmId: number, flag: string, state: boolean) => void
}
