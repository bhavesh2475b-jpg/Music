import React from 'react';
import { cn } from '../lib/utils';

interface ThemeSwitcherProps {
  currentTheme: string;
  onThemeChange: (theme: string) => void;
}

export const ThemeSwitcher: React.FC<ThemeSwitcherProps> = ({ currentTheme, onThemeChange }) => {
  const themes = [
    { name: 'default', label: 'Default', class: '' },
    { name: 'ocean', label: 'Ocean', class: 'theme-ocean' },
    { name: 'sunset', label: 'Sunset', class: 'theme-sunset' },
  ];

  return (
    <div className="flex gap-2 p-2 bg-[#2B2930] rounded-full">
      {themes.map((theme) => (
        <button
          key={theme.name}
          onClick={() => onThemeChange(theme.name)}
          className={cn(
            "px-4 py-2 rounded-full text-sm font-medium transition-all",
            currentTheme === theme.name 
              ? "bg-[#D0BCFF] text-[#381E72]" 
              : "text-[#CAC4D0] hover:text-[#E6E0E9]"
          )}
        >
          {theme.label}
        </button>
      ))}
    </div>
  );
};
