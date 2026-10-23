// Colors come from CSS variables in src/index.css, so one class name (e.g. `bg-surface`)
// works in both themes. The `dark` class on <html> swaps the variable values.
const token = (name) => `rgb(var(--${name}) / <alpha-value>)`;

/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        bg: token('bg'),
        surface: {
          DEFAULT: token('surface'),
          2: token('surface-2'),
        },
        border: {
          DEFAULT: token('border'),
          strong: token('border-strong'),
        },
        fg: token('fg'),
        muted: token('muted'),
        subtle: token('subtle'),
        accent: {
          DEFAULT: token('accent'),
          hover: token('accent-hover'),
          soft: token('accent-soft'),
          fg: token('accent-fg'),
        },
        'on-accent': token('on-accent'),
        debit: {
          DEFAULT: token('debit'),
          soft: token('debit-soft'),
        },
        warn: {
          DEFAULT: token('warn'),
          soft: token('warn-soft'),
        },
        info: {
          DEFAULT: token('info'),
          soft: token('info-soft'),
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'ui-monospace', 'monospace'],
      },
      borderRadius: {
        control: '10px',
        card: '14px',
      },
      boxShadow: {
        card: '0 1px 2px rgb(16 24 40 / 0.06)',
      },
    },
  },
  plugins: [],
}
