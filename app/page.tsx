/**
 * 🏠 DOMAINSEEK.AI - Step-based UI with compact styles
 *
 * ① Build a style → ② Your search list
 * Inline character slider, compact style chips
 */

'use client';

import { useState, useMemo, useEffect, useCallback } from 'react';
import { Sparkles, Search, Heart, Loader2, X } from 'lucide-react';
import { type ThemeId } from '@/lib/ai/themes';
import { DomainDetailsModal } from '@/components/DomainDetailsModal';
import { DomainTooltip } from '@/components/DomainTooltip';
import { AdminAlert } from '@/components/AdminAlert';
import { Tooltip } from 'react-tooltip';
import type { DomainAnalysis } from '@/lib/ai/ranking';

// Vibe data with tooltips
const VIBE_DATA: Record<string, {
  id: ThemeId;
  emoji: string;
  name: string;
  title: string;
  examples: string[];
  goodFor: string;
  description: string;
}> = {
  'catchy': {
    id: 'catchy',
    emoji: '🎯',
    name: 'Catchy',
    title: 'Catchy & Memorable',
    examples: ['Zipzap', 'Buzzflow', 'Snapbean', 'Glowpop'],
    goodFor: 'Viral potential, easy to remember',
    description: 'Short & memorable',
  },
  'direct': {
    id: 'direct',
    emoji: '💼',
    name: 'Direct',
    title: 'Direct & Clear',
    examples: ['GetCoffee', 'CoffeeClub', 'MyCoffee'],
    goodFor: 'SEO, instant understanding',
    description: 'Clear business names',
  },
  'nature': {
    id: 'nature',
    emoji: '🌿',
    name: 'Nature',
    title: 'Nature & Organic',
    examples: ['Willowbrew', 'Mossroast', 'Fernbean'],
    goodFor: 'Wellness, eco-friendly, organic brands',
    description: 'Organic & earthy',
  },
  'tech': {
    id: 'tech',
    emoji: '⚡',
    name: 'Tech',
    title: 'Tech & Innovation',
    examples: ['NexusAI', 'QuantumLab', 'ByteForge'],
    goodFor: 'Startups, SaaS, developer tools',
    description: 'Modern & innovative',
  },
  'gen-z': {
    id: 'gen-z',
    emoji: '✨',
    name: 'Modern',
    title: 'Modern & Trendy',
    examples: ['Vibecheck', 'Glowup', 'Chillzone'],
    goodFor: 'Consumer apps, lifestyle brands',
    description: 'Fresh & trendy',
  },
  'ancient-greek': {
    id: 'ancient-greek',
    emoji: '🏛️',
    name: 'Greek',
    title: 'Greek Mythology',
    examples: ['Nike', 'Hermes', 'Apollo', 'Athena'],
    goodFor: 'Authority, trust, timelessness',
    description: 'Mythology inspired',
  },
  'roman': {
    id: 'roman',
    emoji: '⚔️',
    name: 'Roman',
    title: 'Roman Empire',
    examples: ['Mars', 'Venus', 'Jupiter', 'Caesar'],
    goodFor: 'Power, strength, leadership',
    description: 'Imperial & commanding',
  },
  'norse': {
    id: 'norse',
    emoji: '🪓',
    name: 'Norse',
    title: 'Norse Mythology',
    examples: ['Thor', 'Odin', 'Valhalla', 'Freya'],
    goodFor: 'Strength, adventure, boldness',
    description: 'Viking & heroic',
  },
  'astrology': {
    id: 'astrology',
    emoji: '⭐',
    name: 'Astrology',
    title: 'Zodiac & Celestial',
    examples: ['Aries', 'Luna', 'Stellar', 'Cosmic'],
    goodFor: 'Spirituality, wellness, lifestyle',
    description: 'Celestial & mystical',
  },
  'ocean': {
    id: 'ocean',
    emoji: '🌊',
    name: 'Ocean',
    title: 'Ocean & Maritime',
    examples: ['Waveflow', 'Tidalab', 'Aquaforge'],
    goodFor: 'Travel, adventure, flow',
    description: 'Waves & maritime',
  },
  'solar-system': {
    id: 'solar-system',
    emoji: '🌞',
    name: 'Cosmic',
    title: 'Space & Cosmos',
    examples: ['Novaforge', 'Stellarlink', 'Orbitlab'],
    goodFor: 'Innovation, future, expansion',
    description: 'Space & stars',
  },
  'abstract': {
    id: 'abstract',
    emoji: '🎭',
    name: 'Abstract',
    title: 'Abstract & Conceptual',
    examples: ['Zenith', 'Paradigm', 'Kinetic'],
    goodFor: 'Unique, philosophical brands',
    description: 'Conceptual & unique',
  },
  'literary': {
    id: 'literary',
    emoji: '📚',
    name: 'Literary',
    title: 'Books & Literature',
    examples: ['Gatsby', 'Sherlock', 'Byron'],
    goodFor: 'Education, publishing, culture',
    description: 'Classic & sophisticated',
  },
  'music': {
    id: 'music',
    emoji: '🎵',
    name: 'Music',
    title: 'Music & Rhythm',
    examples: ['Rhythmflow', 'Harmonylab', 'Beatforge'],
    goodFor: 'Audio, entertainment, creativity',
    description: 'Rhythm & sound',
  },
  'art': {
    id: 'art',
    emoji: '🎨',
    name: 'Art',
    title: 'Visual Arts',
    examples: ['Canvasflow', 'Palettelab', 'Studioforge'],
    goodFor: 'Design, creativity, visual brands',
    description: 'Visual & creative',
  },
  'gaming': {
    id: 'gaming',
    emoji: '🎮',
    name: 'Gaming',
    title: 'Gaming & Esports',
    examples: ['Questforge', 'Arcadeflow', 'Playerone'],
    goodFor: 'Entertainment, competition, fun',
    description: 'Playful & action',
  },
};

