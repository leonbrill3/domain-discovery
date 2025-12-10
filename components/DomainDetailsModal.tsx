/**
 * 🎯 DOMAIN DETAILS MODAL - Full Analysis
 *
 * Complete breakdown including trademark search
 */

'use client';

import { X, ExternalLink, Heart } from 'lucide-react';
import type { DomainAnalysis } from '@/lib/ai/ranking';
import { useEffect, useState } from 'react';

interface DomainDetailsModalProps {
  domain: string;
  price: number;
  analysis: DomainAnalysis;
  onClose: () => void;
  onBuy: () => void;
}

interface TrademarkResult {
  hasConflicts: boolean;
  exactMatches: { mark: string; status: string; serialNumber: string }[];
  similarMarks: { mark: string; status: string; serialNumber: string }[];
}

export function DomainDetailsModal({
  domain,
  price,
  analysis,
  onClose,
  onBuy,
}: DomainDetailsModalProps) {
  const [trademarkData, setTrademarkData] = useState<TrademarkResult | null>(null);
  const [loadingTrademark, setLoadingTrademark] = useState(true);
  const [socialData, setSocialData] = useState<any>(null);
  const [loadingSocial, setLoadingSocial] = useState(true);

  const domainName = domain.split('.')[0];

  useEffect(() => {
    // Load trademark data
    checkTrademark();
    // Load social handles
    checkSocialHandles();
  }, [domain]);

  const checkTrademark = async () => {
    setLoadingTrademark(true);
    try {
      const response = await fetch(`/api/trademark?query=${encodeURIComponent(domainName)}`);
      const data = await response.json();
      setTrademarkData(data);
    } catch (error) {
      console.error('Trademark check error:', error);
    } finally {
      setLoadingTrademark(false);
    }
  };

  const checkSocialHandles = async () => {
    setLoadingSocial(true);
    try {
      const response = await fetch(`/api/social?handle=${encodeURIComponent(domainName)}`);
      const data = await response.json();
      setSocialData(data);
    } catch (error) {
      console.error('Social check error:', error);
    } finally {
      setLoadingSocial(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div
        className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 p-6 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 font-mono">{domain}</h2>
            <div className="flex items-center gap-3 mt-1 text-sm text-gray-600">
              <span className="font-semibold">${price}/yr</span>
              <span>•</span>
              <span className="text-3xl font-bold text-brand-blue">
                {analysis.overallScore.toFixed(1)}<span className="text-sm text-gray-500">/10</span>
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Meaning & Relevance */}
          <Section title="📖 Meaning & Relevance">
            <div className="space-y-3">
              <div>
                <h4 className="text-sm font-semibold text-gray-700 mb-1">What it means:</h4>
                <p className="text-sm text-gray-600">{analysis.meaning}</p>
              </div>
              <div>
                <h4 className="text-sm font-semibold text-gray-700 mb-1">Why it works:</h4>
                <p className="text-sm text-gray-600">{analysis.relevance}</p>
              </div>
              <div>
                <h4 className="text-sm font-semibold text-gray-700 mb-1">Ranking rationale:</h4>
                <p className="text-sm text-gray-600">{analysis.whyRanked}</p>
              </div>
            </div>
          </Section>

          {/* Pronunciation */}
          <Section title="🔤 Pronunciation">
            <div className="flex items-center gap-4">
              <div className="flex-1">
                <div className="text-2xl font-mono font-bold text-brand-blue mb-1">
                  {analysis.pronunciation.phonetic}
                </div>
                <div className="text-sm text-gray-600">
                  {analysis.pronunciation.syllables} syllable{analysis.pronunciation.syllables !== 1 ? 's' : ''}
                  {analysis.pronunciation.easyToSay && ' • Easy to pronounce'}
                  {analysis.pronunciation.rhymesWith && ` • Rhymes with: ${analysis.pronunciation.rhymesWith}`}
                </div>
              </div>
            </div>
          </Section>

          {/* Brandability Scores */}
          <Section title="💪 Brandability Breakdown">
            <div className="space-y-3">
              <ScoreLine label="Memorability" score={analysis.scores.memorability} />
              <ScoreLine label="Pronounceability" score={analysis.scores.pronounceability} />
              <ScoreLine label="Uniqueness" score={analysis.scores.uniqueness} />
              <ScoreLine label="Professionalism" score={analysis.scores.professionalism} />
              <ScoreLine label="SEO Value" score={analysis.scores.seoValue} />
            </div>
          </Section>

          {/* Social Media */}
          <Section title="📱 Social Media Handles">
            {loadingSocial ? (
              <p className="text-sm text-gray-500">Checking availability...</p>
            ) : socialData ? (
              <div className="grid grid-cols-2 gap-3">
                {['twitter', 'instagram', 'tiktok', 'facebook'].map((platform) => {
                  const available = socialData[platform]?.available;
                  return (
                    <div key={platform} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                      <span className="text-sm capitalize">{platform}</span>
                      <span className={`text-xs font-semibold ${available ? 'text-green-600' : 'text-red-600'}`}>
                        {available ? '✅ Available' : '❌ Taken'}
                      </span>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-sm text-gray-500">Could not check social handles</p>
            )}
          </Section>

          {/* Trademark */}
          <Section title="™️ Trademark Status">
            {loadingTrademark ? (
              <p className="text-sm text-gray-500">Searching USPTO database...</p>
            ) : trademarkData ? (
              <div className="space-y-3">
                {trademarkData.exactMatches.length > 0 ? (
                  <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
                    <p className="text-sm font-semibold text-amber-900 mb-2">
                      ⚠️ Found {trademarkData.exactMatches.length} exact match{trademarkData.exactMatches.length !== 1 ? 'es' : ''}
                    </p>
                    {trademarkData.exactMatches.map((tm) => (
                      <div key={tm.serialNumber} className="text-xs text-amber-800 mb-1">
                        • "{tm.mark}" - {tm.status}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                    <p className="text-sm font-semibold text-green-900">
                      ✅ No exact trademark conflicts found
                    </p>
                  </div>
                )}

                {trademarkData.similarMarks.length > 0 && (
                  <div className="text-xs text-gray-600">
                    <p className="mb-1">Similar marks found: {trademarkData.similarMarks.length}</p>
                    {trademarkData.similarMarks.slice(0, 3).map((tm) => (
                      <div key={tm.serialNumber} className="ml-2">• {tm.mark}</div>
                    ))}
                  </div>
                )}

                <a
                  href={`https://tmsearch.uspto.gov/search/search-results?searchKeyword=${encodeURIComponent(domainName)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-xs text-brand-blue hover:underline mt-2"
                >
                  View full USPTO search
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            ) : (
              <p className="text-sm text-gray-500">Could not check trademarks</p>
            )}
          </Section>

          {/* Logo Suggestions */}
          <Section title="🎨 Logo Style Suggestions">
            <div className="flex flex-wrap gap-2">
              {analysis.logoStyles.map((style) => (
                <span
                  key={style}
                  className="px-3 py-1.5 bg-gradient-to-r from-brand-blue to-brand-violet text-white text-sm rounded-lg font-medium"
                >
                  {style}
                </span>
              ))}
            </div>
          </Section>
        </div>

        {/* Footer Actions */}
        <div className="sticky bottom-0 bg-gray-50 border-t border-gray-200 p-6 flex gap-3">
          <button
            onClick={onBuy}
            className="flex-1 py-3 bg-gradient-to-r from-brand-blue to-brand-violet text-white font-bold rounded-xl hover:shadow-lg transition-all"
          >
            💎 Buy for ${price}
          </button>
          <button className="px-4 py-3 border-2 border-gray-300 rounded-xl hover:bg-gray-100 transition-colors">
            <Heart className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h3 className="text-sm font-bold text-gray-900 mb-3">{title}</h3>
      {children}
    </div>
  );
}

function ScoreLine({ label, score }: { label: string; score: number }) {
  const percentage = (score / 10) * 100;

  return (
    <div className="flex items-center gap-3">
      <span className="text-sm text-gray-700 w-32">{label}</span>
      <div className="flex-1 h-3 bg-gray-200 rounded-full overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-brand-blue to-brand-violet rounded-full transition-all"
          style={{ width: `${percentage}%` }}
        />
      </div>
      <span className="text-sm font-bold text-brand-blue w-12 text-right">
        {score.toFixed(1)}
      </span>
    </div>
  );
}
