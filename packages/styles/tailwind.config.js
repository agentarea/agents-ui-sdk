/** @type {import('tailwindcss').Config} */
export default {
  content: [
    '../react/src/**/*.{js,ts,jsx,tsx}',
    '../react/dist/**/*.{js,ts,jsx,tsx}',
    '../core/src/**/*.{js,ts,jsx,tsx}',
    '../core/dist/**/*.{js,ts,jsx,tsx}',
    '../../apps/*/src/**/*.{js,ts,jsx,tsx}'
  ],
  theme: {
    extend: {
      colors: {
        border: 'hsl(var(--agentarea-border))',
        input: 'hsl(var(--agentarea-input))',
        ring: 'hsl(var(--agentarea-ring))',
        background: 'hsl(var(--agentarea-background))',
        foreground: 'hsl(var(--agentarea-foreground))',
        primary: {
          DEFAULT: 'hsl(var(--agentarea-primary))',
          foreground: 'hsl(var(--agentarea-primary-foreground))'
        },
        secondary: {
          DEFAULT: 'hsl(var(--agentarea-secondary))',
          foreground: 'hsl(var(--agentarea-secondary-foreground))'
        },
        destructive: {
          DEFAULT: 'hsl(var(--agentarea-destructive))',
          foreground: 'hsl(var(--agentarea-destructive-foreground))'
        },
        muted: {
          DEFAULT: 'hsl(var(--agentarea-muted))',
          foreground: 'hsl(var(--agentarea-muted-foreground))'
        },
        accent: {
          DEFAULT: 'hsl(var(--agentarea-accent))',
          foreground: 'hsl(var(--agentarea-accent-foreground))'
        }
      },
      borderRadius: {
        lg: 'var(--agentarea-radius)',
        md: 'calc(var(--agentarea-radius) - 2px)',
        sm: 'calc(var(--agentarea-radius) - 4px)'
      },
      keyframes: {
        'accordion-down': {
          from: { height: '0' },
          to: { height: 'var(--radix-accordion-content-height)' }
        },
        'accordion-up': {
          from: { height: 'var(--radix-accordion-content-height)' },
          to: { height: '0' }
        }
      },
      animation: {
        'accordion-down': 'accordion-down 0.2s ease-out',
        'accordion-up': 'accordion-up 0.2s ease-out'
      }
    }
  },
  plugins: []
};