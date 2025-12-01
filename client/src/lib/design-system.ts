/**
 * Unified Design System extracted from Admin Panel
 * Applied across the entire application for visual consistency
 */

// Color Palette from Admin Panel
export const colors = {
  // Primary
  primary: {
    DEFAULT: "hsl(207, 90%, 54%)", // Blue
    light: "hsl(207, 90%, 65%)",
    dark: "hsl(207, 90%, 40%)",
    50: "hsl(207, 100%, 97%)",
    100: "hsl(207, 100%, 94%)",
    200: "hsl(207, 97%, 85%)",
    500: "hsl(207, 90%, 54%)",
    600: "hsl(207, 89%, 47%)",
    700: "hsl(207, 88%, 40%)",
  },

  // Secondary & Accents
  secondary: {
    DEFAULT: "hsl(210, 40%, 98%)",
    foreground: "hsl(215, 13.8%, 44.1%)",
  },

  // Neutral/Slate
  slate: {
    50: "hsl(210, 40%, 98%)",
    100: "hsl(210, 40%, 96%)",
    200: "hsl(214, 13.9%, 90.2%)",
    300: "hsl(213, 13.3%, 83.5%)",
    400: "hsl(215, 13.8%, 44.1%)",
    500: "hsl(215, 13.8%, 34.1%)",
    600: "hsl(215, 16%, 27%)",
    700: "hsl(215, 20.2%, 18.8%)",
    800: "hsl(215, 28%, 17%)",
    900: "hsl(215, 20.2%, 13.1%)",
  },

  // Admin Panel Background
  background: {
    primary: "hsl(0, 0%, 100%)", // White
    secondary: "hsl(210, 40%, 96.5%)", // Very light gray
    dark: "hsl(215, 20.2%, 13.1%)",
  },

  // Status Colors
  success: "hsl(159, 67%, 52%)",
  warning: "hsl(27, 87%, 55%)",
  error: "hsl(0, 84%, 60%)",
  info: "hsl(207, 90%, 54%)",

  // Gradient backgrounds from stat cards
  gradients: {
    blue: "linear-gradient(to bottom right, hsl(207, 100%, 97%), hsl(207, 100%, 94%))",
    green:
      "linear-gradient(to bottom right, hsl(159, 100%, 97%), hsl(159, 100%, 94%))",
    orange:
      "linear-gradient(to bottom right, hsl(27, 100%, 97%), hsl(27, 100%, 94%))",
    purple:
      "linear-gradient(to bottom right, hsl(262, 100%, 97%), hsl(262, 100%, 94%))",
  },

  // Sidebar colors
  sidebar: {
    background: "hsl(215, 20.2%, 13.1%)", // Dark slate
    text: "hsl(0, 0%, 100%)", // White
    hover: "hsl(215, 20%, 23%)", // Slightly lighter
    active: "hsl(207, 90%, 54%)", // Primary blue
  },
};

// Typography Scale - Professional & Hierarchical
export const typography = {
  // Font Sizes
  fontSize: {
    xs: "0.75rem", // 12px
    sm: "0.875rem", // 14px
    base: "1rem", // 16px
    lg: "1.125rem", // 18px
    xl: "1.25rem", // 20px
    "2xl": "1.5rem", // 24px
    "3xl": "1.875rem", // 30px
    "4xl": "2.25rem", // 36px
  },

  // Font Weights
  fontWeight: {
    light: 300,
    normal: 400,
    medium: 500,
    semibold: 600,
    bold: 700,
    extrabold: 800,
  },

  // Line Heights
  lineHeight: {
    tight: 1.25,
    normal: 1.5,
    relaxed: 1.625,
    loose: 2,
  },

  // Letter Spacing
  letterSpacing: {
    tight: "-0.011em",
    normal: "0em",
    wide: "0.025em",
  },

  // Heading Styles
  heading: {
    h1: {
      fontSize: "1.875rem",
      fontWeight: 700,
      lineHeight: 1.25,
      letterSpacing: "-0.011em",
    },
    h2: {
      fontSize: "1.5rem",
      fontWeight: 700,
      lineHeight: 1.25,
    },
    h3: {
      fontSize: "1.25rem",
      fontWeight: 600,
      lineHeight: 1.25,
    },
    h4: {
      fontSize: "1rem",
      fontWeight: 600,
      lineHeight: 1.5,
    },
  },

  // Body Styles
  body: {
    large: {
      fontSize: "1rem",
      fontWeight: 400,
      lineHeight: 1.5,
    },
    default: {
      fontSize: "0.875rem",
      fontWeight: 400,
      lineHeight: 1.5,
    },
    small: {
      fontSize: "0.75rem",
      fontWeight: 400,
      lineHeight: 1.5,
    },
  },

  // Font Family
  fontFamily: {
    sans: [
      "Inter",
      "Segoe UI",
      "system-ui",
      "-apple-system",
      "BlinkMacSystemFont",
      "Roboto",
      "sans-serif",
    ],
    display: [
      "Inter",
      "Segoe UI",
      "system-ui",
      "-apple-system",
      "BlinkMacSystemFont",
      "Roboto",
      "sans-serif",
    ],
  },
};

