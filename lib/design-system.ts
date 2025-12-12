/**
 * Minimal design system constants for BadHabit Tracker (dark mode premium). 
 * Tailwind-friendly definitions to keep spacing, colors and typography consistent.
 */

export const colors = {
  background: '#030712',
  surface: '#0f1220',
  overlay: 'rgba(3, 7, 18, 0.85)',
  border: 'rgba(255, 255, 255, 0.08)',
  borderStrong: 'rgba(255, 255, 255, 0.18)',
  text: '#e5e7eb',
  textMuted: '#9ca3af',
  textAccent: '#93c5fd',
  primary: '#2563eb',
  primarySoft: '#1d4ed8',
  secondary: '#7c3aed',
  success: '#34d399',
  warning: '#fbbf24',
  danger: '#f87171',
  metallic: '#d4d4d8',
}

export const radius = {
  none: '0px',
  sm: '0.375rem',
  md: '0.75rem',
  lg: '1.25rem',
  pill: '999px',
}

export const spacing = {
  xs: '0.25rem',
  sm: '0.5rem',
  md: '1rem',
  lg: '1.5rem',
  xl: '2rem',
  '2xl': '2.5rem',
  '3xl': '3.5rem',
}

export const typography = {
  fontFamily: 'Inter, SF Pro Display, system-ui, sans-serif',
  sizes: {
    xs: '0.75rem',
    sm: '0.875rem',
    base: '1rem',
    lg: '1.125rem',
    xl: '1.25rem',
    '2xl': '1.5rem',
    '3xl': '1.875rem',
    '4xl': '2.25rem',
  },
  weights: {
    regular: 400,
    medium: 500,
    semibold: 600,
    bold: 700,
  },
  leading: {
    tight: 1.2,
    normal: 1.5,
    relaxed: 1.7,
  },
}

export const shadow = {
  subtle: '0 10px 40px rgba(0, 0, 0, 0.25)',
  focus: '0 0 0 3px rgba(37, 99, 235, 0.25)',
}
