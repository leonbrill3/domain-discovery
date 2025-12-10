/**
 * 🎯 DOMAIN ANALYSIS CARD - DomainSeek.ai
 *
 * Shows complete AI analysis including:
 * - Overall ranking + explanation
 * - Meaning + relevance
 * - 5 brandability sub-scores
 * - Pronunciation guide
 * - Social media availability
 * - Logo preview
 */

'use client';

import { useState } from 'react';
import { Heart, ExternalLink, CheckCircle2, XCircle, Volume2 } from 'lucide-react';
import type { DomainAnalysis } from '@/lib/ai/ranking';
import type { SocialHandleStatus } from '@/lib/social/checker';

interface DomainAnalysisCardProps {
  domain: string;
  rank: number;
  available: boolean;
  price: number;
  currency: string;
  analysis?: DomainAnalysis;
  socialHandles?: SocialHandleStatus[];
  onBuy?: () => void;
  onSave?: () => void;
}

export function DomainAnalysisCard({
  domain,
  rank,
  available,
  price,
  currency = 'USD',
  analysis,
  socialHandles,
  onBuy,
  onSave,
}: DomainAnalysisCardProps) {
  const [isFavorite, setIsFavorite] = useState(false);
  const [showFullAnalysis, setShowFullAnalysis] = useState(false);

  const handleSave = () => {
    setIsFavorite(!isFavorite);
    if (onSave) onSave();
  };

  const domainLength = domain.split('.')[0].length;
  const tld = domain.split('.').pop();

  return (
    <div className="bg-white border-2 border-gray-200 rounded-xl p-6 hover:border-brand-blue hover:shadow-xl transition-all">
      {/* Header: Rank + Domain + Score */}
      <div className="flex items-start gap-4 mb-6">
        {/* Rank badge */}
        <div className="flex-shrink-0 w-12 h-12 bg-gradient-to-br from-brand-blue to-brand-violet rounded-full flex items-center justify-center text-white font-bold text-lg shadow-lg">
          #{rank}
        </div>

        {/* Domain info */}
        <div className="flex-1">
          <h3 className="text-2xl font-bold text-text-primary mb-2">
            {domain}
          </h3>
          <div className="flex flex-wrap items-center gap-3 text-sm">
            <span className="flex items-center gap-1">
              {available ? (
                <>
                  <CheckCircle2 className="w-4 h-4 text-brand-green" />
                  <span className="text-brand-green font-semibold">Available</span>
                </>
              ) : (
                <>
                  <XCircle className="w-4 h-4 text-brand-red" />
                  <span className="text-brand-red font-semibold">Taken</span>
                </>
              )}
            </span>
            <span className="text-text-tertiary">•</span>
            <span className="font-semibold">${price}/{currency === 'USD' ? 'yr' : currency}</span>
            <span className="text-text-tertiary">•</span>
            <span>{domainLength} characters</span>
            <span className="text-text-tertiary">•</span>
            <span className="text-brand-blue">.{tld}</span>
          </div>
        </div>

        {/* Overall score */}
        <div className="text-right">
          <div className="text-4xl font-bold bg-gradient-to-r from-brand-blue to-brand-violet bg-clip-text text-transparent">
            {analysis?.overallScore.toFixed(1) || '9.0'}
          </div>
          <div className="text-xs text-text-tertiary">/ 10</div>
        </div>
      </div>

      {available && analysis && (
        <>
          {/* AI Explanation */}
          <div className="bg-blue-50 border border-blue-100 rounded-lg p-4 mb-4">
            <div className="flex items-start gap-2 mb-2">
              <div className="text-2xl">🤖</div>
              <div className="flex-1">
                <h4 className="font-semibold text-text-primary mb-2">Why This Domain:</h4>
                <p className="text-sm text-text-secondary mb-3">{analysis.meaning}</p>
                <p className="text-sm text-text-secondary">{analysis.relevance}</p>
              </div>
            </div>
          </div>

          {/* Ranking Explanation */}
          <div className="bg-violet-50 border border-violet-100 rounded-lg p-4 mb-4">
            <h4 className="font-semibold text-text-primary mb-2 flex items-center gap-2">
              <span>🏆</span>
              <span>Why Ranked #{rank}:</span>
            </h4>
            <p className="text-sm text-text-secondary">{analysis.whyRanked}</p>
          </div>

          {/* Brandability Scores */}
          <div className="border border-gray-200 rounded-lg p-4 mb-4">
            <h4 className="font-semibold text-text-primary mb-3">📊 Brandability Breakdown:</h4>
            <div className="space-y-2">
              {[
                { label: 'Memorability', value: analysis.scores.memorability },
                { label: 'Pronounceability', value: analysis.scores.pronounceability },
                { label: 'Uniqueness', value: analysis.scores.uniqueness },
                { label: 'Professionalism', value: analysis.scores.professionalism },
                { label: 'SEO Value', value: analysis.scores.seoValue },
              ].map(({ label, value }) => (
                <div key={label} className="flex items-center gap-3">
                  <span className="text-sm text-text-secondary w-32">{label}:</span>
                  <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-brand-blue to-brand-violet rounded-full transition-all duration-500"
                      style={{ width: `${value * 10}%` }}
                    />
                  </div>
                  <span className="text-sm font-semibold text-brand-blue w-12">{value.toFixed(1)}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Pronunciation */}
          <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg mb-4">
            <Volume2 className="w-5 h-5 text-brand-blue" />
            <div className="flex-1">
              <div className="text-sm text-text-tertiary">Pronunciation:</div>
              <div className="font-semibold text-text-primary text-lg">
                {analysis.pronunciation.phonetic}
              </div>
              <div className="text-xs text-text-tertiary">
                {analysis.pronunciation.syllables} syllable{analysis.pronunciation.syllables > 1 ? 's' : ''} •{' '}
                {analysis.pronunciation.easyToSay ? '✓ Easy to say' : '⚠️ May be difficult'}
              </div>
            </div>
          </div>

          {/* Social Media Handles */}
          {socialHandles && socialHandles.length > 0 && (
            <div className="border border-gray-200 rounded-lg p-4 mb-4">
              <h4 className="font-semibold text-text-primary mb-3">📱 Social Media Handles:</h4>
              <div className="grid grid-cols-3 gap-2">
                {socialHandles.map((social) => (
                  <div
                    key={social.platform}
                    className={`
                      px-3 py-2 rounded-lg text-sm text-center
                      ${social.available
                        ? 'bg-green-50 text-brand-green border border-green-200'
                        : 'bg-red-50 text-brand-red border border-red-200'
                      }
                    `}
                  >
                    <div className="font-medium">{social.platform}</div>
                    <div className="text-xs">
                      {social.available ? '✓ Available' : '✗ Taken'}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Logo Previews */}
          {analysis && (
            <div className="border border-gray-200 rounded-lg p-4 mb-4">
              <h4 className="font-semibold text-text-primary mb-3">🎨 Logo Preview:</h4>
              <div className="grid grid-cols-3 gap-3">
                {analysis.logoStyles.map((style) => (
                  <div
                    key={style}
                    className="aspect-square bg-gradient-to-br from-gray-50 to-gray-100 rounded-lg flex items-center justify-center border border-gray-200"
                  >
                    <div className="text-center">
                      <div className={`
                        font-bold text-brand-blue
                        ${style === 'Bold' ? 'text-xl' : style === 'Minimal' ? 'text-sm' : 'text-base'}
                      `}>
                        {domain.split('.')[0]}
                      </div>
                      <div className="text-xs text-text-tertiary mt-1">{style}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3">
            <button
              onClick={handleSave}
              className={`
                px-6 py-3 rounded-lg font-medium transition-all
                ${isFavorite
                  ? 'bg-red-50 text-brand-red border-2 border-brand-red'
                  : 'bg-gray-100 hover:bg-gray-200 border-2 border-transparent'
                }
              `}
            >
              {isFavorite ? '❤️ Saved' : '🤍 Save'}
            </button>

            <button
              onClick={onBuy}
              className="flex-1 px-6 py-3 bg-gradient-to-r from-brand-blue to-brand-violet text-white rounded-lg font-semibold transition-all hover:scale-105 shadow-lg flex items-center justify-center gap-2"
            >
              <span>Buy {domain}</span>
              <ExternalLink className="w-4 h-4" />
            </button>
          </div>

          {/* Toggle full analysis */}
          {!showFullAnalysis && (
            <button
              onClick={() => setShowFullAnalysis(true)}
              className="w-full mt-3 text-sm text-brand-blue hover:underline"
            >
              Show detailed analysis →
            </button>
          )}
        </>
      )}

      {/* Unavailable state */}
      {!available && (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
          <p className="text-sm text-text-secondary text-center">
            This domain is not available for registration.
          </p>
        </div>
      )}
    </div>
  );
}
