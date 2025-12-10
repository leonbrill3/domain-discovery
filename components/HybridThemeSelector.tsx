/**
 * 🎨 HYBRID THEME SELECTOR - DomainSeek.ai
 *
 * Three-tier selection system:
 * 1. Curated Vibe Packs (quick start)
 * 2. Horizontal scrollable pills (browse all)
 * 3. Search (power users)
 */

'use client';

import { useState, useMemo } from 'react';
import { Search, X, CheckCircle2 } from 'lucide-react';
import { THEMES, getAllThemes, type ThemeId } from '@/lib/ai/themes';
import { VIBE_PACKS, type VibePack } from '@/lib/ai/all-themes';

interface HybridThemeSelectorProps {
  selected: ThemeId[];
  onSelectionChange: (themes: ThemeId[]) => void;
  maxSelection?: number;
}

export function HybridThemeSelector({
  selected,
  onSelectionChange,
  maxSelection = 10,
}: HybridThemeSelectorProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearch, setShowSearch] = useState(false);

  const allThemes = getAllThemes();

  // Filter themes based on search
  const filteredThemes = useMemo(() => {
    if (!searchQuery) return allThemes;

    const query = searchQuery.toLowerCase();
    return allThemes.filter(theme =>
      theme.name.toLowerCase().includes(query) ||
      theme.description.toLowerCase().includes(query) ||
      theme.keywords.some(k => k.includes(query))
    );
  }, [searchQuery, allThemes]);

  const toggleTheme = (themeId: ThemeId) => {
    const isSelected = selected.includes(themeId);

    if (isSelected) {
      onSelectionChange(selected.filter(id => id !== themeId));
    } else if (selected.length < maxSelection) {
      onSelectionChange([...selected, themeId]);
    }
  };

  const selectVibePack = (pack: VibePack) => {
    // Add all themes from vibe pack (that aren't already selected)
    const newThemes = pack.themes.filter(id => !selected.includes(id as ThemeId));
    const combined = [...selected, ...newThemes].slice(0, maxSelection);
    onSelectionChange(combined as ThemeId[]);
  };

  const clearAll = () => {
    onSelectionChange([]);
  };

  return (
    <div className="w-full">
      {/* Selected Tags */}
      {selected.length > 0 && (
        <div className="mb-6 flex flex-wrap items-center gap-2">
          <span className="text-sm font-semibold text-gray-700">Selected ({selected.length}):</span>
          {selected.map((themeId) => (
            <button
              key={themeId}
              onClick={() => toggleTheme(themeId)}
              className="inline-flex items-center gap-2 px-3 py-1.5 bg-brand-blue text-white rounded-lg text-sm font-medium hover:bg-blue-600 transition-colors"
            >
              <span>{THEMES[themeId].emoji}</span>
              <span>{THEMES[themeId].name}</span>
              <X className="w-3 h-3" />
            </button>
          ))}
          <button
            onClick={clearAll}
            className="text-xs text-gray-500 hover:text-gray-700 underline ml-2"
          >
            Clear all
          </button>
        </div>
      )}

      {/* TIER 1: VIBE PACKS (Curated - Professional Design) */}
      <div className="mb-8">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 font-display">
          ⚡ Quick Start - Pick a Vibe
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {VIBE_PACKS.map((pack) => (
            <button
              key={pack.id}
              onClick={() => selectVibePack(pack)}
              className="group relative p-6 bg-white rounded-xl border-2 border-gray-200 hover:border-brand-blue transition-all hover:shadow-xl text-left"
            >
              {/* Gradient accent bar */}
              <div className={`absolute top-0 left-0 right-0 h-1 rounded-t-xl bg-gradient-to-r ${pack.gradient}`} />

              {/* Content */}
              <div className="text-4xl mb-3">{pack.emoji}</div>
              <h4 className="text-lg font-bold text-gray-900 mb-2 font-display">
                {pack.name}
              </h4>
              <p className="text-sm text-gray-600 mb-3">
                {pack.description}
              </p>

              {/* Theme count */}
              <div className="flex items-center gap-2 text-xs text-gray-500">
                <span className="px-2 py-1 bg-gray-100 rounded-md font-medium">
                  {pack.themes.length} themes
                </span>
              </div>

              {/* Hover effect */}
              <div className={`absolute inset-0 rounded-xl bg-gradient-to-br ${pack.gradient} opacity-0 group-hover:opacity-5 transition-opacity pointer-events-none`} />
            </button>
          ))}
        </div>
      </div>

      {/* TIER 2: HORIZONTAL SCROLLABLE PILLS */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">
            🎭 Or Browse All Themes
          </h3>
          <button
            onClick={() => setShowSearch(!showSearch)}
            className="text-sm text-brand-blue hover:underline flex items-center gap-1"
          >
            <Search className="w-4 h-4" />
            {showSearch ? 'Hide' : 'Search'}
          </button>
        </div>

        {/* Search bar (optional, toggleable) */}
        {showSearch && (
          <div className="mb-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search themes... (e.g., greek, space, nature)"
                className="w-full pl-10 pr-4 py-2 border-2 border-gray-200 rounded-lg text-sm focus:border-brand-blue focus:ring-2 focus:ring-blue-50 outline-none"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
            {searchQuery && (
              <div className="mt-2 text-xs text-gray-500">
                Found {filteredThemes.length} theme{filteredThemes.length !== 1 ? 's' : ''}
              </div>
            )}
          </div>
        )}

        {/* Horizontal scrollable theme pills */}
        <div className="relative">
          <div className="overflow-x-auto pb-4 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
            <div className="flex gap-2 min-w-max">
              {filteredThemes.map((theme) => {
                const isSelected = selected.includes(theme.id as ThemeId);
                const isMaxed = selected.length >= maxSelection && !isSelected;

                return (
                  <button
                    key={theme.id}
                    onClick={() => toggleTheme(theme.id as ThemeId)}
                    disabled={isMaxed}
                    className={`
                      flex-shrink-0
                      inline-flex items-center gap-2
                      px-4 py-2.5
                      rounded-lg
                      border-2
                      text-sm font-medium
                      transition-all
                      ${isSelected
                        ? 'border-brand-blue bg-blue-50 text-brand-blue scale-105 shadow-md'
                        : isMaxed
                        ? 'border-gray-200 bg-gray-50 text-gray-400 cursor-not-allowed opacity-50'
                        : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300 hover:shadow-sm'
                      }
                    `}
                  >
                    <span className="text-lg">{theme.emoji}</span>
                    <span>{theme.name}</span>
                    {isSelected && <CheckCircle2 className="w-4 h-4" />}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Scroll indicators */}
          <div className="absolute right-0 top-0 bottom-4 w-12 bg-gradient-to-l from-white pointer-events-none" />
        </div>

        <div className="text-xs text-gray-500 text-center mt-2">
          ← Scroll to see all {allThemes.length} themes →
        </div>
      </div>

      {/* Selection limit indicator */}
      {selected.length >= maxSelection && (
        <div className="text-sm text-amber-600 bg-amber-50 border border-amber-200 rounded-lg p-3 flex items-center gap-2">
          <span>⚠️</span>
          <span>Maximum {maxSelection} themes selected. Remove some to add others.</span>
        </div>
      )}
    </div>
  );
}
