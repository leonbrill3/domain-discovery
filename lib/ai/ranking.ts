/**
 * 🏆 AI RANKING & EXPLANATION SYSTEM - DomainSeek.ai
 *
 * Uses Claude to:
 * 1. Rank domains by quality (0-10 score)
 * 2. Explain why each domain is good
 * 3. Explain why it's ranked where it is
 * 4. Provide brandability breakdown
 * 5. Generate pronunciation guide
 */

import Anthropic from '@anthropic-ai/sdk';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export interface DomainAnalysis {
  domain: string;
  overallScore: number;  // 0-10

  // Explanation
  meaning: string;        // What the domain name means
  relevance: string;      // Why it's relevant to the project
  whyRanked: string;      // Why it's ranked at this position

  // Brandability scores (5 sub-scores)
  scores: {
    memorability: number;      // 0-10
    pronounceability: number;  // 0-10
    uniqueness: number;        // 0-10
    professionalism: number;   // 0-10
    seoValue: number;          // 0-10
  };

  // Pronunciation
  pronunciation: {
    phonetic: string;          // "ZOOS-fit"
    syllables: number;
    easyToSay: boolean;
    rhymesWith?: string;
  };

  // Logo preview suggestions
  logoStyles: string[];      // ["Modern", "Bold", "Minimal"]
}

/**
 * Rank and analyze multiple domains
 */
export async function rankAndAnalyzeDomains(
  domains: string[],
  project: string
): Promise<DomainAnalysis[]> {
  const prompt = `You are an expert brand strategist analyzing domain names for a project.

PROJECT: "${project}"

DOMAINS TO ANALYZE:
${domains.map((d, i) => `${i + 1}. ${d}`).join('\n')}

For each domain, provide:

1. OVERALL SCORE (0-10): How good is this domain overall?

2. MEANING: What does this domain name mean? Break down the components.

3. RELEVANCE: Why is this domain relevant to the project "${project}"?

4. BRANDABILITY SCORES (each 0-10):
   - Memorability: How easy to remember?
   - Pronounceability: How easy to say out loud?
   - Uniqueness: How distinctive/unique?
   - Professionalism: How professional/trustworthy?
   - SEO Value: How good for search engines?

5. PRONUNCIATION:
   - Phonetic spelling (e.g., "ZOOS-fit")
   - Number of syllables
   - Easy to say? (yes/no)
   - Rhymes with? (optional)

6. WHY RANKED HERE: Explain why this domain is ranked where it is compared to others in the list.

7. LOGO STYLE SUGGESTIONS: 3 words describing visual styles (e.g., "Modern", "Bold", "Minimal")

OUTPUT FORMAT (JSON array):
[
  {
    "domain": "zeusfit.io",
    "overallScore": 9.4,
    "meaning": "Zeus, king of Greek gods, combined with 'fit' (fitness)",
    "relevance": "Perfect for fitness app. Zeus represents supreme power and strength.",
    "whyRanked": "Ranked #1 because it's the shortest (7 chars), most memorable, and has strongest brand association with power/fitness.",
    "scores": {
      "memorability": 9.5,
      "pronounceability": 10.0,
      "uniqueness": 8.8,
      "professionalism": 9.2,
      "seoValue": 9.0
    },
    "pronunciation": {
      "phonetic": "ZOOS-fit",
      "syllables": 2,
      "easyToSay": true,
      "rhymesWith": "juice-fit"
    },
    "logoStyles": ["Modern", "Bold", "Athletic"]
  }
]

Return ONLY valid JSON. Rank domains from best to worst.`;

  try {
    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-5-20250929',
      max_tokens: 4000,
      temperature: 0.3,  // Low temperature for consistent analysis
      messages: [{
        role: 'user',
        content: prompt
      }]
    });

    const text = response.content[0].type === 'text' ? response.content[0].text : '';

    // Extract JSON from response (Claude might wrap it in markdown)
    const jsonMatch = text.match(/\[[\s\S]*\]/);
    if (!jsonMatch) {
      throw new Error('Failed to parse AI response');
    }

    const analyses: DomainAnalysis[] = JSON.parse(jsonMatch[0]);

    console.log(`[AI/Ranking] Analyzed and ranked ${analyses.length} domains`);

    return analyses;

  } catch (error) {
    console.error('[AI/Ranking] Error:', error);
    throw error;
  }
}

/**
 * Quick brandability score (without full analysis)
 */
export function calculateQuickBrandScore(domain: string): number {
  let score = 10;

  const nameWithoutTld = domain.split('.')[0];
  const length = nameWithoutTld.length;

  // Length penalty
  if (length > 12) score -= 2;
  if (length > 15) score -= 2;
  if (length < 5) score -= 1;

  // Has numbers
  if (/\d/.test(nameWithoutTld)) score -= 2;

  // Has hyphens
  if (nameWithoutTld.includes('-')) score -= 1.5;

  // Hard to pronounce (too many consonants)
  const consonantClusters = nameWithoutTld.match(/[bcdfghjklmnpqrstvwxyz]{4,}/gi);
  if (consonantClusters) score -= 2;

  // Ideal length bonus (6-10 chars)
  if (length >= 6 && length <= 10) score += 0.5;

  return Math.max(0, Math.min(10, score));
}
