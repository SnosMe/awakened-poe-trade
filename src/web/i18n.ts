import Vue from 'vue'
import VueI18n, { LocaleMessages } from 'vue-i18n'
import { Config } from './Config'

Vue.use(VueI18n)

function loadLocaleMessages (): LocaleMessages {
  const locales = require.context('./locales', true, /[A-Za-z0-9-_,\s]+\.json$/i)
  const messages: LocaleMessages = {}
  locales.keys().forEach(key => {
    const matched = key.match(/([A-Za-z0-9-_]+)\./i)
    if (matched && matched.length > 1) {
      const locale = matched[1]
      messages[locale] = locales(key)
    }
  })
  return messages
}

export default new VueI18n({
  locale: Config.store.language,
  fallbackLocale: 'en',
  formatFallbackMessages: true,
  silentFallbackWarn: true,
  silentTranslationWarn: true,
  messages: loadLocaleMessages()
})
