/**
 * 🏠 DOMAINSEEK.AI - Single Page Domain Discovery
 *
 * Features:
 * - Search Directions: Multiple vibe combos in one search
 * - Streaming results: Domains appear as found
 * - Never repeat: localStorage tracks seen domains
 * - Hover tooltip + Click modal
 * - Persistent saves
 */

'use client';

import { useState, useMemo, useEffect, useCallback } from 'react';
import { Sparkles, Search, Heart, ExternalLink, Loader2, Plus, X, SlidersHorizontal, ChevronDown } from 'lucide-react';
import { THEMES, type ThemeId } from '@/lib/ai/themes';
import { CharacterRangeSlider } from '@/components/CharacterRangeSlider';
import { DomainDetailsModal } from '@/components/DomainDetailsModal';
import { DomainTooltip } from '@/components/DomainTooltip';
import { AdminAlert } from '@/components/AdminAlert';
import { Tooltip } from 'react-tooltip';
import type { DomainAnalysis } from '@/lib/ai/ranking';

// Curated vibes for the chip selector
const VIBE_CHIPS: { id: ThemeId; emoji: string; name: string }[] = [
  { id: 'catchy', emoji: '🎯', name: 'Catchy' },
  { id: 'direct', emoji: '💼', name: 'Direct' },
  { id: 'nature', emoji: '🌿', name: 'Nature' },
  { id: 'tech', emoji: '⚡', name: 'Tech' },
  { id: 'gen-z', emoji: '✨', name: 'Modern' },
  { id: 'ancient-greek', emoji: '🏛️', name: 'Greek' },
  { id: 'roman', emoji: '⚔️', name: 'Roman' },
  { id: 'norse', emoji: '🪓', name: 'Norse' },
  { id: 'astrology', emoji: '⭐', name: 'Astrology' },
  { id: 'ocean', emoji: '🌊', name: 'Ocean' },
  { id: 'solar-system', emoji: '🌞', name: 'Cosmic' },
  { id: 'abstract', emoji: '🎭', name: 'Abstract' },
  { id: 'literary', emoji: '📚', name: 'Literary' },
  { id: 'music', emoji: '🎵', name: 'Music' },
  { id: 'art', emoji: '🎨', name: 'Art' },
  { id: 'gaming', emoji: '🎮', name: 'Gaming' },
];

interface SearchDirection {
  id: string;
  vibes: ThemeId[];
}

interface DomainResult {
  domain: string;
  available: boolean;
  price?: number;
  confidence: number;
  analysis?: DomainAnalysis;
  previouslyRegistered?: boolean;
  lastSnapshot?: string;
  directionId: string;
  directionVibes: ThemeId[];
}

// Helper to get vibe display info
const getVibeInfo = (vibeId: ThemeId) => {
  const chip = VIBE_CHIPS.find(v => v.id === vibeId);
  if (chip) return chip;
  const theme = THEMES[vibeId];
  return { id: vibeId, emoji: theme.emoji, name: theme.name };
};

// Format direction for display
const formatDirection = (vibes: ThemeId[]) => {
  return vibes.map(v => getVibeInfo(v).emoji).join('+');
};

const formatDirectionFull = (vibes: ThemeId[]) => {
  return vibes.map(v => `${getVibeInfo(v).emoji} ${getVibeInfo(v).name}`).join(' + ');
};

