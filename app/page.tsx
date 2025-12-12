/**
 * 🏠 DOMAINSEEK.AI - Table Layout UI
 *
 * ① Build a style → ② Your search list
 * Aligned table rows, global tooltips, fast analysis
 */

'use client';

import { useState, useMemo, useEffect, useCallback, useRef } from 'react';
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
  description: string;
}> = {
  'catchy': { id: 'catchy', emoji: '🎯', name: 'Catchy', title: 'Catchy & Memorable', examples: ['Zipzap', 'Buzzflow', 'Snapbean'], description: 'Short & memorable' },
  'direct': { id: 'direct', emoji: '💼', name: 'Direct', title: 'Direct & Clear', examples: ['GetCoffee', 'CoffeeClub'], description: 'Clear business names' },
  'nature': { id: 'nature', emoji: '🌿', name: 'Nature', title: 'Nature & Organic', examples: ['Willowbrew', 'Mossroast'], description: 'Organic & earthy' },
  'tech': { id: 'tech', emoji: '⚡', name: 'Tech', title: 'Tech & Innovation', examples: ['NexusAI', 'QuantumLab'], description: 'Modern & innovative' },
  'gen-z': { id: 'gen-z', emoji: '✨', name: 'Modern', title: 'Modern & Trendy', examples: ['Vibecheck', 'Glowup'], description: 'Fresh & trendy' },
  'ancient-greek': { id: 'ancient-greek', emoji: '🏛️', name: 'Greek', title: 'Greek Mythology', examples: ['Nike', 'Hermes', 'Apollo'], description: 'Mythology inspired' },
  'roman': { id: 'roman', emoji: '⚔️', name: 'Roman', title: 'Roman Empire', examples: ['Mars', 'Venus', 'Jupiter'], description: 'Imperial & commanding' },
  'norse': { id: 'norse', emoji: '🪓', name: 'Norse', title: 'Norse Mythology', examples: ['Thor', 'Odin', 'Valhalla'], description: 'Viking & heroic' },
  'astrology': { id: 'astrology', emoji: '⭐', name: 'Astrology', title: 'Zodiac & Celestial', examples: ['Aries', 'Luna', 'Stellar'], description: 'Celestial & mystical' },
  'ocean': { id: 'ocean', emoji: '🌊', name: 'Ocean', title: 'Ocean & Maritime', examples: ['Waveflow', 'Tidalab'], description: 'Waves & maritime' },
  'solar-system': { id: 'solar-system', emoji: '🌞', name: 'Cosmic', title: 'Space & Cosmos', examples: ['Novaforge', 'Stellarlink'], description: 'Space & stars' },
  'abstract': { id: 'abstract', emoji: '🎭', name: 'Abstract', title: 'Abstract & Conceptual', examples: ['Zenith', 'Paradigm'], description: 'Conceptual & unique' },
  'literary': { id: 'literary', emoji: '📚', name: 'Literary', title: 'Books & Literature', examples: ['Gatsby', 'Sherlock'], description: 'Classic & sophisticated' },
  'music': { id: 'music', emoji: '🎵', name: 'Music', title: 'Music & Rhythm', examples: ['Rhythmflow', 'Harmonylab'], description: 'Rhythm & sound' },
  'art': { id: 'art', emoji: '🎨', name: 'Art', title: 'Visual Arts', examples: ['Canvasflow', 'Palettelab'], description: 'Visual & creative' },
  'gaming': { id: 'gaming', emoji: '🎮', name: 'Gaming', title: 'Gaming & Esports', examples: ['Questforge', 'Arcadeflow'], description: 'Playful & action' },
};

const VIBE_ORDER: ThemeId[] = [
  'catchy', 'direct', 'nature', 'tech', 'gen-z',
  'ancient-greek', 'roman', 'norse', 'astrology', 'ocean',
  'solar-system', 'abstract', 'literary', 'music', 'art', 'gaming',
];

// Word type options
type WordType = 'real' | 'madeup' | 'both';
const WORD_TYPES: { id: WordType; label: string; description: string }[] = [
  { id: 'both', label: 'Any', description: 'Real & made-up words' },
  { id: 'real', label: 'Real Words', description: 'Dictionary words only' },
  { id: 'madeup', label: 'Made-up', description: 'Phonetic invented words' },
];

