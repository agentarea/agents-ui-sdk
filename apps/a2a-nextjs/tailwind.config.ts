import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './src/app/**/*.{ts,tsx,mdx}',
    '../../packages/react/src/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        border: "hsl(var(--agentarea-border))",
        input: "hsl(var(--agentarea-input))",
        ring: "hsl(var(--agentarea-ring))",
        background: "hsl(var(--agentarea-background))",
        foreground: "hsl(var(--agentarea-foreground))",
        primary: {
          DEFAULT: "hsl(var(--agentarea-primary))",
          foreground: "hsl(var(--agentarea-primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--agentarea-secondary))",
          foreground: "hsl(var(--agentarea-secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--agentarea-destructive))",
          foreground: "hsl(var(--agentarea-destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--agentarea-muted))",
          foreground: "hsl(var(--agentarea-muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--agentarea-accent))",
          foreground: "hsl(var(--agentarea-accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--agentarea-popover))",
          foreground: "hsl(var(--agentarea-popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--agentarea-card))",
          foreground: "hsl(var(--agentarea-card-foreground))",
        },
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
      },
    },
  },
  plugins: [],
}

export default config;