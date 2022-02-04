import { createI18n, I18nAdditionalOptions, ComposerOptions } from 'vue-i18n'
import { AppConfig } from './Config'

export default async () => createI18n<I18nAdditionalOptions & ComposerOptions>({
  legacy: false,
  locale: AppConfig().language,
  fallbackLocale: 'en',
  fallbackFormat: true,
  fallbackWarn: false,
  missingWarn: false,
  messages: {
    [AppConfig().language]: await (await fetch(`${process.env.BASE_URL}data/${AppConfig().language}/app_i18n.json`)).json()
  }
})
