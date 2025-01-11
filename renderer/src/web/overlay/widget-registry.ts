import type { Component } from 'vue'
import type { WidgetSpec } from './interfaces'
import WidgetTimer from '../stopwatch/WidgetTimer.vue'
import WidgetStashSearch from '../stash-search/WidgetStashSearch.vue'
import WidgetMenu from './WidgetMenu.vue'
import PriceCheckWindow from '@/web/price-check/PriceCheckWindow.vue'
import WidgetItemCheck from '@/web/item-check/WidgetItemCheck.vue'
import WidgetImageStrip from './WidgetImageStrip.vue'
import WidgetDelveGrid from './WidgetDelveGrid.vue'
import WidgetItemSearch from '../item-search/WidgetItemSearch.vue'
import WidgetSettings from '../settings/SettingsWindow.vue'

type WidgetComponent = Component & { widget: WidgetSpec }

export const registry = {
  widgets: [] as WidgetComponent[],

  getWidgetComponent (wmType: string) {
    return this.widgets.find(component => component.widget.type === wmType)
  }
}

// Core
registry.widgets.push(WidgetMenu as unknown as WidgetComponent)
registry.widgets.push(WidgetSettings as unknown as WidgetComponent)
// Extra
registry.widgets.push(WidgetItemSearch as unknown as WidgetComponent)
registry.widgets.push(WidgetTimer as unknown as WidgetComponent)
registry.widgets.push(WidgetStashSearch as unknown as WidgetComponent)
registry.widgets.push(PriceCheckWindow as unknown as WidgetComponent)
registry.widgets.push(WidgetItemCheck as unknown as WidgetComponent)
registry.widgets.push(WidgetImageStrip as unknown as WidgetComponent)
registry.widgets.push(WidgetDelveGrid as unknown as WidgetComponent)
