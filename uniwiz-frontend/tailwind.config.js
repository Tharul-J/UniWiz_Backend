/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // --- SUPERB MODERN COLOR PALETTE (EXISTING) ---
        'primary-dark': '#1A202C',
        'primary-main': '#4F46E5',
        'primary-light': '#818CF8',
        'primary-lighter': '#E0E7FF',
        
        // --- UPDATED & ENHANCED ACCENT COLORS ---
        'accent-green': '#10B981',
        'accent-red': '#EF4444',
        'accent-yellow': '#F59E0B',
        
        // --- NEW LIGHT & VIBRANT ACCENT COLORS FOR CATEGORIES/ICONS ---
        'accent-blue': {
          light: '#EBF5FF', // Light blue background
          dark: '#3B82F6'   // Dark blue text/icon
        },
        'accent-pink': {
          light: '#FFF0F5', // Light pink background
          dark: '#EC4899'   // Dark pink text/icon
        },
        'accent-teal': {
          light: '#ECFDF5', // Light teal background
          dark: '#14B8A6'   // Dark teal text/icon
        },
        'accent-purple': {
          light: '#F5F3FF', // Light purple background
          dark: '#8B5CF6'   // Dark purple text/icon
        },

        'neutral-dark': '#374151',
        'neutral-medium': '#6B7280',
        'neutral-light': '#F9FAFB',
        
        'bg-student-dashboard': '#FDF2F8',
        'bg-publisher-dashboard': '#F0F4F8',
      },
    },
  },
  plugins: [],
}