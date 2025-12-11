/**
 * 🕰️ WAYBACK MACHINE CHECKER - DomainSeek.ai
 *
 * Check if a domain was previously registered by looking for
 * archived snapshots in the Wayback Machine.
 *
 * Previously registered domains may have:
 * - Existing backlinks (SEO value)
 * - Domain age benefits
 * - Type-in traffic
 */

interface WaybackResult {
  domain: string;
  wasRegistered: boolean;
  firstSnapshot?: string; // Date of first archive
  lastSnapshot?: string;  // Date of most recent archive
  snapshotCount?: number; // Approximate activity level
}

interface WaybackAPIResponse {
  url: string;
  archived_snapshots: {
    closest?: {
      status: string;
      available: boolean;
      url: string;
      timestamp: string; // Format: YYYYMMDDHHmmss
    };
  };
}

/**
 * Check if a single domain has Wayback Machine history
 */
export async function checkWaybackHistory(domain: string): Promise<WaybackResult> {
  try {
    const response = await fetch(
      `http://archive.org/wayback/available?url=${encodeURIComponent(domain)}`,
      { signal: AbortSignal.timeout(5000) } // 5s timeout
    );

    if (!response.ok) {
      return { domain, wasRegistered: false };
    }

    const data: WaybackAPIResponse = await response.json();
    const snapshot = data.archived_snapshots?.closest;

    if (snapshot?.available) {
      // Parse timestamp: YYYYMMDDHHmmss -> readable date
      const ts = snapshot.timestamp;
      const lastSnapshot = `${ts.slice(0, 4)}-${ts.slice(4, 6)}-${ts.slice(6, 8)}`;

      return {
        domain,
        wasRegistered: true,
        lastSnapshot,
      };
    }

    return { domain, wasRegistered: false };
  } catch (error) {
    // On error, assume no history (don't block the flow)
    console.warn(`[Wayback] Error checking ${domain}:`, error);
    return { domain, wasRegistered: false };
  }
}

/**
 * Batch check multiple domains for Wayback history
 * Uses parallel requests with concurrency limit to avoid rate limiting
 */
export async function checkWaybackBatch(
  domains: string[],
  concurrency: number = 5
): Promise<Map<string, WaybackResult>> {
  const results = new Map<string, WaybackResult>();

  // Process in batches to avoid overwhelming the API
  for (let i = 0; i < domains.length; i += concurrency) {
    const batch = domains.slice(i, i + concurrency);
    const batchResults = await Promise.all(
      batch.map(domain => checkWaybackHistory(domain))
    );

    batchResults.forEach(result => {
      results.set(result.domain, result);
    });

    // Small delay between batches to be nice to the API
    if (i + concurrency < domains.length) {
      await new Promise(resolve => setTimeout(resolve, 200));
    }
  }

  return results;
}
