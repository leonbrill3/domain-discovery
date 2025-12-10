/**
 * 🔍 DOMAINR API CLIENT - DomainSeek.ai
 *
 * Domain availability checking with zero false positives.
 * Uses RapidAPI (10k free requests/month).
 */

export interface DomainStatus {
  domain: string;
  available: boolean;
  price?: number;
  currency?: string;
  source: 'domainr' | 'rdap' | 'cache';
  confidence: number;  // 0.0-1.0
  checkedAt: Date;
}

/**
 * Check domain availability via Domainr API (RapidAPI)
 */
export async function checkDomainAvailability(domain: string): Promise<DomainStatus> {
  const apiKey = process.env.DOMAINR_API_KEY;
  const apiHost = 'domainr.p.rapidapi.com';

  if (!apiKey) {
    throw new Error('DOMAINR_API_KEY not configured');
  }

  try {
    const url = `https://${apiHost}/v2/status?domain=${encodeURIComponent(domain)}`;

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'X-RapidAPI-Key': apiKey,
        'X-RapidAPI-Host': apiHost,
      },
    });

    if (!response.ok) {
      throw new Error(`Domainr API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();

    // Domainr response format:
    // { "status": [{ "domain": "example.com", "status": "undelegated"|"inactive"|"active", ... }] }
    const statusData = data.status?.[0];

    if (!statusData) {
      throw new Error('Invalid Domainr response format');
    }

    // STRICT AVAILABILITY CHECK:
    // - "undelegated" = definitely available (not registered)
    // - "inactive" = may be registered but not active (CONSERVATIVE: treat as unavailable)
    // - "active" = registered and active (unavailable)
    // - "premium" = premium domain (unavailable)
    // - "reserved" = reserved by registry (unavailable)
    //
    // We ONLY accept "undelegated" to ensure 100% reliability
    const isAvailable = statusData.status === 'undelegated';

    return {
      domain,
      available: isAvailable,
      price: statusData.price,
      currency: statusData.currency || 'USD',
      source: 'domainr',
      confidence: 0.99,  // Domainr is highly accurate
      checkedAt: new Date(),
    };

  } catch (error) {
    console.error(`[Domainr] Error checking ${domain}:`, error);
    throw error;
  }
}

/**
 * Batch check multiple domains
 */
export async function checkDomainsBatch(domains: string[]): Promise<DomainStatus[]> {
  // Check domains in parallel (max 5 concurrent to avoid rate limits)
  const MAX_CONCURRENT = 5;
  const results: DomainStatus[] = [];

  for (let i = 0; i < domains.length; i += MAX_CONCURRENT) {
    const batch = domains.slice(i, i + MAX_CONCURRENT);

    const batchResults = await Promise.allSettled(
      batch.map(domain => checkDomainAvailability(domain))
    );

    for (const result of batchResults) {
      if (result.status === 'fulfilled') {
        results.push(result.value);
      } else {
        console.error('[Domainr] Batch check error:', result.reason);
        // Add error result
        results.push({
          domain: domains[results.length],
          available: false,
          source: 'domainr',
          confidence: 0,
          checkedAt: new Date(),
        });
      }
    }

    // Rate limiting: wait 200ms between batches
    if (i + MAX_CONCURRENT < domains.length) {
      await sleep(200);
    }
  }

  return results;
}

/**
 * Helper: Sleep function
 */
function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Test Domainr API connection
 */
export async function testDomainrConnection(): Promise<boolean> {
  try {
    console.log('[Domainr] Testing API connection...');

    const result = await checkDomainAvailability('google.com');

    console.log('[Domainr] ✅ API test successful');
    console.log(`  Domain: ${result.domain}`);
    console.log(`  Available: ${result.available}`);
    console.log(`  Confidence: ${result.confidence}`);

    return true;
  } catch (error) {
    console.error('[Domainr] ❌ API test failed:', error);
    return false;
  }
}
