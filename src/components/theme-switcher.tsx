
"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Moon, Sun, Monitor } from "lucide-react";
import { useSidebar } from "./ui/sidebar";

type Theme = "light" | "dark" | "system";

export function ThemeSwitcher() {
  const [theme, setTheme] = useState<Theme>("system");
  const { state: sidebarState } = useSidebar();

  useEffect(() => {
    const storedTheme = localStorage.getItem("theme") as Theme | null;
    if (storedTheme) {
      setTheme(storedTheme);
    }
  }, []);

  useEffect(() => {
    if (theme === "system") {
      const systemTheme = window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
      document.documentElement.classList.toggle("dark", systemTheme === "dark");
    } else {
      document.documentElement.classList.toggle("dark", theme === "dark");
    }
    localStorage.setItem("theme", theme);
  }, [theme]);

  const handleThemeChange = (newTheme: Theme) => {
    setTheme(newTheme);
  };
  
  const containerClasses = sidebarState === 'collapsed' 
    ? "flex flex-col gap-1"
    : "grid grid-cols-3 gap-1 border rounded-lg p-1";

  const buttonSize = sidebarState === 'collapsed' ? "icon" : "icon";
  const buttonClasses = sidebarState === 'collapsed' ? "h-8 w-8" : "h-7 w-full";


  return (
    <div className={containerClasses}>
        <Button
            variant={theme === 'light' ? "secondary" : "ghost"}
            size={buttonSize}
            className={buttonClasses}
            onClick={() => handleThemeChange("light")}
            aria-label="Light theme"
        >
            <Sun />
        </Button>
        <Button
            variant={theme === 'dark' ? "secondary" : "ghost"}
            size={buttonSize}
            className={buttonClasses}
            onClick={() => handleThemeChange("dark")}
            aria-label="Dark theme"
        >
            <Moon />
        </Button>
        <Button
            variant={theme === 'system' ? "secondary" : "ghost"}
            size={buttonSize}
            className={buttonClasses}
            onClick={() => handleThemeChange("system")}
            aria-label="System theme"
        >
            <Monitor />
        </Button>
    </div>
  );
}