export default function HomePage() {
  // Project input
  const [project, setProject] = useState('');

  // Search directions
  const [directions, setDirections] = useState<SearchDirection[]>([]);
  const [buildingVibes, setBuildingVibes] = useState<ThemeId[]>([]);

  // Settings
  const [selectedTLDs, setSelectedTLDs] = useState<string[]>(['com', 'ai']);
  const [charRange, setCharRange] = useState<[number, number]>([4, 12]);
  const [showSettings, setShowSettings] = useState(false);

  // Results
  const [domains, setDomains] = useState<DomainResult[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatingDirections, setGeneratingDirections] = useState<Set<string>>(new Set());

  // Seen domains (localStorage)
  const [seenDomains, setSeenDomains] = useState<Set<string>>(new Set());

  // Saved domains
  const [savedDomains, setSavedDomains] = useState<DomainResult[]>([]);

  // Filters
  const [activeFilters, setActiveFilters] = useState<{
    maxLength?: number;
    directionId?: string;
    tldFilter?: string;
  }>({});

  // Modal state
  const [selectedDomain, setSelectedDomain] = useState<DomainResult | null>(null);
  const [loadingAnalysis, setLoadingAnalysis] = useState(false);
  const [hoveredDomain, setHoveredDomain] = useState<string | null>(null);

  // Load seen/saved domains from localStorage on mount
  useEffect(() => {
    const seen = localStorage.getItem('domainseek_seen');
    if (seen) {
      try {
        setSeenDomains(new Set(JSON.parse(seen)));
      } catch (e) {
        console.warn('Failed to parse seen domains:', e);
      }
    }

    const saved = localStorage.getItem('domainseek_saved');
    if (saved) {
      try {
        setSavedDomains(JSON.parse(saved));
      } catch (e) {
        console.warn('Failed to parse saved domains:', e);
      }
    }
  }, []);

  // Save to localStorage when seenDomains changes
  useEffect(() => {
    if (seenDomains.size > 0) {
      localStorage.setItem('domainseek_seen', JSON.stringify(Array.from(seenDomains)));
    }
  }, [seenDomains]);

  // Save to localStorage when savedDomains changes
  useEffect(() => {
    localStorage.setItem('domainseek_saved', JSON.stringify(savedDomains));
  }, [savedDomains]);

  // Filter domains
  const filteredDomains = useMemo(() => {
    let result = domains;

    if (activeFilters.maxLength) {
      result = result.filter(d => d.domain.split('.')[0].length <= activeFilters.maxLength!);
    }
    if (activeFilters.directionId) {
      result = result.filter(d => d.directionId === activeFilters.directionId);
    }
    if (activeFilters.tldFilter) {
      result = result.filter(d => d.domain.endsWith(`.${activeFilters.tldFilter}`));
    }

    return result;
  }, [domains, activeFilters]);

  // Toggle vibe in building direction
  const toggleBuildingVibe = (vibeId: ThemeId) => {
    setBuildingVibes(prev =>
      prev.includes(vibeId)
        ? prev.filter(v => v !== vibeId)
        : [...prev, vibeId]
    );
  };

  // Add current building vibes as a new direction
  const addDirection = () => {
    if (buildingVibes.length === 0) return;

    const newDirection: SearchDirection = {
      id: `dir-${Date.now()}`,
      vibes: [...buildingVibes],
    };

    setDirections(prev => [...prev, newDirection]);
    setBuildingVibes([]);
  };

  // Remove a direction
  const removeDirection = (directionId: string) => {
    setDirections(prev => prev.filter(d => d.id !== directionId));
  };

  // Toggle save domain
  const toggleSave = (domain: DomainResult) => {
    setSavedDomains(prev => {
      const exists = prev.some(d => d.domain === domain.domain);
      if (exists) {
        return prev.filter(d => d.domain !== domain.domain);
      }
      return [...prev, domain];
    });
  };

  const isSaved = (domain: string) => savedDomains.some(d => d.domain === domain);

  // Generate domains for a single direction
  const generateForDirection = useCallback(async (direction: SearchDirection, existingDomains: Set<string>) => {
    try {
      const response = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          project,
          themes: direction.vibes,
          countPerTheme: 25,
          charMin: charRange[0],
          charMax: charRange[1],
          tlds: selectedTLDs,
        }),
      });

      const data = await response.json();

      if (data.success && data.data?.themes) {
        const themeDomains = Object.values(data.data.themes).flat() as DomainResult[];
        const available = themeDomains
          .filter(d => d.available && d.confidence >= 0.95)
          .filter(d => !existingDomains.has(d.domain) && !seenDomains.has(d.domain))
          .map(d => ({
            ...d,
            directionId: direction.id,
            directionVibes: direction.vibes,
          }));

        return available;
      }
    } catch (error) {
      console.error(`Generation error for direction ${direction.id}:`, error);
    }

    return [];
  }, [project, charRange, selectedTLDs, seenDomains]);

  // Get AI analysis for domains
  const getAnalysis = useCallback(async (domainsToAnalyze: DomainResult[]) => {
    if (domainsToAnalyze.length === 0) return domainsToAnalyze;

    try {
      const response = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          domains: domainsToAnalyze.map(d => d.domain),
          project,
        }),
      });

      const data = await response.json();

      if (data.success && data.analyses) {
        domainsToAnalyze.forEach(domain => {
          const analysis = data.analyses.find((a: DomainAnalysis) => a.domain === domain.domain);
          if (analysis) {
            domain.analysis = analysis;
          }
        });
      }
    } catch (error) {
      console.warn('Analysis failed:', error);
    }

    return domainsToAnalyze;
  }, [project]);

  // Main generate function - runs all directions in parallel, streams results
  const generateDomains = async (append = false) => {
    if (directions.length === 0 || !project.trim()) return;

    setIsGenerating(true);
    if (!append) {
      setDomains([]);
      setActiveFilters({});
    }

    const existingDomains = new Set(domains.map(d => d.domain));

    // Track which directions are generating
    setGeneratingDirections(new Set(directions.map(d => d.id)));

    // Run all directions in parallel
    const results = await Promise.all(
      directions.map(async (direction) => {
        const directionDomains = await generateForDirection(direction, existingDomains);

        // Add to existing domains set to prevent duplicates across directions
        directionDomains.forEach(d => existingDomains.add(d.domain));

        // Get analysis
        const analyzed = await getAnalysis(directionDomains);

        // Update state immediately (streaming effect)
        setDomains(prev => {
          const newDomains = [...prev, ...analyzed];
          // Sort by score
          newDomains.sort((a, b) => {
            const scoreA = a.analysis?.overallScore || 0;
            const scoreB = b.analysis?.overallScore || 0;
            return scoreB - scoreA;
          });
          return newDomains;
        });

        // Mark direction as done
        setGeneratingDirections(prev => {
          const next = new Set(prev);
          next.delete(direction.id);
          return next;
        });

        // Add to seen domains
        setSeenDomains(prev => {
          const next = new Set(prev);
          analyzed.forEach(d => next.add(d.domain));
          return next;
        });

        return analyzed;
      })
    );

    setIsGenerating(false);
  };

  // Handle domain click for modal
  const handleDomainClick = async (domainResult: DomainResult) => {
    if (domainResult.analysis) {
      setSelectedDomain(domainResult);
      return;
    }

    setLoadingAnalysis(true);
    setSelectedDomain(domainResult);

    try {
      const response = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          domains: [domainResult.domain],
          project: project || 'general brand',
        }),
      });

      const data = await response.json();

      if (data.success && data.analyses?.[0]) {
        setSelectedDomain({ ...domainResult, analysis: data.analyses[0] });
      }
    } catch (error) {
      console.error('Analysis error:', error);
    } finally {
      setLoadingAnalysis(false);
    }
  };

  // Toggle filter
  const toggleFilter = (filterType: 'maxLength' | 'directionId' | 'tldFilter', value: number | string) => {
    setActiveFilters(prev => {
      if (prev[filterType] === value) {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { [filterType]: _, ...rest } = prev;
        return rest;
      }
      return { ...prev, [filterType]: value };
    });
  };

  // Get unique directions from results for filter chips
  const resultDirections = useMemo(() => {
    const dirs = new Map<string, ThemeId[]>();
    domains.forEach(d => {
      if (!dirs.has(d.directionId)) {
        dirs.set(d.directionId, d.directionVibes);
      }
    });
    return dirs;
  }, [domains]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50">
      <AdminAlert />

      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-6 py-4">
          <h1 className="text-2xl font-bold text-gray-900">
            Domain<span className="text-brand-blue">Seek</span>
          </h1>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-8">
        {/* Project Input */}
        <div className="mb-8">
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            What are you building?
          </label>
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              value={project}
              onChange={(e) => setProject(e.target.value)}
              placeholder="e.g., coffee subscription startup"
              className="w-full pl-12 pr-4 py-3 border-2 border-gray-300 rounded-xl focus:border-brand-blue focus:ring-4 focus:ring-blue-50 outline-none text-base"
            />
          </div>
        </div>

        {/* Search Directions */}
        <div className="mb-6 p-6 bg-white rounded-xl border border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-gray-900">Search Directions</h2>
            {buildingVibes.length > 0 && (
              <button
                onClick={addDirection}
                className="flex items-center gap-2 px-3 py-1.5 bg-brand-blue text-white rounded-lg text-sm font-medium hover:bg-blue-600 transition-colors"
              >
                <Plus className="w-4 h-4" />
                Add Direction
              </button>
            )}
          </div>

          {/* Existing Directions */}
          {directions.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-4">
              {directions.map((dir) => (
                <div
                  key={dir.id}
                  className="flex items-center gap-2 px-3 py-2 bg-blue-50 border border-blue-200 rounded-lg"
                >
                  <span className="text-sm font-medium">
                    {formatDirectionFull(dir.vibes)}
                  </span>
                  <button
                    onClick={() => removeDirection(dir.id)}
                    className="text-gray-400 hover:text-red-500 transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Building Direction Preview */}
          {buildingVibes.length > 0 && (
            <div className="flex items-center gap-2 mb-4 p-3 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
              <span className="text-sm text-gray-500">Building:</span>
              <span className="text-sm font-medium">
                {formatDirectionFull(buildingVibes)}
              </span>
            </div>
          )}

          {/* Vibe Chips */}
          <div className="flex flex-wrap gap-2">
            {VIBE_CHIPS.map((vibe) => {
              const isSelected = buildingVibes.includes(vibe.id);
              return (
                <button
                  key={vibe.id}
                  onClick={() => toggleBuildingVibe(vibe.id)}
                  className={`
                    px-3 py-2 rounded-lg border text-sm font-medium transition-all
                    ${isSelected
                      ? 'border-brand-blue bg-blue-50 text-brand-blue'
                      : 'border-gray-300 bg-white text-gray-700 hover:border-gray-400'
                    }
                  `}
                >
                  {vibe.emoji} {vibe.name}
                </button>
              );
            })}
          </div>

          {directions.length === 0 && buildingVibes.length === 0 && (
            <p className="text-sm text-gray-500 mt-3">
              Click vibes to build a search direction, then click "Add Direction"
            </p>
          )}
        </div>

        {/* Settings Row */}
        <div className="mb-6 flex items-center gap-4">
          {/* TLDs */}
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600">TLDs:</span>
            {[
              { tld: 'com', price: '$13' },
              { tld: 'ai', price: '$70' },
              { tld: 'io', price: '$35' },
            ].map(({ tld, price }) => (
              <button
                key={tld}
                onClick={() => setSelectedTLDs(prev =>
                  prev.includes(tld)
                    ? prev.length > 1 ? prev.filter(t => t !== tld) : prev
                    : [...prev, tld]
                )}
                className={`
                  px-2 py-1 rounded text-xs font-mono transition-all
                  ${selectedTLDs.includes(tld)
                    ? 'bg-brand-blue text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }
                `}
              >
                .{tld}
              </button>
            ))}
          </div>

          {/* More Settings Toggle */}
          <button
            onClick={() => setShowSettings(!showSettings)}
            className="flex items-center gap-1 text-sm text-gray-600 hover:text-gray-900"
          >
            <SlidersHorizontal className="w-4 h-4" />
            More
            <ChevronDown className={`w-3 h-3 transition-transform ${showSettings ? 'rotate-180' : ''}`} />
          </button>

          {/* Generate Button */}
          <button
            onClick={() => generateDomains(false)}
            disabled={directions.length === 0 || !project.trim() || isGenerating}
            className={`
              ml-auto px-6 py-2.5 rounded-xl font-bold text-sm transition-all flex items-center gap-2
              ${directions.length > 0 && project.trim() && !isGenerating
                ? 'bg-gradient-to-r from-brand-blue to-brand-violet text-white hover:shadow-lg hover:scale-[1.02]'
                : 'bg-gray-200 text-gray-400 cursor-not-allowed'
              }
            `}
          >
            {isGenerating ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                Generate Domains
              </>
            )}
          </button>
        </div>

        {/* Expanded Settings */}
        {showSettings && (
          <div className="mb-6 p-4 bg-white rounded-xl border border-gray-200">
            <CharacterRangeSlider
              min={3}
              max={15}
              value={charRange}
              onChange={setCharRange}
            />
          </div>
        )}

        {/* Results Section */}
        {(domains.length > 0 || isGenerating) && (
          <>
            {/* Results Header */}
            <div className="flex items-center justify-between mb-4">
              <p className="text-gray-600">
                <span className="font-bold text-gray-900">{filteredDomains.length}</span>
                {filteredDomains.length !== domains.length && (
                  <span className="text-gray-500"> of {domains.length}</span>
                )}
                {' '}domains found
                {generatingDirections.size > 0 && (
                  <span className="text-brand-blue ml-2">
                    <Loader2 className="w-4 h-4 animate-spin inline mr-1" />
                    Loading more...
                  </span>
                )}
              </p>
            </div>

            {/* Refinement Chips */}
            {domains.length > 0 && (
              <div className="flex items-center gap-2 flex-wrap mb-6">
                <span className="text-sm text-gray-500">Refine:</span>

                <button
                  onClick={() => toggleFilter('maxLength', 6)}
                  className={`px-3 py-1.5 rounded-full text-sm transition-all ${
                    activeFilters.maxLength === 6
                      ? 'bg-brand-blue text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  Short (≤6)
                </button>

                {selectedTLDs.map(tld => (
                  <button
                    key={tld}
                    onClick={() => toggleFilter('tldFilter', tld)}
                    className={`px-3 py-1.5 rounded-full text-sm font-mono transition-all ${
                      activeFilters.tldFilter === tld
                        ? 'bg-brand-blue text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    .{tld}
                  </button>
                ))}

                {Array.from(resultDirections.entries()).map(([dirId, vibes]) => (
                  <button
                    key={dirId}
                    onClick={() => toggleFilter('directionId', dirId)}
                    className={`px-3 py-1.5 rounded-full text-sm transition-all ${
                      activeFilters.directionId === dirId
                        ? 'bg-brand-blue text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {formatDirection(vibes)}
                  </button>
                ))}

                {Object.keys(activeFilters).length > 0 && (
                  <button
                    onClick={() => setActiveFilters({})}
                    className="px-3 py-1.5 text-sm text-gray-500 hover:text-gray-700"
                  >
                    Clear
                  </button>
                )}
              </div>
            )}

            {/* Domain Grid */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mb-8">
              {filteredDomains.map((domain) => {
                const saved = isSaved(domain.domain);

                return (
                  <div
                    key={domain.domain}
                    data-tooltip-id={`tooltip-${domain.domain}`}
                    className="bg-white rounded-xl border border-gray-200 p-4 hover:shadow-lg hover:border-brand-blue/50 transition-all group cursor-pointer"
                    onClick={() => handleDomainClick(domain)}
                    onMouseEnter={() => setHoveredDomain(domain.domain)}
                    onMouseLeave={() => setHoveredDomain(null)}
                  >
                    {/* Domain Name */}
                    <div className="font-mono font-bold text-gray-900 mb-2 truncate group-hover:text-brand-blue transition-colors">
                      {domain.domain}
                    </div>

                    {/* Score & Direction Tag */}
                    <div className="flex items-center gap-2 mb-3">
                      {domain.analysis && (
                        <span className="text-lg font-bold text-brand-blue">
                          {domain.analysis.overallScore.toFixed(1)}
                        </span>
                      )}
                      <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-600">
                        {formatDirection(domain.directionVibes)}
                      </span>
                      {domain.previouslyRegistered && (
                        <span className="text-xs px-1.5 py-0.5 bg-amber-100 text-amber-700 rounded">
                          ♻️
                        </span>
                      )}
                    </div>

                    {/* Price & Actions */}
                    <div className="flex items-center justify-between">
                      <a
                        href={`https://www.namecheap.com/domains/registration/results/?domain=${domain.domain}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="px-3 py-1.5 bg-gradient-to-r from-brand-blue to-brand-violet text-white text-sm font-bold rounded-lg hover:shadow-md transition-all"
                      >
                        ${domain.price || 13} →
                      </a>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleSave(domain);
                        }}
                        className={`p-2 rounded-lg transition-colors ${
                          saved
                            ? 'text-pink-500 bg-pink-50'
                            : 'text-gray-400 hover:text-pink-500 hover:bg-pink-50'
                        }`}
                      >
                        <Heart className={`w-5 h-5 ${saved ? 'fill-pink-500' : ''}`} />
                      </button>
                    </div>

                    {/* Hover Tooltip */}
                    {hoveredDomain === domain.domain && domain.analysis && (
                      <Tooltip
                        id={`tooltip-${domain.domain}`}
                        place="top"
                        className="!p-0 !opacity-100 !bg-transparent !border-0 z-50"
                      >
                        <DomainTooltip
                          domain={domain.domain}
                          analysis={domain.analysis}
                        />
                      </Tooltip>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Load More */}
            {domains.length > 0 && !isGenerating && (
              <div className="text-center">
                <button
                  onClick={() => generateDomains(true)}
                  className="px-6 py-3 bg-white border border-gray-300 rounded-xl text-gray-700 hover:border-brand-blue hover:text-brand-blue transition-colors"
                >
                  Load More Domains
                </button>
              </div>
            )}
          </>
        )}

        {/* Empty State */}
        {domains.length === 0 && !isGenerating && (
          <div className="text-center py-16 text-gray-500">
            <Sparkles className="w-12 h-12 mx-auto mb-4 text-gray-300" />
            <p className="text-lg font-medium mb-2">Ready to find your perfect domain</p>
            <p className="text-sm">Add search directions above and click Generate</p>
          </div>
        )}
      </main>

      {/* Saved Domains Tray */}
      {savedDomains.length > 0 && (
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-lg z-50">
          <div className="max-w-6xl mx-auto px-6 py-4">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Heart className="w-5 h-5 text-pink-500 fill-pink-500" />
                <span className="font-semibold text-gray-900">Saved ({savedDomains.length})</span>
              </div>

              <div className="flex-1 flex items-center gap-2 overflow-x-auto">
                {savedDomains.map((domain) => (
                  <div
                    key={domain.domain}
                    className="flex items-center gap-2 px-3 py-2 bg-gray-100 rounded-lg flex-shrink-0"
                  >
                    <span className="font-mono text-sm text-gray-900">{domain.domain}</span>
                    <button
                      onClick={() => toggleSave(domain)}
                      className="text-gray-400 hover:text-red-500 transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>

              <button className="px-6 py-2 bg-gradient-to-r from-brand-blue to-brand-violet text-white rounded-lg font-semibold hover:shadow-lg transition-all">
                Compare →
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Domain Details Modal */}
      {selectedDomain && (
        loadingAnalysis ? (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
            <div className="bg-white rounded-2xl p-8 text-center shadow-2xl">
              <Loader2 className="w-12 h-12 animate-spin text-brand-blue mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Analyzing {selectedDomain.domain}</h3>
              <p className="text-sm text-gray-600">Getting AI insights...</p>
            </div>
          </div>
        ) : selectedDomain.analysis ? (
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
        ) : null
      )}
    </div>
  );
}
