# ROCK IT ED - Brand Style Guide

## Overview

This style guide ensures consistent design and branding across the ROCK IT ED website. All components and pages should follow these guidelines to maintain a cohesive user experience.

## Brand Colors

### Primary Colors

- **Primary (Light Mode)**: `#190647` (Deep Indigo/Navy) - Used for key components, buttons, and branding
- **Primary (Dark Mode)**: `#8CB0D8` (Light Slate Blue) - Used for visual pop in dark mode
- **Background (Light Mode)**: `#E7E1D3` (Light Beige/Off-White) - Main background color
- **Background (Dark Mode)**: `#121212` (Very Dark Gray/Near-Black) - Standard accessible dark background

### Accent Colors (Consistent Across Both Modes)

- **Orange/Coral**: `#F17947` - CTAs, hover states, and focus elements
- **Rose/Magenta**: `#D35285` - Highlights, icons, or secondary CTAs

### Status Colors

- **Success (Light Mode)**: `#4CAF50` (Material Green)
- **Success (Dark Mode)**: `#8BC34A` (Light Green)
- **Error (Light Mode)**: `#D32F2F` (Material Red)
- **Error (Dark Mode)**: `#FF5252` (Light Red)

### Surface Colors

- **Surface (Light Mode)**: `#FFFFFF` (Pure White) - Cards, containers, distinct elements
- **Surface (Dark Mode)**: `#1D1D1D` (Slightly Lighter Dark Gray) - Cards, containers

### Text Colors

- **Text Primary (Light Mode)**: `#190647` (Deep Indigo/Navy)
- **Text Primary (Dark Mode)**: `#E7E1D3` (Off-White/Beige)
- **Text Secondary (Light Mode)**: `#5B5B5B` (Mid-Dark Gray)
- **Text Secondary (Dark Mode)**: `#A3A3A3` (Mid-Light Gray)

## Typography

### Headings

```css
/* Large headings (Hero sections) */
.text-6xl.md:text-7xl.font-bold.text-primary

/* Section headings */
.text-3xl.md:text-4xl.font-bold.text-foreground

/* Card headings */
.text-xl.font-semibold.text-foreground
```

### Body Text

```css
/* Main body text */
.text-foreground

/* Secondary/muted text */
.text-muted-foreground

/* Small text */
.text-sm.text-muted-foreground
```

## Components

### Buttons

```css
/* Primary button (default) */
.bg-primary.text-primary-foreground.hover:bg-accent-orange.hover:text-primary-foreground.shadow-brand.hover:shadow-brand-hover

/* Secondary button */
.bg-secondary.text-secondary-foreground.hover:bg-secondary/80

/* Outline button */
.border.border-primary.hover:bg-primary.hover:text-primary-foreground

/* Ghost button */
.text-foreground.hover:bg-accent-orange/10.hover:text-accent-orange
```

### Cards

```css
/* Standard card */
.bg-card.border.border-border.rounded-lg.shadow-brand-md.hover: shadow-brand-lg;
```

### Badges

```css
/* Default badge */
.bg-primary.text-primary-foreground

/* Success badge */
.bg-success.text-success-foreground

/* Warning badge */
.bg-accent-orange.text-white

/* Error badge */
.bg-destructive.text-destructive-foreground
```

### Alerts

```css
/* Success alert */
.border-success/50.text-success.bg-success/10

/* Warning alert */
.border-accent-orange/50.text-accent-orange.bg-accent-orange/10

/* Error alert */
.border-destructive/50.text-destructive.bg-destructive/10
```

## Layout Patterns

### Containers

```css
/* Main container */
.container.mx-auto.px-4

/* Section spacing */
.py-16

/* Card padding */
.p-6
```

### Shadows

```css
/* Small shadow */
.shadow-brand

/* Medium shadow (default for cards) */
.shadow-brand-md

/* Large shadow */
.shadow-brand-lg

/* Hover shadow */
.hover:shadow-brand-hover
```

## Background

The background uses solid colors for both light and dark modes:

