/**
 * 🎨 THEME SELECTOR - DomainSeek.ai
 *
 * Beautiful, interactive theme selection cards.
 * Each theme has personality, preview, and delightful animations.
 */

'use client';

import { useState } from 'react';
import { THEMES, getAllThemes, type ThemeId } from '@/lib/ai/themes';
import { Check } from 'lucide-react';

interface ThemeSelectorProps {
  selected: ThemeId[];
  onSelectionChange: (themes: ThemeId[]) => void;
  maxSelection?: number;
}

export function ThemeSelector({
  selected,
  onSelectionChange,
  maxSelection = 5,
}: ThemeSelectorProps) {
  const [hoveredTheme, setHoveredTheme] = useState<ThemeId | null>(null);
  const themes = getAllThemes();

  const toggleTheme = (themeId: ThemeId) => {
    const isSelected = selected.includes(themeId);

    if (isSelected) {
      // Deselect
      onSelectionChange(selected.filter(id => id !== themeId));
    } else {
      // Select (if under max)
      if (selected.length < maxSelection) {
        onSelectionChange([...selected, themeId]);
      }
    }
  };

  return (
    <div className="w-full max-w-6xl mx-auto px-6 py-12">
      {/* Header */}
      <div className="text-center mb-10">
        <h2 className="text-3xl md:text-4xl font-bold text-text-primary mb-3">
          Pick Your Vibe
        </h2>
        <p className="text-lg text-text-secondary">
          Select up to {maxSelection} themes to explore{' '}
          <span className="text-brand-blue font-semibold">
            ({selected.length} selected)
          </span>
        </p>
      </div>

      {/* Theme grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {themes.map((theme) => {
          const isSelected = selected.includes(theme.id as ThemeId);
          const isHovered = hoveredTheme === theme.id;
          const isMaxed = selected.length >= maxSelection && !isSelected;

          return (
            <button
              key={theme.id}
              onClick={() => toggleTheme(theme.id as ThemeId)}
              onMouseEnter={() => setHoveredTheme(theme.id as ThemeId)}
              onMouseLeave={() => setHoveredTheme(null)}
              disabled={isMaxed}
              className={`
                relative
                group
                p-8
                bg-brand-card
                border-2
                rounded-card
                text-left
                transition-all duration-normal
                ${isSelected
                  ? 'border-brand-blue shadow-glow-blue scale-105'
                  : 'border-brand-border hover:border-brand-border/50'
                }
                ${isMaxed ? 'opacity-50 cursor-not-allowed' : 'hover:scale-105 cursor-pointer'}
                ${!isSelected && !isMaxed ? 'hover:shadow-card-hover' : ''}
              `}
            >
              {/* Selected indicator */}
              {isSelected && (
                <div className="absolute top-4 right-4 w-8 h-8 bg-brand-blue rounded-full flex items-center justify-center animate-scaleIn">
                  <Check className="w-5 h-5 text-white" />
                </div>
              )}

              {/* Theme emoji with gradient background */}
              <div className={`
                inline-flex items-center justify-center
                w-16 h-16
                bg-gradient-to-br ${theme.gradient}
                rounded-2xl
                mb-4
                transition-transform duration-normal
                ${isHovered && !isMaxed ? 'scale-110 rotate-3' : 'scale-100'}
              `}>
                <span className="text-4xl">{theme.emoji}</span>
              </div>

              {/* Theme name */}
              <h3 className="text-2xl font-bold text-text-primary mb-2">
                {theme.name}
              </h3>

              {/* Description */}
              <p className="text-sm text-text-secondary mb-4">
                {theme.description}
              </p>

              {/* Examples preview */}
              <div className={`
                space-y-1.5
                transition-all duration-normal
                ${isHovered ? 'opacity-100' : 'opacity-60'}
              `}>
                {theme.examples.slice(0, 3).map((example, i) => (
                  <div
                    key={example}
                    className="
                      text-xs text-text-tertiary
                      font-mono
                      px-3 py-1.5
                      bg-brand-dark/50
                      rounded-lg
                      border border-brand-border/30
                      animate-fadeIn
                    "
                    style={{ animationDelay: `${i * 0.05}s` }}
                  >
                    {example}
                  </div>
                ))}
              </div>

              {/* Hover glow effect */}
              {isHovered && !isMaxed && !isSelected && (
                <div className="absolute inset-0 bg-gradient-to-br from-brand-blue/5 to-brand-violet/5 rounded-card pointer-events-none animate-fadeIn" />
              )}
            </button>
          );
        })}
      </div>

      {/* Selection summary */}
      {selected.length > 0 && (
        <div className="mt-10 text-center animate-fadeIn">
          <div className="inline-flex items-center gap-3 px-6 py-3 bg-brand-card border border-brand-border rounded-full">
            <span className="text-sm text-text-secondary">Selected themes:</span>
            {selected.map((themeId) => (
              <div key={themeId} className="flex items-center gap-2">
                <span className="text-lg">{THEMES[themeId].emoji}</span>
                <span className="text-sm font-medium text-text-primary">
                  {THEMES[themeId].name}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
