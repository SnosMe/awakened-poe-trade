import { defineConfig } from 'astro/config';
import { unified } from '@astrojs/markdown-remark';
import { rehypeRemoveAttrs, rehypeBase } from './src/plugins/rehype.js';

const BASE = '/awakened-poe-trade';

export default defineConfig({
  site: 'https://snosme.github.io',
  base: BASE,
  build: {
    format: 'file'
  },
  trailingSlash: 'never',
  scopedStyleStrategy: 'class',
  markdown: {
    shikiConfig: {
      theme: 'light-plus',
      wrap: true
    },
    processor: unified({
      rehypePlugins: [
        [rehypeBase, { base: BASE }],
        rehypeRemoveAttrs
      ]
    })
  }
});