const VIBE_ORDER: ThemeId[] = [
  'catchy', 'direct', 'nature', 'tech', 'gen-z',
  'ancient-greek', 'roman', 'norse', 'astrology', 'ocean',
  'solar-system', 'abstract', 'literary', 'music', 'art', 'gaming',
];

interface SearchStyle {
  id: string;
  vibes: ThemeId[];
  description: string;
}

interface DomainResult {
  domain: string;
  available: boolean;
  price?: number;
  confidence: number;
  analysis?: DomainAnalysis;
  previouslyRegistered?: boolean;
  lastSnapshot?: string;
  styleId: string;
  styleVibes: ThemeId[];
  styleName: string;
}

// Generate description for a style
function getStyleDescription(vibes: ThemeId[]): string {
  if (vibes.length === 1) {
    const vibe = VIBE_DATA[vibes[0]];
    return `${vibe.description} - ${vibe.examples.slice(0, 3).join(', ')}`;
  }
  const descs = vibes.map(v => VIBE_DATA[v]?.description || v);
  return descs.join(' meets ');
}

// Get display name for style
function getStyleName(vibes: ThemeId[]): string {
  return vibes.map(v => VIBE_DATA[v]?.name || v).join(' + ');
}

// Get short emoji name for style chip
function getStyleChipLabel(vibes: ThemeId[]): string {
  return vibes.map(v => `${VIBE_DATA[v]?.emoji}${VIBE_DATA[v]?.name}`).join(' + ');
}

