'use client';

import { useState, useEffect, useCallback } from 'react';
import { FloatingTags, RotatingText } from '@/components/FloatingTags';
import { Tooltip } from 'react-tooltip';
import { Heart } from 'lucide-react';

interface DomainAnalysis {
  domain: string;
  overallScore: number;
  meaning: string;
  scores: {
    memorability: number;
    brandability: number;
    relevance: number;
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

  // Load saved domains from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('savedDomains');
    if (saved) setSavedDomains(JSON.parse(saved));
  }, []);

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

  // Fetch analysis for domains
  const getAnalysis = useCallback(async (domains: string[]) => {
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
    <div className="min-h-screen bg-slate-950 text-white">
      <div className="max-w-4xl mx-auto px-4 py-16">
        {/* Header with rotating text */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-4">
            <span className="text-white">Find the perfect domain for your </span>
            <RotatingText />
          </h1>
          <p className="text-slate-400 text-lg">
            Describe what you're building, or click a style below
          </p>
        </div>

        {/* Search Input */}
        <div className="relative mb-6">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="e.g., meditation app for professionals, greek mythology fintech..."
            className="w-full px-6 py-4 text-lg rounded-xl
                       bg-slate-900 border border-slate-700
                       focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20
                       outline-none transition-all
                       placeholder:text-slate-500"
          />
          <button
            onClick={handleSearch}
            disabled={loading || !query.trim()}
            className="absolute right-2 top-1/2 -translate-y-1/2
                       px-6 py-2 rounded-lg
                       bg-purple-600 hover:bg-purple-500
                       disabled:bg-slate-700 disabled:cursor-not-allowed
                       font-medium transition-colors"
          >
            {loading ? 'Searching...' : 'Search'}
          </button>
        </div>

        {/* Floating Tags */}
        <div className="mb-12">
          <FloatingTags onTagClick={handleTagClick} />
        </div>

        {/* Results */}
        {results.length > 0 && (
          <div className="bg-slate-900 rounded-xl border border-slate-700 p-4">
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm text-slate-400">
                <span className="font-bold text-white">{results.length}</span> domains found
              </span>
              {stats && (
                <span className="text-sm text-slate-500">
                  {stats.totalTime}ms
                </span>
              )}
            </div>

            {/* Domain Grid - 4 columns like original */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
              {results.map((domainResult) => {
                const saved = isSaved(domainResult.domain);
                return (
                  <div
                    key={domainResult.domain}
                    data-tooltip-id="domain-tooltips"
                    data-tooltip-html={domainResult.analysis
                      ? `<div class="text-xs"><div class="font-bold">${domainResult.domain}</div><div>Score: ${domainResult.analysis.overallScore.toFixed(1)}/10</div><div class="text-gray-400">${domainResult.analysis.meaning || ''}</div></div>`
                      : ''}
                    className={`flex items-center justify-between gap-1 px-1 py-1 cursor-pointer transition-all hover:bg-slate-800/50 rounded ${
                      saved ? 'text-pink-300' : ''
                    }`}
                  >
                    <div className="flex items-center gap-1 min-w-0">
                      <span className="font-mono text-sm font-semibold text-white truncate">
                        {domainResult.domain}
                      </span>
                      <span className="text-xs font-bold text-purple-400 flex-shrink-0">
                        {domainResult.analysis ? domainResult.analysis.overallScore.toFixed(1) : '—'}
                      </span>
                    </div>
                    <div className="flex items-center gap-1 flex-shrink-0">
                      <a
                        href={`https://www.namecheap.com/domains/registration/results/?domain=${domainResult.domain}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="px-2 py-0.5 bg-purple-600 text-white text-xs font-bold rounded text-center hover:bg-purple-500 transition-colors"
                      >
                        ${domainResult.domain.endsWith('.ai') ? 70 : 13}
                      </a>
                      <button
                        onClick={(e) => { e.stopPropagation(); toggleSave(domainResult.domain); }}
                        className={`transition-colors ${saved ? 'text-pink-500' : 'text-slate-500 hover:text-pink-500'}`}
                      >
                        <Heart className={`w-4 h-4 ${saved ? 'fill-pink-500' : ''}`} />
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
            <div className="w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-slate-400">Finding perfect domains...</p>
          </div>
        )}

        {/* Empty State */}
        {!loading && results.length === 0 && (
          <div className="text-center py-12 text-slate-500">
            Press Enter or click Search to find domains
          </div>
        )}
      </div>

      {/* Saved Domains Tray */}
      {savedDomains.length > 0 && (
        <div className="fixed bottom-0 left-0 right-0 bg-slate-900 border-t border-slate-700 shadow-lg z-50">
          <div className="max-w-4xl mx-auto px-4 py-2">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1.5">
                <Heart className="w-4 h-4 text-pink-500 fill-pink-500" />
                <span className="text-sm font-medium text-slate-300">{savedDomains.length} saved</span>
              </div>
              <div className="flex gap-2 overflow-x-auto">
                {savedDomains.map(domain => (
                  <span key={domain} className="px-2 py-1 bg-slate-800 rounded text-xs font-mono text-slate-300">
                    {domain}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tooltips */}
      <Tooltip id="domain-tooltips" className="z-50" />
    </div>
  );
}
