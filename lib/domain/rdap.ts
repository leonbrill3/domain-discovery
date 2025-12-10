/**
 * 🌐 RDAP FALLBACK CLIENT - DomainSeek.ai
 *
 * RDAP (Registration Data Access Protocol) is the modern replacement for WHOIS.
 * Used as a free fallback when Domainr quota is exceeded.
 *
 * Official replacement for WHOIS as of January 2025.
 */

import type { DomainStatus } from './domainr';

/**
 * Check domain availability via RDAP
 * Uses Iceland's ISNIC RDAP service (7200 requests per 30 min - very generous!)
 */
export async function checkDomainAvailabilityRDAP(domain: string): Promise<DomainStatus> {
  try {
    // Use ISNIC RDAP service
    const url = `https://rdap.isnic.is/rdap/dac/${encodeURIComponent(domain)}`;

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
    });

    // RDAP convention:
    // 404 = Domain is available
    // 200 = Domain is taken/reserved/invalid
    const isAvailable = response.status === 404;

    return {
      domain,
      available: isAvailable,
      source: 'rdap',
      confidence: 0.90,  // RDAP is accurate but slightly less than Domainr
      checkedAt: new Date(),
    };

  } catch (error) {
    console.error(`[RDAP] Error checking ${domain}:`, error);

    // Conservative fallback: assume taken
    return {
      domain,
      available: false,
      source: 'rdap',
      confidence: 0,
      checkedAt: new Date(),
    };
  }
}

/**
 * Fallback to RDAP.org bootstrap service (alternative)
 */
export async function checkDomainRDAPOrg(domain: string): Promise<DomainStatus> {
  try {
    const url = `https://rdap.org/domain/${encodeURIComponent(domain)}`;

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
    });

    // 404 = Available, 200 = Taken
    const isAvailable = response.status === 404;

    return {
      domain,
      available: isAvailable,
      source: 'rdap',
      confidence: 0.88,
      checkedAt: new Date(),
    };

  } catch (error) {
    console.error(`[RDAP.org] Error checking ${domain}:`, error);

    return {
      domain,
      available: false,
      source: 'rdap',
      confidence: 0,
      checkedAt: new Date(),
    };
  }
}

/**
 * Batch check via RDAP (with rate limiting)
 */
export async function checkDomainsBatchRDAP(domains: string[]): Promise<DomainStatus[]> {
  const results: DomainStatus[] = [];
  const MAX_CONCURRENT = 10;  // RDAP can handle more than Domainr

  for (let i = 0; i < domains.length; i += MAX_CONCURRENT) {
    const batch = domains.slice(i, i + MAX_CONCURRENT);

    const batchResults = await Promise.allSettled(
      batch.map(domain => checkDomainAvailabilityRDAP(domain))
    );

    for (const result of batchResults) {
      if (result.status === 'fulfilled') {
        results.push(result.value);
      } else {
        // Error fallback
        results.push({
          domain: domains[results.length],
          available: false,
          source: 'rdap',
          confidence: 0,
          checkedAt: new Date(),
        });
      }
    }

    // Small delay to be respectful
    if (i + MAX_CONCURRENT < domains.length) {
      await sleep(100);
    }
  }

  return results;
}

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}
