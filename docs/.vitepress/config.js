import { defineConfig } from 'vitepress'

const BASE = '/awakened-poe2-trade2/'

export default defineConfig({
  title: 'Awakened PoE2 Trade2',
  description: 'App for price-checking items in Path of Exile 2',
  base: BASE,
  mpa: true,
  head: [
    ['link', { rel: 'shortcut icon', type: 'image/png', href: `${BASE}favicon.png` }],
    ['meta', { name: 'google-site-verification', content: 'R0xdvBEYFTxfn0RxHhquiA6tBgvshYv3ODk-oNSuq4g' }]
  ],
  markdown: {
    theme: 'light-plus',
    attrs: {
      leftDelimiter: '{:',
      rightDelimiter: '}'
    }
  },
  themeConfig: {
    // logo: 'TODO', https://github.com/vuejs/vitepress/issues/1401
    appVersion: '3.25.101',
    github: {
      releasesUrl: 'https://github.com/Kvan7/awakened-poe2-trade2/releases'
    },
    socialLinks: [
      {
        text: 'Patreon',
        color: '#FF424D',
        link: 'https://patreon.com/awakened_poe_trade'
      },
      {
        text: 'GitHub',
        color: '#181717',
        link: 'https://github.com/Kvan7/awakened-poe2-trade2'
      }
    ],
    sidebar: [
      {
        items: [{
          text: 'Download',
          link: '/download'
        }, {
          text: 'Quick Start',
          link: '/quick-start'
        }]
      },
      {
        items: [{
          text: 'Chat commands',
          link: '/chat-commands'
        }, {
          text: 'OCR Guide',
          link: '/ocr-guide'
        }]
      },
      {
        items: [{
          text: 'Common issues',
          link: '/issues'
        }, {
          text: 'FAQ',
          link: '/faq'
        }]
      }
    ]
  }
})
