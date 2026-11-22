import { visit } from 'unist-util-visit';
import type * as hast from 'hast';
import type { Plugin } from 'unified';

interface RehypeBaseOptions {
  base?: string;
}

export const rehypeBase: Plugin<[RehypeBaseOptions?], hast.Root> = (options = {}) => {
  const base = options.base ? options.base.replace(/\/$/, '') : '';

  return (tree) => {
    if (!base) return;
    visit(tree, 'element', (node) => {
      if (node.tagName === 'a' && node.properties.href?.startsWith('/')) {
        node.properties.href = `${base}${node.properties.href}`;
      }
    });
  };
};

export const rehypeRemoveAttrs: Plugin<[], hast.Root> = () => {
  return (tree) => {
    visit(tree, 'text', (node) => {
      node.value = node.value.replace(/\{:[^\}]+\}/g, '');
    });
  };
};
