/**
 * 🎱 DOMAIN POOL - DomainSeek.ai
 *
 * Query pre-checked available domains from the database.
 * Returns instant results from our pool of ~1M verified domains.
 */

import { prisma } from '@/lib/prisma';
import { checkDomainsBatchRDAP } from './rdap';
import type { DomainStatus } from './domainr';

export interface PoolSearchParams {
  tld?: string;
  minLength?: number;
  maxLength?: number;
  pattern?: string;       // CVCV, CVCVC, etc.
  startsWith?: string;
  endsWith?: string;
  limit?: number;
}

export interface PoolSearchResult {
  domains: string[];
  verified: string[];     // Still available after real-time check
  taken: string[];        // No longer available
  queryTime: number;      // ms
  verifyTime: number;     // ms
  totalInPool: number;
}

/**
 * Query the domain pool with filters
 * Returns random selection matching criteria
 */
export async function queryPool(params: PoolSearchParams): Promise<string[]> {
  const {
    tld = 'ai',
    minLength = 4,
    maxLength = 7,
    pattern,
    startsWith,
    endsWith,
    limit = 100
  } = params;

  const startTime = Date.now();

  // Build where clause
  const where: any = {
    tld,
    length: {
      gte: minLength,
      lte: maxLength
    }
  };

  if (pattern) {
    where.pattern = pattern;
  }

  if (startsWith) {
    where.word = {
      ...where.word,
      startsWith: startsWith.toLowerCase()
    };
  }

  if (endsWith) {
    where.word = {
      ...where.word,
      endsWith: endsWith.toLowerCase()
    };
  }

  // Get random selection using raw SQL for performance
  // Prisma doesn't support ORDER BY RANDOM() directly
  let domains: { domain: string }[];

  if (pattern) {
    domains = await prisma.$queryRaw<{ domain: string }[]>`
      SELECT domain FROM available_domains
      WHERE tld = ${tld}
        AND length >= ${minLength}
        AND length <= ${maxLength}
        AND pattern = ${pattern}
      ORDER BY RANDOM()
      LIMIT ${limit}
    `;
  } else {
    domains = await prisma.$queryRaw<{ domain: string }[]>`
      SELECT domain FROM available_domains
      WHERE tld = ${tld}
        AND length >= ${minLength}
        AND length <= ${maxLength}
      ORDER BY RANDOM()
      LIMIT ${limit}
    `;
  }

  console.log(`[Pool] Query took ${Date.now() - startTime}ms, found ${domains.length} domains`);

  return domains.map(d => d.domain);
}

/**
 * Search pool and verify results in real-time
 * Full pipeline: Query → Verify → Return
 */
export async function searchPool(params: PoolSearchParams): Promise<PoolSearchResult> {
  const queryStart = Date.now();

  // Step 1: Query pool for candidates
  const candidates = await queryPool({
    ...params,
    limit: (params.limit || 50) * 2  // Get 2x to account for some being taken
  });

  const queryTime = Date.now() - queryStart;

  if (candidates.length === 0) {
    return {
      domains: [],
      verified: [],
      taken: [],
      queryTime,
      verifyTime: 0,
      totalInPool: 0
    };
  }

  // Step 2: Verify top candidates via RDAP
  const verifyStart = Date.now();
  const toVerify = candidates.slice(0, params.limit || 50);

  const verificationResults = await checkDomainsBatchRDAP(toVerify);

  const verifyTime = Date.now() - verifyStart;

  // Separate verified available vs taken
  const verified: string[] = [];
  const taken: string[] = [];

  for (const result of verificationResults) {
    if (result.available) {
      verified.push(result.domain);
    } else {
      taken.push(result.domain);
    }
  }

  // Step 3: Remove taken domains from pool (async, don't wait)
  if (taken.length > 0) {
    removeTakenFromPool(taken).catch(err => {
      console.error('[Pool] Error removing taken domains:', err);
    });
  }

  console.log(`[Pool] Search complete: ${verified.length} verified, ${taken.length} taken (${queryTime}ms query, ${verifyTime}ms verify)`);

  return {
    domains: candidates,
    verified,
    taken,
    queryTime,
    verifyTime,
    totalInPool: candidates.length
  };
}

/**
 * Remove taken domains from pool
 * Called asynchronously after verification
 */
async function removeTakenFromPool(domains: string[]): Promise<void> {
  const result = await prisma.availableDomain.deleteMany({
    where: {
      domain: {
        in: domains
      }
    }
  });

  console.log(`[Pool] Removed ${result.count} taken domains from pool`);
}

/**
 * Get pool statistics
 */
export async function getPoolStats(tld?: string): Promise<{
  total: number;
  byLength: Record<number, number>;
  byPattern: Record<string, number>;
}> {
  const where = tld ? { tld } : {};

  const total = await prisma.availableDomain.count({ where });

  // Get counts by length
  const lengthCounts = await prisma.availableDomain.groupBy({
    by: ['length'],
    where,
    _count: true
  });

  const byLength: Record<number, number> = {};
  for (const item of lengthCounts) {
    byLength[item.length] = item._count;
  }

  // Get counts by pattern
  const patternCounts = await prisma.availableDomain.groupBy({
    by: ['pattern'],
    where,
    _count: true
  });

  const byPattern: Record<string, number> = {};
  for (const item of patternCounts) {
    if (item.pattern) {
      byPattern[item.pattern] = item._count;
    }
  }

  return { total, byLength, byPattern };
}

/**
 * Add domains to pool (for bulk import)
 */
export async function addToPool(domains: {
  domain: string;
  word: string;
  tld: string;
  length: number;
  pattern?: string;
}[]): Promise<number> {
  const result = await prisma.availableDomain.createMany({
    data: domains.map(d => ({
      domain: d.domain,
      word: d.word,
      tld: d.tld,
      length: d.length,
      pattern: d.pattern,
      checkedAt: new Date()
    })),
    skipDuplicates: true
  });

  return result.count;
}
