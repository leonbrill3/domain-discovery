/**
 * ⚡ INSTANT POOL SEARCH - DomainSeek.ai
 *
 * Lightning-fast search using pre-computed embeddings + base scores.
 * NO Claude API calls at search time = ~50ms response.
 *
 * Formula: finalScore = baseScore + relevanceBoost
 *   - baseScore: Pre-computed by Claude (memorability, pronounceability, etc.)
 *   - relevanceBoost: Calculated via embedding similarity to query
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { checkDomainsBatchRDAP } from '@/lib/domain/rdap';

export const maxDuration = 30;

/**
 * Generate embedding for search query (same algorithm as score-domains.ts)
 */
function generateQueryEmbedding(query: string): number[] {
  const embedding: number[] = new Array(128).fill(0);

  // Normalize query: lowercase, extract key terms
  const words = query.toLowerCase().split(/\s+/).filter(w => w.length > 2);
  const combined = words.join('');

  // Character frequency features (0-25)
  for (const word of words) {
    for (let i = 0; i < word.length; i++) {
      const charCode = word.charCodeAt(i) - 97;
      if (charCode >= 0 && charCode < 26) {
        embedding[charCode] += 1 / combined.length;
      }
    }
  }

  // Bigram features (26-51)
  for (const word of words) {
    for (let i = 0; i < word.length - 1; i++) {
      const bigram = word.substring(i, i + 2);
      const hash = (bigram.charCodeAt(0) * 31 + bigram.charCodeAt(1)) % 26;
      embedding[26 + hash] += 0.5 / combined.length;
    }
  }

  // Pattern features (52-77)
  const vowels = (combined.match(/[aeiou]/g) || []).length;
  const consonants = (combined.match(/[bcdfghjklmnpqrstvwxyz]/g) || []).length;
  embedding[52] = vowels / combined.length || 0;
  embedding[53] = consonants / combined.length || 0;
  embedding[54] = combined.length / 30; // normalized length for queries

  // Common concept keywords boost specific features
  const concepts: Record<string, number[]> = {
    'fitness': [71, 101], 'health': [71, 101], 'gym': [71, 101], 'workout': [71, 101],
    'tech': [72, 102], 'ai': [72, 102], 'app': [72, 102], 'software': [72, 102],
    'finance': [73, 103], 'money': [73, 103], 'invest': [73, 103], 'crypto': [73, 103],
    'creative': [74, 104], 'design': [74, 104], 'art': [74, 104], 'studio': [74, 104],
    'food': [75, 105], 'coffee': [75, 105], 'restaurant': [75, 105], 'chef': [75, 105],
    'travel': [76, 106], 'adventure': [76, 106], 'explore': [76, 106],
    'education': [77, 107], 'learn': [77, 107], 'school': [77, 107], 'course': [77, 107],
    'meditation': [78, 108], 'calm': [78, 108], 'zen': [78, 108], 'mindful': [78, 108],
  };

  for (const word of words) {
    for (const [concept, indices] of Object.entries(concepts)) {
      if (word.includes(concept) || concept.includes(word)) {
        for (const idx of indices) {
          embedding[idx] = 0.8;
        }
      }
    }
  }

  // Fill remaining with hash-based features
  let hash = 0;
  for (let i = 0; i < combined.length; i++) {
    hash = ((hash << 5) - hash) + combined.charCodeAt(i);
    hash = hash & hash;
  }
  for (let i = 111; i < 128; i++) {
    embedding[i] = Math.abs(Math.sin(hash * (i - 110))) * 0.3;
  }

  // Normalize to unit length
  const magnitude = Math.sqrt(embedding.reduce((sum, v) => sum + v * v, 0));
  if (magnitude > 0) {
    for (let i = 0; i < embedding.length; i++) {
      embedding[i] /= magnitude;
    }
  }

  return embedding;
}

/**
 * Calculate cosine similarity between two embeddings
 */
function cosineSimilarity(a: number[], b: number[]): number {
  if (!a || !b || a.length !== b.length) return 0;

  let dotProduct = 0;
  let magA = 0;
  let magB = 0;

  for (let i = 0; i < a.length; i++) {
    dotProduct += a[i] * b[i];
    magA += a[i] * a[i];
    magB += b[i] * b[i];
  }

  const magnitude = Math.sqrt(magA) * Math.sqrt(magB);
  return magnitude > 0 ? dotProduct / magnitude : 0;
}

interface InstantSearchRequest {
  query: string;       // "fitness app for busy professionals"
  tld?: string;        // Default: 'ai'
  limit?: number;      // Default: 15
  verify?: boolean;    // Default: true - check availability via RDAP
}

/**
 * POST /api/pool/instant
 *
 * Lightning-fast search using embeddings + pre-computed scores.
 * Target: <100ms for unverified, <500ms with verification
 */
