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
  noCompounds?: boolean; // Single words only, no compounds like "moonwave" or "starglow"
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

  // Word type instruction - MUST be emphatic to override system prompt defaults
  const wordTypeInstruction = constraints?.wordType === 'real'
    ? `- Word Type: **CRITICAL - REAL WORDS ONLY**
  You MUST use ONLY real dictionary words that exist in a dictionary.
  DO NOT invent words. DO NOT create made-up combinations.
  Examples of REAL words: peak, flow, spark, wave, tide, forest, stellar, quest, pure
  Examples of FORBIDDEN made-up words: aquol, wavyn, zova, brix, plyx (these are NOT real words)
  Every domain name MUST use words you would find in an English or foreign language dictionary.`
    : constraints?.wordType === 'madeup'
    ? `- Word Type: **MADE-UP WORDS ONLY**
  You MUST create invented/made-up words that are phonetically pleasing.
  DO NOT use real dictionary words. Create brandable coined names.
  Examples: zova, kiru, plyx, novu, brix, vela, aquol, wavyn`
    : '- Word Type: Mix of real words and creative made-up words';

  // Language instruction
  const languageInstruction = constraints?.language && constraints.language !== 'any'
    ? `- Language: Draw inspiration from ${constraints.language} language (use ${constraints.language} words, roots, sounds, or translations)`
    : '';

  // No compounds instruction - with obscure words guidance when using real words
  const noCompoundsInstruction = constraints?.noCompounds
    ? constraints?.wordType === 'real'
      ? `- Structure: **SINGLE WORDS ONLY** - NO compound words, NO word combinations. Each domain MUST be ONE word only.
  **IMPORTANT: Use OBSCURE, RARE, UNUSUAL dictionary words** - NOT common words like buzz, glow, snap, ping, wave, flow.
  Use words from: archaic English, scientific terms, botanical names, musical terms, architectural terms, nautical terms, obscure foreign words.
  Examples of GOOD obscure words: byre, froe, gawp, quaff, sprig, frond, croft, thane, wyrd, plinth, cairn, fjord, gloam, mirth, verdant
  Examples of BAD common words: buzz, glow, snap, wave, flow, spark, pulse, dash - these are ALL TAKEN`
      : `- Structure: **SINGLE WORDS ONLY** - NO compound words, NO word combinations. Each domain MUST be ONE word only (e.g., "luna", "peak", "zova" - NOT "moonwave", "peakflow", "starglow")`
    : '';

  // Themes that need project context (descriptive/direct themes)
  const PROJECT_DEPENDENT_THEMES = ['direct', 'descriptive', 'clear', 'keyword-rich', 'exact-match'];
  const needsProject = PROJECT_DEPENDENT_THEMES.includes(themeId);

  // Critical override for real words - must be at the top
  const realWordsOverride = constraints?.wordType === 'real'
    ? `⚠️ CRITICAL OVERRIDE: You MUST use ONLY real dictionary words. NO made-up words allowed. Every word must exist in a dictionary (English or foreign). Examples of VALID real words: moon, star, wave, glow, peak, tide, echo, beat, run, fly. Examples of INVALID made-up words: mooniq, cosmly, lunrix, aquafly, tempofy, leovox - these are FORBIDDEN.\n\n`
    : constraints?.wordType === 'madeup'
    ? `⚠️ CRITICAL OVERRIDE: You MUST use ONLY made-up/invented words. NO real dictionary words. Create brandable coined names like: zova, brix, plyx, kiru.\n\n`
    : '';

  // Critical override for single words - must be at the top
  const noCompoundsOverride = constraints?.noCompounds
    ? constraints?.wordType === 'real'
      ? `⚠️ CRITICAL: SINGLE OBSCURE WORDS ONLY. Each domain must be ONE RARE/UNUSUAL dictionary word. Use archaic, scientific, botanical, musical, or nautical terms. DO NOT use common words (buzz, glow, snap, wave, flow, pulse - ALL TAKEN). GOOD examples: thane.ai, frond.com, cairn.io, plinth.ai, gloam.com\n\n`
      : `⚠️ CRITICAL: SINGLE WORDS ONLY. Each domain must be ONE word, not compounds. VALID: luna.ai, peak.com, zova.io. INVALID: moonwave.ai, peakflow.com, starglow.io\n\n`
    : '';

  // Build user prompt - only include project for descriptive themes
  const userPrompt = needsProject
    ? `${realWordsOverride}${noCompoundsOverride}Project Description: "${project}"

Theme: ${theme.name}

${theme.prompt}

CONSTRAINTS:
- TLDs: ONLY use these TLDs: ${tldList}
- Length: ${charLength}
${wordTypeInstruction}
${languageInstruction ? languageInstruction + '\n' : ''}${noCompoundsInstruction ? noCompoundsInstruction + '\n' : ''}- Each domain MUST match ALL constraints

Generate exactly ${count} domain names for this project using the ${theme.name} theme.`
    : `${realWordsOverride}${noCompoundsOverride}Theme: ${theme.name}

${theme.prompt}

CONSTRAINTS:
- TLDs: ONLY use these TLDs: ${tldList}
- Length: ${charLength}
${wordTypeInstruction}
${languageInstruction ? languageInstruction + '\n' : ''}${noCompoundsInstruction ? noCompoundsInstruction + '\n' : ''}- Each domain MUST match ALL constraints

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

  // Filter compounds when noCompounds is enabled
  if (constraints?.noCompounds && isCompoundWord(name)) {
    return false;
  }

  return true;
}

/**
 * Common words used in compound domain names
 * Used to detect compounds like "leostar" (leo + star)
 */
const COMPOUND_WORDS = new Set([
  // 2-letter words
  'ai', 'go', 'io', 'up', 'my', 'we', 'me', 'be', 'do', 'no', 'so', 'to',
  // 3-letter words - common
  'ace', 'air', 'all', 'app', 'arc', 'art', 'bay', 'bee', 'bet', 'big', 'bit', 'box', 'bug', 'bus', 'buy', 'cap', 'car', 'cat', 'cup', 'day', 'dev', 'dew', 'dot', 'duo', 'eco', 'era', 'eye', 'fan', 'fin', 'fit', 'fix', 'fly', 'fog', 'fox', 'fun', 'gem', 'geo', 'get', 'gig', 'gym', 'hat', 'hex', 'hit', 'hop', 'hot', 'hub', 'hue', 'ice', 'ink', 'ion', 'ivy', 'jam', 'jar', 'jet', 'job', 'joy', 'key', 'kid', 'kit', 'lab', 'lap', 'led', 'let', 'lid', 'lip', 'lit', 'log', 'lot', 'lux', 'map', 'mat', 'max', 'med', 'met', 'mid', 'mix', 'mob', 'mod', 'net', 'new', 'nix', 'now', 'nut', 'oak', 'odd', 'oil', 'old', 'one', 'opt', 'orb', 'ore', 'our', 'out', 'owl', 'own', 'pad', 'pal', 'pan', 'pay', 'pea', 'pen', 'pet', 'pic', 'pie', 'pin', 'pit', 'pix', 'pod', 'pop', 'pot', 'pro', 'pub', 'pup', 'put', 'rad', 'ram', 'ray', 'red', 'ref', 'rev', 'rib', 'rim', 'rio', 'rip', 'rod', 'row', 'rub', 'run', 'rye', 'sea', 'set', 'six', 'ski', 'sky', 'sol', 'spa', 'spy', 'sub', 'sum', 'sun', 'tab', 'tag', 'tan', 'tap', 'tar', 'tax', 'tea', 'ten', 'the', 'tie', 'tin', 'tip', 'toe', 'ton', 'top', 'toy', 'try', 'tub', 'two', 'van', 'vet', 'via', 'vip', 'viz', 'war', 'wax', 'way', 'web', 'wet', 'wig', 'win', 'wit', 'wok', 'won', 'yak', 'yam', 'yap', 'yay', 'yes', 'yet', 'yew', 'yin', 'you', 'zap', 'zen', 'zip', 'zoo',
  // 4-letter words - common
  'able', 'aero', 'apex', 'aqua', 'area', 'atom', 'auto', 'axis', 'band', 'bank', 'barn', 'base', 'beam', 'bean', 'bear', 'beat', 'bell', 'belt', 'bend', 'beta', 'bike', 'bird', 'bite', 'blip', 'blob', 'blog', 'blue', 'blur', 'boat', 'body', 'bold', 'bolt', 'bond', 'bone', 'book', 'boom', 'boot', 'boss', 'bowl', 'brew', 'buck', 'bulb', 'bulk', 'bump', 'burn', 'buzz', 'byte', 'cafe', 'cage', 'cake', 'calm', 'camp', 'cape', 'card', 'care', 'cart', 'case', 'cash', 'cast', 'cave', 'chip', 'city', 'clan', 'clay', 'clip', 'club', 'clue', 'coal', 'coat', 'code', 'coil', 'coin', 'cold', 'cone', 'cook', 'cool', 'cope', 'copy', 'cord', 'core', 'cork', 'corn', 'cost', 'cozy', 'crab', 'crew', 'crop', 'cube', 'cult', 'cure', 'curl', 'cute', 'cyan', 'dado', 'dark', 'dart', 'dash', 'data', 'dawn', 'deal', 'dear', 'deck', 'deed', 'deep', 'deer', 'demo', 'dent', 'desk', 'dial', 'dice', 'diet', 'dine', 'disc', 'dish', 'disk', 'dive', 'dock', 'dome', 'door', 'dose', 'dove', 'down', 'doze', 'drag', 'draw', 'drip', 'drop', 'drum', 'duck', 'dude', 'dump', 'dune', 'dusk', 'dust', 'duty', 'each', 'ease', 'east', 'easy', 'echo', 'edge', 'edit', 'emit', 'epic', 'even', 'ever', 'expo', 'face', 'fact', 'fade', 'fair', 'fake', 'fall', 'fame', 'farm', 'fast', 'fate', 'fawn', 'faze', 'feat', 'feed', 'feel', 'fest', 'file', 'fill', 'film', 'find', 'fine', 'fire', 'firm', 'fish', 'fist', 'five', 'fizz', 'flag', 'flap', 'flat', 'flaw', 'flex', 'flip', 'flit', 'flow', 'flux', 'foam', 'focus', 'fold', 'folk', 'fond', 'font', 'food', 'foot', 'ford', 'fork', 'form', 'fort', 'four', 'free', 'frog', 'fuel', 'full', 'fund', 'funk', 'fuse', 'fuzz', 'gain', 'gala', 'game', 'gang', 'gate', 'gaze', 'gear', 'gene', 'gift', 'girl', 'give', 'glad', 'glee', 'glow', 'glue', 'goal', 'goat', 'gold', 'golf', 'good', 'grab', 'gram', 'gray', 'grin', 'grip', 'grit', 'grow', 'gulf', 'guru', 'gust', 'hack', 'hail', 'hair', 'half', 'hall', 'halo', 'hand', 'hang', 'hare', 'harm', 'harp', 'hash', 'hate', 'haul', 'have', 'hawk', 'haze', 'head', 'heal', 'heap', 'hear', 'heat', 'heel', 'held', 'help', 'hemp', 'herb', 'herd', 'hero', 'hide', 'high', 'hike', 'hill', 'hint', 'hive', 'hold', 'hole', 'home', 'hood', 'hook', 'hoop', 'hope', 'horn', 'host', 'hour', 'howl', 'hubs', 'hues', 'huge', 'hulk', 'hull', 'hunt', 'hype', 'icon', 'idea', 'idle', 'inch', 'info', 'into', 'iris', 'iron', 'isle', 'item', 'jack', 'jade', 'jazz', 'jerk', 'jest', 'jobs', 'join', 'joke', 'jolt', 'jump', 'june', 'junk', 'jury', 'just', 'kale', 'keen', 'keep', 'kelp', 'kick', 'kids', 'kind', 'king', 'kite', 'kiwi', 'knee', 'knit', 'knob', 'knot', 'know', 'labs', 'lace', 'lack', 'laid', 'lake', 'lamb', 'lamp', 'land', 'lane', 'lark', 'last', 'late', 'lava', 'lawn', 'lead', 'leaf', 'lean', 'leap', 'left', 'lend', 'lens', 'less', 'levy', 'life', 'lift', 'like', 'lily', 'limb', 'lime', 'line', 'link', 'lion', 'list', 'lite', 'live', 'load', 'loan', 'lobe', 'lock', 'loft', 'logo', 'lone', 'long', 'look', 'loom', 'loop', 'loot', 'lord', 'lore', 'lose', 'loss', 'lost', 'loud', 'love', 'luck', 'lump', 'luna', 'luxe', 'lynx', 'made', 'mage', 'mail', 'main', 'make', 'mall', 'malt', 'mane', 'many', 'maps', 'mark', 'mars', 'mart', 'mask', 'mass', 'mast', 'mate', 'math', 'maze', 'meal', 'mean', 'meat', 'meet', 'mega', 'melt', 'memo', 'menu', 'mesa', 'mesh', 'meta', 'mild', 'mile', 'milk', 'mill', 'mind', 'mine', 'mini', 'mint', 'mist', 'mode', 'mojo', 'mold', 'monk', 'mood', 'moon', 'more', 'moss', 'most', 'moth', 'move', 'much', 'muse', 'musk', 'must', 'myth', 'nail', 'name', 'nano', 'navy', 'near', 'neat', 'neck', 'need', 'neon', 'nest', 'nets', 'news', 'next', 'nice', 'nick', 'nine', 'node', 'nook', 'noon', 'norm', 'nose', 'note', 'nova', 'nuke', 'null', 'oaks', 'oars', 'oats', 'odds', 'oils', 'okay', 'omni', 'once', 'only', 'open', 'opus', 'oral', 'orbs', 'orca', 'ores', 'oven', 'over', 'owls', 'owns', 'pace', 'pack', 'pads', 'page', 'paid', 'pail', 'pain', 'pair', 'pale', 'palm', 'pals', 'pane', 'park', 'part', 'pass', 'past', 'path', 'paws', 'peak', 'pear', 'peas', 'peat', 'peck', 'peek', 'peel', 'peer', 'pens', 'perk', 'pest', 'pets', 'pick', 'pier', 'pike', 'pile', 'pill', 'pine', 'ping', 'pink', 'pins', 'pint', 'pipe', 'pits', 'plan', 'play', 'plea', 'plop', 'plot', 'plow', 'plug', 'plum', 'plus', 'pods', 'poem', 'poet', 'poke', 'pole', 'poll', 'polo', 'pond', 'pony', 'pool', 'poor', 'pops', 'pore', 'pork', 'port', 'pose', 'post', 'pour', 'prep', 'prey', 'prod', 'prop', 'pros', 'prow', 'puff', 'pull', 'pulp', 'pump', 'punk', 'pure', 'push', 'puts', 'quad', 'quay', 'quiz', 'race', 'rack', 'raft', 'rage', 'raid', 'rail', 'rain', 'rake', 'ramp', 'rams', 'rand', 'rang', 'rank', 'rare', 'rash', 'rate', 'rave', 'rays', 'read', 'real', 'reap', 'rear', 'reed', 'reef', 'reel', 'rely', 'rent', 'rest', 'rice', 'rich', 'ride', 'rift', 'rigs', 'rim', 'rims', 'ring', 'riot', 'ripe', 'rise', 'risk', 'road', 'roam', 'roar', 'robe', 'rock', 'rods', 'role', 'roll', 'roof', 'room', 'root', 'rope', 'rose', 'rows', 'ruby', 'ruin', 'rule', 'rune', 'runs', 'rush', 'rust', 'safe', 'sage', 'sail', 'sale', 'salt', 'same', 'sand', 'sang', 'sank', 'save', 'scan', 'seal', 'seam', 'seas', 'seat', 'seed', 'seek', 'seen', 'self', 'sell', 'semi', 'send', 'sens', 'sent', 'sera', 'sets', 'shed', 'ship', 'shop', 'shot', 'show', 'shut', 'sick', 'side', 'sift', 'sign', 'silk', 'sing', 'sink', 'site', 'size', 'skip', 'slab', 'slam', 'slap', 'sled', 'slew', 'slid', 'slim', 'slip', 'slit', 'slot', 'slow', 'slug', 'snap', 'snow', 'snug', 'soak', 'soap', 'soar', 'sock', 'soda', 'soft', 'soil', 'sold', 'sole', 'solo', 'some', 'song', 'soon', 'soot', 'sort', 'soul', 'soup', 'span', 'spar', 'spec', 'sped', 'spin', 'spit', 'spot', 'spry', 'spur', 'squad', 'star', 'stay', 'stem', 'step', 'stew', 'stir', 'stop', 'stub', 'stud', 'such', 'suit', 'sumo', 'sung', 'sunk', 'sure', 'surf', 'swan', 'swap', 'sway', 'swim', 'sync', 'tabs', 'taco', 'tags', 'tail', 'take', 'tale', 'talk', 'tall', 'tame', 'tank', 'tape', 'taps', 'task', 'team', 'tear', 'teas', 'tech', 'teem', 'temp', 'tend', 'tens', 'tent', 'term', 'test', 'text', 'than', 'that', 'them', 'then', 'they', 'thin', 'this', 'thud', 'thus', 'tick', 'tide', 'tidy', 'tied', 'tier', 'ties', 'tile', 'till', 'tilt', 'time', 'tint', 'tiny', 'tips', 'tire', 'toad', 'toes', 'tofu', 'toga', 'told', 'toll', 'tomb', 'tone', 'tons', 'took', 'tool', 'tops', 'torn', 'tort', 'toss', 'tots', 'tour', 'town', 'toys', 'trap', 'tray', 'tree', 'trek', 'trim', 'trio', 'trip', 'trod', 'trot', 'true', 'tube', 'tubs', 'tuck', 'tuft', 'tune', 'turf', 'turn', 'twig', 'twin', 'type', 'unit', 'upon', 'urge', 'used', 'user', 'uses', 'vans', 'vary', 'vase', 'vast', 'veer', 'vein', 'vent', 'verb', 'very', 'vest', 'vibe', 'vice', 'view', 'vine', 'visa', 'void', 'volt', 'vote', 'wade', 'wage', 'wait', 'wake', 'walk', 'wall', 'wand', 'want', 'ward', 'warm', 'warn', 'warp', 'wart', 'wash', 'wasp', 'wave', 'wavy', 'waxy', 'ways', 'weak', 'wear', 'webs', 'weed', 'week', 'well', 'went', 'were', 'west', 'what', 'when', 'whip', 'wide', 'wife', 'wifi', 'wild', 'will', 'wilt', 'wind', 'wine', 'wing', 'wins', 'wipe', 'wire', 'wise', 'wish', 'with', 'wits', 'woke', 'wolf', 'womb', 'wood', 'wool', 'word', 'wore', 'work', 'worm', 'worn', 'wrap', 'yard', 'yarn', 'yawn', 'year', 'yell', 'yoga', 'yoke', 'yolk', 'your', 'zaps', 'zeal', 'zero', 'zest', 'zinc', 'zone', 'zoom',
  // 5-letter words - commonly used in domain compounds
  'alpha', 'beach', 'black', 'blade', 'blast', 'blaze', 'blend', 'blink', 'block', 'bloom', 'board', 'boost', 'bound', 'brand', 'brave', 'break', 'brick', 'bride', 'brief', 'bring', 'broad', 'brook', 'brush', 'build', 'burst', 'cargo', 'chain', 'chalk', 'chase', 'cheap', 'check', 'chief', 'child', 'chill', 'chord', 'chunk', 'civic', 'claim', 'clamp', 'clash', 'class', 'clean', 'clear', 'click', 'climb', 'cling', 'clock', 'clone', 'close', 'cloth', 'cloud', 'coach', 'coast', 'comet', 'coral', 'count', 'cover', 'crack', 'craft', 'crane', 'crash', 'crawl', 'cream', 'creek', 'crest', 'crisp', 'cross', 'crowd', 'crown', 'crush', 'curve', 'cyber', 'cycle', 'daily', 'dairy', 'dance', 'datum', 'dealt', 'delta', 'depth', 'disco', 'draft', 'drain', 'drake', 'drape', 'dream', 'dress', 'drift', 'drill', 'drink', 'drive', 'droit', 'drown', 'earth', 'ember', 'enter', 'equal', 'event', 'extra', 'fable', 'facet', 'faith', 'fault', 'feast', 'field', 'finch', 'first', 'fixed', 'flame', 'flare', 'flash', 'fleet', 'flesh', 'flick', 'float', 'flock', 'flood', 'floor', 'flora', 'floss', 'flour', 'flown', 'fluid', 'fluke', 'flush', 'flyer', 'focal', 'force', 'forge', 'forth', 'forum', 'found', 'fox', 'frame', 'frank', 'fresh', 'front', 'frost', 'fruit', 'fuels', 'gamma', 'gauge', 'giant', 'given', 'glaze', 'gleam', 'glide', 'glint', 'globe', 'gloom', 'glory', 'gloss', 'glyph', 'grace', 'grade', 'grain', 'grand', 'grant', 'grape', 'graph', 'grasp', 'grass', 'grave', 'graze', 'great', 'green', 'greet', 'grind', 'grips', 'groom', 'gross', 'group', 'grove', 'growl', 'grown', 'guard', 'guess', 'guest', 'guide', 'guild', 'habit', 'happy', 'haven', 'hazel', 'heart', 'helix', 'hello', 'heron', 'honey', 'horse', 'hotel', 'hound', 'house', 'human', 'hydro', 'ideal', 'image', 'index', 'indie', 'input', 'intro', 'ivory', 'jewel', 'joint', 'joker', 'juice', 'jumbo', 'karma', 'kayak', 'kiosk', 'knock', 'knoll', 'label', 'labor', 'lance', 'large', 'laser', 'latch', 'later', 'laugh', 'layer', 'learn', 'lease', 'least', 'leave', 'ledge', 'legal', 'lemon', 'level', 'lever', 'light', 'limit', 'linen', 'liner', 'lions', 'local', 'lodge', 'logic', 'lotus', 'lower', 'lunar', 'lunch', 'macro', 'magic', 'major', 'maker', 'maple', 'march', 'marsh', 'match', 'manor', 'maxim', 'melon', 'merge', 'merit', 'metal', 'meter', 'metro', 'micro', 'might', 'miner', 'minor', 'mixer', 'model', 'modem', 'moist', 'money', 'motor', 'mound', 'mount', 'mouse', 'movie', 'music', 'mylar', 'nerve', 'never', 'night', 'nimble', 'noble', 'noise', 'north', 'notch', 'novel', 'ocean', 'oasis', 'olive', 'omega', 'onion', 'opera', 'optic', 'orbit', 'order', 'overt', 'oxide', 'ozone', 'panda', 'panel', 'paper', 'parch', 'parse', 'party', 'pasta', 'paste', 'patch', 'pause', 'peace', 'peach', 'pearl', 'pedal', 'penny', 'perch', 'petal', 'phase', 'phone', 'photo', 'piano', 'piece', 'pilot', 'pinch', 'pitch', 'pixel', 'pizza', 'place', 'plaid', 'plain', 'plane', 'plank', 'plant', 'plate', 'plaza', 'plumb', 'plume', 'plunk', 'point', 'polar', 'porch', 'power', 'press', 'price', 'pride', 'prime', 'print', 'prism', 'prize', 'probe', 'proof', 'prose', 'proud', 'proxy', 'prune', 'pulse', 'punch', 'purge', 'quest', 'queue', 'quick', 'quiet', 'quill', 'quilt', 'quote', 'radar', 'radii', 'radio', 'raise', 'rally', 'ranch', 'range', 'rapid', 'ratio', 'reach', 'react', 'ready', 'realm', 'rebar', 'rebel', 'recon', 'refer', 'reign', 'relay', 'remix', 'reply', 'reset', 'resin', 'rider', 'ridge', 'rifle', 'right', 'rigid', 'ripen', 'risen', 'river', 'rivet', 'roast', 'robot', 'rocky', 'roost', 'rotor', 'rough', 'round', 'route', 'royal', 'rugby', 'ruins', 'ruler', 'rural', 'rusty', 'sabre', 'safer', 'saint', 'salsa', 'salve', 'sands', 'sandy', 'sapid', 'satin', 'sauce', 'savor', 'scale', 'scald', 'scaly', 'scape', 'scare', 'scarf', 'scene', 'scent', 'scope', 'score', 'scout', 'scrap', 'seize', 'sense', 'serve', 'setup', 'seven', 'shade', 'shaft', 'shake', 'shall', 'shame', 'shape', 'share', 'shark', 'sharp', 'shave', 'shawl', 'shear', 'sheen', 'sheep', 'sheer', 'sheet', 'shelf', 'shell', 'shift', 'shine', 'shirt', 'shock', 'shore', 'short', 'shout', 'shown', 'shrub', 'sigma', 'sight', 'sigma', 'silky', 'since', 'siren', 'sixth', 'sixty', 'skate', 'skies', 'skill', 'skirt', 'skull', 'slash', 'slate', 'sleek', 'sleep', 'sleet', 'slice', 'slide', 'slime', 'sling', 'slope', 'slosh', 'sloth', 'small', 'smart', 'smash', 'smell', 'smile', 'smith', 'smoke', 'snack', 'snail', 'snake', 'snare', 'sneak', 'sniff', 'snore', 'snow', 'sober', 'solar', 'solid', 'solve', 'sonic', 'sonar', 'sound', 'south', 'space', 'spade', 'spare', 'spark', 'speak', 'spear', 'speed', 'spell', 'spend', 'spice', 'spicy', 'spike', 'spill', 'spine', 'spire', 'spite', 'splash', 'split', 'spoon', 'sport', 'spray', 'spree', 'squat', 'stack', 'staff', 'stage', 'stain', 'stair', 'stake', 'stalk', 'stamp', 'stand', 'stark', 'start', 'state', 'steam', 'steel', 'steep', 'steer', 'stick', 'stiff', 'still', 'sting', 'stink', 'stock', 'stomp', 'stone', 'stool', 'stoop', 'store', 'storm', 'story', 'stout', 'stove', 'strap', 'straw', 'stray', 'strip', 'strum', 'strut', 'stuck', 'study', 'stuff', 'stump', 'style', 'suave', 'sugar', 'suite', 'sunny', 'super', 'surge', 'swamp', 'swarm', 'swatch', 'swear', 'sweat', 'sweep', 'sweet', 'swell', 'swept', 'swift', 'swing', 'swipe', 'swirl', 'swiss', 'sword', 'sworn', 'syrup', 'table', 'tempo', 'tense', 'terra', 'theft', 'theme', 'thick', 'thing', 'think', 'third', 'thorn', 'those', 'three', 'throw', 'thumb', 'thump', 'tiger', 'tight', 'timer', 'titan', 'title', 'toast', 'today', 'token', 'tonic', 'tooth', 'topic', 'torch', 'total', 'touch', 'tough', 'tower', 'trace', 'track', 'tract', 'trade', 'trail', 'train', 'trait', 'trans', 'trash', 'tread', 'treat', 'trend', 'trial', 'tribe', 'trick', 'tried', 'trims', 'trite', 'troop', 'trout', 'truck', 'truly', 'trump', 'trunk', 'trust', 'truth', 'tumor', 'tuner', 'twist', 'ultra', 'uncle', 'under', 'union', 'unite', 'unity', 'until', 'upper', 'urban', 'usage', 'usual', 'valid', 'value', 'valve', 'vapor', 'vault', 'venue', 'verge', 'verse', 'video', 'vigor', 'villa', 'viral', 'virus', 'visit', 'vista', 'vital', 'vivid', 'vocal', 'vogue', 'voice', 'voila', 'vomit', 'voter', 'vouch', 'vowel', 'wager', 'wagon', 'waist', 'watch', 'water', 'weary', 'weave', 'wedge', 'weird', 'whale', 'wheat', 'wheel', 'where', 'which', 'while', 'whirl', 'white', 'whole', 'whose', 'width', 'wield', 'wilds', 'winch', 'winds', 'wiper', 'wired', 'wires', 'witch', 'woods', 'words', 'world', 'worry', 'worse', 'worst', 'worth', 'would', 'wound', 'woven', 'wrack', 'wraps', 'wrath', 'wreck', 'wring', 'wrist', 'write', 'wrong', 'wrote', 'yacht', 'yearn', 'yeast', 'yield', 'young', 'yours', 'youth', 'zebra', 'zonal', 'zones',
  // Mythology/Astrology words commonly used
  'leo', 'aries', 'mars', 'luna', 'sol', 'zeus', 'hera', 'eros', 'nike', 'iris', 'gaia', 'juno', 'vesta', 'ceres', 'pluto', 'orion', 'atlas', 'titan', 'aurora', 'venus', 'mercury', 'jupiter', 'saturn', 'neptune', 'uranus'
]);

/**
 * Detect if a word is a compound (two words combined)
 * Returns true if the word can be split into two recognizable words
 */
function isCompoundWord(word: string): boolean {
  // Don't check very short words (likely single words)
  if (word.length < 5) return false;

  // Try all possible split points
  for (let i = 2; i < word.length - 1; i++) {
    const part1 = word.slice(0, i);
    const part2 = word.slice(i);

    // Check if both parts are common words
    if (COMPOUND_WORDS.has(part1) && COMPOUND_WORDS.has(part2)) {
      console.log(`[Claude] Detected compound: ${word} = ${part1} + ${part2}`);
      return true;
    }
  }

  return false;
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
