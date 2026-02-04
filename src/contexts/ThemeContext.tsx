import { createContext, useContext, useEffect, useState, ReactNode } from "react";

type Theme = "light" | "dark";
type ThemePreference = "light" | "dark" | "auto";

interface ThemeContextType {
  theme: Theme;
  preference: ThemePreference;
  setTheme: (theme: ThemePreference) => void;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const STORAGE_KEY = "theme-preference";

// Function to determine theme based on system time
// Daytime: 6 AM - 6 PM (light theme)
// Nighttime: 6 PM - 6 AM (dark theme)
function getThemeFromTime(): Theme {
  const now = new Date();
  const hour = now.getHours();
  // 6 AM to 6 PM = light theme, otherwise dark theme
  return hour >= 6 && hour < 18 ? "light" : "dark";
}

// Get stored preference from localStorage
function getStoredPreference(): ThemePreference {
  if (typeof window === "undefined") return "auto";
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored === "light" || stored === "dark" || stored === "auto") {
    return stored;
  }
  // Default to "auto" for new users - will use time-based theme
  return "auto";
}

// Resolve theme based on preference
function resolveTheme(preference: ThemePreference): Theme {
  if (preference === "auto") {
    return getThemeFromTime();
  }
  return preference;
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [preference, setPreference] = useState<ThemePreference>(getStoredPreference);
  const [theme, setThemeState] = useState<Theme>(() => resolveTheme(getStoredPreference()));

  // Update theme when preference changes
  useEffect(() => {
    const newTheme = resolveTheme(preference);
    setThemeState(newTheme);
    localStorage.setItem(STORAGE_KEY, preference);
  }, [preference]);

  // Auto-update theme based on time (only when preference is "auto")
  useEffect(() => {
    if (preference !== "auto") return;

    const updateTheme = () => {
      const newTheme = getThemeFromTime();
      setThemeState(newTheme);
    };

    // Update theme every minute to catch time changes
    const interval = setInterval(updateTheme, 60000);

    // Also check when the page becomes visible (user returns to tab)
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        updateTheme();
      }
    };
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      clearInterval(interval);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [preference]);

  // Apply theme to document
  useEffect(() => {
    const root = document.documentElement;
    if (theme === "dark") {
      root.classList.add("dark");
    } else {
      root.classList.remove("dark");
    }
  }, [theme]);

  // Set theme preference
  const setTheme = (newPreference: ThemePreference) => {
    setPreference(newPreference);
  };

  // Toggle between light and dark (manual override)
  const toggleTheme = () => {
    setPreference(prev => {
      // If currently auto, switch to opposite of current resolved theme
      if (prev === "auto") {
        return theme === "light" ? "dark" : "light";
      }
      // Otherwise toggle between light and dark
      return prev === "light" ? "dark" : "light";
    });
  };

  return (
    <ThemeContext.Provider value={{ theme, preference, setTheme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
}
