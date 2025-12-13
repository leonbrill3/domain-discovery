/**
 * Instant Autocomplete API - No verification, just pool search
 *
 * Returns domains from pool instantly based on prefix/contains match.
 * No RDAP verification = ~10-20ms response time.
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const maxDuration = 10;

interface AutocompleteRequest {
  query: string;      // Search query
  tld?: string;       // Default: 'ai'
  limit?: number;     // Default: 20
}

/**
 * POST /api/pool/autocomplete
 *
 * Instant search - no verification
 */
export async function POST(req: NextRequest) {
  const startTime = Date.now();

  try {
    const body: AutocompleteRequest = await req.json();
    const { query, tld = 'ai', limit = 20 } = body;

    if (!query || query.length < 1) {
      return NextResponse.json(
        { error: 'Query required' },
        { status: 400 }
      );
    }

    const searchTerm = query.toLowerCase().trim();

    // Search strategies in priority order:
    // 1. Exact prefix match (word starts with query)
    // 2. Contains match
    // 3. Semantic similarity via embedding (if query is descriptive)

    const domains = await prisma.availableDomain.findMany({
      where: {
        tld,
        OR: [
          // Prefix match - highest priority
          { word: { startsWith: searchTerm } },
          // Contains match
          { word: { contains: searchTerm } },
        ]
      },
      select: {
        domain: true,
        word: true,
        baseScore: true,
        memorability: true,
        pronounceability: true,
        uniqueness: true,
        meaning: true,
        phonetic: true,
        syllables: true,
        logoStyles: true,
        checkedAt: true,
      },
      orderBy: [
        { baseScore: 'desc' },
        { length: 'asc' }
      ],
      take: limit * 2 // Get extra to sort properly
    });

    // Sort: prefix matches first, then by score
    const sorted = domains.sort((a, b) => {
      const aPrefix = a.word.startsWith(searchTerm) ? 1 : 0;
      const bPrefix = b.word.startsWith(searchTerm) ? 1 : 0;
      if (aPrefix !== bPrefix) return bPrefix - aPrefix;
      return (b.baseScore || 7) - (a.baseScore || 7);
    }).slice(0, limit);

    const responseTime = Date.now() - startTime;

    return NextResponse.json({
      success: true,
      domains: sorted.map(d => ({
        domain: d.domain,
        word: d.word,
        score: d.baseScore || 7,
        meaning: d.meaning || '',
        phonetic: d.phonetic || d.word.toUpperCase(),
        syllables: d.syllables || 2,
        logoStyles: d.logoStyles || [],
        verified: false, // Not verified yet
        checkedAt: d.checkedAt,
        scores: {
          memorability: d.memorability,
          pronounceability: d.pronounceability,
          uniqueness: d.uniqueness,
        }
      })),
      stats: {
        responseTime,
        total: sorted.length
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
