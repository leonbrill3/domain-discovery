/**
 * 💡 DOMAIN TOOLTIP - Quick Preview
 *
 * Shows on hover - meaning, score, key metrics
 */

'use client';

import type { DomainAnalysis } from '@/lib/ai/ranking';

interface DomainTooltipProps {
  domain: string;
  analysis?: DomainAnalysis;
}

export function DomainTooltip({ domain, analysis }: DomainTooltipProps) {
  if (!analysis) {
    return (
      <div className="p-3 bg-gray-900 text-white text-xs rounded-lg shadow-xl max-w-xs">
        <p className="text-gray-400">Loading analysis...</p>
      </div>
    );
  }

  return (
    <div className="p-4 bg-gray-900 text-white rounded-xl shadow-2xl max-w-sm">
      {/* Score */}
      <div className="flex items-center justify-between mb-3 pb-3 border-b border-gray-700">
        <span className="text-xs text-gray-400">Overall Score</span>
        <span className="text-2xl font-bold text-blue-400">
          {analysis.overallScore.toFixed(1)}<span className="text-sm text-gray-500">/10</span>
        </span>
      </div>

      {/* Meaning */}
      <div className="mb-3">
        <div className="text-xs font-semibold text-gray-400 mb-1">📖 Meaning</div>
        <p className="text-sm leading-relaxed">{analysis.meaning}</p>
      </div>

      {/* Relevance */}
      <div className="mb-3">
        <div className="text-xs font-semibold text-gray-400 mb-1">✨ Why it works</div>
        <p className="text-sm leading-relaxed">{analysis.relevance}</p>
      </div>

      {/* Pronunciation */}
      <div className="mb-3">
        <div className="text-xs font-semibold text-gray-400 mb-1">🔤 Pronunciation</div>
        <div className="flex items-center gap-2">
          <span className="text-sm font-mono text-blue-300">{analysis.pronunciation.phonetic}</span>
          <span className="text-xs text-gray-500">
            • {analysis.pronunciation.syllables} syllable{analysis.pronunciation.syllables !== 1 ? 's' : ''}
            {analysis.pronunciation.easyToSay && ' • Easy to say'}
          </span>
        </div>
      </div>

      {/* Top 3 Brand Scores */}
      <div>
        <div className="text-xs font-semibold text-gray-400 mb-2">💪 Brand Strength</div>
        <div className="space-y-1.5">
          <ScoreBar label="Memorable" score={analysis.scores.memorability} />
          <ScoreBar label="Unique" score={analysis.scores.uniqueness} />
          <ScoreBar label="Professional" score={analysis.scores.professionalism} />
        </div>
      </div>

      {/* Footer */}
      <div className="mt-3 pt-3 border-t border-gray-700 text-center">
        <p className="text-xs text-gray-500">Click domain for full analysis →</p>
      </div>
    </div>
  );
}

function ScoreBar({ label, score }: { label: string; score: number }) {
  const percentage = (score / 10) * 100;

  return (
    <div className="flex items-center gap-2">
      <span className="text-xs text-gray-400 w-20">{label}</span>
      <div className="flex-1 h-2 bg-gray-700 rounded-full overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-blue-500 to-violet-500 rounded-full transition-all"
          style={{ width: `${percentage}%` }}
        />
      </div>
      <span className="text-xs font-semibold text-blue-400 w-8 text-right">
        {score.toFixed(1)}
      </span>
    </div>
  );
}
