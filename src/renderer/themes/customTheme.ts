import { createTheme, Theme, ThemeOptions } from '@mui/material/styles';
import { PaletteMode, PaletteColorOptions } from '@mui/material';

export interface ThemePreferences {
  mode: PaletteMode;
  primaryColor: string;
  secondaryColor: string;
  fontSize: 'small' | 'medium' | 'large';
  borderRadius: number;
  spacing: number;
  animations: boolean;
  compactMode: boolean;
  highContrast: boolean;
  customFont?: string;
}

export interface ColorScheme {
  name: string;
  primary: string;
  secondary: string;
  background?: string;
  surface?: string;
  description?: string;
}

// Predefined color schemes
export const COLOR_SCHEMES: ColorScheme[] = [
  {
    name: 'Default Blue',
    primary: '#1976d2',
    secondary: '#dc004e',
    description: 'Classic Material Design blue',
  },
  {
    name: 'Security Green',
    primary: '#2e7d32',
    secondary: '#ed6c02',
    description: 'Professional security theme',
  },
  {
    name: 'Deep Purple',
    primary: '#512da8',
    secondary: '#00bcd4',
    description: 'Modern purple accent',
  },
  {
    name: 'Warm Orange',
    primary: '#f57c00',
    secondary: '#5e35b1',
    description: 'Energetic orange theme',
  },
  {
    name: 'Elegant Teal',
    primary: '#00695c',
    secondary: '#bf360c',
    description: 'Sophisticated teal',
  },
  {
    name: 'Dark Red',
    primary: '#c62828',
    secondary: '#1565c0',
    description: 'Bold and striking',
  },
  {
    name: 'Forest Green',
    primary: '#388e3c',
    secondary: '#f57f17',
    description: 'Natural forest theme',
  },
  {
    name: 'Royal Blue',
    primary: '#1565c0',
    secondary: '#e65100',
    description: 'Rich royal blue',
  },
];

// Font size mappings
const FONT_SIZES = {
  small: {
    h1: '2rem',
    h2: '1.75rem',
    h3: '1.5rem',
    h4: '1.25rem',
    h5: '1.125rem',
    h6: '1rem',
    body1: '0.875rem',
    body2: '0.75rem',
    caption: '0.6875rem',
  },
  medium: {
    h1: '2.5rem',
    h2: '2rem',
    h3: '1.75rem',
    h4: '1.5rem',
    h5: '1.25rem',
    h6: '1.125rem',
    body1: '1rem',
    body2: '0.875rem',
    caption: '0.75rem',
  },
  large: {
    h1: '3rem',
    h2: '2.5rem',
    h3: '2rem',
    h4: '1.75rem',
    h5: '1.5rem',
    h6: '1.25rem',
    body1: '1.125rem',
    body2: '1rem',
    caption: '0.875rem',
  },
};

export function createCustomTheme(preferences: ThemePreferences): Theme {
  const baseTheme: ThemeOptions = {
    palette: {
      mode: preferences.mode,
      primary: {
        main: preferences.primaryColor,
      } as PaletteColorOptions,
      secondary: {
        main: preferences.secondaryColor,
      } as PaletteColorOptions,
      ...(preferences.highContrast && {
        background: {
          default: preferences.mode === 'dark' ? '#000000' : '#ffffff',
          paper: preferences.mode === 'dark' ? '#121212' : '#f5f5f5',
        },
        text: {
          primary: preferences.mode === 'dark' ? '#ffffff' : '#000000',
          secondary: preferences.mode === 'dark' ? '#e0e0e0' : '#333333',
        },
      }),
    },
    typography: {
      fontSize: preferences.fontSize === 'small' ? 12 : preferences.fontSize === 'large' ? 16 : 14,
      fontFamily: preferences.customFont || '"Roboto", "Helvetica", "Arial", sans-serif',
      ...FONT_SIZES[preferences.fontSize],
    },
    spacing: preferences.spacing,
    shape: {
      borderRadius: preferences.borderRadius,
    },
    transitions: {
      create: preferences.animations
        ? (props: any, options?: any) => createTheme().transitions.create(props, options)
        : () => 'none',
    },
    components: {
      MuiCssBaseline: {
        styleOverrides: {
          body: {
            transition: preferences.animations ? 'all 0.3s ease' : 'none',
            fontSize: preferences.compactMode ? '0.875rem' : undefined,
          },
        },
      },
      MuiButton: {
        styleOverrides: {
          root: {
            borderRadius: preferences.borderRadius,
            transition: preferences.animations ? 'all 0.2s ease' : 'none',
            ...(preferences.compactMode && {
              padding: '6px 12px',
              minHeight: '32px',
            }),
          },
        },
      },
      MuiCard: {
        styleOverrides: {
          root: {
            borderRadius: preferences.borderRadius,
            ...(preferences.compactMode && {
              padding: '12px',
            }),
          },
        },
      },
      MuiTextField: {
        styleOverrides: {
          root: {
            ...(preferences.compactMode && {
              '& .MuiInputBase-root': {
                minHeight: '40px',
              },
            }),
          },
        },
      },
      MuiAccordion: {
        styleOverrides: {
          root: {
            borderRadius: preferences.borderRadius,
            '&:before': {
              display: 'none',
            },
          },
        },
      },
      MuiPaper: {
        styleOverrides: {
          root: {
            borderRadius: preferences.borderRadius,
            ...(preferences.highContrast && {
              border: preferences.mode === 'dark' ? '1px solid #333' : '1px solid #e0e0e0',
            }),
          },
        },
      },
      MuiAppBar: {
        styleOverrides: {
          root: {
            borderRadius: 0,
            boxShadow: preferences.animations
              ? '0px 2px 4px -1px rgba(0,0,0,0.2)'
              : 'none',
          },
        },
      },
      MuiListItem: {
        styleOverrides: {
          root: {
            borderRadius: preferences.borderRadius / 2,
            margin: preferences.compactMode ? '2px 0' : '4px 0',
            ...(preferences.compactMode && {
              minHeight: '36px',
              padding: '4px 12px',
            }),
          },
        },
      },
    },
  };

  return createTheme(baseTheme);
}

