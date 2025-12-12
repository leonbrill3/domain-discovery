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
const SYSTEM_PROMPT = `You are an expert domain name generator optimized for both BRANDING and SEO.

Your domain names should be:
- **Memorable**: Easy to remember and recall
- **Pronounceable**: Can be said out loud clearly
- **Brandable**: Feels like a real company name
- **SEO-Optimized**: Contains relevant keywords when appropriate
- **Short**: Ideally 5-15 characters (excluding TLD)
- **AVAILABLE**: Focus on UNIQUE, creative combinations likely to be available

CRITICAL: Prioritize domain availability!
- Avoid common dictionary words alone (usually taken)
- Prefer creative combinations and compounds (more likely available)
- Add unique twists to common words (yogaflow > yoga)
- Use modern suffixes: -ly, -ify, -hub, -lab, -flow, -base
- Mix unexpected elements to create uniqueness

FOR SHORT DOMAINS (4-6 chars):
- COMMON English words are ALL TAKEN (flow, peak, bold, pure, sage = taken)
- Instead use these strategies:
  1. OBSCURE/RARE dictionary words (byre, froe, gawp, quay, kelp, weft, culm)
  2. MADE-UP pronounceable names (zova, kiru, plyx, novu, brix, vela)
  3. Foreign words from Latin, Greek, Japanese, etc (vita, nova, kaze, mori)
- Mix these approaches for variety
- These are more likely available AND more brandable than common words

SEO BEST PRACTICES:
- Include relevant keywords naturally when they fit the theme
- Prioritize .com for maximum SEO authority (but use others when appropriate)
- Avoid hyphens and numbers (harder to rank and remember)
- Keep it spellable (reduces bounce rate from typos)
- Balance keyword-rich (good SEO) with brandable (good trademark)
- Consider voice search: easy to pronounce = better voice SEO

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
 * Domain generation constraints
 */
export interface GenerationConstraints {
  tlds?: string[];      // User-selected TLDs (e.g., ['com', 'io'])
  charMin?: number;     // Minimum characters (before TLD)
  charMax?: number;     // Maximum characters (before TLD)
  wordType?: 'real' | 'madeup' | 'both';  // Real dictionary words vs made-up phonetic words
  language?: string;    // Language inspiration (e.g., 'spanish', 'french', 'latin')
}

/**
 * Interpret user input - detect commands vs project descriptions
 * Returns processed input and any extracted constraints
 */
export async function interpretUserInput(input: string): Promise<{
  project: string;
  extractedConstraints: Partial<GenerationConstraints>;
  isCommand: boolean;
}> {
  // Quick pattern matching for common commands (avoid API call)
  const lowerInput = input.toLowerCase().trim();

  // Detect length commands
  const lengthPatterns = [
    { pattern: /(\d+)\s*(?:letter|char|character)s?\s*(?:word|name|domain)?/i, extract: (m: RegExpMatchArray) => parseInt(m[1]) },
    { pattern: /(?:short|tiny|brief)\s*(?:name|domain|word)?/i, extract: () => ({ min: 3, max: 6 }) },
    { pattern: /(?:long|longer)\s*(?:name|domain|word)?/i, extract: () => ({ min: 10, max: 15 }) },
  ];

  // Check for length-related commands
  for (const { pattern, extract } of lengthPatterns) {
    const match = lowerInput.match(pattern);
    if (match) {
      const result = extract(match);
      const constraints: Partial<GenerationConstraints> = typeof result === 'number'
        ? { charMin: result, charMax: result }
        : { charMin: result.min, charMax: result.max };

      // It's a command - generate generic creative domains
      return {
        project: 'creative brand name', // Generic project for pure creative generation
        extractedConstraints: constraints,
        isCommand: true,
      };
    }
  }

  // Detect style commands
  const styleCommands = [
    { patterns: ['catchy', 'memorable', 'punchy'], style: 'catchy brand name' },
    { patterns: ['professional', 'corporate', 'business'], style: 'professional business' },
    { patterns: ['tech', 'startup', 'modern'], style: 'tech startup' },
    { patterns: ['fun', 'playful', 'quirky'], style: 'fun creative brand' },
  ];

  for (const { patterns, style } of styleCommands) {
    if (patterns.some(p => lowerInput.includes(p))) {
      // Check if it's JUST the command word (no actual project)
      const justCommand = patterns.some(p => lowerInput === p || lowerInput === `something ${p}` || lowerInput === `a ${p} name`);
      if (justCommand) {
        return {
          project: style,
          extractedConstraints: {},
          isCommand: true,
        };
      }
    }
  }

  // Not a command - return as-is
  return {
    project: input,
    extractedConstraints: {},
    isCommand: false,
  };
}

/**
 * Generate domain names for a specific theme
 */
export async function generateDomainsForTheme(
  project: string,
  themeId: ThemeId,
  count: number = 10,
  constraints?: GenerationConstraints
): Promise<{
  domains: string[];
  tokensUsed: { input: number; output: number };
  cached: boolean;
}> {
  const theme = THEMES[themeId];

  if (!theme) {
    throw new Error(`Invalid theme ID: ${themeId}`);
  }

  // Build constraints text
  const tldList = constraints?.tlds && constraints.tlds.length > 0
    ? constraints.tlds.map(t => `.${t}`).join(', ')
    : '.com, .io, .ai, .app, .dev';

  const charLength = constraints?.charMin && constraints?.charMax
    ? `${constraints.charMin}-${constraints.charMax} characters (excluding TLD)`
    : '5-15 characters (excluding TLD)';

  // Word type instruction
  const wordTypeInstruction = constraints?.wordType === 'real'
    ? '- Word Type: ONLY use real dictionary words (existing words from any language)'
    : constraints?.wordType === 'madeup'
    ? '- Word Type: ONLY use made-up/invented words that are phonetically pleasing and easy to pronounce (not real dictionary words)'
    : '- Word Type: Mix of real words and creative made-up words';

  // Language instruction
  const languageInstruction = constraints?.language && constraints.language !== 'any'
    ? `- Language: Draw inspiration from ${constraints.language} language (use ${constraints.language} words, roots, sounds, or translations)`
    : '';

  // Themes that need project context (descriptive/direct themes)
  const PROJECT_DEPENDENT_THEMES = ['direct', 'descriptive', 'clear', 'keyword-rich', 'exact-match'];
  const needsProject = PROJECT_DEPENDENT_THEMES.includes(themeId);

  // Build user prompt - only include project for descriptive themes
  const userPrompt = needsProject
    ? `Project Description: "${project}"

