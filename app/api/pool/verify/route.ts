/**
 * Domain Verification API
 *
 * Verifies availability of specific domains via RDAP.
 * Called after showing instant results to confirm availability.
 */

import { NextRequest, NextResponse } from 'next/server';
import { checkDomainsBatchRDAP } from '@/lib/domain/rdap';
import { prisma } from '@/lib/prisma';

export const maxDuration = 30;

interface VerifyRequest {
  domains: string[];  // List of domains to verify
}

/**
 * POST /api/pool/verify
 *
 * Verify availability of domains via RDAP
 */
export async function POST(req: NextRequest) {
  const startTime = Date.now();

  try {
    const body: VerifyRequest = await req.json();
    const { domains } = body;

    if (!domains || domains.length === 0) {
      return NextResponse.json(
        { error: 'Domains array required' },
        { status: 400 }
      );
    }

    // Limit to 20 domains per request
    const toVerify = domains.slice(0, 20);

    // Check via RDAP
    const results = await checkDomainsBatchRDAP(toVerify);

    // Track which are taken to remove from pool
    const taken: string[] = [];
    const available: string[] = [];

    for (const result of results) {
      if (result.available) {
        available.push(result.domain);
      } else {
        taken.push(result.domain);
      }
    }

    // Remove taken domains from pool (async, don't wait)
    if (taken.length > 0) {
      prisma.availableDomain.deleteMany({
        where: { domain: { in: taken } }
      }).catch(err => console.error('[Verify] Error removing taken:', err));
    }

    const responseTime = Date.now() - startTime;

    return NextResponse.json({
      success: true,
      results: results.map(r => ({
        domain: r.domain,
        available: r.available,
        error: r.error
      })),
      stats: {
        responseTime,
        verified: toVerify.length,
        available: available.length,
        taken: taken.length
      }
    });

  } catch (error) {
    console.error('[Verify] Error:', error);
    return NextResponse.json(
      { error: 'Verification failed', details: String(error) },
      { status: 500 }
    );
  }
}
