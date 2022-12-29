import { createI18n } from 'vue-i18n'
import { AppConfig } from './Config'

export default async () => createI18n<false>({
  legacy: false,
  locale: AppConfig().language,
  fallbackLocale: 'en',
  fallbackFormat: true,
  fallbackWarn: false,
  missingWarn: false,
  messages: {
    [AppConfig().language]: await (await fetch(`${import.meta.env.BASE_URL}data/${AppConfig().language}/app_i18n.json`)).json()
  }
})