export async function POST(req: NextRequest) {
  try {
    const body: InstantSearchRequest = await req.json();
    const { query, tld = 'ai', limit = 15, verify = true } = body;

    if (!query || query.length < 2) {
      return NextResponse.json(
        { error: 'Query required (min 2 characters)' },
        { status: 400 }
      );
    }

    const startTime = Date.now();

    // Step 1: Generate embedding for query
    const queryEmbedding = generateQueryEmbedding(query);

    // Step 2: Fetch domains with scores from DB
    // Get more than needed since some might be taken
    const fetchLimit = Math.min(limit * 3, 200);

    const domains = await prisma.availableDomain.findMany({
      where: {
        tld,
        baseScore: { not: null }, // Only scored domains
        embedding: { isEmpty: false } // Only domains with embeddings
      },
      select: {
        domain: true,
        word: true,
        baseScore: true,
        memorability: true,
        pronounceability: true,
        uniqueness: true,
        professionalism: true,
        seoValue: true,
        meaning: true,
        phonetic: true,
        syllables: true,
        logoStyles: true,
        embedding: true
      },
      orderBy: { baseScore: 'desc' },
      take: fetchLimit * 2 // Get extra for scoring
    });

    const queryTime = Date.now() - startTime;

    if (domains.length === 0) {
      // Fallback: get unscored domains
      const fallback = await prisma.availableDomain.findMany({
        where: { tld },
        select: { domain: true, word: true },
        orderBy: { length: 'asc' },
        take: limit
      });

      return NextResponse.json({
        success: true,
        domains: fallback.map(d => ({
          domain: d.domain,
          score: 7.0,
          meaning: '',
          phonetic: d.word.toUpperCase()
        })),
        stats: { queryTime, scoringTime: 0, verifyTime: 0, totalTime: Date.now() - startTime }
      });
    }

    // Step 3: Score each domain = baseScore + relevance boost
    const scoringStart = Date.now();

    const scored = domains.map(d => {
      // Calculate relevance via embedding similarity
      const similarity = cosineSimilarity(queryEmbedding, d.embedding);

      // Relevance boost: -1 to +2 based on similarity
      // similarity ranges from -1 to 1, we map to -1 to +2
      const relevanceBoost = (similarity + 0.5) * 1.5; // Maps [-1,1] to [-0.75, 2.25]

      // Final score = base + relevance, capped at 10
      const finalScore = Math.min(10, Math.max(0, (d.baseScore || 7) + relevanceBoost));

      return {
        domain: d.domain,
        word: d.word,
        score: Math.round(finalScore * 10) / 10,
        baseScore: d.baseScore,
        relevanceBoost: Math.round(relevanceBoost * 100) / 100,
        similarity: Math.round(similarity * 100) / 100,
        meaning: d.meaning || '',
        phonetic: d.phonetic || d.word.toUpperCase(),
        syllables: d.syllables || Math.ceil(d.word.length / 3),
        logoStyles: d.logoStyles || ['Modern', 'Clean', 'Bold'],
        scores: {
          memorability: d.memorability,
          pronounceability: d.pronounceability,
          uniqueness: d.uniqueness,
          professionalism: d.professionalism,
          seoValue: d.seoValue
        }
      };
    });

    // Sort by final score
    scored.sort((a, b) => b.score - a.score);

    const scoringTime = Date.now() - scoringStart;

    // Step 4: Optional verification
    let verified = scored.slice(0, fetchLimit);
    let verifyTime = 0;
    let taken: string[] = [];

    if (verify) {
      const verifyStart = Date.now();
      const toVerify = scored.slice(0, Math.min(limit + 10, scored.length));

      const verificationResults = await checkDomainsBatchRDAP(
        toVerify.map(d => d.domain)
      );

      verified = [];
      for (const result of verificationResults) {
        if (result.available) {
          const match = toVerify.find(d => d.domain === result.domain);
          if (match) {
            verified.push(match);
            if (verified.length >= limit) break;
          }
        } else {
          taken.push(result.domain);
        }
      }

      verifyTime = Date.now() - verifyStart;

      // Remove taken domains from pool (async)
      if (taken.length > 0) {
        prisma.availableDomain.deleteMany({
          where: { domain: { in: taken } }
        }).catch(err => console.error('[Instant] Error removing taken:', err));
      }
    }

    const totalTime = Date.now() - startTime;

    console.log(`[Instant] "${query.slice(0, 25)}..." → ${verified.length} results (${queryTime}ms query, ${scoringTime}ms score, ${verifyTime}ms verify = ${totalTime}ms total)`);

    return NextResponse.json({
      success: true,
      domains: verified.slice(0, limit),
      stats: {
        poolSearched: domains.length,
        scoringTime,
        queryTime,
        verifyTime,
        totalTime,
        taken: taken.length
      }
    });

  } catch (error) {
    console.error('[Instant] Error:', error);
    return NextResponse.json(
      { error: 'Search failed', details: String(error) },
      { status: 500 }
    );
  }
}

/**
 * GET /api/pool/instant - Quick stats
 */
export async function GET() {
  try {
    const [total, scored] = await Promise.all([
      prisma.availableDomain.count(),
      prisma.availableDomain.count({ where: { baseScore: { not: null } } })
    ]);

    return NextResponse.json({
      success: true,
      stats: {
        totalDomains: total,
        scoredDomains: scored,
        scoringProgress: total > 0 ? Math.round((scored / total) * 100) : 0
      }
    });
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
