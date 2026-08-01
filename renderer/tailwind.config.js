// Colors are driven by CSS custom properties declared in `src/web/App.vue`
// (`:root` and `:root[data-theme="..."]`). Values are stored as space-separated
// sRGB channel triplets so that Tailwind's `<alpha-value>` placeholder works and
// opacity modifiers such as `bg-surface-hover/30` keep functioning.
//
// In hand-written CSS always write `rgb(var(--c-foo))`, never a bare `var(--c-foo)`.
const token = (name) => `rgb(var(--c-${name}) / <alpha-value>)`

// The pre-refactor palette (`gray-700`, `red-600`, ...) is kept permanently as a set
// of deprecated aliases so that any usage missed by the migration still renders a
// sensible color instead of emitting no CSS at all. `--c-legacy-debug` is never
// defined in normal operation, so each alias resolves through the fallback.
//
// MIGRATION AUDIT: uncomment the `--c-legacy-debug` line in App.vue to turn every
// remaining legacy class magenta.
const legacy = (name) => `rgb(var(--c-legacy-debug, var(--c-${name})) / <alpha-value>)`

module.exports = {
  content: ['./src/**/*.{ts,vue}'],
  theme: {
    extend: {
      fontFamily: {
      }
    },
    colors: {
      transparent: 'transparent',
      current: 'currentColor',

      black: '#000',
      white: '#fff',

      // --- semantic tokens -------------------------------------------------
      surface: {
        deep: token('surface-deep'),
        base: token('surface-base'),
        raised: token('surface-raised'),
        hover: token('surface-hover'),
        overlay: token('surface-overlay'),
      },
      line: {
        DEFAULT: token('border'),
        strong: token('border-strong'),
      },
      content: {
        primary: token('text-primary'),
        body: token('text-body'),
        muted: token('text-muted'),
        faint: token('text-faint'),
        inverse: token('text-inverse'),
      },
      accent: {
        DEFAULT: token('accent'),
        strong: token('accent-strong'),
        dim: token('accent-dim'),
        contrast: token('accent-contrast'),
      },
      danger: {
        DEFAULT: token('danger'),
        text: token('danger-text'),
      },
      warn: {
        DEFAULT: token('warn'),
        text: token('warn-text'),
      },
      good: {
        DEFAULT: token('good'),
        text: token('good-text'),
      },
      info: {
        DEFAULT: token('info'),
        text: token('info-text'),
      },
      shadow: token('shadow'),
      scrim: token('scrim'),

      // --- deprecated aliases (do not use in new code) ----------------------
      gray: {
        100: legacy('text-primary'),
        200: legacy('text-body'),
        300: legacy('text-body'),
        400: legacy('text-muted'),
        500: legacy('text-muted'),
        600: legacy('text-muted'),
        700: legacy('surface-hover'),
        800: legacy('surface-raised'),
        900: legacy('surface-base'),
      },
      red: {
        100: legacy('text-primary'),
        200: legacy('text-primary'),
        300: legacy('danger-text'),
        400: legacy('danger-text'),
        500: legacy('danger'),
        600: legacy('danger'),
        700: legacy('danger'),
        800: legacy('danger'),
        900: legacy('danger'),
      },
      orange: {
        100: legacy('text-primary'),
        200: legacy('text-primary'),
        300: legacy('warn-text'),
        400: legacy('warn-text'),
        500: legacy('warn-text'),
        600: legacy('warn'),
        700: legacy('warn'),
        800: legacy('warn'),
        900: legacy('warn'),
      },
      yellow: {
        100: legacy('text-primary'),
        200: legacy('text-primary'),
        300: legacy('warn-text'),
        400: legacy('warn-text'),
        500: legacy('warn-text'),
        600: legacy('warn'),
        700: legacy('warn'),
        800: legacy('warn'),
        900: legacy('warn'),
      },
      green: {
        100: legacy('text-primary'),
        200: legacy('text-primary'),
        300: legacy('good-text'),
        400: legacy('good-text'),
        500: legacy('good-text'),
        600: legacy('good'),
        700: legacy('good'),
        800: legacy('good'),
        900: legacy('good'),
      },
      teal: {
        100: legacy('text-primary'),
        200: legacy('text-primary'),
        300: legacy('info-text'),
        400: legacy('info-text'),
        500: legacy('info-text'),
        600: legacy('info'),
        700: legacy('info'),
        800: legacy('info'),
        900: legacy('info'),
      },
      blue: {
        100: legacy('text-primary'),
        200: legacy('text-primary'),
        300: legacy('info-text'),
        400: legacy('info-text'),
        500: legacy('info-text'),
        600: legacy('info'),
        700: legacy('info'),
        800: legacy('info'),
        900: legacy('info'),
      },
      indigo: {
        100: legacy('text-primary'),
        200: legacy('text-primary'),
        300: legacy('info-text'),
        400: legacy('info-text'),
        500: legacy('info-text'),
        600: legacy('info'),
        700: legacy('info'),
        800: legacy('info'),
        900: legacy('info'),
      },
      purple: {
        100: legacy('text-primary'),
        200: legacy('text-primary'),
        300: legacy('accent-strong'),
        400: legacy('accent-strong'),
        500: legacy('accent'),
        600: legacy('accent-dim'),
        700: legacy('accent-dim'),
        800: legacy('accent-dim'),
        900: legacy('accent-dim'),
      },
      pink: {
        100: legacy('text-primary'),
        200: legacy('text-primary'),
        300: legacy('accent-strong'),
        400: legacy('accent-strong'),
        500: legacy('accent'),
        600: legacy('accent-dim'),
        700: legacy('accent-dim'),
        800: legacy('accent-dim'),
        900: legacy('accent-dim'),
      },
    }
  },
  variants: {},
  plugins: []
}
