/**
 * In-Memory Domain Cache
 *
 * Loads all domains from PostgreSQL into memory for instant search.
 * ~80k domains = ~40MB = easily fits in Node.js memory
 *
 * Search is just array.filter() = <5ms
 */

import { prisma } from '@/lib/prisma';

export interface CachedDomain {
  domain: string;
  word: string;
  tld: string;
  score: number;
  meaning: string;
  phonetic: string;
  syllables: number;
  logoStyles: string[];
  memorability: number | null;
  pronounceability: number | null;
  uniqueness: number | null;
}

// In-memory cache
let domainCache: CachedDomain[] = [];
let cacheLoaded = false;
let cacheLoadedAt: Date | null = null;
let isLoading = false;

// Cache refresh interval (5 minutes)
const CACHE_REFRESH_MS = 5 * 60 * 1000;

/**
 * Load all domains from database into memory
 */
export async function loadCache(): Promise<void> {
  if (isLoading) return;
  isLoading = true;

  try {
    console.log('[Cache] Loading domains into memory...');
    const startTime = Date.now();

    const domains = await prisma.availableDomain.findMany({
      select: {
        domain: true,
        word: true,
        tld: true,
        baseScore: true,
        meaning: true,
        phonetic: true,
        syllables: true,
        logoStyles: true,
        memorability: true,
        pronounceability: true,
        uniqueness: true,
      },
      orderBy: { baseScore: 'desc' },
    });

    domainCache = domains.map(d => ({
      domain: d.domain,
      word: d.word,
      tld: d.tld,
      score: d.baseScore || 7,
      meaning: d.meaning || '',
      phonetic: d.phonetic || d.word.toUpperCase(),
      syllables: d.syllables || 2,
      logoStyles: d.logoStyles || [],
      memorability: d.memorability,
      pronounceability: d.pronounceability,
      uniqueness: d.uniqueness,
    }));

    cacheLoaded = true;
    cacheLoadedAt = new Date();

    const elapsed = Date.now() - startTime;
    const sizeMB = (JSON.stringify(domainCache).length / 1024 / 1024).toFixed(2);
    console.log(`[Cache] Loaded ${domainCache.length} domains (${sizeMB}MB) in ${elapsed}ms`);

  } catch (error) {
    console.error('[Cache] Failed to load:', error);
  } finally {
    isLoading = false;
  }
}

/**
 * Get cache, loading if necessary
 */
export async function getCache(): Promise<CachedDomain[]> {
  // Load if not loaded or stale
  if (!cacheLoaded || !cacheLoadedAt ||
      (Date.now() - cacheLoadedAt.getTime() > CACHE_REFRESH_MS)) {
    await loadCache();
  }
  return domainCache;
}

/**
 * Instant search - <5ms
 * Searches word field for prefix/contains match
 */
export async function searchCache(
  query: string,
  options: {
    tld?: string;
    limit?: number;
  } = {}
): Promise<CachedDomain[]> {
  const { tld, limit = 20 } = options;
  const cache = await getCache();
  const searchTerm = query.toLowerCase().trim();

  if (!searchTerm) return [];

  const startTime = Date.now();

  // Filter and sort
  let results = cache.filter(d => {
    // TLD filter
    if (tld && d.tld !== tld) return false;
    // Word match (prefix or contains)
    return d.word.includes(searchTerm);
  });

  // Sort: prefix matches first, then by score
  results.sort((a, b) => {
    const aPrefix = a.word.startsWith(searchTerm) ? 1 : 0;
    const bPrefix = b.word.startsWith(searchTerm) ? 1 : 0;
    if (aPrefix !== bPrefix) return bPrefix - aPrefix;
    return b.score - a.score;
  });

  // Limit results
  results = results.slice(0, limit);

  const elapsed = Date.now() - startTime;
  console.log(`[Cache] Search "${query}" found ${results.length} in ${elapsed}ms`);

  return results;
}

/**
 * Get cache stats
 */
export function getCacheStats() {
  return {
    loaded: cacheLoaded,
    count: domainCache.length,
    loadedAt: cacheLoadedAt,
    sizeMB: cacheLoaded
      ? (JSON.stringify(domainCache).length / 1024 / 1024).toFixed(2)
      : 0,
  };
}

/**
 * Force cache refresh
 */
export async function refreshCache(): Promise<void> {
  cacheLoaded = false;
  await loadCache();
}
