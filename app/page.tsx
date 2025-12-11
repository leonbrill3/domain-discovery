/**
 * 🏠 DOMAINSEEK.AI - Progressive Domain Discovery
 *
 * Flow: Project → Vibes → Results (50 domains as cards)
 * Features: Refinement chips, persistent saves, vibe tags
 */

'use client';

import { useState, useMemo } from 'react';
import { Sparkles, Search, Heart, ExternalLink, Loader2, ArrowRight, ChevronLeft, X, SlidersHorizontal } from 'lucide-react';
import { THEMES, type ThemeId } from '@/lib/ai/themes';
import { CharacterRangeSlider } from '@/components/CharacterRangeSlider';
import { DomainDetailsModal } from '@/components/DomainDetailsModal';
import { AdminAlert } from '@/components/AdminAlert';
import type { DomainAnalysis } from '@/lib/ai/ranking';

// Curated vibes - the best 8 for most users
const CURATED_VIBES: { id: ThemeId; emoji: string; name: string; description: string }[] = [
  { id: 'catchy', emoji: '🎯', name: 'Catchy', description: 'Memorable & viral' },
  { id: 'direct', emoji: '💼', name: 'Direct', description: 'Clear & professional' },
  { id: 'nature', emoji: '🌿', name: 'Nature', description: 'Organic & earthy' },
  { id: 'tech', emoji: '⚡', name: 'Tech', description: 'Modern & innovative' },
  { id: 'gen-z', emoji: '✨', name: 'Modern', description: 'Fresh & trendy' },
  { id: 'abstract', emoji: '🎭', name: 'Creative', description: 'Unique & artistic' },
  { id: 'ancient-greek', emoji: '🏛️', name: 'Classic', description: 'Timeless & trusted' },
  { id: 'business', emoji: '🚀', name: 'Bold', description: 'Confident & strong' },
];

interface DomainResult {
  domain: string;
  available: boolean;
  price?: number;
  confidence: number;
  analysis?: DomainAnalysis;
  previouslyRegistered?: boolean;
  lastSnapshot?: string;
  vibeId: ThemeId; // Which vibe generated this domain
}

type Step = 'project' | 'vibes' | 'results';