export const DEFAULT_THEME_PREFERENCES: ThemePreferences = {
  mode: 'light',
  primaryColor: '#1976d2',
  secondaryColor: '#dc004e',
  fontSize: 'medium',
  borderRadius: 8,
  spacing: 8,
  animations: true,
  compactMode: false,
  highContrast: false,
};

// Theme validation functions
export function validateThemePreferences(preferences: Partial<ThemePreferences>): ThemePreferences {
  return {
    mode: preferences.mode === 'dark' ? 'dark' : 'light',
    primaryColor: isValidColor(preferences.primaryColor) ? preferences.primaryColor! : DEFAULT_THEME_PREFERENCES.primaryColor,
    secondaryColor: isValidColor(preferences.secondaryColor) ? preferences.secondaryColor! : DEFAULT_THEME_PREFERENCES.secondaryColor,
    fontSize: ['small', 'medium', 'large'].includes(preferences.fontSize!) ? preferences.fontSize! : 'medium',
    borderRadius: Math.max(0, Math.min(20, preferences.borderRadius || 8)),
    spacing: Math.max(4, Math.min(16, preferences.spacing || 8)),
    animations: preferences.animations !== false,
    compactMode: preferences.compactMode === true,
    highContrast: preferences.highContrast === true,
    customFont: preferences.customFont,
  };
}

function isValidColor(color?: string): boolean {
  if (!color) return false;

  // Simple hex color validation
  const hexRegex = /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/;
  if (hexRegex.test(color)) return true;

  // CSS color names validation (basic check)
  const cssColors = ['red', 'blue', 'green', 'black', 'white', 'gray', 'purple', 'orange', 'yellow', 'pink', 'brown'];
  if (cssColors.includes(color.toLowerCase())) return true;

  return false;
}

// Color utility functions
export function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16),
  } : null;
}

export function rgbToHex(r: number, g: number, b: number): string {
  return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`;
}

export function lightenColor(color: string, amount: number): string {
  const rgb = hexToRgb(color);
  if (!rgb) return color;

  return rgbToHex(
    Math.min(255, Math.floor(rgb.r + (255 - rgb.r) * amount)),
    Math.min(255, Math.floor(rgb.g + (255 - rgb.g) * amount)),
    Math.min(255, Math.floor(rgb.b + (255 - rgb.b) * amount))
  );
}

export function darkenColor(color: string, amount: number): string {
  const rgb = hexToRgb(color);
  if (!rgb) return color;

  return rgbToHex(
    Math.max(0, Math.floor(rgb.r * (1 - amount))),
    Math.max(0, Math.floor(rgb.g * (1 - amount))),
    Math.max(0, Math.floor(rgb.b * (1 - amount)))
  );
}

export function getContrastColor(backgroundColor: string): string {
  const rgb = hexToRgb(backgroundColor);
  if (!rgb) return '#000000';

  // Calculate luminance
  const luminance = (0.299 * rgb.r + 0.587 * rgb.g + 0.114 * rgb.b) / 255;

  return luminance > 0.5 ? '#000000' : '#ffffff';
}

// Theme presets for different use cases
export const THEME_PRESETS: Record<string, Partial<ThemePreferences>> = {
  default: DEFAULT_THEME_PREFERENCES,

  darkMinimal: {
    mode: 'dark',
    primaryColor: '#90caf9',
    secondaryColor: '#f48fb1',
    borderRadius: 4,
    compactMode: true,
    animations: false,
  },

  lightAccessible: {
    mode: 'light',
    primaryColor: '#1976d2',
    secondaryColor: '#d32f2f',
    fontSize: 'large',
    highContrast: true,
    borderRadius: 12,
  },

  securityFocused: {
    mode: 'dark',
    primaryColor: '#2e7d32',
    secondaryColor: '#f57c00',
    borderRadius: 8,
    spacing: 12,
  },

  elegant: {
    mode: 'light',
    primaryColor: '#6a1b9a',
    secondaryColor: '#00acc1',
    borderRadius: 16,
    spacing: 12,
    fontSize: 'medium',
  },

  compact: {
    compactMode: true,
    fontSize: 'small',
    spacing: 4,
    borderRadius: 4,
    animations: false,
  },
};