```css
body {
  background: hsl(var(--background));
  color: hsl(var(--foreground));
}
```

- Light mode: `#E7E1D3` (Light Beige/Off-White)
- Dark mode: `#121212` (Very Dark Gray/Near-Black)

## Transitions

All interactive elements should use consistent transitions:

```css
/* Default transition */
.transition-all.duration-200

/* Color-only transition */
.transition-colors.duration-200

/* Shadow transition */
.transition-shadow.duration-200

/* Transform transition */
.transition-transform.duration-300
```

## Color Usage Guidelines

### When to use each color:

**Primary (`#190647` light / `#8CB0D8` dark)**:

- Key components, buttons, and branding
- All headings (h1-h6)
- Navigation elements
- Primary borders
- Footer background

**Background (`#E7E1D3` light / `#121212` dark)**:

- Main page background
- Base canvas for all content

**Surface (`#FFFFFF` light / `#1D1D1D` dark)**:

- Card backgrounds
- Container backgrounds
- Distinct elements that need elevation

**Orange/Coral (`#F17947`)**:

- CTAs and primary action buttons
- Hover states
- Focus elements
- Interactive highlights

**Rose/Magenta (`#D35285`)**:

- Highlights and accents
- Icons
- Secondary CTAs

**Success (`#4CAF50` light / `#8BC34A` dark)**:

- Success messages
- Positive notifications
- Confirmation states

**Error (`#D32F2F` light / `#FF5252` dark)**:

- Error messages
- Destructive actions
- Warning alerts

## Accessibility

### Contrast Ratios

- Primary purple on cream background: ✅ WCAG AA compliant
- All text combinations meet accessibility standards
- Focus states use ring utilities for keyboard navigation

### Focus Management

```css
/* Focus ring for interactive elements */
.focus-visible:ring-2.focus-visible:ring-ring.focus-visible:ring-offset-2
```

## Dark Mode

Dark mode is fully implemented and active. The theme system uses `next-themes` with system preference detection.

### Theme Toggle

A theme toggle component is available in the header that allows users to switch between:

- **Light Mode**: Uses the light color palette
- **Dark Mode**: Uses the dark color palette
- **System**: Follows the user's OS preference (default)

### Implementation

The theme is managed via CSS variables and the `.dark` class on the root element. All components automatically adapt to the current theme using semantic color classes.

## Development Guidelines

### Do's ✅

- Use theme utilities from `src/lib/theme.ts`
- Follow the established color palette
- Use semantic CSS classes (text-foreground, bg-card, etc.)
- Apply consistent transitions and shadows
- Test accessibility with screen readers

### Don'ts ❌

- Don't use hardcoded colors (gray-900, blue-500, etc.)
- Don't skip hover states on interactive elements
- Don't use background images or textures - use solid colors only
- Don't use colors outside the brand palette without approval
- Don't forget to test in both light and dark modes
- Don't use old color references (accent-blue, accent-pink) - use semantic colors instead

## File Structure

```
src/
├── lib/
│   └── theme.ts          # Theme utilities and constants
├── components/
│   ├── ui/               # Base UI components
│   └── layout/           # Layout components
└── app/
    └── globals.css       # Global styles and CSS variables
```

## Quick Reference

### Import theme utilities:

```typescript
import { theme, cn } from "@/lib/theme";
```

### Apply consistent styling:

```typescript
const cardClasses = cn(theme.components.card, theme.transitions.shadows);
const buttonClasses = cn(theme.usage.buttons.primary, theme.transitions.default);
```

### Use semantic colors:

```typescript
// ✅ Good
className = "text-foreground bg-card border-border";

// ❌ Avoid
className = "text-gray-900 bg-white border-gray-300";
```

## Updates

When updating the theme:

1. Update colors in `src/lib/theme.ts`
2. Update CSS variables in `src/app/globals.css`
3. Update this style guide
4. Test all components for consistency
5. Verify accessibility compliance

---

_Last updated: [Current Date]_
_Version: 1.0_
