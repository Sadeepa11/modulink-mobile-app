// ============================================================
// ModuLink App Theme
//
// Brand colour palette (light → dark gradient):
//   #083a7a  deep navy
//   #135792  rich blue
//   #20749f  medium blue
//   #379ebb  sky blue
//   #79dadf  light teal / cyan
//   #e1ebf1  very light blue-grey  ← light mode background
//
// In LIGHT mode  → dark colours on light backgrounds
// In DARK  mode  → light colours on dark backgrounds
// ============================================================

// ---- Spacing scale (multiples of 4 px) ---------------------
export const Spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

// ---- Font size scale ----------------------------------------
export const FontSize = {
  xs: 11,
  sm: 13,
  md: 15,
  lg: 17,
  xl: 20,
  xxl: 24,
  title: 28,
};

// ---- Border-radius constants --------------------------------
export const Radius = {
  sm: 6,
  md: 12,
  lg: 20,
  full: 999,
};

// ============================================================
// LIGHT THEME — solid navy background, light text (aligned with header)
// ============================================================
const light = {
  // ---- Backgrounds ----
  background: '#083a7a',         // Header color as background
  surface: '#0d478a',            // Tinted navy surface for cards/inputs
  surfaceAlt: '#135792',         // Secondary surface
  chatBackground: '#e5eef4',     // Light blue-grey chat wallpaper

  // ---- Brand colours ----
  primary: '#79dadf',            // Cyan/teal accent
  primaryDark: '#379ebb',
  secondary: '#379ebb',
  accent: '#20749f',
  accentLight: '#79dadf',

  // ---- Text ----
  text: '#ffffff',               // White text for high contrast on navy
  textSecondary: '#c2d8e4',      // Muted light blue
  textOnPrimary: '#083a7a',      // Dark text on cyan/teal elements

  // ---- Borders & separators ----
  border: '#1a3a5c',

  // ---- Icons & tabs ----
  icon: '#79dadf',
  tabIconDefault: '#379ebb',
  tabIconSelected: '#ffffff',
  tint: '#79dadf',

  // ---- Chat bubbles ----
  myBubble: '#d2e8ff',           // Sent bubble (WhatsApp style: light blue under blue theme)
  myBubbleText: '#083a7a',       // Dark text inside sent bubble
  theirBubble: '#ffffff',        // Received bubble (WhatsApp style: white)
  theirBubbleText: '#083a7a',    // Dark text inside received bubble

  // ---- Misc ----
  online: '#25D366',
  error: '#c0392b',
  storyGradient: ['#083a7a', '#135792', '#379ebb', '#79dadf'] as string[],
};

// ============================================================
// DARK THEME — solid deep navy background
// ============================================================
const dark = {
  // ---- Backgrounds ----
  background: '#071a30',         // Header color as background
  surface: '#0c243e',            // Tinted dark navy surface
  surfaceAlt: '#112d4e',         // Secondary surface
  chatBackground: '#08131e',     // Dark blue-grey chat wallpaper

  // ---- Brand colours ----
  primary: '#79dadf',
  primaryDark: '#379ebb',
  secondary: '#379ebb',
  accent: '#20749f',
  accentLight: '#79dadf',

  // ---- Text ----
  text: '#e1ebf1',
  textSecondary: '#79dadf',
  textOnPrimary: '#071a30',

  // ---- Borders & separators ----
  border: '#1a3a5c',

  // ---- Icons & tabs ----
  icon: '#79dadf',
  tabIconDefault: '#379ebb',
  tabIconSelected: '#79dadf',
  tint: '#79dadf',

  // ---- Chat bubbles ----
  myBubble: '#1b4f8f',           // Sent bubble (dark blue)
  myBubbleText: '#ffffff',       // Light text inside sent bubble
  theirBubble: '#0c243e',        // Received bubble (dark surface)
  theirBubbleText: '#e1ebf1',    // Light text inside received bubble

  // ---- Misc ----
  online: '#25D366',
  error: '#e74c3c',
  storyGradient: ['#083a7a', '#135792', '#379ebb', '#79dadf'] as string[],
};

// Export both themes under a single object so components can pick:
//   const colors = Colors[colorScheme]
export const Colors = { light, dark };

// Type helper — any component can annotate its color prop as:
//   colors: ThemeColors
export type ThemeColors = typeof light;
