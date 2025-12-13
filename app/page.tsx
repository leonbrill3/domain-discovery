'use client';

import { useState, useEffect, useCallback } from 'react';
import { FloatingTags, RotatingText } from '@/components/FloatingTags';
import { Tooltip } from 'react-tooltip';
import { Heart, Search, X, ExternalLink } from 'lucide-react';

interface DomainAnalysis {
  domain: string;
  overallScore: number;
  meaning: string;
  scores: {
    memorability?: number;
    brandability?: number;
    relevance?: number;
    pronounceability?: number;
    uniqueness?: number;
    professionalism?: number;
    seoValue?: number;
  };
}

interface DomainResult {
  domain: string;
  analysis?: DomainAnalysis;
}

export default function NewSearchPage() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<DomainResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState<any>(null);
  const [savedDomains, setSavedDomains] = useState<string[]>([]);
  const [hasSearched, setHasSearched] = useState(false);
  const [featuredLoading, setFeaturedLoading] = useState(true);
  const [selectedDomain, setSelectedDomain] = useState<DomainResult | null>(null);
  const [analyzingDomain, setAnalyzingDomain] = useState(false);

  // Load saved domains from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('savedDomains');
    if (saved) setSavedDomains(JSON.parse(saved));
  }, []);

  // Load featured domains on mount
  useEffect(() => {
    const loadFeatured = async () => {
      try {
        // Fetch random sample from pool
        const res = await fetch('/api/pool/search', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ tld: 'ai', limit: 15 })
        });
        const data = await res.json();
        if (data.success && data.domains && data.domains.length > 0) {
          // Domains are already strings like "cuish.ai"
          const domains: string[] = data.domains.filter((d: any) => d && typeof d === 'string');

          if (domains.length === 0) {
            setFeaturedLoading(false);
            return;
          }

          // Show domains immediately without scores
          setResults(domains.map((d: string) => ({ domain: d })));
          setFeaturedLoading(false);

          // Skip analysis for featured - just show the domains
          // Analysis API has issues with obscure words
        }
      } catch (error) {
        console.warn('Failed to load featured domains:', error);
      } finally {
        setFeaturedLoading(false);
      }
    };
    loadFeatured();
  }, []);

  // Separate analysis function for featured (no query dependency)
  const getAnalysisForFeatured = async (domains: string[]) => {
    const results: DomainResult[] = domains.map(d => ({ domain: d }));
    try {
      const response = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ domains, project: 'brandable domain names' }),
      });
      const data = await response.json();
      if (data.success && data.analyses) {
        domains.forEach((domain, idx) => {
          const analysis = data.analyses.find((a: DomainAnalysis) => a.domain === domain);
          if (analysis && results[idx]) {
            results[idx].analysis = analysis;
          }
        });
      }
    } catch (error) {
      console.warn('Featured analysis failed:', error);
    }
    return results;
  };

  const toggleSave = (domain: string) => {
    setSavedDomains(prev => {
      const next = prev.includes(domain)
        ? prev.filter(d => d !== domain)
        : [...prev, domain];
      localStorage.setItem('savedDomains', JSON.stringify(next));
      return next;
    });
  };

  const isSaved = (domain: string) => savedDomains.includes(domain);

  const handleTagClick = (tag: string) => {
    setQuery((prev) => prev.trim() ? `${prev.trim()} ${tag}` : tag);
  };

  // Analyze single domain on click (for modal)
  const handleDomainClick = async (domainResult: DomainResult) => {
    setSelectedDomain(domainResult);

    // If we already have analysis, don't refetch
    if (domainResult.analysis) return;

    // Fetch analysis for this domain
    setAnalyzingDomain(true);
    try {
      const response = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          domains: [domainResult.domain],
          project: query || 'creative brand name'
        }),
      });
      const data = await response.json();
      if (data.success && data.analyses && data.analyses.length > 0) {
        const analysis = data.analyses[0];
        // Update the selected domain with analysis
        setSelectedDomain({ ...domainResult, analysis });
        // Also update in results list
        setResults(prev => prev.map(r =>
          r.domain === domainResult.domain ? { ...r, analysis } : r
        ));
      }
    } catch (error) {
      console.warn('Domain analysis failed:', error);
    } finally {
      setAnalyzingDomain(false);
    }
  };

  // Fetch analysis for domains
  const getAnalysis = useCallback(async (rawDomains: (string | null | undefined)[]) => {
    // Filter out nulls and ensure all are strings
    const domains = rawDomains.filter((d): d is string => typeof d === 'string' && d.length > 0);
    if (domains.length === 0) return [];

    const BATCH_SIZE = 20;
    const results: DomainResult[] = domains.map(d => ({ domain: d }));

    for (let i = 0; i < domains.length; i += BATCH_SIZE) {
      const batch = domains.slice(i, i + BATCH_SIZE);
      try {
        const response = await fetch('/api/analyze', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ domains: batch, project: query || 'creative brand' }),
        });
        const data = await response.json();
        if (data.success && data.analyses) {
          batch.forEach((domain, idx) => {
            const analysis = data.analyses.find((a: DomainAnalysis) => a.domain === domain);
            const resultIdx = i + idx;
            if (analysis && results[resultIdx]) {
              results[resultIdx].analysis = analysis;
            }
          });
        }
      } catch (error) {
        console.warn('Analysis batch failed:', error);
      }
    }
    return results;
  }, [query]);

  const handleSearch = async () => {
    if (!query.trim()) return;

    setLoading(true);
    setResults([]);
    setHasSearched(true);

    try {
      const res = await fetch('/api/pool/semantic', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          description: query,
          tld: 'ai',
          limit: 15
        })
      });

      const data = await res.json();

      if (data.success) {
        setStats(data.stats);
        // Get analysis for the domains
        const analyzed = await getAnalysis(data.domains);
        // Sort by score
        analyzed.sort((a, b) => (b.analysis?.overallScore || 0) - (a.analysis?.overallScore || 0));
        setResults(analyzed);
      } else {
        console.error('Search failed:', data.error);
      }
    } catch (error) {
      console.error('Search error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  return (
    <div className="min-h-screen bg-white text-gray-900">
      {/* Branding */}
      <div className="text-center pt-8 pb-4">
        <span className="text-sm font-medium text-gray-400 tracking-wide">DomainSeek</span>
      </div>

      <div className="max-w-5xl mx-auto px-6 py-8">
        {/* Header with rotating text */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold">
            <span className="text-gray-900">Find the perfect domain for your </span>
            <RotatingText />
          </h1>
        </div>

        {/* Search Input - full width, left aligned */}
        <div className="flex items-center gap-3 mb-10">
          <Search className="w-5 h-5 text-gray-400 flex-shrink-0" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="meditation app inspired by greek mythology"
            className="text-lg bg-transparent border-0 outline-none
                       placeholder:text-gray-400 text-gray-900
                       w-full"
          />
        </div>

        {/* Floating Tags */}
        <div className="mb-16">
          <FloatingTags onTagClick={handleTagClick} />
        </div>

        {/* Featured Loading State */}
        {featuredLoading && !hasSearched && (
          <div className="text-center py-12">
            <div className="w-8 h-8 border-2 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-gray-500">Loading featured domains...</p>
          </div>
        )}

        {/* Results */}
        {results.length > 0 && (
          <div>
            {/* Header - different text for featured vs search results */}
            <div className="mb-6">
              <span className="text-base font-light tracking-wide text-orange-500">
                {hasSearched ? 'Your brand starts here' : 'Featured domains'}
              </span>
            </div>

            {/* Domain Grid - 3 columns with more spacing */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {results.filter(r => r && r.domain).map((domainResult) => {
                const saved = isSaved(domainResult.domain);
                const price = domainResult.domain.endsWith('.ai') ? 70 : 13;
                return (
                  <div
                    key={domainResult.domain}
                    onClick={() => handleDomainClick(domainResult)}
                    data-tooltip-id="domain-tooltips"
                    data-tooltip-html={domainResult.analysis
                      ? `<div style="background: white; color: #111; padding: 12px; border-radius: 8px; box-shadow: 0 4px 12px rgba(0,0,0,0.1); max-width: 280px;"><div style="font-weight: 600; color: #2563eb; font-family: monospace;">${domainResult.domain}</div><div style="margin-top: 4px;">Score: ${domainResult.analysis.overallScore.toFixed(1)}/10</div><div style="color: #666; margin-top: 4px; font-size: 12px;">${domainResult.analysis.meaning || ''}</div></div>`
                      : `<div style="background: white; color: #111; padding: 12px; border-radius: 8px; box-shadow: 0 4px 12px rgba(0,0,0,0.1);"><div style="font-weight: 600; color: #2563eb; font-family: monospace;">${domainResult.domain}</div><div style="color: #666; margin-top: 4px; font-size: 12px;">~$${price}/year • Click for details</div></div>`}
                    className={`flex items-center justify-between gap-2 py-2 px-2 cursor-pointer transition-all hover:bg-gray-50 rounded-lg ${
                      saved ? 'bg-orange-50' : ''
                    }`}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="font-mono text-base text-blue-600 truncate">
                        {domainResult.domain}
                      </span>
                      {domainResult.analysis && (
                        <span className="text-sm font-medium text-orange-500 flex-shrink-0">
                          {domainResult.analysis.overallScore.toFixed(1)}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <a
                        href={`https://www.namecheap.com/domains/registration/results/?domain=${domainResult.domain}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="text-sm text-gray-400 hover:text-orange-500 transition-colors"
                      >
                        ${domainResult.domain.endsWith('.ai') ? 70 : 13}
                      </a>
                      <button
                        onClick={(e) => { e.stopPropagation(); toggleSave(domainResult.domain); }}
                        className={`transition-colors ${saved ? 'text-orange-500' : 'text-gray-300 hover:text-orange-500'}`}
                      >
                        <Heart className={`w-5 h-5 ${saved ? 'fill-orange-500' : ''}`} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Loading State */}
        {loading && (
          <div className="text-center py-12">
            <div className="w-8 h-8 border-2 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-gray-500">Finding perfect domains...</p>
          </div>
        )}
      </div>

      {/* Saved Domains Tray */}
      {savedDomains.length > 0 && (
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-lg z-50">
          <div className="max-w-4xl mx-auto px-4 py-2">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1.5">
                <Heart className="w-4 h-4 text-orange-500 fill-orange-500" />
                <span className="text-sm font-medium text-gray-600">{savedDomains.length} saved</span>
              </div>
              <div className="flex gap-2 overflow-x-auto">
                {savedDomains.map(domain => (
                  <span key={domain} className="px-2 py-1 bg-gray-100 rounded-full text-xs font-mono text-gray-700">
                    {domain}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tooltips */}
      <Tooltip
        id="domain-tooltips"
        className="z-50"
        style={{ backgroundColor: 'transparent', padding: 0, border: 'none' }}
        opacity={1}
      />

      {/* Domain Details Modal */}
      {selectedDomain && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
          onClick={() => setSelectedDomain(null)}
        >
          <div
            className="bg-white rounded-2xl max-w-md w-full p-6 relative"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close button */}
            <button
              onClick={() => setSelectedDomain(null)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Domain name */}
            <h2 className="text-2xl font-bold text-blue-600 font-mono mb-4">
              {selectedDomain.domain}
            </h2>

            {/* Analysis loading or content */}
            {analyzingDomain ? (
              <div className="py-8 text-center">
                <div className="w-8 h-8 border-2 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                <p className="text-gray-500">Analyzing domain...</p>
              </div>
            ) : selectedDomain.analysis ? (
              <div className="space-y-4">
                {/* Overall Score */}
                <div className="flex items-center gap-4">
                  <div className="text-4xl font-bold text-orange-500">
                    {selectedDomain.analysis.overallScore.toFixed(1)}
                  </div>
                  <div className="text-gray-500 text-sm">/ 10 overall score</div>
                </div>

                {/* Meaning */}
                {selectedDomain.analysis.meaning && (
                  <p className="text-gray-600">{selectedDomain.analysis.meaning}</p>
                )}

                {/* Score breakdown */}
                {selectedDomain.analysis.scores && (
                  <div className="grid grid-cols-3 gap-4 pt-4 border-t">
                    <div className="text-center">
                      <div className="text-lg font-semibold text-gray-900">
                        {(selectedDomain.analysis.scores.memorability ?? 0).toFixed(1)}
                      </div>
                      <div className="text-xs text-gray-500">Memorability</div>
                    </div>
                    <div className="text-center">
                      <div className="text-lg font-semibold text-gray-900">
                        {(selectedDomain.analysis.scores.brandability ?? selectedDomain.analysis.scores.pronounceability ?? 0).toFixed(1)}
                      </div>
                      <div className="text-xs text-gray-500">Brandability</div>
                    </div>
                    <div className="text-center">
                      <div className="text-lg font-semibold text-gray-900">
                        {(selectedDomain.analysis.scores.relevance ?? selectedDomain.analysis.scores.uniqueness ?? 0).toFixed(1)}
                      </div>
                      <div className="text-xs text-gray-500">Relevance</div>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <p className="text-gray-500 py-4">Click to load analysis...</p>
            )}

            {/* Price and Buy button */}
            <div className="mt-6 pt-4 border-t flex items-center justify-between">
              <div className="text-gray-600">
                <span className="text-2xl font-bold text-gray-900">
                  ${selectedDomain.domain.endsWith('.ai') ? 70 : 13}
                </span>
                <span className="text-sm">/year</span>
              </div>
              <a
                href={`https://www.namecheap.com/domains/registration/results/?domain=${selectedDomain.domain}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white px-6 py-2.5 rounded-full font-medium transition-colors"
              >
                Buy Now
                <ExternalLink className="w-4 h-4" />
              </a>
            </div>

            {/* Save button */}
            <button
              onClick={() => toggleSave(selectedDomain.domain)}
              className={`mt-4 w-full py-2.5 rounded-full border transition-colors flex items-center justify-center gap-2 ${
                isSaved(selectedDomain.domain)
                  ? 'bg-orange-50 border-orange-200 text-orange-600'
                  : 'border-gray-200 text-gray-600 hover:border-orange-200 hover:text-orange-600'
              }`}
            >
              <Heart className={`w-4 h-4 ${isSaved(selectedDomain.domain) ? 'fill-orange-500' : ''}`} />
              {isSaved(selectedDomain.domain) ? 'Saved' : 'Save for later'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
