/**
 * 🧠 SEMANTIC POOL SEARCH - DomainSeek.ai
 *
 * "Input IS the Search" - Claude reads the user's description
 * and picks the best domains from our pre-verified pool.
 *
 * No vibes to select. No buttons to click. Just describe what you're building.
 */

import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import { prisma } from '@/lib/prisma';
import { checkDomainsBatchRDAP } from '@/lib/domain/rdap';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export const maxDuration = 60;

interface SemanticSearchRequest {
  description: string;  // "a meditation app for busy professionals"
  tld?: string;         // Default: 'ai'
  limit?: number;       // Default: 15
}

/**
 * POST /api/pool/semantic
 *
 * Input: { description: "meditation app for professionals" }
 * Output: { domains: ["zen.ai", "kensho.ai", "satori.ai", ...], stats: {...} }
 */
export async function POST(req: NextRequest) {
  try {
    const body: SemanticSearchRequest = await req.json();
    const { description, tld = 'ai', limit = 15 } = body;

    if (!description || description.length < 3) {
      return NextResponse.json(
        { error: 'Description required (min 3 characters)' },
        { status: 400 }
      );
    }

    const startTime = Date.now();

    // Step 1: Get ALL available domains from pool (we'll let Claude filter)
    // For now we have ~5,500 domains, so we can fetch them all
    // Later with 500k+ we'll do smarter filtering
    const poolDomains = await prisma.$queryRaw<{ word: string; domain: string }[]>`
      SELECT word, domain FROM available_domains
      WHERE tld = ${tld}
      ORDER BY length ASC
      LIMIT 2000
    `;

    const queryTime = Date.now() - startTime;

    if (poolDomains.length === 0) {
      return NextResponse.json({
        success: false,
        error: 'No domains in pool for this TLD',
        domains: [],
        stats: { queryTime, verifyTime: 0, totalTime: queryTime }
      });
    }

    // Step 2: Ask Claude to pick the best matches
    const wordList = poolDomains.map(d => d.word).join(', ');

    const claudeStart = Date.now();

    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 500,
      messages: [{
        role: 'user',
        content: `You're picking domain names for someone building: "${description}"

Here are available .${tld} domains to choose from:
${wordList}

Pick the ${limit * 2} BEST matches for their project. Consider:
- Semantic relevance (does the word fit what they're building?)
- Memorability (is it catchy? easy to remember?)
- Brandability (does it feel like a company name?)
- Pronunciation (easy to say?)

Output ONLY the words, one per line. No explanations. No numbering.
Most relevant first.`
      }]
    });

    const claudeTime = Date.now() - claudeStart;

    // Parse Claude's response
    const selectedWords = (response.content[0] as { text: string }).text
      .split('\n')
      .map(line => line.trim().toLowerCase())
      .filter(word => word.length > 0 && poolDomains.some(d => d.word === word))
      .slice(0, limit * 2);

    // Map words back to full domains
    const selectedDomains = selectedWords.map(word => {
      const found = poolDomains.find(d => d.word === word);
      return found ? found.domain : `${word}.${tld}`;
    });

    // Step 3: Verify top picks are still available
    const verifyStart = Date.now();
    const toVerify = selectedDomains.slice(0, Math.min(limit + 5, selectedDomains.length));

    const verificationResults = await checkDomainsBatchRDAP(toVerify);

    const verifyTime = Date.now() - verifyStart;

    // Filter to only verified available
    const verified: string[] = [];
    const taken: string[] = [];

    for (const result of verificationResults) {
      if (result.available) {
        verified.push(result.domain);
        if (verified.length >= limit) break;
      } else {
        taken.push(result.domain);
      }
    }

    // Remove taken domains from pool (async, don't wait)
    if (taken.length > 0) {
      prisma.availableDomain.deleteMany({
        where: { domain: { in: taken } }
      }).catch(err => console.error('[Semantic] Error removing taken:', err));
    }

    const totalTime = Date.now() - startTime;

    console.log(`[Semantic] "${description.slice(0, 30)}..." → ${verified.length} results (${queryTime}ms query, ${claudeTime}ms claude, ${verifyTime}ms verify)`);

    return NextResponse.json({
      success: true,
      domains: verified,
      stats: {
        poolSize: poolDomains.length,
        claudeSelected: selectedWords.length,
        verified: verified.length,
        taken: taken.length,
        queryTime,
        claudeTime,
        verifyTime,
        totalTime
      }
    });

  } catch (error) {
    console.error('[Semantic] Error:', error);
    return NextResponse.json(
      { error: 'Search failed', details: String(error) },
      { status: 500 }
    );
  }
}
