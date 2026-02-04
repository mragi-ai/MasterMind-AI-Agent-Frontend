import { Moon, Sun, Monitor } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useTheme } from "@/contexts/ThemeContext";
import { cn } from "@/lib/utils";

type ThemeToggleProps = {
  className?: string;
  showLabel?: boolean;
  size?: "sm" | "default" | "lg";
  variant?: "ghost" | "outline" | "default";
};

export function ThemeToggle({ 
  className, 
  showLabel = false, 
  size = "default",
  variant = "ghost" 
}: ThemeToggleProps) {
  const { theme, preference, setTheme } = useTheme();

  const iconSize = size === "sm" ? "h-4 w-4" : size === "lg" ? "h-6 w-6" : "h-5 w-5";
  const buttonSize = size === "sm" ? "h-8 w-8" : size === "lg" ? "h-11 w-11" : "h-9 w-9";

  const getIcon = () => {
    if (preference === "auto") {
      return <Monitor className={cn(iconSize, "transition-all duration-300")} />;
    }
    if (theme === "dark") {
      return <Moon className={cn(iconSize, "transition-all duration-300")} />;
    }
    return <Sun className={cn(iconSize, "transition-all duration-300")} />;
  };

  const getLabel = () => {
    if (preference === "auto") return "Auto";
    return theme === "light" ? "Light" : "Dark";
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant={variant}
          size="icon"
          className={cn(
            "relative transition-colors",
            !showLabel && buttonSize,
            showLabel && "w-auto px-3 gap-2",
            className
          )}
          aria-label="Toggle theme"
        >
          {getIcon()}
          {showLabel && (
            <span className="text-sm font-medium">{getLabel()}</span>
          )}
          <span className="sr-only">Toggle theme</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-[120px]">
        <DropdownMenuItem 
          onClick={() => setTheme("light")}
          className={cn(
            "gap-2 cursor-pointer",
            preference === "light" && "bg-accent"
          )}
        >
          <Sun className="h-4 w-4" />
          <span>Light</span>
        </DropdownMenuItem>
        <DropdownMenuItem 
          onClick={() => setTheme("dark")}
          className={cn(
            "gap-2 cursor-pointer",
            preference === "dark" && "bg-accent"
          )}
        >
          <Moon className="h-4 w-4" />
          <span>Dark</span>
        </DropdownMenuItem>
        <DropdownMenuItem 
          onClick={() => setTheme("auto")}
          className={cn(
            "gap-2 cursor-pointer",
            preference === "auto" && "bg-accent"
          )}
        >
          <Monitor className="h-4 w-4" />
          <span>Auto</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

// Floating theme toggle that can be placed in a fixed position
// Cycles through: auto -> light -> dark -> auto
export function FloatingThemeToggle({ className }: { className?: string }) {
  const { theme, preference, setTheme } = useTheme();

  const cycleTheme = () => {
    if (preference === "auto") {
      setTheme("light");
    } else if (preference === "light") {
      setTheme("dark");
    } else {
      setTheme("auto");
    }
  };

  const getIcon = () => {
    if (preference === "auto") {
      return <Monitor className="h-5 w-5 text-foreground" />;
    }
    if (theme === "dark") {
      return <Sun className="h-5 w-5 text-foreground" />;
    }
    return <Moon className="h-5 w-5 text-foreground" />;
  };

  const getLabel = () => {
    if (preference === "auto") return "Auto mode (time-based: 6AM-6PM light)";
    if (preference === "light") return "Switch to dark mode";
    return "Switch to auto mode";
  };

  return (
    <button
      onClick={cycleTheme}
      className={cn(
        "fixed z-50 p-3 rounded-full shadow-lg transition-all duration-300",
        "bg-card border-2 border-border hover:border-primary/50",
        "hover:scale-110 hover:shadow-xl",
        "focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2",
        className
      )}
      aria-label={getLabel()}
      title={getLabel()}
    >
      {getIcon()}
    </button>
  );
}
