/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        bg: 'rgb(var(--sf-bg) / <alpha-value>)',
        surface: 'rgb(var(--sf-surface) / <alpha-value>)',
        'surface-2': 'rgb(var(--sf-surface-2) / <alpha-value>)',
        border: 'rgb(var(--sf-border) / <alpha-value>)',
        text: 'rgb(var(--sf-text) / <alpha-value>)',
        muted: 'rgb(var(--sf-muted) / <alpha-value>)',
        primary: {
          DEFAULT: 'rgb(var(--sf-primary) / <alpha-value>)',
          fg: 'rgb(var(--sf-primary-fg) / <alpha-value>)',
          soft: 'rgb(var(--sf-primary-soft) / <alpha-value>)',
        },
        accent: 'rgb(var(--sf-accent) / <alpha-value>)',
        success: 'rgb(var(--sf-success) / <alpha-value>)',
        warning: 'rgb(var(--sf-warning) / <alpha-value>)',
        danger: 'rgb(var(--sf-danger) / <alpha-value>)',
        info: 'rgb(var(--sf-info) / <alpha-value>)',
        sidebar: 'rgb(var(--sf-sidebar) / <alpha-value>)',
        'sidebar-fg': 'rgb(var(--sf-sidebar-fg) / <alpha-value>)',
      },
      fontFamily: {
        sans: ['Manrope', 'system-ui', 'sans-serif'],
        display: ['Plus Jakarta Sans', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        xl: '0.875rem',
        '2xl': '1.25rem',
      },
      boxShadow: {
        soft: '0 1px 2px rgb(0 0 0 / 0.04), 0 1px 3px rgb(0 0 0 / 0.06)',
        card: '0 2px 8px rgb(0 0 0 / 0.06), 0 1px 2px rgb(0 0 0 / 0.04)',
        float: '0 12px 32px rgb(0 0 0 / 0.12), 0 4px 8px rgb(0 0 0 / 0.06)',
      },
      keyframes: {
        'fade-in': {
          from: { opacity: '0' },
          to: { opacity: '1' },
        },
        'scale-in': {
          from: { opacity: '0', transform: 'scale(0.96)' },
          to: { opacity: '1', transform: 'scale(1)' },
        },
      },
      animation: {
        'fade-in': 'fade-in 0.3s ease both',
        'scale-in': 'scale-in 0.2s cubic-bezier(0.16, 1, 0.3, 1) both',
      },
    },
  },
  plugins: [],
};
