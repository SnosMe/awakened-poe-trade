export const siteConfig = {
  title: 'Awakened PoE Trade',
  description: 'App for price-checking items in Path of Exile',
  appVersion: '3.30.102',
  github: {
    releasesUrl: 'https://github.com/SnosMe/awakened-poe-trade/releases'
  },
  socialLinks: [
    { text: 'Discord', color: '#7289DA', link: 'https://github.com/SnosMe/awakened-poe-trade/issues/22' },
    { text: 'Donate', color: '#F96854', link: '/donate' },
    { text: 'GitHub', color: '#181717', link: 'https://github.com/SnosMe/awakened-poe-trade' }
  ],
  sidebar: [
    {
      items: [
        { text: 'Download', link: '/download' },
        { text: 'Quick Start', link: '/quick-start' }
      ]
    },
    {
      items: [
        { text: 'Chat commands', link: '/chat-commands' },
        { text: 'OCR Guide', link: '/ocr-guide' }
      ]
    },
    {
      items: [
        { text: 'Common issues', link: '/issues' },
        { text: 'FAQ', link: '/faq' }
      ]
    }
  ]
};