export default function HomePage() {
  // Step management
  const [step, setStep] = useState<Step>('project');

  // User inputs
  const [project, setProject] = useState('');
  const [selectedVibes, setSelectedVibes] = useState<ThemeId[]>([]);
  const [selectedTLDs, setSelectedTLDs] = useState<string[]>(['com', 'ai']);
  const [charRange, setCharRange] = useState<[number, number]>([4, 12]);
  const [showAdvanced, setShowAdvanced] = useState(false);

  // Results
  const [domains, setDomains] = useState<DomainResult[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [savedDomains, setSavedDomains] = useState<DomainResult[]>([]);

  // Filters (for refinement chips)
  const [activeFilters, setActiveFilters] = useState<{
    maxLength?: number;
    vibeFilter?: ThemeId;
    tldFilter?: string;
  }>({});

  // Modal state
  const [selectedDomain, setSelectedDomain] = useState<DomainResult | null>(null);
  const [loadingAnalysis, setLoadingAnalysis] = useState(false);

  // Filter domains based on active filters
  const filteredDomains = useMemo(() => {
    let result = domains;

    if (activeFilters.maxLength) {
      result = result.filter(d => d.domain.split('.')[0].length <= activeFilters.maxLength!);
    }
    if (activeFilters.vibeFilter) {
      result = result.filter(d => d.vibeId === activeFilters.vibeFilter);
    }
    if (activeFilters.tldFilter) {
      result = result.filter(d => d.domain.endsWith(`.${activeFilters.tldFilter}`));
    }

    return result;
  }, [domains, activeFilters]);

  const toggleVibe = (vibeId: ThemeId) => {
    setSelectedVibes(prev =>
      prev.includes(vibeId)
        ? prev.filter(id => id !== vibeId)
        : [...prev, vibeId]
    );
  };

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

  const generateDomains = async () => {
    if (selectedVibes.length === 0 || !project.trim()) return;

    setIsGenerating(true);
    setDomains([]);
    setActiveFilters({});

    try {
      // Generate for each selected vibe
      const allDomains: DomainResult[] = [];

      for (const vibeId of selectedVibes) {
        const response = await fetch('/api/generate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            project,
            themes: [vibeId],
            countPerTheme: Math.ceil(50 / selectedVibes.length), // Distribute across vibes
            charMin: charRange[0],
            charMax: charRange[1],
            tlds: selectedTLDs,
          }),
        });

        const data = await response.json();

        if (data.success && data.data?.themes) {
          const themeDomains = Object.values(data.data.themes).flat() as DomainResult[];
          const available = themeDomains
            .filter((d) => d.available && d.confidence >= 0.95)
            .map((d) => ({
              ...d,
              vibeId,
            }));
          allDomains.push(...available);
        }
      }

      // Remove duplicates and sort by score (if available) or alphabetically
      const uniqueDomains = allDomains.filter(
        (d, i, arr) => arr.findIndex(x => x.domain === d.domain) === i
      );

      // Get AI analysis for all domains
      if (uniqueDomains.length > 0) {
        try {
          const analysisResponse = await fetch('/api/analyze', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              domains: uniqueDomains.map(d => d.domain),
              project,
            }),
          });

          const analysisData = await analysisResponse.json();

          if (analysisData.success && analysisData.analyses) {
            uniqueDomains.forEach(domain => {
              const analysis = analysisData.analyses.find(
                (a: DomainAnalysis) => a.domain === domain.domain
              );
              if (analysis) {
                domain.analysis = analysis;
              }
            });
          }
        } catch (error) {
          console.warn('Analysis failed:', error);
        }
      }

      // Sort by score descending
      uniqueDomains.sort((a, b) => {
        const scoreA = a.analysis?.overallScore || 0;
        const scoreB = b.analysis?.overallScore || 0;
        return scoreB - scoreA;
      });

      setDomains(uniqueDomains);
      setStep('results');
    } catch (error) {
      console.error('Generation error:', error);
    } finally {
      setIsGenerating(false);
    }
  };

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

  const getVibeInfo = (vibeId: ThemeId) => {
    const curated = CURATED_VIBES.find(v => v.id === vibeId);
    if (curated) return curated;
    const theme = THEMES[vibeId];
    return { id: vibeId, emoji: theme.emoji, name: theme.name, description: theme.description };
  };

  const toggleFilter = (filterType: 'maxLength' | 'vibeFilter' | 'tldFilter', value: number | ThemeId | string) => {
    setActiveFilters(prev => {
      if (prev[filterType] === value) {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { [filterType]: _, ...rest } = prev;
        return rest;
      }
      return { ...prev, [filterType]: value };
    });
  };

  // STEP 1: Project Input
  if (step === 'project') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 flex items-center justify-center p-6">
        <AdminAlert />
        <div className="w-full max-w-2xl">
          <div className="text-center mb-12">
            <h1 className="text-5xl font-bold text-gray-900 mb-4 font-display">
              Find Your Perfect{' '}
              <span className="bg-gradient-to-r from-brand-blue to-brand-violet bg-clip-text text-transparent">
                Domain
              </span>
            </h1>
            <p className="text-xl text-gray-600">AI-powered domain discovery in seconds</p>
          </div>

          <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-200">
            <label className="block text-lg font-semibold text-gray-900 mb-3">
              What are you building?
            </label>
            <div className="relative mb-6">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                value={project}
                onChange={(e) => setProject(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && project.trim() && setStep('vibes')}
                placeholder="e.g., coffee subscription startup"
                className="w-full pl-12 pr-4 py-4 border-2 border-gray-300 rounded-xl focus:border-brand-blue focus:ring-4 focus:ring-blue-50 outline-none text-lg"
                autoFocus
              />
            </div>

            <div className="flex flex-wrap gap-2 mb-8">
              <span className="text-sm text-gray-500">Try:</span>
              {['yoga studio', 'tech consulting', 'meal prep service', 'fitness app'].map((ex) => (
                <button
                  key={ex}
                  onClick={() => setProject(ex)}
                  className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm text-gray-700 transition-colors"
                >
                  {ex}
                </button>
              ))}
            </div>

            <button
              onClick={() => setStep('vibes')}
              disabled={!project.trim()}
              className={`
                w-full py-4 rounded-xl font-bold text-lg transition-all flex items-center justify-center gap-3
                ${project.trim()
                  ? 'bg-gradient-to-r from-brand-blue to-brand-violet text-white hover:shadow-lg hover:scale-[1.02]'
                  : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                }
              `}
            >
              Next
              <ArrowRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  // STEP 2: Vibe Selection
  if (step === 'vibes') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 p-6">
        <AdminAlert />
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="flex items-center gap-4 mb-8">
            <button
              onClick={() => setStep('project')}
              className="p-2 hover:bg-white rounded-lg transition-colors"
            >
              <ChevronLeft className="w-6 h-6 text-gray-600" />
            </button>
            <div className="flex-1">
              <div className="flex items-center gap-2 text-gray-600 text-sm mb-1">
                <span className="w-6 h-6 rounded-full bg-brand-blue text-white flex items-center justify-center text-xs font-bold">✓</span>
                <span className="truncate max-w-md">{project}</span>
                <button
                  onClick={() => setStep('project')}
                  className="text-brand-blue hover:underline text-xs"
                >
                  Edit
                </button>
              </div>
              <h2 className="text-2xl font-bold text-gray-900">What vibe are you going for?</h2>
            </div>
          </div>

          {/* Vibe Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            {CURATED_VIBES.map((vibe) => {
              const isSelected = selectedVibes.includes(vibe.id);
              return (
                <button
                  key={vibe.id}
                  onClick={() => toggleVibe(vibe.id)}
                  className={`
                    p-6 rounded-xl border-2 transition-all text-left
                    ${isSelected
                      ? 'border-brand-blue bg-blue-50 shadow-md scale-[1.02]'
                      : 'border-gray-200 bg-white hover:border-gray-300 hover:shadow-sm'
                    }
                  `}
                >
                  <span className="text-3xl mb-2 block">{vibe.emoji}</span>
                  <span className="font-bold text-gray-900 block">{vibe.name}</span>
                  <span className="text-sm text-gray-500">{vibe.description}</span>
                </button>
              );
            })}
          </div>

          {/* TLD Selection - Always visible */}
          <div className="mb-6 p-6 bg-white rounded-xl border border-gray-200">
            <label className="block text-sm font-semibold text-gray-700 mb-3">Which extensions do you want?</label>
            <div className="flex flex-wrap gap-3">
              {[
                { tld: 'com', price: '$13', desc: 'Most trusted' },
                { tld: 'ai', price: '$70', desc: 'Tech/AI focused' },
                { tld: 'io', price: '$35', desc: 'Startups' },
                { tld: 'app', price: '$15', desc: 'Mobile apps' },
                { tld: 'dev', price: '$13', desc: 'Developers' },
              ].map(({ tld, price, desc }) => (
                <button
                  key={tld}
                  onClick={() => setSelectedTLDs(prev =>
                    prev.includes(tld)
                      ? prev.length > 1 ? prev.filter(t => t !== tld) : prev // Keep at least one
                      : [...prev, tld]
                  )}
                  className={`
                    px-4 py-3 rounded-xl border-2 text-left transition-all min-w-[100px]
                    ${selectedTLDs.includes(tld)
                      ? 'border-brand-blue bg-blue-50'
                      : 'border-gray-200 bg-white hover:border-gray-300'
                    }
                  `}
                >
                  <span className={`font-mono font-bold block ${selectedTLDs.includes(tld) ? 'text-brand-blue' : 'text-gray-900'}`}>
                    .{tld}
                  </span>
                  <span className="text-xs text-gray-500">{price} · {desc}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Advanced Settings Toggle */}
          <div className="mb-8">
            <button
              onClick={() => setShowAdvanced(!showAdvanced)}
              className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
            >
              <SlidersHorizontal className="w-4 h-4" />
              <span className="text-sm font-medium">More options</span>
              <span className="text-xs text-gray-400">{showAdvanced ? '▲' : '▼'}</span>
            </button>

            {showAdvanced && (
              <div className="mt-4 p-6 bg-white rounded-xl border border-gray-200">
                <CharacterRangeSlider
                  min={3}
                  max={15}
                  value={charRange}
                  onChange={setCharRange}
                />
              </div>
            )}
          </div>

          {/* Generate Button */}
          <button
            onClick={generateDomains}
            disabled={selectedVibes.length === 0 || isGenerating}
            className={`
              w-full py-4 rounded-xl font-bold text-lg transition-all flex items-center justify-center gap-3
              ${selectedVibes.length > 0 && !isGenerating
                ? 'bg-gradient-to-r from-brand-blue to-brand-violet text-white hover:shadow-lg hover:scale-[1.02]'
                : 'bg-gray-200 text-gray-400 cursor-not-allowed'
              }
            `}
          >
            {isGenerating ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Finding domains...
              </>
            ) : (
              <>
                <Sparkles className="w-5 h-5" />
                Show me domains
                <ArrowRight className="w-5 h-5" />
              </>
            )}
          </button>

          {selectedVibes.length > 0 && (
            <p className="text-center text-sm text-gray-500 mt-3">
              {selectedVibes.length} vibe{selectedVibes.length !== 1 ? 's' : ''} selected:{' '}
              {selectedVibes.map(v => getVibeInfo(v).emoji).join(' ')}
            </p>
          )}
        </div>
      </div>
    );
  }

  // STEP 3: Results
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50">
      <AdminAlert />

      {/* Sticky Header */}
      <div className="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => setStep('vibes')}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ChevronLeft className="w-5 h-5 text-gray-600" />
              </button>
              <div>
                <p className="text-sm text-gray-500 truncate max-w-xs">{project}</p>
                <p className="font-semibold text-gray-900">
                  {selectedVibes.map(v => getVibeInfo(v).emoji).join(' ')} {selectedVibes.map(v => getVibeInfo(v).name).join(', ')}
                  <button
                    onClick={() => setStep('vibes')}
                    className="text-brand-blue hover:underline text-sm ml-2"
                  >
                    Change
                  </button>
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              {savedDomains.length > 0 && (
                <div className="flex items-center gap-2 px-4 py-2 bg-pink-50 rounded-lg border border-pink-200">
                  <Heart className="w-4 h-4 text-pink-500 fill-pink-500" />
                  <span className="text-sm font-medium text-pink-700">{savedDomains.length} saved</span>
                </div>
              )}
              <button
                onClick={generateDomains}
                disabled={isGenerating}
                className="px-4 py-2 bg-brand-blue text-white rounded-lg hover:bg-blue-600 transition-colors flex items-center gap-2 text-sm font-medium"
              >
                {isGenerating ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Sparkles className="w-4 h-4" />
                )}
                Different ones
              </button>
            </div>
          </div>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* Results Count & Filters */}
        <div className="flex items-center justify-between mb-6">
          <p className="text-gray-600">
            <span className="font-bold text-gray-900">{filteredDomains.length}</span>
            {filteredDomains.length !== domains.length && (
              <span className="text-gray-500"> of {domains.length}</span>
            )}
            {' '}domains found
          </p>

          {/* Refinement Chips */}
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm text-gray-500">Refine:</span>

            {/* Length filters */}
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
            <button
              onClick={() => toggleFilter('maxLength', 8)}
              className={`px-3 py-1.5 rounded-full text-sm transition-all ${
                activeFilters.maxLength === 8
                  ? 'bg-brand-blue text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Medium (≤8)
            </button>

            {/* TLD filters */}
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

            {/* Vibe filters */}
            {selectedVibes.map(vibeId => {
              const vibe = getVibeInfo(vibeId);
              return (
                <button
                  key={vibeId}
                  onClick={() => toggleFilter('vibeFilter', vibeId)}
                  className={`px-3 py-1.5 rounded-full text-sm transition-all ${
                    activeFilters.vibeFilter === vibeId
                      ? 'bg-brand-blue text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {vibe.emoji} {vibe.name}
                </button>
              );
            })}

            {/* Clear filters */}
            {Object.keys(activeFilters).length > 0 && (
              <button
                onClick={() => setActiveFilters({})}
                className="px-3 py-1.5 text-sm text-gray-500 hover:text-gray-700"
              >
                Clear all
              </button>
            )}
          </div>
        </div>

        {/* Domain Grid */}
        {isGenerating ? (
          <div className="flex flex-col items-center justify-center py-20">
            <Loader2 className="w-12 h-12 animate-spin text-brand-blue mb-4" />
            <p className="text-gray-600">Finding perfect domains...</p>
          </div>
        ) : filteredDomains.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {filteredDomains.map((domain) => {
              const vibe = getVibeInfo(domain.vibeId);
              const saved = isSaved(domain.domain);

              return (
                <div
                  key={domain.domain}
                  className="bg-white rounded-xl border border-gray-200 p-4 hover:shadow-lg hover:border-brand-blue/50 transition-all group cursor-pointer"
                  onClick={() => handleDomainClick(domain)}
                >
                  {/* Domain Name */}
                  <div className="font-mono font-bold text-gray-900 mb-2 truncate group-hover:text-brand-blue transition-colors">
                    {domain.domain}
                  </div>

                  {/* Score & Vibe Tag */}
                  <div className="flex items-center gap-2 mb-3">
                    {domain.analysis && (
                      <span className="text-sm font-bold text-brand-blue">
                        {domain.analysis.overallScore.toFixed(1)}
                      </span>
                    )}
                    <span
                      className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-600"
                      title={vibe.name}
                    >
                      {vibe.emoji}
                    </span>
                    {domain.previouslyRegistered && (
                      <span
                        className="text-xs px-1.5 py-0.5 bg-amber-100 text-amber-700 rounded"
                        title={`Previously registered${domain.lastSnapshot ? ` (${domain.lastSnapshot})` : ''}`}
                      >
                        ♻️
                      </span>
                    )}
                  </div>

                  {/* Price & Actions */}
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-500">${domain.price || 13}</span>
                    <div className="flex items-center gap-1">
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
                        <Heart className={`w-4 h-4 ${saved ? 'fill-pink-500' : ''}`} />
                      </button>
                      <a
                        href={`https://www.namecheap.com/domains/registration/results/?domain=${domain.domain}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="p-2 text-gray-400 hover:text-brand-blue hover:bg-blue-50 rounded-lg transition-colors"
                      >
                        <ExternalLink className="w-4 h-4" />
                      </a>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-20">
            <p className="text-gray-500 mb-4">No domains match your filters</p>
            <button
              onClick={() => setActiveFilters({})}
              className="text-brand-blue hover:underline"
            >
              Clear filters
            </button>
          </div>
        )}

        {/* Load More */}
        {filteredDomains.length > 0 && filteredDomains.length === domains.length && (
          <div className="text-center mt-8">
            <button
              onClick={generateDomains}
              disabled={isGenerating}
              className="px-6 py-3 bg-white border border-gray-300 rounded-xl text-gray-700 hover:border-brand-blue hover:text-brand-blue transition-colors"
            >
              Load more domains
            </button>
          </div>
        )}
      </main>

      {/* Saved Domains Tray */}
      {savedDomains.length > 0 && (
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-lg z-50">
          <div className="max-w-7xl mx-auto px-6 py-4">
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

              <button
                className="px-6 py-2 bg-gradient-to-r from-brand-blue to-brand-violet text-white rounded-lg font-semibold hover:shadow-lg transition-all"
              >
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
