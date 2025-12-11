/**
 * 🏠 DOMAINSEEK.AI - Sentence Builder UI
 *
 * "I want domains that feel..." - natural language approach
 * Features: Search styles with descriptions, hover tooltips, better filters
 */

'use client';

import { useState, useMemo, useEffect, useCallback } from 'react';
import { Sparkles, Search, Heart, Loader2, Plus, X, SlidersHorizontal, ChevronDown, HelpCircle } from 'lucide-react';
import { THEMES, type ThemeId } from '@/lib/ai/themes';
import { CharacterRangeSlider } from '@/components/CharacterRangeSlider';
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

  // Combo - join descriptions
  const descs = vibes.map(v => VIBE_DATA[v]?.description || v);
  return descs.join(' meets ');
}

// Get display name for style
function getStyleName(vibes: ThemeId[]): string {
  return vibes.map(v => VIBE_DATA[v]?.name || v).join(' + ');
}

// Get emoji string for style
function getStyleEmojis(vibes: ThemeId[]): string {
  return vibes.map(v => VIBE_DATA[v]?.emoji || '').join('+');
}

export default function HomePage() {
  // Project input
  const [project, setProject] = useState('');

  // Search styles (formerly directions)
  const [styles, setStyles] = useState<SearchStyle[]>([]);
  const [selectedVibes, setSelectedVibes] = useState<ThemeId[]>([]);

  // Settings
  const [selectedTLDs, setSelectedTLDs] = useState<string[]>(['com', 'ai']);
  const [charRange, setCharRange] = useState<[number, number]>([4, 12]);
  const [showSettings, setShowSettings] = useState(false);

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

  // Help tooltip
  const [showHelp, setShowHelp] = useState(false);

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

        {/* Vibe Selection */}
        <div className="mb-6 p-6 bg-white rounded-xl border border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            I want domains that feel...
          </h2>

          {/* Vibe Chips */}
          <div className="flex flex-wrap gap-2 mb-4">
            {VIBE_ORDER.map((vibeId) => {
              const vibe = VIBE_DATA[vibeId];
              const isSelected = selectedVibes.includes(vibeId);
              return (
                <button
                  key={vibeId}
                  data-tooltip-id={`vibe-tooltip-${vibeId}`}
                  onClick={() => toggleVibe(vibeId)}
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

          {/* Vibe Tooltips */}
          {VIBE_ORDER.map((vibeId) => {
            const vibe = VIBE_DATA[vibeId];
            return (
              <Tooltip
                key={`tooltip-${vibeId}`}
                id={`vibe-tooltip-${vibeId}`}
                place="top"
                className="!bg-gray-900 !text-white !rounded-lg !px-4 !py-3 !max-w-xs z-50"
              >
                <div className="text-sm">
                  <div className="font-bold mb-1">{vibe.emoji} {vibe.title}</div>
                  <div className="text-gray-300 mb-2">Examples: {vibe.examples.join(', ')}</div>
                  <div className="text-gray-400 text-xs">Good for: {vibe.goodFor}</div>
                </div>
              </Tooltip>
            );
          })}

          {/* Selected Preview */}
          {selectedVibes.length > 0 && (
            <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg border border-blue-200">
              <div>
                <span className="text-sm text-gray-600">Selected: </span>
                <span className="font-semibold text-gray-900">
                  {selectedVibes.map(v => `${VIBE_DATA[v].emoji} ${VIBE_DATA[v].name}`).join(' + ')}
                </span>
              </div>
              <button
                onClick={saveAsStyle}
                className="px-4 py-2 bg-brand-blue text-white rounded-lg text-sm font-medium hover:bg-blue-600 transition-colors"
              >
                Save as style →
              </button>
            </div>
          )}
        </div>

        {/* My Search Styles */}
        {styles.length > 0 && (
          <div className="mb-6 p-6 bg-white rounded-xl border border-gray-200">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-semibold text-gray-900">My search styles</h2>
                <button
                  onClick={() => setShowHelp(!showHelp)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <HelpCircle className="w-4 h-4" />
                </button>
              </div>
            </div>

            {showHelp && (
              <div className="mb-4 p-3 bg-blue-50 rounded-lg text-sm text-gray-700">
                Each style searches separately. Results from all styles are combined and ranked together.
                Combine vibes (like Greek + Catchy) for unique naming directions!
              </div>
            )}

            <div className="space-y-2">
              {styles.map((style) => (
                <div
                  key={style.id}
                  className="flex items-start justify-between p-3 bg-gray-50 rounded-lg border border-gray-200"
                >
                  <div>
                    <div className="font-semibold text-gray-900">
                      {style.vibes.map(v => `${VIBE_DATA[v].emoji} ${VIBE_DATA[v].name}`).join(' + ')}
                    </div>
                    <div className="text-sm text-gray-500">{style.description}</div>
                  </div>
                  <button
                    onClick={() => removeStyle(style.id)}
                    className="text-gray-400 hover:text-red-500 transition-colors p-1"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Settings Row */}
        <div className="mb-6 flex items-center gap-4 flex-wrap">
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
                  px-2.5 py-1 rounded text-xs font-mono transition-all
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

          {/* More Settings */}
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
            disabled={styles.length === 0 || !project.trim() || isGenerating}
            className={`
              ml-auto px-6 py-2.5 rounded-xl font-bold text-sm transition-all flex items-center gap-2
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
                Generate from all styles
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
                <div className="text-sm text-gray-500 mb-3">Filter results:</div>
                <div className="space-y-3">
                  {/* Length filters */}
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-500 w-16">Length</span>
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
                  </div>

                  {/* TLD filters */}
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-500 w-16">TLD</span>
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
                  </div>

                  {/* Style filters */}
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-500 w-16">Style</span>
                    {Array.from(resultStyles.entries()).map(([styleId, { name }]) => (
                      <button
                        key={styleId}
                        onClick={() => toggleFilter('styleId', styleId)}
                        className={`px-3 py-1.5 rounded-full text-sm transition-all ${
                          activeFilters.styleId === styleId
                            ? 'bg-brand-blue text-white'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                      >
                        {name}
                      </button>
                    ))}
                  </div>

                  {/* Clear all */}
                  {Object.keys(activeFilters).length > 0 && (
                    <div className="flex justify-end">
                      <button
                        onClick={() => setActiveFilters({})}
                        className="text-sm text-gray-500 hover:text-gray-700"
                      >
                        Clear all
                      </button>
                    </div>
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
          <div className="text-center py-16 text-gray-500">
            <Sparkles className="w-12 h-12 mx-auto mb-4 text-gray-300" />
            <p className="text-lg font-medium mb-2">Ready to find your perfect domain</p>
            <p className="text-sm">Select vibes above, save as style, then generate!</p>
          </div>
        )}
      </main>

      {/* Saved Domains Tray */}
      {savedDomains.length > 0 && (
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-lg z-50">
          <div className="max-w-5xl mx-auto px-6 py-4">
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
