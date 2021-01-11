import { createI18n, VueI18nOptions } from 'vue-i18n'
import { Config } from './Config'

export default createI18n<VueI18nOptions>({
  locale: Config.store.language,
  fallbackLocale: 'en',
  formatFallbackMessages: true,
  silentFallbackWarn: true,
  silentTranslationWarn: true,
  messages: {
    en: require('./locales/en.json'),
    ru: require('./locales/ru.json')
  }
})
