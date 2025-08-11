import type { Config } from "tailwindcss";

export default {
  darkMode: ["class"],
  content: ["./client/index.html", "./client/src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        card: {
          DEFAULT: "var(--card)",
          foreground: "var(--card-foreground)",
        },
        popover: {
          DEFAULT: "var(--popover)",
          foreground: "var(--popover-foreground)",
        },
        primary: {
          DEFAULT: "var(--primary)",
          foreground: "var(--primary-foreground)",
        },
        secondary: {
          DEFAULT: "var(--secondary)",
          foreground: "var(--secondary-foreground)",
        },
        muted: {
          DEFAULT: "var(--muted)",
          foreground: "var(--muted-foreground)",
        },
        accent: {
          DEFAULT: "var(--accent)",
          foreground: "var(--accent-foreground)",
        },
        destructive: {
          DEFAULT: "var(--destructive)",
          foreground: "var(--destructive-foreground)",
        },
        border: "var(--border)",
        input: "var(--input)",
        ring: "var(--ring)",
        chart: {
          "1": "var(--chart-1)",
          "2": "var(--chart-2)",
          "3": "var(--chart-3)",
          "4": "var(--chart-4)",
          "5": "var(--chart-5)",
        },
        sidebar: {
          DEFAULT: "var(--sidebar)",
          foreground: "var(--sidebar-foreground)",
          primary: "var(--sidebar-primary)",
          "primary-foreground": "var(--sidebar-primary-foreground)",
          accent: "var(--sidebar-accent)",
          "accent-foreground": "var(--sidebar-accent-foreground)",
          border: "var(--sidebar-border)",
          ring: "var(--sidebar-ring)",
        },
        // MyKliq custom colors
        'mykliq-pink': 'var(--mykliq-pink)',
        'mykliq-blue': 'var(--mykliq-blue)',
        'mykliq-green': 'var(--mykliq-green)',
        'mykliq-orange': 'var(--mykliq-orange)',
        'mykliq-purple': 'var(--mykliq-purple)',
        'retro-yellow': 'var(--retro-yellow)',
        'neon-cyan': 'var(--neon-cyan)',
      },
      fontFamily: {
        sans: ["var(--font-sans)"],
        serif: ["var(--font-serif)"],
        mono: ["var(--font-mono)"],
        comic: ['Comic Neue', 'Comic Sans MS', 'cursive'],
        retro: ['Courier Prime', 'Courier New', 'monospace'],
      },
      keyframes: {
        "accordion-down": {
          from: {
            height: "0",
          },
          to: {
            height: "var(--radix-accordion-content-height)",
          },
        },
        "accordion-up": {
          from: {
            height: "var(--radix-accordion-content-height)",
          },
          to: {
            height: "0",
          },
        },
        gradientShift: {
          '0%': { backgroundPosition: '0% 50%' },
          '50%': { backgroundPosition: '100% 50%' },
          '100%': { backgroundPosition: '0% 50%' },
        },
        sparkle: {
          '0%, 100%': { opacity: '0', transform: 'scale(0.8)' },
          '50%': { opacity: '1', transform: 'scale(1.2)' },
        },
        'pulse-slow': {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.6' },
        },
        'bounce-gentle': {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-10px)' },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        'gradient-shift': 'gradientShift 4s ease infinite',
        'sparkle': 'sparkle 2s ease-in-out infinite',
        'pulse-slow': 'pulse-slow 3s ease-in-out infinite',
        'bounce-gentle': 'bounce-gentle 2s ease-in-out infinite',
      },
      backgroundImage: {
        'gradient-mykliq': 'linear-gradient(45deg, var(--mykliq-pink), var(--mykliq-blue), var(--mykliq-green))',
        'gradient-rainbow': 'linear-gradient(45deg, var(--mykliq-pink), var(--mykliq-blue), var(--mykliq-green), var(--mykliq-orange), var(--mykliq-purple))',
        'gradient-retro': 'linear-gradient(45deg, var(--mykliq-pink), var(--mykliq-purple))',
        'gradient-neon': 'linear-gradient(45deg, var(--neon-cyan), var(--mykliq-blue))',
      },
      boxShadow: {
        'retro': 'var(--shadow-retro)',
        'neon': 'var(--shadow-neon)',
        'mykliq-pink': '0 0 20px rgba(255, 20, 147, 0.5)',
        'mykliq-blue': '0 0 20px rgba(0, 191, 255, 0.5)',
        'mykliq-green': '0 0 20px rgba(50, 205, 50, 0.5)',
      },
      backdropBlur: {
        'retro': '8px',
      },
      spacing: {
        '18': '4.5rem',
        '88': '22rem',
      },
    },
  },
  plugins: [
    require("tailwindcss-animate"), 
    require("@tailwindcss/typography"),
    // Custom plugin for MyKliq utilities
    function({ addUtilities }: any) {
      const newUtilities = {
        '.retro-shadow': {
          'box-shadow': 'var(--shadow-retro)',
        },
        '.neon-glow': {
          'box-shadow': 'var(--shadow-neon)',
        },
        '.gradient-banner': {
          'background': 'linear-gradient(45deg, var(--mykliq-pink), var(--mykliq-blue), var(--mykliq-green))',
          'background-size': '400% 400%',
          'animation': 'gradientShift 4s ease infinite',
        },
        '.sparkle-effect': {
          'position': 'relative',
          '&::before': {
            'content': '"✨"',
            'position': 'absolute',
            'top': '-5px',
            'right': '-5px',
            'font-size': '12px',
            'animation': 'sparkle 2s ease-in-out infinite',
          },
        },
      }
      addUtilities(newUtilities);
    }
  ],
} satisfies Config;
