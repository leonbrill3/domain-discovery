/**
 * 🤖 CLAUDE API CLIENT - DomainSeek.ai
 *
 * AI-powered domain name generation with prompt caching.
 * Prompt caching reduces costs by 90% ($3/MTok → $0.30/MTok).
 */

import Anthropic from '@anthropic-ai/sdk';
import { THEMES, type ThemeId } from './themes';

// Initialize Claude client
const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

/**
 * System prompt (CACHED for 5 minutes)
 * This is the same for all requests, so we cache it aggressively.
 * Saves 90% on these tokens!
 */
const SYSTEM_PROMPT = `You are an expert domain name generator for startups, businesses, and creative projects.

Your domain names should be:
- **Memorable**: Easy to remember and recall
- **Pronounceable**: Can be said out loud clearly
- **Brandable**: Feels like a real company name
- **Short**: Ideally 5-15 characters (excluding TLD)
- **Available**: Focus on realistic, likely-available combinations

CRITICAL OUTPUT RULES:
1. Return ONLY domain names, one per line
2. Each domain MUST include a TLD (.com, .io, .ai, .app, or .dev)
3. NO numbering, NO bullet points, NO explanations
4. NO markdown formatting
5. lowercase only

Example correct output:
olympusrun.com
zeusfit.io
athenaapp.ai
hermeslink.dev

NEVER output like this:
1. olympusrun.com - A fitness app for...
- zeusfit.io (good for...)`;

/**
 * Generate domain names for a specific theme
 */
