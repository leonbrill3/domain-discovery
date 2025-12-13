/**
 * Instant Autocomplete API - In-Memory Cache
 *
 * Returns domains from in-memory cache instantly.
 * ~5ms response time (vs ~200ms with PostgreSQL)
 */

import { NextRequest, NextResponse } from 'next/server';
import { searchCache, getCacheStats } from '@/lib/domain/cache';

export const maxDuration = 10;

interface AutocompleteRequest {
  query: string;      // Search query
  tld?: string;       // Default: 'ai'
  limit?: number;     // Default: 20
}

/**
 * POST /api/pool/autocomplete
 *
 * Instant search from in-memory cache
 */
export async function POST(req: NextRequest) {
  const startTime = Date.now();

  try {
    const body: AutocompleteRequest = await req.json();
    const { query, tld, limit = 20 } = body;

    if (!query || query.length < 1) {
      return NextResponse.json(
        { error: 'Query required' },
        { status: 400 }
      );
    }

    // Search in-memory cache - <5ms
    const results = await searchCache(query, { tld, limit });

    const responseTime = Date.now() - startTime;
    const cacheStats = getCacheStats();

    return NextResponse.json({
      success: true,
      domains: results.map(d => ({
        domain: d.domain,
        word: d.word,
        score: d.score,
        meaning: d.meaning,
        phonetic: d.phonetic,
        syllables: d.syllables,
        logoStyles: d.logoStyles,
        verified: true, // Pre-verified in pool
        scores: {
          memorability: d.memorability,
          pronounceability: d.pronounceability,
          uniqueness: d.uniqueness,
        }
      })),
      stats: {
        responseTime,
        total: results.length,
        cacheSize: cacheStats.count,
        cacheLoaded: cacheStats.loaded,
      }
    });

  } catch (error) {
    console.error('[Autocomplete] Error:', error);
    return NextResponse.json(
      { error: 'Search failed', details: String(error) },
      { status: 500 }
    );
  }
}

/**
 * GET /api/pool/autocomplete
 *
 * Get cache stats
 */
export async function GET() {
  const stats = getCacheStats();
  return NextResponse.json({
    success: true,
    cache: stats,
  });
}
