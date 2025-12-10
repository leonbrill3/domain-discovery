/**
 * 💾 REDIS CACHING LAYER - DomainSeek.ai
 *
 * Upstash Redis for serverless caching.
 * Critical for staying within Domainr's 10k/month free tier.
 * Target: 95%+ cache hit rate
 */

import { Redis } from '@upstash/redis';
import { getCacheKey } from '../brand';

// Initialize Upstash Redis client (optional - gracefully degrades without it)
let redis: Redis | null = null;

try {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;

  if (url && token) {
    redis = Redis.fromEnv();
    console.log('[Redis] ✅ Initialized successfully');
  } else {
    console.warn('[Redis] ⚠️ Environment variables not set. Running without cache.');
  }
} catch (error) {
  console.warn('[Redis] ⚠️ Failed to initialize. Running without cache:', error);
}

export { redis };

/**
 * Cache key structure:
 * ds:domain:{domain} - Domain availability (24hr TTL)
 * ds:session:{sessionId} - User session data (7 days)
 * ds:theme:{themeId}:{hash} - Generated domains (1hr)
 * ds:ratelimit:{ip}:{endpoint} - Rate limiting (1 min)
 */

/**
 * Generic cache operations
 */
export async function cacheGet<T>(key: string): Promise<T | null> {
  if (!redis) return null; // Skip if Redis not available

  try {
    const fullKey = getCacheKey(key);
    const value = await redis.get(fullKey);

    if (!value) {
      return null;
    }

    return value as T;
  } catch (error) {
    console.error(`[Redis] Get error for ${key}:`, error);
    return null;
  }
}

export async function cacheSet<T>(
  key: string,
  value: T,
  ttl?: number  // TTL in seconds
): Promise<void> {
  if (!redis) return; // Skip if Redis not available

  try {
    const fullKey = getCacheKey(key);

    if (ttl) {
      await redis.set(fullKey, value, { ex: ttl });
    } else {
      await redis.set(fullKey, value);
    }

  } catch (error) {
    console.error(`[Redis] Set error for ${key}:`, error);
    // Non-fatal: continue without caching
  }
}

export async function cacheDel(key: string): Promise<void> {
  try {
    const fullKey = getCacheKey(key);
    await redis.del(fullKey);
  } catch (error) {
    console.error(`[Redis] Delete error for ${key}:`, error);
  }
}

/**
 * Domain-specific cache operations
 */
export async function cacheDomain(
  domain: string,
  available: boolean,
  ttl: number = 86400  // 24 hours
): Promise<void> {
  const key = `domain:${domain}`;
  await cacheSet(key, { available, cachedAt: new Date().toISOString() }, ttl);
}

export async function getCachedDomain(domain: string): Promise<{ available: boolean; cachedAt: string } | null> {
  const key = `domain:${domain}`;
  return await cacheGet(key);
}

/**
 * Session cache operations
 */
export async function cacheSession(
  sessionId: string,
  data: any,
  ttl: number = 604800  // 7 days
): Promise<void> {
  const key = `session:${sessionId}`;
  await cacheSet(key, data, ttl);
}

export async function getCachedSession(sessionId: string): Promise<any | null> {
  const key = `session:${sessionId}`;
  return await cacheGet(key);
}

/**
 * Get cache statistics
 */
export async function getCacheStats(): Promise<{
  connected: boolean;
  keyCount?: number;
  memoryUsage?: string;
}> {
  try {
    // Test connection
    await redis.ping();

    // Note: Upstash doesn't support DBSIZE or INFO commands
    // We'll track hits/misses in application code

    return {
      connected: true,
    };

  } catch (error) {
    console.error('[Redis] Stats error:', error);
    return {
      connected: false,
    };
  }
}

/**
 * Clear all cache keys matching pattern (use sparingly!)
 */
export async function clearCachePattern(pattern: string): Promise<number> {
  try {
    const fullPattern = getCacheKey(pattern);

    // Note: Upstash supports SCAN but it's expensive
    // For now, we'll clear specific keys only
    console.warn(`[Redis] Pattern clear not implemented for ${fullPattern}`);

    return 0;

  } catch (error) {
    console.error(`[Redis] Clear pattern error:`, error);
    return 0;
  }
}

/**
 * Test Redis connection
 */
export async function testRedisConnection(): Promise<boolean> {
  try {
    console.log('[Redis] Testing connection...');

    const result = await redis.ping();

    console.log('[Redis] ✅ Connection test successful');
    console.log(`  Ping response: ${result}`);

    return true;
  } catch (error) {
    console.error('[Redis] ❌ Connection test failed:', error);
    return false;
  }
}