export async function generateDomainsForTheme(
  project: string,
  themeId: ThemeId,
  count: number = 10
): Promise<{
  domains: string[];
  tokensUsed: { input: number; output: number };
  cached: boolean;
}> {
  const theme = THEMES[themeId];

  if (!theme) {
    throw new Error(`Invalid theme ID: ${themeId}`);
  }

  // Build user prompt
  const userPrompt = `Project Description: "${project}"

Theme: ${theme.name}

${theme.prompt}

Generate exactly ${count} domain names for this project using the ${theme.name} theme.`;

  try {
    const startTime = Date.now();

    // Call Claude with prompt caching
    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-5-20250929',
      max_tokens: 2000,
      temperature: 0.8,  // Slightly creative
      system: [
        {
          type: "text",
          text: SYSTEM_PROMPT,
          cache_control: { type: "ephemeral" }  // Cache for 5 min - 90% savings!
        }
      ],
      messages: [{
        role: 'user',
        content: userPrompt
      }]
    });

    const duration = Date.now() - startTime;

    // Extract text from response
    const text = response.content[0].type === 'text'
      ? response.content[0].text
      : '';

    // Parse domains from response
    const domains = parseDomains(text, count);

    // Check if prompt cache was used
    const cached = (response.usage.cache_read_input_tokens ?? 0) > 0;

    console.log(`[Claude] Generated ${domains.length} domains for ${themeId} in ${duration}ms (cached: ${cached})`);

    return {
      domains,
      tokensUsed: {
        input: response.usage.input_tokens,
        output: response.usage.output_tokens,
      },
      cached,
    };

  } catch (error) {
    console.error('[Claude] Generation error:', error);
    throw new Error(`Failed to generate domains: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Generate domains for multiple themes in parallel
 */
export async function generateDomainsForThemes(
  project: string,
  themeIds: ThemeId[],
  countPerTheme: number = 10
): Promise<{
  results: Record<ThemeId, string[]>;
  totalTokensUsed: { input: number; output: number };
  generationTime: number;
}> {
  const startTime = Date.now();

  // Generate all themes in parallel
  const promises = themeIds.map(themeId =>
    generateDomainsForTheme(project, themeId, countPerTheme)
  );

  const responses = await Promise.all(promises);

  // Aggregate results
  const results: Record<string, string[]> = {};
  let totalInputTokens = 0;
  let totalOutputTokens = 0;

  themeIds.forEach((themeId, index) => {
    results[themeId] = responses[index].domains;
    totalInputTokens += responses[index].tokensUsed.input;
    totalOutputTokens += responses[index].tokensUsed.output;
  });

  const generationTime = Date.now() - startTime;

  console.log(`[Claude] Generated ${Object.values(results).flat().length} total domains in ${generationTime}ms`);

  return {
    results: results as Record<ThemeId, string[]>,
    totalTokensUsed: {
      input: totalInputTokens,
      output: totalOutputTokens,
    },
    generationTime,
  };
}

/**
 * Parse domains from Claude's response
 * Handles various formatting issues and extracts valid domains
 */
function parseDomains(text: string, expectedCount: number): string[] {
  // Split by newlines
  const lines = text.split('\n');

  const domains: string[] = [];

  for (const line of lines) {
    // Clean the line
    const cleaned = line
      .trim()
      .toLowerCase()
      // Remove numbering: "1. domain.com" → "domain.com"
      .replace(/^\d+[\.\)]\s*/, '')
      // Remove bullets: "- domain.com" → "domain.com"
      .replace(/^[-*]\s*/, '')
      // Remove markdown: "[domain.com]" → "domain.com"
      .replace(/[\[\]]/g, '')
      // Remove extra spaces
      .replace(/\s+/g, '');

    // Validate domain format
    if (isValidDomain(cleaned)) {
      domains.push(cleaned);
    }
  }

  // Warn if we didn't get enough
  if (domains.length < expectedCount) {
    console.warn(`[Claude] Expected ${expectedCount} domains, got ${domains.length}`);
  }

  // Return up to expected count
  return domains.slice(0, expectedCount);
}

/**
 * Validate domain format
 */
function isValidDomain(domain: string): boolean {
  // Must have a dot (TLD)
  if (!domain.includes('.')) return false;

  // Must end with valid TLD
  const validTLDs = ['.com', '.io', '.ai', '.app', '.dev'];
  const hasValidTLD = validTLDs.some(tld => domain.endsWith(tld));
  if (!hasValidTLD) return false;

  // Must be reasonable length (5-30 chars)
  if (domain.length < 5 || domain.length > 30) return false;

  // Must not have special characters (except dot and hyphen)
  if (!/^[a-z0-9.-]+$/.test(domain)) return false;

  // Must not start or end with hyphen
  if (domain.startsWith('-') || domain.endsWith('-')) return false;

  // Must have content before TLD
  const parts = domain.split('.');
  if (parts[0].length < 2) return false;

  return true;
}

/**
 * Calculate cost of generation
 */
export function calculateGenerationCost(tokensUsed: { input: number; output: number }, cached: boolean = false): number {
  // Pricing (per million tokens)
  const INPUT_PRICE = cached ? 0.30 : 3.00;    // $0.30 cached, $3 normal
  const OUTPUT_PRICE = 15.00;

  const inputCost = (tokensUsed.input / 1_000_000) * INPUT_PRICE;
  const outputCost = (tokensUsed.output / 1_000_000) * OUTPUT_PRICE;

  return inputCost + outputCost;
}

/**
 * Test the Claude integration
 */
export async function testClaudeIntegration(): Promise<boolean> {
  try {
    console.log('[Claude] Testing API connection...');

    const result = await generateDomainsForTheme(
      'fitness app for runners',
      'ancient-greek',
      5
    );

    console.log('[Claude] ✅ API test successful');
    console.log(`  Generated ${result.domains.length} domains:`);
    console.log(`  ${result.domains.join(', ')}`);
    console.log(`  Tokens: ${result.tokensUsed.input} in, ${result.tokensUsed.output} out`);
    console.log(`  Cached: ${result.cached}`);

    return true;
  } catch (error) {
    console.error('[Claude] ❌ API test failed:', error);
    return false;
  }
}
