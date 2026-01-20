import { createContext, useContext, useEffect, useState, ReactNode } from "react";

type Theme = "light" | "dark";

interface ThemeContextType {
  theme: Theme;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

// Function to determine theme based on system time
// Daytime: 6 AM - 6 PM (light theme)
// Nighttime: 6 PM - 6 AM (dark theme)
function getThemeFromTime(): Theme {
  const now = new Date();
  const hour = now.getHours();
  // 6 AM to 6 PM = light theme, otherwise dark theme
  return hour >= 6 && hour < 18 ? "light" : "dark";
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<Theme>(getThemeFromTime);

  // Update theme based on time
  useEffect(() => {
    const updateTheme = () => {
      const newTheme = getThemeFromTime();
      setThemeState(newTheme);
    };

    // Set initial theme
    updateTheme();

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
  }, []);

  // Apply theme to document
  useEffect(() => {
    const root = document.documentElement;
    if (theme === "dark") {
      root.classList.add("dark");
    } else {
      root.classList.remove("dark");
    }
  }, [theme]);

  return (
    <ThemeContext.Provider value={{ theme }}>
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