// Spacing Scale - Professional & Consistent
export const spacing = {
  0: "0",
  px: "1px",
  0.5: "0.125rem", // 2px
  1: "0.25rem", // 4px
  2: "0.5rem", // 8px
  3: "0.75rem", // 12px
  4: "1rem", // 16px
  5: "1.25rem", // 20px
  6: "1.5rem", // 24px
  8: "2rem", // 32px
  10: "2.5rem", // 40px
  12: "3rem", // 48px
  16: "4rem", // 64px
  20: "5rem", // 80px
};

// Border Radius - Modern & Professional
export const borderRadius = {
  none: "0",
  sm: "0.375rem", // 6px
  md: "0.5rem", // 8px
  lg: "0.625rem", // 10px
  xl: "1rem", // 16px
  full: "9999px",
};

// Shadows - Subtle Professional Feel
export const shadows = {
  none: "none",
  sm: "0 1px 2px 0 rgba(0, 0, 0, 0.05)",
  md: "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)",
  lg: "0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)",
  xl: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)",
  "2xl": "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
  inner: "inset 0 2px 4px 0 rgba(0, 0, 0, 0.05)",
};

// Animations & Transitions - Smooth & Professional
export const animations = {
  // Durations
  duration: {
    fast: "150ms",
    base: "200ms",
    slow: "300ms",
    slower: "500ms",
  },

  // Timing Functions
  timing: {
    linear: "linear",
    ease: "ease",
    easeIn: "ease-in",
    easeOut: "ease-out",
    easeInOut: "ease-in-out",
    easeCubicBezier: "cubic-bezier(0.4, 0, 0.2, 1)",
  },

  // Predefined Transitions
  transitions: {
    colors:
      "background-color 200ms ease, color 200ms ease, border-color 200ms ease",
    opacity: "opacity 200ms ease",
    transform: "transform 200ms ease",
    all: "all 200ms ease",
    smooth: "all 200ms cubic-bezier(0.4, 0, 0.2, 1)",
  },
};

// Component-specific spacing (padding/margins)
export const componentSpacing = {
  card: {
    padding: "1.5rem", // 24px
  },
  button: {
    padding: "0.5rem 1rem", // 8px 16px
    paddingLarge: "0.75rem 1.5rem", // 12px 24px
  },
  input: {
    padding: "0.5rem 1rem", // 8px 16px
  },
  section: {
    paddingX: "2rem", // 32px (horizontal)
    paddingY: "2rem", // 32px (vertical)
    maxWidth: "1280px", // 80rem
  },
};

// Responsive Breakpoints
export const breakpoints = {
  xs: "320px",
  sm: "640px",
  md: "768px",
  lg: "1024px",
  xl: "1280px",
  "2xl": "1536px",
};

// Utility: 80% Width Container Settings
export const responsiveContainer = {
  containerWidth: "80%", // 80% of viewport
  centerHorizontally: true,
  maxWidth: "100%",
  margin: "0 auto",
};