export default function HomePage() {
  // Project input
  const [project, setProject] = useState('');

  // Search styles (formerly directions)
  const [styles, setStyles] = useState<SearchStyle[]>([]);
  const [selectedVibes, setSelectedVibes] = useState<ThemeId[]>([]);

  // Settings - inline now
  const [selectedTLDs, setSelectedTLDs] = useState<string[]>(['com', 'ai']);
  const [charRange, setCharRange] = useState<[number, number]>([4, 12]);

  // Results
  const [domains, setDomains] = useState<DomainResult[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [loadingStyles, setLoadingStyles] = useState<Set<string>>(new Set());

  // Seen domains (localStorage)
  const [seenDomains, setSeenDomains] = useState<Set<string>>(new Set());

  // Saved domains
  const [savedDomains, setSavedDomains] = useState<DomainResult[]>([]);

  // Filters
  const [activeFilters, setActiveFilters] = useState<{
    maxLength?: number;
    styleId?: string;
    tldFilter?: string;
  }>({});

  // Modal state
  const [selectedDomain, setSelectedDomain] = useState<DomainResult | null>(null);
  const [loadingAnalysis, setLoadingAnalysis] = useState(false);
  const [hoveredDomain, setHoveredDomain] = useState<string | null>(null);

  // Load from localStorage on mount
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

  // Save to localStorage
  useEffect(() => {
    if (seenDomains.size > 0) {
      localStorage.setItem('domainseek_seen', JSON.stringify(Array.from(seenDomains)));
    }
  }, [seenDomains]);

  useEffect(() => {
    localStorage.setItem('domainseek_saved', JSON.stringify(savedDomains));
  }, [savedDomains]);

  // Filter domains
  const filteredDomains = useMemo(() => {
    let result = domains;

    if (activeFilters.maxLength) {
      result = result.filter(d => d.domain.split('.')[0].length <= activeFilters.maxLength!);
    }
    if (activeFilters.styleId) {
      result = result.filter(d => d.styleId === activeFilters.styleId);
    }
    if (activeFilters.tldFilter) {
      result = result.filter(d => d.domain.endsWith(`.${activeFilters.tldFilter}`));
    }

    return result;
  }, [domains, activeFilters]);

  // Toggle vibe selection
  const toggleVibe = (vibeId: ThemeId) => {
    setSelectedVibes(prev =>
      prev.includes(vibeId)
        ? prev.filter(v => v !== vibeId)
        : [...prev, vibeId]
    );
  };

  // Save current selection as a style
  const saveAsStyle = () => {
    if (selectedVibes.length === 0) return;

    const newStyle: SearchStyle = {
      id: `style-${Date.now()}`,
      vibes: [...selectedVibes],
      description: getStyleDescription(selectedVibes),
    };

    setStyles(prev => [...prev, newStyle]);
    setSelectedVibes([]);
  };

  // Remove a style
  const removeStyle = (styleId: string) => {
    setStyles(prev => prev.filter(s => s.id !== styleId));
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

  // Generate domains for a single style
  const generateForStyle = useCallback(async (style: SearchStyle, existingDomains: Set<string>) => {
    try {
      const response = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          project,
          themes: style.vibes,
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
            styleId: style.id,
            styleVibes: style.vibes,
            styleName: getStyleName(style.vibes),
          }));

        return available;
      }
    } catch (error) {
      console.error(`Generation error for style ${style.id}:`, error);
    }

    return [];
  }, [project, charRange, selectedTLDs, seenDomains]);

  // Get AI analysis
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

  // Main generate function
  const generateDomains = async (append = false) => {
    if (styles.length === 0 || !project.trim()) return;

    setIsGenerating(true);
    if (!append) {
      setDomains([]);
      setActiveFilters({});
    }

    const existingDomains = new Set(domains.map(d => d.domain));
    setLoadingStyles(new Set(styles.map(s => s.id)));

    // Run all styles in parallel
    await Promise.all(
      styles.map(async (style) => {
        const styleDomains = await generateForStyle(style, existingDomains);
        styleDomains.forEach(d => existingDomains.add(d.domain));

        const analyzed = await getAnalysis(styleDomains);

        // Update state immediately (streaming effect)
        setDomains(prev => {
          const newDomains = [...prev, ...analyzed];
          newDomains.sort((a, b) => {
            const scoreA = a.analysis?.overallScore || 0;
            const scoreB = b.analysis?.overallScore || 0;
            return scoreB - scoreA;
          });
          return newDomains;
        });

        // Mark style as done
        setLoadingStyles(prev => {
          const next = new Set(prev);
          next.delete(style.id);
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

  // Handle domain click
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
  const toggleFilter = (filterType: 'maxLength' | 'styleId' | 'tldFilter', value: number | string) => {
    setActiveFilters(prev => {
      if (prev[filterType] === value) {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { [filterType]: _, ...rest } = prev;
        return rest;
      }
      return { ...prev, [filterType]: value };
    });
  };

  // Get unique styles from results
  const resultStyles = useMemo(() => {
    const styleMap = new Map<string, { vibes: ThemeId[]; name: string }>();
    domains.forEach(d => {
      if (!styleMap.has(d.styleId)) {
        styleMap.set(d.styleId, { vibes: d.styleVibes, name: d.styleName });
      }
    });
    return styleMap;
  }, [domains]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50">
      <AdminAlert />

      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-5xl mx-auto px-6 py-4">
          <h1 className="text-2xl font-bold text-gray-900">
            Domain<span className="text-brand-blue">Seek</span>
          </h1>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-8">
        {/* Project Input */}
        <div className="mb-6">
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

        {/* Step 1: Build a Style */}
        <div className="mb-4 p-5 bg-white rounded-xl border border-gray-200">
          <div className="flex items-baseline gap-3 mb-3">
            <span className="flex items-center justify-center w-6 h-6 rounded-full bg-brand-blue text-white text-sm font-bold">1</span>
            <h2 className="text-base font-semibold text-gray-900">Build a style</h2>
            <span className="text-sm text-gray-500">(click multiple to combine)</span>
          </div>

          {/* Vibe Chips */}
          <div className="flex flex-wrap gap-2 mb-3">
            {VIBE_ORDER.map((vibeId) => {
              const vibe = VIBE_DATA[vibeId];
              const isSelected = selectedVibes.includes(vibeId);
              return (
                <button
                  key={vibeId}
                  data-tooltip-id={`vibe-tooltip-${vibeId}`}
                  onClick={() => toggleVibe(vibeId)}
                  className={`
                    px-2.5 py-1.5 rounded-lg border text-sm font-medium transition-all
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

          {/* Vibe Tooltips */}
          {VIBE_ORDER.map((vibeId) => {
            const vibe = VIBE_DATA[vibeId];
            return (
              <Tooltip
                key={`tooltip-${vibeId}`}
                id={`vibe-tooltip-${vibeId}`}
                place="top"
                className="!bg-gray-900 !text-white !rounded-lg !px-3 !py-2 !max-w-xs z-50"
              >
                <div className="text-xs">
                  <div className="font-bold">{vibe.title}</div>
                  <div className="text-gray-300">{vibe.examples.join(', ')}</div>
                </div>
              </Tooltip>
            );
          })}

          {/* Selected Preview + Add Button */}
          {selectedVibes.length > 0 && (
            <div className="flex items-center justify-between p-2.5 bg-blue-50 rounded-lg border border-blue-200">
              <span className="text-sm text-gray-900">
                {selectedVibes.map(v => `${VIBE_DATA[v].emoji} ${VIBE_DATA[v].name}`).join(' + ')}
              </span>
              <button
                onClick={saveAsStyle}
                className="px-3 py-1.5 bg-brand-blue text-white rounded-lg text-sm font-medium hover:bg-blue-600 transition-colors"
              >
                Add to search list →
              </button>
            </div>
          )}
        </div>

        {/* Step 2: Your Search List */}
        <div className="mb-4 p-5 bg-white rounded-xl border border-gray-200">
          <div className="flex items-center gap-3 mb-3">
            <span className="flex items-center justify-center w-6 h-6 rounded-full bg-brand-blue text-white text-sm font-bold">2</span>
            <h2 className="text-base font-semibold text-gray-900">Your search list</h2>
            {styles.length > 0 && (
              <span className="text-sm text-gray-500">
                {styles.length} style{styles.length !== 1 ? 's' : ''} will search in parallel
              </span>
            )}
          </div>

          {styles.length === 0 ? (
            <p className="text-sm text-gray-400 italic">No styles yet. Build one above and add it.</p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {styles.map((style) => (
                <div
                  key={style.id}
                  data-tooltip-id={`style-tooltip-${style.id}`}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 rounded-lg border border-gray-200 group"
                >
                  <span className="text-sm font-medium text-gray-800">
                    {getStyleChipLabel(style.vibes)}
                  </span>
                  <button
                    onClick={() => removeStyle(style.id)}
                    className="text-gray-400 hover:text-red-500 transition-colors"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                  <Tooltip
                    id={`style-tooltip-${style.id}`}
                    place="top"
                    className="!bg-gray-900 !text-white !rounded-lg !px-3 !py-2 z-50"
                  >
                    <div className="text-xs">{style.description}</div>
                  </Tooltip>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Settings Row - All Inline */}
        <div className="mb-6 flex items-center gap-4 flex-wrap bg-white rounded-xl border border-gray-200 p-4">
          {/* TLDs */}
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600">TLDs:</span>
            {[
              { tld: 'com', price: '$13' },
              { tld: 'ai', price: '$70' },
              { tld: 'io', price: '$35' },
              { tld: 'app', price: '$15' },
              { tld: 'dev', price: '$13' },
            ].map(({ tld }) => (
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

          {/* Divider */}
          <div className="w-px h-6 bg-gray-200" />

          {/* Character Length - Inline */}
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600">Length:</span>
            <input
              type="range"
              min={3}
              max={15}
              value={charRange[0]}
              onChange={(e) => setCharRange([parseInt(e.target.value), charRange[1]])}
              className="w-16 h-1.5 accent-brand-blue"
            />
            <span className="text-sm font-mono text-gray-700 w-6 text-center">{charRange[0]}</span>
            <span className="text-gray-400">-</span>
            <input
              type="range"
              min={3}
              max={15}
              value={charRange[1]}
              onChange={(e) => setCharRange([charRange[0], parseInt(e.target.value)])}
              className="w-16 h-1.5 accent-brand-blue"
            />
            <span className="text-sm font-mono text-gray-700 w-6 text-center">{charRange[1]}</span>
          </div>

          {/* Generate Button */}
          <button
            onClick={() => generateDomains(false)}
            disabled={styles.length === 0 || !project.trim() || isGenerating}
            className={`
              ml-auto px-5 py-2 rounded-xl font-bold text-sm transition-all flex items-center gap-2
              ${styles.length > 0 && project.trim() && !isGenerating
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
                Generate
              </>
            )}
          </button>
        </div>

        {/* Results Section */}
        {(domains.length > 0 || isGenerating) && (
          <>
            {/* Results Header */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <span className="text-gray-600">
                  <span className="font-bold text-gray-900">{filteredDomains.length}</span>
                  {filteredDomains.length !== domains.length && (
                    <span className="text-gray-500"> of {domains.length}</span>
                  )}
                  {' '}domains found
                </span>
                {loadingStyles.size > 0 && (
                  <span className="flex items-center gap-2 text-brand-blue text-sm">
                    <span className="w-2 h-2 bg-brand-blue rounded-full animate-pulse"></span>
                    Loading more...
                  </span>
                )}
              </div>
            </div>

            {/* Filter Section */}
            {domains.length > 0 && (
              <div className="mb-6 p-4 bg-white rounded-xl border border-gray-200">
                <div className="flex flex-wrap items-center gap-3">
                  <span className="text-sm text-gray-500">Filter:</span>

                  {/* Length filters */}
                  <button
                    onClick={() => toggleFilter('maxLength', 6)}
                    className={`px-2.5 py-1 rounded-full text-xs transition-all ${
                      activeFilters.maxLength === 6
                        ? 'bg-brand-blue text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    Short (≤6)
                  </button>
                  <button
                    onClick={() => toggleFilter('maxLength', 8)}
                    className={`px-2.5 py-1 rounded-full text-xs transition-all ${
                      activeFilters.maxLength === 8
                        ? 'bg-brand-blue text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    Medium (≤8)
                  </button>

                  <span className="text-gray-300">|</span>

                  {/* TLD filters */}
                  {selectedTLDs.map(tld => (
                    <button
                      key={tld}
                      onClick={() => toggleFilter('tldFilter', tld)}
                      className={`px-2.5 py-1 rounded-full text-xs font-mono transition-all ${
                        activeFilters.tldFilter === tld
                          ? 'bg-brand-blue text-white'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      .{tld}
                    </button>
                  ))}

                  {resultStyles.size > 1 && (
                    <>
                      <span className="text-gray-300">|</span>
                      {/* Style filters */}
                      {Array.from(resultStyles.entries()).map(([styleId, { name }]) => (
                        <button
                          key={styleId}
                          onClick={() => toggleFilter('styleId', styleId)}
                          className={`px-2.5 py-1 rounded-full text-xs transition-all ${
                            activeFilters.styleId === styleId
                              ? 'bg-brand-blue text-white'
                              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                          }`}
                        >
                          {name}
                        </button>
                      ))}
                    </>
                  )}

                  {/* Clear all */}
                  {Object.keys(activeFilters).length > 0 && (
                    <button
                      onClick={() => setActiveFilters({})}
                      className="ml-auto text-xs text-gray-500 hover:text-gray-700"
                    >
                      Clear
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* Domain Grid */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mb-8">
              {filteredDomains.map((domain) => {
                const saved = isSaved(domain.domain);

                return (
                  <div
                    key={domain.domain}
                    data-tooltip-id={`domain-tooltip-${domain.domain}`}
                    className="bg-white rounded-xl border border-gray-200 p-4 hover:shadow-lg hover:border-brand-blue/50 transition-all group cursor-pointer"
                    onClick={() => handleDomainClick(domain)}
                    onMouseEnter={() => setHoveredDomain(domain.domain)}
                    onMouseLeave={() => setHoveredDomain(null)}
                  >
                    {/* Domain Name */}
                    <div className="font-mono font-bold text-gray-900 mb-2 truncate group-hover:text-brand-blue transition-colors">
                      {domain.domain}
                    </div>

                    {/* Score & Style Tag */}
                    <div className="flex items-center gap-2 mb-3">
                      {domain.analysis && (
                        <span className="text-lg font-bold text-brand-blue">
                          {domain.analysis.overallScore.toFixed(1)}
                        </span>
                      )}
                      <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-600 truncate max-w-[120px]">
                        {domain.styleName}
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
                        id={`domain-tooltip-${domain.domain}`}
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
          <div className="text-center py-12 text-gray-500">
            <Sparkles className="w-10 h-10 mx-auto mb-3 text-gray-300" />
            <p className="text-base font-medium mb-1">Ready to find your perfect domain</p>
            <p className="text-sm">Build a style above, add it to your search list, then generate!</p>
          </div>
        )}
      </main>

      {/* Saved Domains Tray */}
      {savedDomains.length > 0 && (
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-lg z-50">
          <div className="max-w-5xl mx-auto px-6 py-3">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Heart className="w-4 h-4 text-pink-500 fill-pink-500" />
                <span className="font-semibold text-gray-900 text-sm">Saved ({savedDomains.length})</span>
              </div>

              <div className="flex-1 flex items-center gap-2 overflow-x-auto">
                {savedDomains.map((domain) => (
                  <div
                    key={domain.domain}
                    className="flex items-center gap-1.5 px-2.5 py-1.5 bg-gray-100 rounded-lg flex-shrink-0"
                  >
                    <span className="font-mono text-sm text-gray-900">{domain.domain}</span>
                    <button
                      onClick={() => toggleSave(domain)}
                      className="text-gray-400 hover:text-red-500 transition-colors"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>

              <button className="px-4 py-1.5 bg-gradient-to-r from-brand-blue to-brand-violet text-white rounded-lg font-semibold text-sm hover:shadow-lg transition-all">
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
