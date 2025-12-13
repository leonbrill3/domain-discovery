/**
 * 🎱 POOL SEARCH API - DomainSeek.ai
 *
 * POST /api/pool/search
 *
 * Query pre-checked domain pool for instant results.
 * Returns verified available domains in milliseconds.
 */

import { NextRequest, NextResponse } from 'next/server';
import { searchPool, getPoolStats, type PoolSearchParams } from '@/lib/domain/pool';

export async function POST(req: NextRequest) {
  const startTime = Date.now();

  try {
    const body = await req.json();

    const params: PoolSearchParams = {
      tld: body.tld || 'ai',
      minLength: body.minLength ?? 4,
      maxLength: body.maxLength ?? 7,
      pattern: body.pattern,
      startsWith: body.startsWith,
      endsWith: body.endsWith,
      limit: Math.min(body.limit || 50, 100)  // Cap at 100
    };

    console.log('[Pool API] Search request:', params);

    const result = await searchPool(params);

    return NextResponse.json({
      success: true,
      domains: result.verified,
      stats: {
        candidates: result.domains.length,
        verified: result.verified.length,
        taken: result.taken.length,
        queryTime: result.queryTime,
        verifyTime: result.verifyTime,
        totalTime: Date.now() - startTime
      }
    });

  } catch (error) {
    console.error('[Pool API] Error:', error);

    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      domains: []
    }, { status: 500 });
  }
}

/**
 * GET /api/pool/search - Get pool statistics
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const tld = searchParams.get('tld') || undefined;

    const stats = await getPoolStats(tld);

    return NextResponse.json({
      success: true,
      stats
    });

  } catch (error) {
    console.error('[Pool API] Stats error:', error);

    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
