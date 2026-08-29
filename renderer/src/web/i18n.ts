import { createI18n, Composer as I18n, useI18n } from 'vue-i18n'
import { nextTick } from 'vue'

let _global: I18n

export async function init (lang: string) {
  const plugin = createI18n<false>({
    legacy: false,
    locale: 'en',
    fallbackLocale: 'en',
    fallbackFormat: true,
    fallbackWarn: false,
    missingWarn: false,
    messages: {
      // eslint-disable-next-line @stylistic/quote-props
      'en': await (await fetch(`${import.meta.env.BASE_URL}data/en/app_i18n.json`)).json()
    }
  })
  _global = plugin.global
  await loadLang(lang)
  return plugin
}

export async function loadLang (lang: string): Promise<void> {
  if (lang !== 'en') {
    const messages = await (await fetch(`${import.meta.env.BASE_URL}data/${lang}/app_i18n.json`)).json()
    _global.setLocaleMessage(lang, messages)
  }
  const prevLang = _global.locale.value
  _global.locale.value = lang
  if (prevLang !== 'en') {
    _global.setLocaleMessage(prevLang, {})
  }

  document.documentElement.lang = lang

  await nextTick()
}

export function useI18nNs (name: string) {
  const { t } = useI18n()
  // eslint-disable-next-line @typescript-eslint/no-unsafe-function-type
  const _t = t as Function
  return {
    t: ((path, ...args) => {
      if (typeof path === 'string' && path.startsWith(':')) {
        return _t(path.replace(':', `${name}.`), ...args)
      } else {
        return _t(path, ...args)
      }
    }) as typeof t
  }
}
