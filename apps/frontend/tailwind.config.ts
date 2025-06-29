import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    '../../packages/ui/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#4338CA',
          foreground: '#FFFFFF',
        },
        emotion: {
          low: '#DC2626',
          mid: '#F59E0B',
          high: '#059669',
        },
        success: '#059669',
        warning: '#DC6803',
        error: '#DC2626',
        muted: {
          DEFAULT: '#64748B',
          foreground: '#475569',
        },
        background: '#F8FAFC',
        card: '#FFFFFF',
        border: '#E2E8F0',
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      },
      spacing: {
        'safe-bottom': 'env(safe-area-inset-bottom)',
      },
    },
  },
  plugins: [],
};

export default config;
