/**
 * 🎯 ANALYZE API - Domain Analysis & Ranking
 *
 * Uses Claude to provide detailed analysis for each domain
 */

import { NextRequest, NextResponse } from 'next/server';
import { rankAndAnalyzeDomains } from '@/lib/ai/ranking';
import { z } from 'zod';

const AnalyzeRequestSchema = z.object({
  domains: z.array(z.string()).min(1).max(20),
  project: z.string().min(1),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validated = AnalyzeRequestSchema.parse(body);
    const { domains, project } = validated;

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
        { error: 'Invalid request', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Analysis failed' },
      { status: 500 }
    );
  }
}
