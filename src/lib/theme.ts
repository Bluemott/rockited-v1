/**
 * Theme Configuration and Utilities
 * 
 * This file contains the brand color palette, theme utilities, and guidelines
 * for consistent styling throughout the ROCK IT ED project.
 */

// Brand Color Palette
export const brandColors = {
  // Primary Colors
  primaryLight: '#190647',      // Deep Indigo/Navy - light mode
  primaryDark: '#8CB0D8',       // Light Slate Blue - dark mode
  backgroundLight: '#E7E1D3',   // Light Beige/Off-White - light mode
  backgroundDark: '#121212',   // Very Dark Gray/Near-Black - dark mode
  
  // Accent Colors (consistent across both modes)
  accentOrange: '#F17947',     // Bright Orange/Coral - CTAs, hover states
  accentRose: '#D35285',       // Deep Rose/Magenta - highlights, secondary CTAs
  
  // Status Colors
  successLight: '#4CAF50',     // Material Green - light mode
  successDark: '#8BC34A',      // Light Green - dark mode
  errorLight: '#D32F2F',        // Material Red - light mode
  errorDark: '#FF5252',         // Light Red - dark mode
  
  // Surface Colors
  surfaceLight: '#FFFFFF',      // Pure White - light mode
  surfaceDark: '#1D1D1D',       // Slightly Lighter Dark Gray - dark mode
  
  // Text Colors
  textPrimaryLight: '#190647',  // Deep Indigo/Navy - light mode
  textPrimaryDark: '#E7E1D3',   // Off-White/Beige - dark mode
  textSecondaryLight: '#5B5B5B', // Mid-Dark Gray - light mode
  textSecondaryDark: '#A3A3A3',  // Mid-Light Gray - dark mode
} as const;

// HSL Values for CSS Variables (used in globals.css)
// Light mode values
export const themeHSLLight = {
  primary: '252 75% 18%',        // #190647
  background: '45 20% 90%',      // #E7E1D3
  surface: '0 0% 100%',          // #FFFFFF
  textPrimary: '252 75% 18%',    // #190647
  textSecondary: '0 0% 36%',     // #5B5B5B
  accentOrange: '16 88% 61%',    // #F17947
  accentRose: '334 60% 52%',     // #D35285
  success: '122 39% 49%',        // #4CAF50
  error: '4 73% 50%',            // #D32F2F
} as const;

// Dark mode values
export const themeHSLDark = {
  primary: '210 45% 70%',        // #8CB0D8
  background: '0 0% 7%',         // #121212
  surface: '0 0% 11%',           // #1D1D1D
  textPrimary: '45 20% 90%',    // #E7E1D3
  textSecondary: '0 0% 64%',     // #A3A3A3
  accentOrange: '16 88% 61%',    // #F17947 (same)
  accentRose: '334 60% 52%',     // #D35285 (same)
  success: '88 50% 53%',         // #8BC34A
  error: '0 100% 67%',           // #FF5252
} as const;

// Theme Usage Guidelines
export const themeUsage = {
  // Text Colors
  headings: 'text-primary',           // All h1-h6 elements
  body: 'text-foreground',            // Main body text
  muted: 'text-muted-foreground',     // Secondary text, descriptions
  
  // Backgrounds
  main: 'bg-background',              // Page backgrounds
  cards: 'bg-card',                   // Card backgrounds
  sections: 'bg-secondary',           // Section backgrounds
  
  // Interactive Elements
  buttons: {
    primary: 'bg-primary hover:bg-accent-orange text-primary-foreground',
    secondary: 'bg-secondary text-secondary-foreground',
    outline: 'border-primary hover:bg-primary hover:text-primary-foreground',
    ghost: 'text-foreground hover:bg-muted hover:text-accent-orange',
  },
  
  // Borders and Shadows
  borders: 'border-border',
  shadows: {
    small: 'shadow-brand',
    medium: 'shadow-brand-md',
    large: 'shadow-brand-lg',
    hover: 'hover:shadow-brand-hover',
  },
  
  // Status Colors - Use solid backgrounds with borders
  status: {
    success: 'text-success bg-card border border-success',
    warning: 'text-accent-orange bg-card border border-accent-orange',
    error: 'text-destructive bg-card border border-destructive',
  },
} as const;

// Component Styling Patterns
export const componentPatterns = {
  // Cards
  card: 'bg-card border border-border rounded-lg shadow-brand-md hover:shadow-brand-lg transition-shadow duration-200',
  
  // Buttons
  button: 'rounded-md shadow-brand hover:shadow-brand-hover transition-all duration-200',
  
  // Inputs
  input: 'border border-input bg-background rounded-md px-3 py-2 focus:ring-2 focus:ring-ring focus:outline-none',
  
  // Navigation
  navLink: 'text-muted-foreground hover:text-foreground transition-colors',
  
  // Badges
  badge: {
    default: 'bg-primary text-primary-foreground',
    success: 'bg-success text-white',
    warning: 'bg-accent-orange text-white',
    error: 'bg-destructive text-white',
  },
} as const;

// Background Utility
export const background = {
  // Solid background
  main: 'bg-background',
  
  // Content containers
  floating: 'relative z-10',
} as const;

// Spacing and Layout
export const layout = {
  container: 'container mx-auto px-4',
  section: 'py-16',
  cardPadding: 'p-6',
  buttonPadding: 'px-4 py-2',
} as const;

// Animation and Transitions
export const transitions = {
  default: 'transition-all duration-200',
  colors: 'transition-colors duration-200',
  shadows: 'transition-shadow duration-200',
  transform: 'transition-transform duration-300',
} as const;

// Typography Scale
export const typography = {
  heading: {
    xl: 'text-6xl md:text-7xl font-bold',
    lg: 'text-3xl md:text-4xl font-bold',
    md: 'text-2xl font-semibold',
    sm: 'text-xl font-semibold',
  },
  body: {
    lg: 'text-lg',
    base: 'text-base',
    sm: 'text-sm',
  },
} as const;

// Utility Functions
export const cn = (...classes: (string | undefined | null | false)[]): string => {
  return classes.filter(Boolean).join(' ');
};

// Theme-aware color utilities
export const getThemeColor = (color: keyof typeof themeHSLLight, mode: 'light' | 'dark' = 'light'): string => {
  const hslValues = mode === 'light' ? themeHSLLight : themeHSLDark;
  return `hsl(${hslValues[color]})`;
};

// Validation helpers
export const isValidBrandColor = (color: string): boolean => {
  return Object.values(brandColors).includes(color as any);
};

// Export all theme utilities
export const theme = {
  colors: brandColors,
  hsl: {
    light: themeHSLLight,
    dark: themeHSLDark,
  },
  usage: themeUsage,
  components: componentPatterns,
  background: background,
  layout,
  transitions,
  typography,
  utils: {
    cn,
    getThemeColor,
    isValidBrandColor,
  },
} as const;

export default theme;