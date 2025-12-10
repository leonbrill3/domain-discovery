/**
 * 🌐 RDAP FALLBACK CLIENT - DomainSeek.ai
 *
 * RDAP (Registration Data Access Protocol) is the modern replacement for WHOIS.
 * Uses proper IANA bootstrap to find the correct RDAP server for each TLD.
 *
 * Key endpoints:
 * - .ai, .io, .app, .dev → https://rdap.identitydigital.services/rdap/
 * - .com, .net → https://rdap.verisign.com/{tld}/v1/
 *
 * Response codes:
 * - 200 = Domain exists (TAKEN)
 * - 404 = Domain not found (AVAILABLE)
 */

import type { DomainStatus } from './domainr';

// RDAP server mapping for common TLDs
const RDAP_SERVERS: Record<string, string> = {
  // Identity Digital (formerly Donuts) - handles many new TLDs including .ai
  'ai': 'https://rdap.identitydigital.services/rdap/',
  'app': 'https://rdap.identitydigital.services/rdap/',
  'dev': 'https://rdap.identitydigital.services/rdap/',
  'io': 'https://rdap.identitydigital.services/rdap/',

  // Verisign - .com, .net
  'com': 'https://rdap.verisign.com/com/v1/',
  'net': 'https://rdap.verisign.com/net/v1/',

  // Other common TLDs
  'org': 'https://rdap.publicinterestregistry.org/rdap/',
  'co': 'https://rdap.nic.co/',
};

/**
 * Get the RDAP server URL for a given TLD
 */
function getRdapServer(tld: string): string | null {
  return RDAP_SERVERS[tld.toLowerCase()] || null;
}

/**
 * Check domain availability via RDAP
 * Uses proper RDAP servers based on TLD
 */
export async function checkDomainAvailabilityRDAP(domain: string): Promise<DomainStatus> {
  const tld = domain.split('.').pop()?.toLowerCase() || '';
  const rdapServer = getRdapServer(tld);

  if (!rdapServer) {
    console.warn(`[RDAP] No RDAP server configured for TLD: .${tld}`);
    // Fall back to rdap.org which does bootstrap lookup
    return checkDomainRDAPOrg(domain);
  }

  try {
    const url = `${rdapServer}domain/${encodeURIComponent(domain)}`;

    console.log(`[RDAP] Checking ${domain} via ${rdapServer}`);

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Accept': 'application/rdap+json, application/json',
      },
    });

    // RDAP convention:
    // 200 = Domain exists (TAKEN)
    // 404 = Domain not found (AVAILABLE)
    const isAvailable = response.status === 404;

    console.log(`[RDAP] ${domain}: ${response.status} → ${isAvailable ? 'AVAILABLE' : 'TAKEN'}`);

    return {
      domain,
      available: isAvailable,
      source: 'rdap',
      confidence: 0.95,  // RDAP is very accurate
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
 * Fallback to RDAP.org bootstrap service
 * This service automatically redirects to the correct RDAP server
 */
export async function checkDomainRDAPOrg(domain: string): Promise<DomainStatus> {
  try {
    const url = `https://rdap.org/domain/${encodeURIComponent(domain)}`;

    console.log(`[RDAP.org] Checking ${domain}`);

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Accept': 'application/rdap+json, application/json',
      },
      redirect: 'follow', // Follow redirects to actual RDAP server
    });

    // 200 = Domain exists (TAKEN)
    // 404 = Domain not found (AVAILABLE)
    const isAvailable = response.status === 404;

    console.log(`[RDAP.org] ${domain}: ${response.status} → ${isAvailable ? 'AVAILABLE' : 'TAKEN'}`);

    return {
      domain,
      available: isAvailable,
      source: 'rdap',
      confidence: 0.90,  // Slightly lower confidence for fallback
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
  const MAX_CONCURRENT = 5;  // Be respectful to RDAP servers

  for (let i = 0; i < domains.length; i += MAX_CONCURRENT) {
    const batch = domains.slice(i, i + MAX_CONCURRENT);

    const batchResults = await Promise.allSettled(
      batch.map(domain => checkDomainAvailabilityRDAP(domain))
    );

    for (let j = 0; j < batchResults.length; j++) {
      const result = batchResults[j];
      if (result.status === 'fulfilled') {
        results.push(result.value);
      } else {
        // Error fallback
        results.push({
          domain: batch[j],
          available: false,
          source: 'rdap',
          confidence: 0,
          checkedAt: new Date(),
        });
      }
    }

    // Small delay to be respectful
    if (i + MAX_CONCURRENT < domains.length) {
      await sleep(200);
    }
  }

  return results;
}

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}
