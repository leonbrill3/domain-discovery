/**
 * 🤖 GENERATE API - DomainSeek.ai
 *
 * AI-powered domain generation endpoint.
 * Uses Claude with prompt caching for 90% cost savings.
 */

import { NextRequest, NextResponse } from 'next/server';
import { generateDomainsForThemes, interpretUserInput } from '@/lib/ai/claude';
import { checkDomainsBatch } from '@/lib/domain/checker';
import { checkWaybackBatch } from '@/lib/domain/wayback';
import type { ThemeId } from '@/lib/ai/themes';
import { z } from 'zod';

// Request validation schema
const GenerateRequestSchema = z.object({
  project: z.string().min(5).max(500),
  themes: z.array(z.string()).min(1).max(10), // Increased from 5 to 10 for recipes
  countPerTheme: z.number().min(1).max(50).optional().default(50), // Maxed to 50 to fill Namecheap bulk API
  tlds: z.array(z.string()).min(1).max(5).optional().default(['com', 'io', 'ai']), // User-selected TLDs
  charMin: z.number().min(3).max(15).optional().default(4), // Minimum characters (before TLD)
  charMax: z.number().min(3).max(20).optional().default(10), // Maximum characters (before TLD)
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate request
    const validated = GenerateRequestSchema.parse(body);
    let { project, themes, countPerTheme, tlds, charMin, charMax } = validated;

    // Interpret user input - detect commands like "4 letter word" or "something catchy"
    const interpreted = await interpretUserInput(project);

    if (interpreted.isCommand) {
      console.log(`[API/Generate] Detected command: "${project}" → project: "${interpreted.project}"`);
      project = interpreted.project;

      // Apply extracted constraints (but don't override user's explicit settings)
      if (interpreted.extractedConstraints.charMin) {
        charMin = interpreted.extractedConstraints.charMin;
        charMax = interpreted.extractedConstraints.charMax || charMin;
      }
    }

    console.log(`[API/Generate] Request: ${themes.length} themes × ${countPerTheme} domains (chars: ${charMin}-${charMax})`);

    // Generate domains using Claude
    const startTime = Date.now();

    const { results, totalTokensUsed, generationTime } = await generateDomainsForThemes(
      project,
      themes as ThemeId[],
      countPerTheme,
      { tlds, charMin, charMax } // Pass user constraints
    );

    // Flatten all domains for batch checking
    const allDomains = Object.values(results).flat();

    console.log(`[API/Generate] Generated ${allDomains.length} domains in ${generationTime}ms`);

    // Check domain availability (with caching + fallback)
    const checkStartTime = Date.now();
    const availabilityResults = await checkDomainsBatch(allDomains);
    const checkDuration = Date.now() - checkStartTime;

    console.log(`[API/Generate] Checked ${allDomains.length} domains in ${checkDuration}ms`);

    // CRITICAL: Only return HIGH-CONFIDENCE AVAILABLE domains
    // Confidence threshold: 0.95 (ultra-conservative to prevent false positives)
    const MIN_CONFIDENCE = 0.95;

    // Filter to ONLY available domains with high confidence
    const availableOnly = availabilityResults.filter(
      r => r.available && r.confidence >= MIN_CONFIDENCE
    );

    console.log(`[API/Generate] Filtered: ${availableOnly.length}/${allDomains.length} available (${((availableOnly.length / allDomains.length) * 100).toFixed(1)}%)`);

    // Check Wayback Machine for available domains (to detect previously registered)
    const availableDomainNames = availableOnly.map(r => r.domain);
    const waybackResults = await checkWaybackBatch(availableDomainNames, 10);
    const previouslyRegistered = [...waybackResults.values()].filter(r => r.wasRegistered).length;
    console.log(`[API/Generate] Wayback: ${previouslyRegistered}/${availableDomainNames.length} were previously registered`);

    // Organize results by theme - ONLY AVAILABLE DOMAINS
    const domainsByTheme: Record<string, Array<{
      domain: string;
      available: boolean;
      price?: number;
      currency?: string;
      confidence: number;
      previouslyRegistered?: boolean;
      lastSnapshot?: string;
    }>> = {};

    for (const [themeId, domains] of Object.entries(results)) {
      // Only include domains that passed our strict availability filter
      const availableForTheme = domains
        .map(domain => {
          const status = availableOnly.find(r => r.domain === domain);
          if (!status) return null; // Exclude unavailable or low-confidence

          const wayback = waybackResults.get(domain);

          return {
            domain,
            available: true, // Always true since we pre-filtered
            price: status.price,
            currency: status.currency,
            confidence: status.confidence,
            previouslyRegistered: wayback?.wasRegistered || false,
            lastSnapshot: wayback?.lastSnapshot,
          };
        })
        .filter((d): d is NonNullable<typeof d> => d !== null);

      domainsByTheme[themeId] = availableForTheme;
    }

    // Calculate metrics (using strict filter)
    const totalDuration = Date.now() - startTime;
    const availableCount = availableOnly.length; // Only high-confidence available

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
