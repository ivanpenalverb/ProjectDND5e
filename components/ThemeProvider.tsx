"use client";
import React, { useEffect, useState } from "react";
import { useUiStore } from "@/store/useUiStore";

export const ThemeProvider = ({ children }: { children: React.ReactNode }) => {
  const currentTheme = useUiStore((state) => state.currentTheme);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    
    // Remove all possible theme classes from html
    document.documentElement.classList.remove(
      "theme-obsidian",
      "theme-parchment",
      "theme-arcane"
    );
    
    // Add the selected theme class
    document.documentElement.classList.add(`theme-${currentTheme}`);
  }, [currentTheme, mounted]);

  // Optionally ensure the body element updates seamlessly during hydration by letting the 
  // background transition naturally via CSS without doing a complete page re-render.
  
  return <>{children}</>;
};
