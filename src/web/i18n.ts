import { createI18n, I18nAdditionalOptions, ComposerOptions } from 'vue-i18n'
import { Config } from './Config'

export default createI18n<I18nAdditionalOptions & ComposerOptions>({
  legacy: false,
  locale: Config.store.language,
  fallbackLocale: 'en',
  fallbackFormat: true,
  fallbackWarn: false,
  missingWarn: false,
  messages: {
    en: require('../assets/locales/en.json'),
    ru: require('../assets/locales/ru.json')
  }
})