// Languages for inspiration
const LANGUAGES = [
  { id: 'any', label: 'Any Language', flag: '🌍' },
  { id: 'english', label: 'English', flag: '🇬🇧' },
  { id: 'spanish', label: 'Spanish', flag: '🇪🇸' },
  { id: 'french', label: 'French', flag: '🇫🇷' },
  { id: 'italian', label: 'Italian', flag: '🇮🇹' },
  { id: 'german', label: 'German', flag: '🇩🇪' },
  { id: 'portuguese', label: 'Portuguese', flag: '🇵🇹' },
  { id: 'japanese', label: 'Japanese', flag: '🇯🇵' },
  { id: 'latin', label: 'Latin', flag: '🏛️' },
  { id: 'sanskrit', label: 'Sanskrit', flag: '🕉️' },
  { id: 'arabic', label: 'Arabic', flag: '🇸🇦' },
  { id: 'swahili', label: 'Swahili', flag: '🇰🇪' },
  { id: 'hawaiian', label: 'Hawaiian', flag: '🌺' },
  { id: 'nordic', label: 'Nordic', flag: '🇸🇪' },
];

interface SearchStyle {
  id: string;
  vibes: ThemeId[];
  description: string;
  wordType: WordType;
  language: string;
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

function getStyleDescription(vibes: ThemeId[]): string {
  if (vibes.length === 1) {
    const vibe = VIBE_DATA[vibes[0]];
    return `${vibe.description} - ${vibe.examples.slice(0, 3).join(', ')}`;
  }
  return vibes.map(v => VIBE_DATA[v]?.description || v).join(' meets ');
}

function getStyleName(vibes: ThemeId[]): string {
  return vibes.map(v => VIBE_DATA[v]?.name || v).join(' + ');
}

function getStyleChipLabel(style: SearchStyle): string {
  const parts: string[] = [];
  if (style.vibes.length > 0) {
    parts.push(style.vibes.map(v => `${VIBE_DATA[v]?.emoji}${VIBE_DATA[v]?.name}`).join('+'));
  }
  if (style.language && style.language !== 'any') {
    const lang = LANGUAGES.find(l => l.id === style.language);
    if (lang) parts.push(`${lang.flag}`);
  }
  if (style.wordType && style.wordType !== 'both') {
    parts.push(style.wordType === 'real' ? '📖' : '✨');
  }
  return parts.join(' ') || 'Custom';
}

// Dual-thumb range slider
function RangeSlider({ min, max, value, onChange }: {
  min: number; max: number; value: [number, number]; onChange: (v: [number, number]) => void;
}) {
  const trackRef = useRef<HTMLDivElement>(null);
  const getPercent = (val: number) => ((val - min) / (max - min)) * 100;

  const handleMouseDown = (thumb: 'min' | 'max') => (e: React.MouseEvent) => {
    e.preventDefault();
    const track = trackRef.current;
    if (!track) return;

    const handleMouseMove = (e: MouseEvent) => {
      const rect = track.getBoundingClientRect();
      const percent = Math.max(0, Math.min(100, ((e.clientX - rect.left) / rect.width) * 100));
      const newVal = Math.round(min + (percent / 100) * (max - min));
      if (thumb === 'min') onChange([Math.min(newVal, value[1] - 1), value[1]]);
      else onChange([value[0], Math.max(newVal, value[0] + 1)]);
    };

    const handleMouseUp = () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  return (
    <div className="flex items-center gap-2">
      <span className="text-xs text-gray-500 w-4">{value[0]}</span>
      <div ref={trackRef} className="relative h-1.5 w-24 bg-gray-200 rounded-full cursor-pointer">
        <div className="absolute h-full bg-brand-blue rounded-full" style={{ left: `${getPercent(value[0])}%`, right: `${100 - getPercent(value[1])}%` }} />
        <div className="absolute w-3.5 h-3.5 bg-brand-blue rounded-full -translate-y-1/4 -translate-x-1/2 cursor-grab shadow-sm border-2 border-white" style={{ left: `${getPercent(value[0])}%` }} onMouseDown={handleMouseDown('min')} />
        <div className="absolute w-3.5 h-3.5 bg-brand-blue rounded-full -translate-y-1/4 -translate-x-1/2 cursor-grab shadow-sm border-2 border-white" style={{ left: `${getPercent(value[1])}%` }} onMouseDown={handleMouseDown('max')} />
      </div>
      <span className="text-xs text-gray-500 w-4">{value[1]}</span>
    </div>
  );
}

export default function HomePage() {
  const [project, setProject] = useState('');
  const [styles, setStyles] = useState<SearchStyle[]>([]);
  const [selectedVibes, setSelectedVibes] = useState<ThemeId[]>([]);
  const [selectedWordType, setSelectedWordType] = useState<WordType>('both');
  const [selectedLanguage, setSelectedLanguage] = useState('any');
  const [selectedTLDs, setSelectedTLDs] = useState<string[]>(['com', 'ai']);
  const [charRange, setCharRange] = useState<[number, number]>([4, 12]);
  const [domains, setDomains] = useState<DomainResult[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [loadingStyles, setLoadingStyles] = useState<Set<string>>(new Set());
  const [seenDomains, setSeenDomains] = useState<Set<string>>(new Set());
  const [savedDomains, setSavedDomains] = useState<DomainResult[]>([]);
  const [activeFilters, setActiveFilters] = useState<{ maxLength?: number; styleId?: string; tldFilter?: string }>({});
  const [selectedDomain, setSelectedDomain] = useState<DomainResult | null>(null);
  const [loadingAnalysis, setLoadingAnalysis] = useState(false);

  // Load from localStorage
  useEffect(() => {
    const seen = localStorage.getItem('domainseek_seen');
    if (seen) try { setSeenDomains(new Set(JSON.parse(seen))); } catch {}
    const saved = localStorage.getItem('domainseek_saved');
    if (saved) try { setSavedDomains(JSON.parse(saved)); } catch {}
  }, []);

  useEffect(() => {
    if (seenDomains.size > 0) localStorage.setItem('domainseek_seen', JSON.stringify(Array.from(seenDomains)));
  }, [seenDomains]);

  useEffect(() => {
    localStorage.setItem('domainseek_saved', JSON.stringify(savedDomains));
  }, [savedDomains]);

  const filteredDomains = useMemo(() => {
    let result = domains;
    if (activeFilters.maxLength) result = result.filter(d => d.domain.split('.')[0].length <= activeFilters.maxLength!);
    if (activeFilters.styleId) result = result.filter(d => d.styleId === activeFilters.styleId);
    if (activeFilters.tldFilter) result = result.filter(d => d.domain.endsWith(`.${activeFilters.tldFilter}`));
    return result;
  }, [domains, activeFilters]);

  const toggleVibe = (vibeId: ThemeId) => {
    setSelectedVibes(prev => prev.includes(vibeId) ? prev.filter(v => v !== vibeId) : [...prev, vibeId]);
  };

  const saveAsStyle = () => {
    if (selectedVibes.length === 0 && selectedLanguage === 'any' && selectedWordType === 'both') return;
    const langLabel = LANGUAGES.find(l => l.id === selectedLanguage)?.label || '';
    const wordLabel = WORD_TYPES.find(w => w.id === selectedWordType)?.label || '';
    const vibeDesc = selectedVibes.length > 0 ? getStyleDescription(selectedVibes) : '';
    const parts = [vibeDesc, selectedLanguage !== 'any' ? langLabel : '', selectedWordType !== 'both' ? wordLabel : ''].filter(Boolean);
    setStyles(prev => [...prev, {
      id: `style-${Date.now()}`,
      vibes: [...selectedVibes],
      description: parts.join(' + ') || 'Custom',
      wordType: selectedWordType,
      language: selectedLanguage,
    }]);
    setSelectedVibes([]);
    setSelectedWordType('both');
    setSelectedLanguage('any');
  };

  const removeStyle = (styleId: string) => setStyles(prev => prev.filter(s => s.id !== styleId));

  const toggleSave = (domain: DomainResult) => {
    setSavedDomains(prev => prev.some(d => d.domain === domain.domain) ? prev.filter(d => d.domain !== domain.domain) : [...prev, domain]);
  };

  const isSaved = (domain: string) => savedDomains.some(d => d.domain === domain);

  const generateForStyle = useCallback(async (style: SearchStyle, existingDomains: Set<string>) => {
    try {
      const response = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          project,
          themes: style.vibes.length > 0 ? style.vibes : ['catchy'],
          countPerTheme: 25,
          charMin: charRange[0],
          charMax: charRange[1],
          tlds: selectedTLDs,
          wordType: style.wordType,
          language: style.language,
        }),
      });
      const data = await response.json();
      if (data.success && data.data?.themes) {
        const themeDomains = Object.values(data.data.themes).flat() as DomainResult[];
        return themeDomains
          .filter(d => d.available && d.confidence >= 0.95)
          .filter(d => !existingDomains.has(d.domain) && !seenDomains.has(d.domain))
          .map(d => ({ ...d, styleId: style.id, styleVibes: style.vibes, styleName: getStyleName(style.vibes) }));
      }
    } catch (error) { console.error(`Generation error:`, error); }
    return [];
  }, [project, charRange, selectedTLDs, seenDomains]);

  const getAnalysis = useCallback(async (domainsToAnalyze: DomainResult[]) => {
    if (domainsToAnalyze.length === 0) return domainsToAnalyze;
    // Batch in chunks of 20 (API limit)
    const BATCH_SIZE = 20;
    for (let i = 0; i < domainsToAnalyze.length; i += BATCH_SIZE) {
      const batch = domainsToAnalyze.slice(i, i + BATCH_SIZE);
      try {
        const response = await fetch('/api/analyze', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ domains: batch.map(d => d.domain), project }),
        });
        const data = await response.json();
        if (data.success && data.analyses) {
          batch.forEach(domain => {
            const analysis = data.analyses.find((a: DomainAnalysis) => a.domain === domain.domain);
            if (analysis) domain.analysis = analysis;
          });
        }
      } catch (error) { console.warn('Analysis batch failed:', error); }
    }
    return domainsToAnalyze;
  }, [project]);

  const generateDomains = async (append = false) => {
    if (styles.length === 0 || !project.trim()) return;
    setIsGenerating(true);
    if (!append) { setDomains([]); setActiveFilters({}); }

    const existingDomains = new Set(domains.map(d => d.domain));
    setLoadingStyles(new Set(styles.map(s => s.id)));

    await Promise.all(styles.map(async (style) => {
      const styleDomains = await generateForStyle(style, existingDomains);
      styleDomains.forEach(d => existingDomains.add(d.domain));
      const analyzed = await getAnalysis(styleDomains);

      setDomains(prev => {
        const newDomains = [...prev, ...analyzed];
        newDomains.sort((a, b) => (b.analysis?.overallScore || 0) - (a.analysis?.overallScore || 0));
        return newDomains;
      });

      setLoadingStyles(prev => { const next = new Set(prev); next.delete(style.id); return next; });
      setSeenDomains(prev => { const next = new Set(prev); analyzed.forEach(d => next.add(d.domain)); return next; });
    }));

    setIsGenerating(false);
  };

  const handleDomainClick = async (domainResult: DomainResult) => {
    if (domainResult.analysis) { setSelectedDomain(domainResult); return; }
    setLoadingAnalysis(true);
    setSelectedDomain(domainResult);
    try {
      const response = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ domains: [domainResult.domain], project: project || 'general brand' }),
      });
      const data = await response.json();
      if (data.success && data.analyses?.[0]) setSelectedDomain({ ...domainResult, analysis: data.analyses[0] });
    } catch (error) { console.error('Analysis error:', error); }
    finally { setLoadingAnalysis(false); }
  };

  const toggleFilter = (filterType: 'maxLength' | 'styleId' | 'tldFilter', value: number | string) => {
    setActiveFilters(prev => {
      if (prev[filterType] === value) { const { [filterType]: _, ...rest } = prev; return rest; }
      return { ...prev, [filterType]: value };
    });
  };

  const resultStyles = useMemo(() => {
    const styleMap = new Map<string, { vibes: ThemeId[]; name: string }>();
    domains.forEach(d => { if (!styleMap.has(d.styleId)) styleMap.set(d.styleId, { vibes: d.styleVibes, name: d.styleName }); });
    return styleMap;
  }, [domains]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50">
      <AdminAlert />

      <header className="bg-white border-b border-gray-200">
        <div className="max-w-5xl mx-auto px-6 py-4">
          <h1 className="text-2xl font-bold text-gray-900">Domain<span className="text-brand-blue">Seek</span></h1>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-6">
        {/* Project Input */}
        <div className="mb-5">
          <label className="block text-sm font-semibold text-gray-700 mb-2">What are you building?</label>
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input type="text" value={project} onChange={(e) => setProject(e.target.value)} placeholder="e.g., coffee subscription startup" className="w-full pl-12 pr-4 py-3 border-2 border-gray-300 rounded-xl focus:border-brand-blue focus:ring-4 focus:ring-blue-50 outline-none text-base" />
          </div>
        </div>

        {/* Step 1: Build a Style */}
        <div className="mb-3 p-4 bg-white rounded-xl border border-gray-200">
          <div className="flex items-baseline gap-3 mb-3">
            <span className="flex items-center justify-center w-5 h-5 rounded-full bg-brand-blue text-white text-xs font-bold">1</span>
            <h2 className="text-sm font-semibold text-gray-900">Build a style</h2>
            <span className="text-xs text-gray-500">(click multiple to combine)</span>
          </div>

          <div className="flex flex-wrap gap-1.5 mb-3">
            {VIBE_ORDER.map((vibeId) => {
              const vibe = VIBE_DATA[vibeId];
              const isSelected = selectedVibes.includes(vibeId);
              return (
                <button key={vibeId} data-tooltip-id="vibe-tooltips" data-tooltip-content={`${vibe.title}: ${vibe.examples.join(', ')}`}
                  onClick={() => toggleVibe(vibeId)}
                  className={`px-2 py-1 rounded-md border text-xs font-medium transition-all ${isSelected ? 'border-brand-blue bg-blue-50 text-brand-blue' : 'border-gray-300 bg-white text-gray-700 hover:border-gray-400'}`}
                >{vibe.emoji} {vibe.name}</button>
              );
            })}
          </div>

          {/* Word Type and Language selectors */}
          <div className="flex items-center gap-4 mb-3">
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-600">Words:</span>
              <div className="flex gap-1">
                {WORD_TYPES.map((wt) => (
                  <button key={wt.id} onClick={() => setSelectedWordType(wt.id)}
                    data-tooltip-id="vibe-tooltips" data-tooltip-content={wt.description}
                    className={`px-2 py-1 rounded text-xs font-medium transition-all ${selectedWordType === wt.id ? 'bg-brand-blue text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                  >{wt.label}</button>
                ))}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-600">Language:</span>
              <select value={selectedLanguage} onChange={(e) => setSelectedLanguage(e.target.value)}
                className="px-2 py-1 rounded border border-gray-300 text-xs bg-white text-gray-700 focus:border-brand-blue focus:ring-1 focus:ring-brand-blue outline-none"
              >
                {LANGUAGES.map((lang) => (
                  <option key={lang.id} value={lang.id}>{lang.flag} {lang.label}</option>
                ))}
              </select>
            </div>
          </div>

          {(selectedVibes.length > 0 || selectedLanguage !== 'any' || selectedWordType !== 'both') && (
            <div className="flex items-center justify-between p-2 bg-blue-50 rounded-lg border border-blue-200">
              <span className="text-xs text-gray-900">
                {[
                  selectedVibes.length > 0 ? selectedVibes.map(v => `${VIBE_DATA[v].emoji} ${VIBE_DATA[v].name}`).join(' + ') : '',
                  selectedLanguage !== 'any' ? `${LANGUAGES.find(l => l.id === selectedLanguage)?.flag} ${LANGUAGES.find(l => l.id === selectedLanguage)?.label}` : '',
                  selectedWordType !== 'both' ? WORD_TYPES.find(w => w.id === selectedWordType)?.label : '',
                ].filter(Boolean).join(' + ')}
              </span>
              <button onClick={saveAsStyle} className="px-2.5 py-1 bg-brand-blue text-white rounded text-xs font-medium hover:bg-blue-600 transition-colors">Add to list →</button>
            </div>
          )}
        </div>

        {/* Step 2: Your Search List */}
        <div className="mb-3 p-4 bg-white rounded-xl border border-gray-200">
          <div className="flex items-center gap-3 mb-2">
            <span className="flex items-center justify-center w-5 h-5 rounded-full bg-brand-blue text-white text-xs font-bold">2</span>
            <h2 className="text-sm font-semibold text-gray-900">Your search list</h2>
            {styles.length > 0 && <span className="text-xs text-gray-500">{styles.length} style{styles.length !== 1 ? 's' : ''}</span>}
          </div>

          {styles.length === 0 ? (
            <p className="text-xs text-gray-400 italic">No styles yet. Build one above.</p>
          ) : (
            <div className="flex flex-wrap gap-1.5">
              {styles.map((style) => (
                <div key={style.id} data-tooltip-id="style-tooltips" data-tooltip-content={style.description} className="flex items-center gap-1 px-2 py-1 bg-gray-100 rounded border border-gray-200">
                  <span className="text-xs font-medium text-gray-800">{getStyleChipLabel(style)}</span>
                  <button onClick={() => removeStyle(style.id)} className="text-gray-400 hover:text-red-500 transition-colors"><X className="w-3 h-3" /></button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Settings Row */}
        <div className="mb-5 flex items-center gap-3 flex-wrap bg-white rounded-xl border border-gray-200 p-3">
          <div className="flex items-center gap-1.5">
            <span className="text-xs text-gray-600">TLDs:</span>
            {['com', 'ai', 'io', 'app', 'dev'].map((tld) => (
              <button key={tld} onClick={() => setSelectedTLDs(prev => prev.includes(tld) ? (prev.length > 1 ? prev.filter(t => t !== tld) : prev) : [...prev, tld])}
                className={`px-1.5 py-0.5 rounded text-xs font-mono transition-all ${selectedTLDs.includes(tld) ? 'bg-brand-blue text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
              >.{tld}</button>
            ))}
          </div>
          <div className="w-px h-5 bg-gray-200" />
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-600">Length:</span>
            <RangeSlider min={3} max={15} value={charRange} onChange={setCharRange} />
          </div>
          <button onClick={() => generateDomains(false)} disabled={styles.length === 0 || !project.trim() || isGenerating}
            className={`ml-auto px-4 py-1.5 rounded-lg font-bold text-xs transition-all flex items-center gap-1.5 ${styles.length > 0 && project.trim() && !isGenerating ? 'bg-gradient-to-r from-brand-blue to-brand-violet text-white hover:shadow-lg' : 'bg-gray-200 text-gray-400 cursor-not-allowed'}`}
          >
            {isGenerating ? <><Loader2 className="w-3.5 h-3.5 animate-spin" />Generating...</> : <><Sparkles className="w-3.5 h-3.5" />Generate</>}
          </button>
        </div>

        {/* Results Section */}
        {(domains.length > 0 || isGenerating) && (
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            {/* Header + Filters */}
            <div className="flex flex-wrap items-center gap-3 mb-4">
              <span className="text-sm text-gray-600">
                <span className="font-bold text-gray-900">{filteredDomains.length}</span>
                {filteredDomains.length !== domains.length && <span className="text-gray-500"> of {domains.length}</span>} domains
              </span>
              {loadingStyles.size > 0 && <span className="flex items-center gap-1.5 text-brand-blue text-xs"><span className="w-1.5 h-1.5 bg-brand-blue rounded-full animate-pulse"></span>Loading...</span>}

              {domains.length > 0 && (
                <>
                  <span className="text-gray-300">|</span>
                  <button onClick={() => toggleFilter('maxLength', 6)} className={`px-2 py-0.5 rounded text-xs transition-all ${activeFilters.maxLength === 6 ? 'bg-brand-blue text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>≤6</button>
                  <button onClick={() => toggleFilter('maxLength', 8)} className={`px-2 py-0.5 rounded text-xs transition-all ${activeFilters.maxLength === 8 ? 'bg-brand-blue text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>≤8</button>
                  {selectedTLDs.map(tld => (
                    <button key={tld} onClick={() => toggleFilter('tldFilter', tld)} className={`px-2 py-0.5 rounded text-xs font-mono transition-all ${activeFilters.tldFilter === tld ? 'bg-brand-blue text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>.{tld}</button>
                  ))}
                  {resultStyles.size > 1 && Array.from(resultStyles.entries()).map(([styleId, { name }]) => (
                    <button key={styleId} onClick={() => toggleFilter('styleId', styleId)} className={`px-2 py-0.5 rounded text-xs transition-all ${activeFilters.styleId === styleId ? 'bg-brand-blue text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>{name}</button>
                  ))}
                  {Object.keys(activeFilters).length > 0 && <button onClick={() => setActiveFilters({})} className="text-xs text-gray-400 hover:text-gray-600">Clear</button>}
                </>
              )}
            </div>

            {/* Domain Grid - 4 columns with aligned prices */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
              {filteredDomains.map((domain) => {
                const saved = isSaved(domain.domain);
                return (
                  <div key={domain.domain}
                    data-tooltip-id="domain-tooltips"
                    data-tooltip-html={domain.analysis ? `<div class="text-xs"><div class="font-bold">${domain.domain}</div><div>Score: ${domain.analysis.overallScore.toFixed(1)}/10</div><div class="text-gray-400">${domain.analysis.meaning || ''}</div></div>` : ''}
                    onClick={() => handleDomainClick(domain)}
                    className={`flex items-center justify-between gap-1 px-2 py-1.5 rounded-lg cursor-pointer transition-all ${saved ? 'bg-pink-50 hover:bg-pink-100' : 'bg-gray-50 hover:bg-blue-50'}`}
                  >
                    <div className="flex items-center gap-1 min-w-0">
                      <span className="font-mono text-sm font-semibold text-gray-900 truncate">{domain.domain}</span>
                      <span className="text-xs font-bold text-brand-blue flex-shrink-0">{domain.analysis ? domain.analysis.overallScore.toFixed(1) : '—'}</span>
                    </div>
                    <div className="flex items-center gap-1 flex-shrink-0">
                      <a href={`https://www.namecheap.com/domains/registration/results/?domain=${domain.domain}`} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()}
                        className="px-2 py-0.5 bg-brand-blue text-white text-xs font-bold rounded text-center hover:bg-blue-600 transition-colors"
                      >${domain.price || (domain.domain.endsWith('.ai') ? 70 : 13)}</a>
                      <button onClick={(e) => { e.stopPropagation(); toggleSave(domain); }} className={`transition-colors ${saved ? 'text-pink-500' : 'text-gray-300 hover:text-pink-500'}`}>
                        <Heart className={`w-4 h-4 ${saved ? 'fill-pink-500' : ''}`} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            {domains.length > 0 && (
              <div className="mt-4 text-center">
                {isGenerating ? (
                  <div className="flex items-center justify-center gap-2 text-gray-500">
                    <div className="w-4 h-4 border-2 border-brand-blue border-t-transparent rounded-full animate-spin" />
                    <span className="text-xs font-medium">Loading more domains...</span>
                  </div>
                ) : (
                  <button onClick={() => generateDomains(true)} className="px-4 py-2 text-xs font-medium text-gray-600 hover:text-brand-blue transition-colors">+ Load More</button>
                )}
              </div>
            )}
          </div>
        )}

        {domains.length === 0 && !isGenerating && (
          <div className="text-center py-10 text-gray-500">
            <Sparkles className="w-8 h-8 mx-auto mb-2 text-gray-300" />
            <p className="text-sm font-medium">Ready to find your perfect domain</p>
            <p className="text-xs">Build a style, add it to your list, then generate!</p>
          </div>
        )}
      </main>

      {/* Saved Domains Tray */}
      {savedDomains.length > 0 && (
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-lg z-50">
          <div className="max-w-5xl mx-auto px-6 py-2">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1.5">
                <Heart className="w-4 h-4 text-pink-500 fill-pink-500" />
                <span className="font-semibold text-gray-900 text-xs">Saved ({savedDomains.length})</span>
              </div>
              <div className="flex-1 flex items-center gap-1.5 overflow-x-auto">
                {savedDomains.map((domain) => (
                  <div key={domain.domain} className="flex items-center gap-1 px-2 py-1 bg-gray-100 rounded flex-shrink-0">
                    <span className="font-mono text-xs text-gray-900">{domain.domain}</span>
                    <button onClick={() => toggleSave(domain)} className="text-gray-400 hover:text-red-500 transition-colors"><X className="w-3 h-3" /></button>
                  </div>
                ))}
              </div>
              <button className="px-3 py-1 bg-gradient-to-r from-brand-blue to-brand-violet text-white rounded text-xs font-semibold hover:shadow-lg transition-all">Compare →</button>
            </div>
          </div>
        </div>
      )}

      {/* Modal */}
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
          <DomainDetailsModal domain={selectedDomain.domain} price={selectedDomain.price || 13} analysis={selectedDomain.analysis}
            onClose={() => setSelectedDomain(null)}
            onBuy={() => window.open(`https://www.namecheap.com/domains/registration/results/?domain=${selectedDomain.domain}`, '_blank')}
          />
        ) : null
      )}

      {/* Global Tooltips */}
      <Tooltip id="vibe-tooltips" place="top" className="!bg-gray-900 !text-white !rounded-lg !px-3 !py-2 !text-xs z-50" />
      <Tooltip id="style-tooltips" place="top" className="!bg-gray-900 !text-white !rounded-lg !px-3 !py-2 !text-xs z-50" />
      <Tooltip id="domain-tooltips" place="top" className="!bg-gray-900 !text-white !rounded-lg !px-3 !py-2 z-50" />
    </div>
  );
}