Theme: ${theme.name}

${theme.prompt}

CONSTRAINTS:
- TLDs: ONLY use these TLDs: ${tldList}
- Length: ${charLength}
${wordTypeInstruction}
${languageInstruction ? languageInstruction + '\n' : ''}- Each domain MUST match ALL constraints

Generate exactly ${count} domain names for this project using the ${theme.name} theme.`
    : `Theme: ${theme.name}

${theme.prompt}

CONSTRAINTS:
- TLDs: ONLY use these TLDs: ${tldList}
- Length: ${charLength}
${wordTypeInstruction}
${languageInstruction ? languageInstruction + '\n' : ''}- Each domain MUST match ALL constraints

Generate exactly ${count} creative domain names using ONLY the ${theme.name} theme. Do NOT reference any specific business or project - generate pure themed names that could work for any brand.`;

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

    // Parse domains from response (with constraints for validation)
    const domains = parseDomains(text, count, constraints);

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
  countPerTheme: number = 10,
  constraints?: GenerationConstraints
): Promise<{
  results: Record<ThemeId, string[]>;
  totalTokensUsed: { input: number; output: number };
  generationTime: number;
}> {
  const startTime = Date.now();

  // Generate all themes in parallel (pass constraints to each)
  const promises = themeIds.map(themeId =>
    generateDomainsForTheme(project, themeId, countPerTheme, constraints)
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
function parseDomains(text: string, expectedCount: number, constraints?: GenerationConstraints): string[] {
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

    // Validate domain format (with user constraints)
    if (isValidDomain(cleaned, constraints)) {
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
function isValidDomain(domain: string, constraints?: GenerationConstraints): boolean {
  // Must have a dot (TLD)
  if (!domain.includes('.')) return false;

  // Extract name and TLD
  const parts = domain.split('.');
  if (parts.length < 2) return false;

  const name = parts[0];
  const tld = parts.slice(1).join('.'); // Handle multi-part TLDs

  // Check TLD against user constraints
  const validTLDs = constraints?.tlds && constraints.tlds.length > 0
    ? constraints.tlds
    : ['com', 'io', 'ai', 'app', 'dev'];
  const hasValidTLD = validTLDs.some(t => domain.endsWith(`.${t}`));
  if (!hasValidTLD) return false;

  // Check character length (BEFORE TLD, as user expects)
  const minLen = constraints?.charMin || 3;
  const maxLen = constraints?.charMax || 30;
  if (name.length < minLen || name.length > maxLen) return false;

  // Must not have special characters (except dot and hyphen)
  if (!/^[a-z0-9.-]+$/.test(domain)) return false;

  // Must not start or end with hyphen
  if (domain.startsWith('-') || domain.endsWith('-')) return false;

  // Must have content before TLD (already have parts from above)
  if (name.length < 2) return false;

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
