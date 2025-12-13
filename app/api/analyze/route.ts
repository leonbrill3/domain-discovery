/**
 * 🎯 ANALYZE API - Domain Analysis & Ranking
 *
 * Uses Claude to provide detailed analysis for each domain
 */

import { NextRequest, NextResponse } from 'next/server';
import { rankAndAnalyzeDomains } from '@/lib/ai/ranking';
import { z } from 'zod';

const AnalyzeRequestSchema = z.object({
  domains: z.array(z.any()),
  project: z.string().min(1),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validated = AnalyzeRequestSchema.parse(body);
    // Filter out null/undefined values and ensure all are strings
    const domains = validated.domains.filter((d): d is string => typeof d === 'string' && d.length > 0);
    const { project } = validated;

    if (domains.length === 0) {
      return NextResponse.json(
        { error: 'No valid domains provided' },
        { status: 400 }
      );
    }

    console.log(`[API/Analyze] Analyzing ${domains.length} domains for project: ${project}`);

    // Get analysis from Claude
    const analyses = await rankAndAnalyzeDomains(domains, project);

    return NextResponse.json({
      success: true,
      analyses,
    });

  } catch (error) {
    console.error('[API/Analyze] Error:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request', details: error.issues },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Analysis failed' },
      { status: 500 }
    );
  }
}
