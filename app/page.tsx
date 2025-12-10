/**
 * 🏠 DOMAINSEEK.AI - Recipe-Based Domain Discovery
 *
 * Horizontal recipe cards for easy comparison
 */

'use client';

import { useState } from 'react';
import { Sparkles, Search, X, Plus, Loader2 } from 'lucide-react';
import { BRAND } from '@/lib/brand';
import { THEMES, type ThemeId } from '@/lib/ai/themes';
import { CharacterRangeSlider } from '@/components/CharacterRangeSlider';
import { Tooltip } from 'react-tooltip';
import { DomainTooltip } from '@/components/DomainTooltip';
import { DomainDetailsModal } from '@/components/DomainDetailsModal';
import type { DomainAnalysis } from '@/lib/ai/ranking';

interface Recipe {
  id: string;
  themes: ThemeId[];
  domains?: DomainResult[];
  isGenerating?: boolean;
}

interface DomainResult {
  domain: string;
  available: boolean;
  price?: number;
  confidence: number;
  analysis?: DomainAnalysis;
}

export default function HomePage() {
  const [project, setProject] = useState('');
  const [recipes, setRecipes] = useState<Recipe[]>([
    { id: '1', themes: [] },
    { id: '2', themes: [] },
    { id: '3', themes: [] },
  ]);
  const [activeRecipeId, setActiveRecipeId] = useState('1');
  const [selectedTLDs, setSelectedTLDs] = useState<string[]>(['com', 'io', 'ai']);
  const [charRange, setCharRange] = useState<[number, number]>([4, 10]);
  const [selectedDomain, setSelectedDomain] = useState<DomainResult | null>(null);
  const [hoveredDomain, setHoveredDomain] = useState<string | null>(null);

  const activeRecipe = recipes.find(r => r.id === activeRecipeId) || recipes[0];

  const addRecipe = () => {
    const newId = String(Date.now());
    setRecipes([...recipes, { id: newId, themes: [] }]);
    setActiveRecipeId(newId);
  };

  const removeRecipe = (recipeId: string) => {
    if (recipes.length === 1) return;
    const newRecipes = recipes.filter(r => r.id !== recipeId);
    setRecipes(newRecipes);
    if (activeRecipeId === recipeId) {
      setActiveRecipeId(newRecipes[0].id);
    }
  };

  const toggleTheme = (themeId: ThemeId) => {
    const newRecipes = recipes.map(r => {
      if (r.id === activeRecipeId) {
        const hasTheme = r.themes.includes(themeId);
        return {
          ...r,
          themes: hasTheme
            ? r.themes.filter(id => id !== themeId)
            : [...r.themes, themeId].slice(0, 10)
        };
      }
      return r;
    });
    setRecipes(newRecipes);
  };

  const toggleTLD = (tld: string) => {
    setSelectedTLDs(prev =>
      prev.includes(tld) ? prev.filter(t => t !== tld) : [...prev, tld]
    );
  };

  const generateRecipe = async (recipeId: string) => {
    const recipe = recipes.find(r => r.id === recipeId);
    if (!recipe || recipe.themes.length === 0 || !project.trim()) return;

    // Set generating state
    setRecipes(recipes.map(r =>
      r.id === recipeId ? { ...r, isGenerating: true, domains: [] } : r
    ));

    try {
      const response = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          project,
          themes: recipe.themes,
          countPerTheme: Math.ceil(5 / recipe.themes.length),
          charMin: charRange[0],
          charMax: charRange[1],
          tlds: selectedTLDs,
        }),
      });

      const data = await response.json();
      console.log('API Response for recipe:', recipeId, data);

      if (data.success && data.data && data.data.themes) {
        const allDomains = Object.values(data.data.themes).flat() as DomainResult[];
        console.log('All domains:', allDomains);
        console.log('Available domains:', allDomains.filter(d => d.available));

        // SAFETY: Double-check that we only show available domains with high confidence
        // This is a backup filter in case API doesn't filter properly
        const MIN_CONFIDENCE = 0.95;
        const availableDomains = allDomains.filter(
          d => d.available && d.confidence >= MIN_CONFIDENCE
        );

        console.log(`[Frontend] Strict filter: ${availableDomains.length}/${allDomains.length} domains passed (≥${MIN_CONFIDENCE} confidence)`);

        // Get AI analysis for available domains
        if (availableDomains.length > 0) {
          try {
            const analysisResponse = await fetch('/api/analyze', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                domains: availableDomains.map(d => d.domain),
                project,
              }),
            });

            const analysisData = await analysisResponse.json();

            if (analysisData.success && analysisData.analyses) {
              // Merge analysis into domain results
              availableDomains.forEach(domain => {
                const analysis = analysisData.analyses.find((a: DomainAnalysis) => a.domain === domain.domain);
                if (analysis) {
                  domain.analysis = analysis;
                }
              });
            }
          } catch (error) {
            console.warn('Analysis failed, showing domains without analysis:', error);
          }
        }

        setRecipes(prevRecipes => prevRecipes.map(r =>
          r.id === recipeId
            ? { ...r, isGenerating: false, domains: availableDomains }
            : r
        ));
      } else {
        console.error('API returned unexpected format:', data);
        // Handle error case - stop spinning
        setRecipes(prevRecipes => prevRecipes.map(r =>
          r.id === recipeId ? { ...r, isGenerating: false } : r
        ));
      }
    } catch (error) {
      console.error('Generation error:', error);
      setRecipes(prevRecipes => prevRecipes.map(r =>
        r.id === recipeId ? { ...r, isGenerating: false } : r
      ));
    }
  };

  const generateAllRecipes = async () => {
    const validRecipes = recipes.filter(r => r.themes.length > 0);
    for (const recipe of validRecipes) {
      await generateRecipe(recipe.id);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50">
      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-5xl font-bold text-gray-900 mb-3 font-display">
            Find Your Perfect{' '}
            <span className="bg-gradient-to-r from-brand-blue to-brand-violet bg-clip-text text-transparent">
              Domain
            </span>
          </h1>
          <p className="text-gray-600">Compare different theme combinations side-by-side</p>
        </div>

        {/* Search Input */}
        <div className="mb-6">
          <div className="relative max-w-3xl mx-auto">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              value={project}
              onChange={(e) => setProject(e.target.value)}
              placeholder="What will you build? (e.g., yoga studio for prenatal mothers)"
              className="w-full pl-12 pr-4 py-4 border-2 border-gray-300 rounded-xl focus:border-brand-blue focus:ring-4 focus:ring-blue-50 outline-none text-base shadow-sm"
            />
          </div>
          <div className="mt-3 flex justify-center flex-wrap gap-2 text-xs">
            <span className="text-gray-500">Try:</span>
            {[
              'yoga beach retreat',
              'tech consulting for startups',
              'organic meal prep service',
            ].map((ex) => (
              <button
                key={ex}
                onClick={() => setProject(ex)}
                className="px-3 py-1.5 bg-white hover:bg-gray-100 border border-gray-300 rounded-lg text-gray-700 transition-colors"
              >
                {ex}
              </button>
            ))}
          </div>
        </div>

        {/* TLDs & Character Length - Compact Row */}
        <div className="mb-8 max-w-3xl mx-auto">
          <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-200">
            <div className="grid grid-cols-2 gap-6">
              {/* TLDs */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-2">TLDs:</label>
                <div className="flex flex-wrap gap-1.5">
                  {[
                    { tld: 'com', price: '$13' },
                    { tld: 'ai', price: '$30' },
                    { tld: 'io', price: '$35' },
                    { tld: 'app', price: '$15' },
                    { tld: 'dev', price: '$13' },
                  ].map(({ tld, price }) => {
                    const isSelected = selectedTLDs.includes(tld);
                    return (
                      <button
                        key={tld}
                        onClick={() => toggleTLD(tld)}
                        className={`
                          px-2.5 py-1 rounded-md border text-xs font-mono transition-all
                          ${isSelected
                            ? 'border-brand-blue bg-blue-50 text-brand-blue font-semibold'
                            : 'border-gray-300 bg-white text-gray-700 hover:border-gray-400'
                          }
                        `}
                      >
                        .{tld} {price}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Character Range */}
              <div>
                <CharacterRangeSlider
                  min={3}
                  max={15}
                  value={charRange}
                  onChange={setCharRange}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Theme Selector */}
        <div className="mb-8 bg-white rounded-xl shadow-sm p-6 border border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-gray-900">
              🎨 Select Themes
            </h2>
            <div className="text-sm text-gray-600">
              Adding to: <span className="font-semibold text-brand-blue">Recipe {recipes.findIndex(r => r.id === activeRecipeId) + 1}</span>
            </div>
          </div>

          <div className="overflow-x-auto">
            <div className="flex gap-2 pb-2">
              {Object.values(THEMES).map((theme) => {
                const isSelected = activeRecipe.themes.includes(theme.id as ThemeId);
                return (
                  <button
                    key={theme.id}
                    onClick={() => toggleTheme(theme.id as ThemeId)}
                    className={`
                      flex-shrink-0 inline-flex items-center gap-2 px-4 py-2.5 rounded-lg border-2 text-sm font-medium transition-all
                      ${isSelected
                        ? 'border-brand-blue bg-blue-50 text-brand-blue shadow-md scale-105'
                        : 'border-gray-300 bg-white text-gray-700 hover:border-gray-400 hover:shadow-sm'
                      }
                    `}
                  >
                    <span className="text-lg">{theme.emoji}</span>
                    <span>{theme.name}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Recipe Cards - Horizontal Layout */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-gray-900">🍳 Your Domain Recipes</h2>
            <button
              onClick={addRecipe}
              className="inline-flex items-center gap-2 px-4 py-2 bg-brand-blue text-white rounded-lg hover:bg-blue-600 transition-colors text-sm font-medium shadow-sm"
            >
              <Plus className="w-4 h-4" />
              Add Recipe
            </button>
          </div>

          <div className="overflow-x-auto pb-4">
            <div className="flex gap-4 min-w-max">
              {recipes.map((recipe, index) => {
                const isActive = recipe.id === activeRecipeId;
                const hasThemes = recipe.themes.length > 0;
                const domainCount = recipe.domains?.length || 0;

                return (
                  <div
                    key={recipe.id}
                    onClick={() => setActiveRecipeId(recipe.id)}
                    className={`
                      w-80 bg-white rounded-xl shadow-md border-2 transition-all cursor-pointer
                      ${isActive ? 'border-brand-blue ring-4 ring-blue-100' : 'border-gray-200 hover:border-gray-300'}
                    `}
                  >
                    {/* Card Header */}
                    <div className="p-4 border-b border-gray-200">
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="font-bold text-gray-900 flex items-center gap-2">
                          Recipe {index + 1}
                          {isActive && (
                            <span className="px-2 py-0.5 bg-brand-blue text-white text-xs rounded-full">
                              Editing
                            </span>
                          )}
                        </h3>
                        {recipes.length > 1 && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              removeRecipe(recipe.id);
                            }}
                            className="p-1 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        )}
                      </div>

                      {/* Themes */}
                      {hasThemes ? (
                        <div className="flex flex-wrap gap-1.5 mb-3">
                          {recipe.themes.map((themeId) => (
                            <span
                              key={themeId}
                              className="inline-flex items-center gap-1 px-2 py-1 bg-blue-50 border border-blue-200 rounded text-xs font-medium"
                            >
                              <span>{THEMES[themeId].emoji}</span>
                              <span>{THEMES[themeId].name}</span>
                            </span>
                          ))}
                        </div>
                      ) : (
                        <div className="text-sm text-gray-500 mb-3">
                          {isActive ? 'Select themes above ↑' : 'No themes selected'}
                        </div>
                      )}

                      {/* Stats */}
                      <div className="flex gap-3 text-xs text-gray-600">
                        <span>📊 {recipe.themes.length} theme{recipe.themes.length !== 1 ? 's' : ''}</span>
                        <span>•</span>
                        <span>🌐 {domainCount} domain{domainCount !== 1 ? 's' : ''}</span>
                      </div>
                    </div>

                    {/* Results */}
                    <div className="p-4 min-h-[200px] max-h-[400px] overflow-y-auto">
                      {recipe.isGenerating ? (
                        <div className="flex flex-col items-center justify-center h-40 text-gray-500">
                          <Loader2 className="w-8 h-8 animate-spin text-brand-blue mb-2" />
                          <p className="text-sm">Generating domains...</p>
                        </div>
                      ) : recipe.domains && recipe.domains.length > 0 ? (
                        <div className="space-y-2">
                          {recipe.domains.map((domainResult) => (
                            <div
                              key={domainResult.domain}
                              data-tooltip-id={`tooltip-${domainResult.domain}`}
                              className="flex items-center justify-between p-2 hover:bg-blue-50 rounded-lg transition-colors group cursor-pointer"
                              onClick={() => setSelectedDomain(domainResult)}
                              onMouseEnter={() => setHoveredDomain(domainResult.domain)}
                              onMouseLeave={() => setHoveredDomain(null)}
                            >
                              <div className="flex items-center gap-2 flex-1 min-w-0">
                                <span className="text-sm font-mono text-gray-900 truncate group-hover:text-brand-blue font-medium transition-colors">
                                  {domainResult.domain}
                                </span>
                                {domainResult.analysis && (
                                  <span className="text-xs font-semibold text-brand-blue">
                                    {domainResult.analysis.overallScore.toFixed(1)}
                                  </span>
                                )}
                              </div>
                              <a
                                href={`https://www.namecheap.com/domains/registration/results/?domain=${domainResult.domain}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex-shrink-0 px-3 py-1.5 bg-gradient-to-r from-brand-blue to-brand-violet text-white text-xs font-bold rounded-md hover:shadow-lg hover:scale-105 transition-all"
                                onClick={(e) => e.stopPropagation()}
                              >
                                💎 ${domainResult.price || 13}
                              </a>

                              {/* Tooltip */}
                              {hoveredDomain === domainResult.domain && domainResult.analysis && (
                                <Tooltip
                                  id={`tooltip-${domainResult.domain}`}
                                  place="left"
                                  className="!p-0 !opacity-100 !bg-transparent !border-0"
                                >
                                  <DomainTooltip
                                    domain={domainResult.domain}
                                    analysis={domainResult.analysis}
                                  />
                                </Tooltip>
                              )}
                            </div>
                          ))}
                        </div>
                      ) : recipe.domains && recipe.domains.length === 0 ? (
                        <div className="flex items-center justify-center h-40 text-amber-600 text-sm text-center bg-amber-50 rounded-lg border border-amber-200">
                          <div>
                            <p className="font-semibold mb-1">No available domains found</p>
                            <p className="text-xs">Try different themes or settings</p>
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-center justify-center h-40 text-gray-400 text-sm text-center">
                          {hasThemes ? (
                            <div>
                              <p className="mb-2">Ready to generate!</p>
                              <p className="text-xs">Click generate below</p>
                            </div>
                          ) : (
                            <p>Add themes above to get started</p>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Generate Button */}
                    <div className="p-4 border-t border-gray-200">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          generateRecipe(recipe.id);
                        }}
                        disabled={!hasThemes || !project.trim() || recipe.isGenerating}
                        className={`
                          w-full py-2.5 rounded-lg font-semibold text-sm transition-all flex items-center justify-center gap-2
                          ${hasThemes && project.trim() && !recipe.isGenerating
                            ? 'bg-brand-blue text-white hover:bg-blue-600 shadow-sm'
                            : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                          }
                        `}
                      >
                        {recipe.isGenerating ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            Generating...
                          </>
                        ) : (
                          <>
                            <Sparkles className="w-4 h-4" />
                            Generate
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>


        {/* Generate All Button */}
        <div className="text-center">
          <button
            onClick={generateAllRecipes}
            disabled={!project.trim() || !recipes.some(r => r.themes.length > 0)}
            className={`
              px-8 py-4 rounded-xl font-bold text-base transition-all inline-flex items-center gap-3 shadow-lg
              ${project.trim() && recipes.some(r => r.themes.length > 0)
                ? 'bg-gradient-to-r from-brand-blue to-brand-violet text-white hover:shadow-xl hover:scale-105'
                : 'bg-gray-200 text-gray-400 cursor-not-allowed'
              }
            `}
          >
            <Sparkles className="w-5 h-5" />
            Generate All Recipes
            <Sparkles className="w-5 h-5" />
          </button>
        </div>
      </main>

      {/* Footer */}
      <footer className="text-center py-6 text-xs text-gray-500 border-t border-gray-200 mt-12">
        Powered by AI • {BRAND.fullName}
      </footer>

      {/* Domain Details Modal */}
      {selectedDomain && selectedDomain.analysis && (
        <DomainDetailsModal
          domain={selectedDomain.domain}
          price={selectedDomain.price || 13}
          analysis={selectedDomain.analysis}
          onClose={() => setSelectedDomain(null)}
          onBuy={() => {
            window.open(
              `https://www.namecheap.com/domains/registration/results/?domain=${selectedDomain.domain}`,
              '_blank'
            );
          }}
        />
      )}
    </div>
  );
}
