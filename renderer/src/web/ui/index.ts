import { App } from 'vue'
import UiRadio from './UiRadio.vue'
import UiCheckbox from './UiCheckbox.vue'
import UiToggle from './UiToggle.vue'
import UiErrorBox from './UiErrorBox.vue'
import UiTimeout from './UiTimeout.vue'
import FullscreenImage from './FullscreenImage.vue'
import Popover from './Popover.vue'

export default function (app: App) {
  app.component(UiRadio.name, UiRadio)
  app.component(UiCheckbox.name, UiCheckbox)
  app.component(UiToggle.name, UiToggle)
  app.component(UiErrorBox.name, UiErrorBox)
  app.component(UiTimeout.name, UiTimeout)
  app.component(FullscreenImage.name, FullscreenImage)
  app.component(Popover.name, Popover)
}
