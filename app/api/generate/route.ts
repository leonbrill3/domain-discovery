/**
 * 🤖 GENERATE API - DomainSeek.ai
 *
 * AI-powered domain generation endpoint.
 * Uses Claude with prompt caching for 90% cost savings.
 */

import { NextRequest, NextResponse } from 'next/server';
import { generateDomainsForThemes } from '@/lib/ai/claude';
import { checkDomainsBatch } from '@/lib/domain/checker';
import type { ThemeId } from '@/lib/ai/themes';
import { z } from 'zod';

// Request validation schema
const GenerateRequestSchema = z.object({
  project: z.string().min(5).max(500),
  themes: z.array(z.string()).min(1).max(10), // Increased from 5 to 10 for recipes
  countPerTheme: z.number().min(1).max(50).optional().default(10), // Min reduced from 5 to 1 for recipes
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate request
    const validated = GenerateRequestSchema.parse(body);
    const { project, themes, countPerTheme } = validated;

    console.log(`[API/Generate] Request: ${themes.length} themes × ${countPerTheme} domains`);

    // Generate domains using Claude
    const startTime = Date.now();

    const { results, totalTokensUsed, generationTime } = await generateDomainsForThemes(
      project,
      themes as ThemeId[],
      countPerTheme
    );

    // Flatten all domains for batch checking
    const allDomains = Object.values(results).flat();

    console.log(`[API/Generate] Generated ${allDomains.length} domains in ${generationTime}ms`);

    // TODO: Add domain availability checking later
    // For now, mark all AI-generated domains as available
    const checkStartTime = Date.now();
    const availabilityResults = allDomains.map(domain => ({
      domain,
      available: true,
      price: 13, // Default price
      currency: 'USD',
      confidence: 1.0,
    }));
    const checkDuration = Date.now() - checkStartTime;

    console.log(`[API/Generate] Marked ${allDomains.length} domains as available (AI-only mode)`);

    // Organize results by theme
    const domainsByTheme: Record<string, Array<{
      domain: string;
      available: boolean;
      price?: number;
      currency?: string;
      confidence: number;
    }>> = {};

    for (const [themeId, domains] of Object.entries(results)) {
      domainsByTheme[themeId] = domains.map(domain => {
        const status = availabilityResults.find(r => r.domain === domain);
        return {
          domain,
          available: status?.available || false,
          price: status?.price,
          currency: status?.currency,
          confidence: status?.confidence || 0,
        };
      });
    }

    // Calculate metrics
    const totalDuration = Date.now() - startTime;
    const availableCount = availabilityResults.filter(r => r.available).length;

    // Return results
    return NextResponse.json({
      success: true,
      data: {
        project,
        themes: domainsByTheme,
        statistics: {
          totalGenerated: allDomains.length,
          totalAvailable: availableCount,
          availabilityRate: availableCount / allDomains.length,
          generationTime,
          checkingTime: checkDuration,
          totalTime: totalDuration,
        },
        tokensUsed: totalTokensUsed,
      },
    });

  } catch (error) {
    console.error('[API/Generate] Error:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: 'Invalid request', details: error.issues },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { success: false, error: 'Generation failed' },
      { status: 500 }
    );
  }
}

// GET method for testing
export async function GET() {
  return NextResponse.json({
    service: 'DomainSeek.ai - Generate API',
    status: 'running',
    endpoints: {
      POST: '/api/generate - Generate domain names',
    },
  });
}
