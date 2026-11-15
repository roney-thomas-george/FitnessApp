import React, { createContext, useContext, useState, useEffect } from 'react';

export type ThemeMode = 'dark' | 'light' | 'system';
export type FontSize = 'normal' | 'large';

interface ThemeContextType {
  theme: ThemeMode;
  resolvedTheme: 'dark' | 'light';
  highContrast: boolean;
  fontSize: FontSize;
  isThemeMenuOpen: boolean;
  setTheme: (theme: ThemeMode) => void;
  setHighContrast: (enabled: boolean) => void;
  setFontSize: (size: FontSize) => void;
  setIsThemeMenuOpen: (open: boolean) => void;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const STORAGE_THEME_KEY = 'pulsefit_theme_mode';
const STORAGE_CONTRAST_KEY = 'pulsefit_high_contrast';
const STORAGE_FONT_SIZE_KEY = 'pulsefit_font_size';

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setThemeState] = useState<ThemeMode>(() => {
    const saved = localStorage.getItem(STORAGE_THEME_KEY);
    if (saved === 'dark' || saved === 'light' || saved === 'system') {
      return saved;
    }
    return 'dark'; // Default to sleek dark mode
  });

  const [highContrast, setHighContrastState] = useState<boolean>(() => {
    return localStorage.getItem(STORAGE_CONTRAST_KEY) === 'true';
  });

  const [fontSize, setFontSizeState] = useState<FontSize>(() => {
    return (localStorage.getItem(STORAGE_FONT_SIZE_KEY) as FontSize) || 'normal';
  });

  const [isThemeMenuOpen, setIsThemeMenuOpen] = useState(false);

  // Compute resolved theme (light vs dark) taking system into account
  const [systemIsDark, setSystemIsDark] = useState<boolean>(() => {
    if (typeof window !== 'undefined' && window.matchMedia) {
      return window.matchMedia('(prefers-color-scheme: dark)').matches;
    }
    return true;
  });

  // Listen to system OS preference changes
  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return;
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handler = (e: MediaQueryListEvent) => setSystemIsDark(e.matches);
    mediaQuery.addEventListener('change', handler);
    return () => mediaQuery.removeEventListener('change', handler);
  }, []);

  const resolvedTheme: 'dark' | 'light' = theme === 'system' ? (systemIsDark ? 'dark' : 'light') : theme;

  // Apply classes to document.documentElement and document.body
  useEffect(() => {
    const root = document.documentElement;
    const body = document.body;

    // Apply dark / light class and data-theme
    if (resolvedTheme === 'dark') {
      root.classList.add('dark');
      root.classList.remove('light');
      body?.classList.add('dark');
      body?.classList.remove('light');
      root.setAttribute('data-theme', 'dark');
    } else {
      root.classList.add('light');
      root.classList.remove('dark');
      body?.classList.add('light');
      body?.classList.remove('dark');
      root.setAttribute('data-theme', 'light');
    }

    // Apply high contrast class
    if (highContrast) {
      root.classList.add('high-contrast');
      body?.classList.add('high-contrast');
    } else {
      root.classList.remove('high-contrast');
      body?.classList.remove('high-contrast');
    }

    // Apply font size class
    if (fontSize === 'large') {
      root.classList.add('font-large');
      body?.classList.add('font-large');
    } else {
      root.classList.remove('font-large');
      body?.classList.remove('font-large');
    }

    root.style.colorScheme = resolvedTheme;
  }, [resolvedTheme, highContrast, fontSize]);

  const setTheme = (newTheme: ThemeMode) => {
    setThemeState(newTheme);
    localStorage.setItem(STORAGE_THEME_KEY, newTheme);
  };

  const setHighContrast = (enabled: boolean) => {
    setHighContrastState(enabled);
    localStorage.setItem(STORAGE_CONTRAST_KEY, String(enabled));
  };

  const setFontSize = (size: FontSize) => {
    setFontSizeState(size);
    localStorage.setItem(STORAGE_FONT_SIZE_KEY, size);
  };

  const toggleTheme = () => {
    const next = resolvedTheme === 'dark' ? 'light' : 'dark';
    setTheme(next);
  };

  return (
    <ThemeContext.Provider
      value={{
        theme,
        resolvedTheme,
        highContrast,
        fontSize,
        isThemeMenuOpen,
        setTheme,
        setHighContrast,
        setFontSize,
        setIsThemeMenuOpen,
        toggleTheme,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = (): ThemeContextType => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};
