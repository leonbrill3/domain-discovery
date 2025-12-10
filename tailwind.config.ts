import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // DomainSeek LIGHT theme (provemewrong style, light mode)
        'brand-light': '#FFFFFF',       // Primary background
        'brand-dark': '#FFFFFF',        // Legacy (mapped to white for light theme)
        'brand-card': '#F9FAFB',        // Card backgrounds
        'brand-border': '#E5E7EB',      // Subtle borders
        'brand-blue': '#3B82F6',        // Primary brand color (SAME)
        'brand-violet': '#8B5CF6',      // Accent color (SAME)
        'brand-green': '#10B981',       // Success/available (SAME)
        'brand-red': '#EF4444',         // Error/taken (SAME)
        'brand-amber': '#F59E0B',       // Warning/premium (SAME)

        // Theme-specific colors (SAME)
        'theme-greek': '#3B82F6',       // Ancient Greek - Blue
        'theme-solar': '#F59E0B',       // Solar System - Amber
        'theme-genz': '#EC4899',        // Gen Z - Pink

        // Semantic colors (SAME)
        'success': '#10B981',
        'error': '#EF4444',
        'warning': '#F59E0B',
        'info': '#3B82F6',

        // Text colors (INVERTED for light theme)
        'text-primary': '#1F2937',      // Almost black
        'text-secondary': '#6B7280',    // Medium gray
        'text-tertiary': '#9CA3AF',     // Light gray

        // Background gradients (LIGHT)
        'bg-start': '#FFFFFF',
        'bg-end': '#F9FAFB',
      },

      fontFamily: {
        sans: [
          'Inter',
          'system-ui',
          '-apple-system',
          'BlinkMacSystemFont',
          'Segoe UI',
          'Roboto',
          'sans-serif',
        ],
        display: [
          'Open Sauce One',
          'Inter',
          'sans-serif',
        ],
        mono: [
          'JetBrains Mono',
          'Monaco',
          'Consolas',
          'Courier New',
          'monospace',
        ],
      },

      fontSize: {
        'hero': '4rem',
        'hero-mobile': '2.5rem',
        'section-title': '2.5rem',
        'card-title': '1.1rem',
        'card-body': '0.95rem',
        'card-meta': '0.75rem',
      },

      container: {
        center: true,
        padding: '1.5rem',
        screens: {
          sm: '640px',
          md: '768px',
          lg: '1024px',
          xl: '1280px',
          '2xl': '1400px',
        },
      },

      borderRadius: {
        '2xl': '1rem',
        'card': '0.75rem',
        'button': '0.5rem',
      },

      backdropBlur: {
        'glass': '12px',
        'heavy': '24px',
      },

      boxShadow: {
        'glass': '0 8px 32px 0 rgba(31, 38, 135, 0.37)',
        'card': '0 4px 16px rgba(0, 0, 0, 0.2)',
        'card-hover': '0 12px 40px rgba(0, 0, 0, 0.4)',
        'glow-blue': '0 0 20px rgba(59, 130, 246, 0.4)',
        'glow-violet': '0 0 20px rgba(139, 92, 246, 0.4)',
        'glow-green': '0 0 20px rgba(16, 185, 129, 0.4)',
      },

      transitionTimingFunction: {
        'soft': 'cubic-bezier(0.4, 0, 0.2, 1)',
        'smooth': 'cubic-bezier(0.25, 0.1, 0.25, 1)',
        'bounce-soft': 'cubic-bezier(0.34, 1.56, 0.64, 1)',
      },

      transitionDuration: {
        'fast': '150ms',
        'normal': '250ms',
        'slow': '400ms',
      },

      keyframes: {
        // Shimmer effect for loading states
        shimmer: {
          '0%': { transform: 'translateX(-100%)' },
          '100%': { transform: 'translateX(100%)' },
        },

        // Pulse glow for emphasis
        'pulse-glow': {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.6' },
        },

        // Fade in from bottom
        'fadeIn': {
          from: { opacity: '0', transform: 'translateY(8px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },

        // Fade in from top
        'fadeInDown': {
          from: { opacity: '0', transform: 'translateY(-8px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },

        // Scale and fade in
        'scaleIn': {
          from: { opacity: '0', transform: 'scale(0.95)' },
          to: { opacity: '1', transform: 'scale(1)' },
        },

        // Slide in from left
        'slideInLeft': {
          from: { transform: 'translateX(-100%)', opacity: '0' },
          to: { transform: 'translateX(0)', opacity: '1' },
        },

        // Slide in from right
        'slideInRight': {
          from: { transform: 'translateX(100%)', opacity: '0' },
          to: { transform: 'translateX(0)', opacity: '1' },
        },

        // Slide up
        'slideUp': {
          from: { transform: 'translateY(100%)', opacity: '0' },
          to: { transform: 'translateY(0)', opacity: '1' },
        },

        // Bar grow animation
        'barGrow': {
          '0%': { transform: 'scaleX(0)', transformOrigin: 'left' },
          '100%': { transform: 'scaleX(1)', transformOrigin: 'left' },
        },

        // Pulse dot
        'pulseDot': {
          '0%, 100%': { opacity: '1', transform: 'scale(1)' },
          '50%': { opacity: '0.5', transform: 'scale(0.95)' },
        },

        // Soft glow
        'glowSoft': {
          '0%, 100%': { boxShadow: '0 0 8px rgba(59, 130, 246, 0.3)' },
          '50%': { boxShadow: '0 0 16px rgba(59, 130, 246, 0.5)' },
        },

        // Float up and fade (for success states)
        'floatUp': {
          '0%': { transform: 'translateY(0)', opacity: '1' },
          '100%': { transform: 'translateY(-20px)', opacity: '0' },
        },

        // Success check animation
        'checkmark': {
          '0%': { strokeDashoffset: '100' },
          '100%': { strokeDashoffset: '0' },
        },

        // Sparkle effect
        'sparkle': {
          '0%, 100%': { opacity: '0', transform: 'scale(0)' },
          '50%': { opacity: '1', transform: 'scale(1)' },
        },
      },

      animation: {
        shimmer: 'shimmer 2s infinite',
        'pulse-glow': 'pulse-glow 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'fadeIn': 'fadeIn 0.5s ease-out',
        'fadeInDown': 'fadeInDown 0.5s ease-out',
        'scaleIn': 'scaleIn 0.3s ease-out',
        'slideInLeft': 'slideInLeft 0.3s ease-out',
        'slideInRight': 'slideInRight 0.3s ease-out',
        'slideUp': 'slideUp 0.3s ease-out',
        'barGrow': 'barGrow 0.6s cubic-bezier(0.4, 0, 0.2, 1)',
        'pulseDot': 'pulseDot 2s ease-in-out infinite',
        'glowSoft': 'glowSoft 2s ease-in-out infinite',
        'floatUp': 'floatUp 1s ease-out forwards',
        'checkmark': 'checkmark 0.5s ease-out forwards',
        'sparkle': 'sparkle 1s ease-in-out infinite',
      },

      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'gradient-conic': 'conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))',
        'gradient-dark': 'linear-gradient(to bottom, #0F1623, #101B2B)',
      },
    },
  },
  plugins: [],
}

export default config
