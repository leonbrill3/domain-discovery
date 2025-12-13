/**
 * 🔄 Background Worker for DomainSeek
 *
 * Continuously:
 * 1. Scores unscored domains with AI
 * 2. Checks domain availability
 * 3. Cleans up taken domains
 *
 * Runs on Render as a Background Worker service.
 *
 * Usage:
 *   npx ts-node scripts/worker.ts
 */

import { PrismaClient } from '@prisma/client';
import Anthropic from '@anthropic-ai/sdk';

const prisma = new PrismaClient();
const anthropic = new Anthropic();

const SCORING_BATCH_SIZE = 15;
const SCORING_DELAY_MS = 1000;
const CHECK_INTERVAL_MS = 60000; // Check for new work every minute

interface DomainScore {
  baseScore: number;
  memorability: number;
  pronounceability: number;
  uniqueness: number;
  professionalism: number;
  seoValue: number;
  meaning: string;
  phonetic: string;
  syllables: number;
  logoStyles: string[];
}

/**
 * Get AI scores for a batch of domains
 */
async function scoreDomainsBatch(domains: string[]): Promise<Map<string, DomainScore>> {
  const prompt = `Score these domain names for brandability. For each domain, provide:

DOMAINS:
${domains.map((d, i) => `${i + 1}. ${d}`).join('\n')}

For EACH domain return JSON with:
- baseScore: Overall brandability 0-10
- memorability: How memorable 0-10
- pronounceability: How easy to say 0-10
- uniqueness: How distinctive 0-10
- professionalism: How trustworthy 0-10
- seoValue: SEO potential 0-10
- meaning: Brief meaning/etymology (1 sentence)
- phonetic: Pronunciation guide like "ZOH-vah"
- syllables: Number of syllables
- logoStyles: Array of 3 style words like ["Modern", "Bold", "Tech"]

OUTPUT FORMAT (JSON array only, no markdown):
[{"domain":"example.ai","baseScore":8.5,"memorability":9,...}]`;

  try {
    const response = await anthropic.messages.create({
      model: 'claude-3-5-haiku-20241022',
      max_tokens: 4000,
      temperature: 0.2,
      messages: [{ role: 'user', content: prompt }]
    });

    const text = response.content[0].type === 'text' ? response.content[0].text : '';
    const jsonMatch = text.match(/\[[\s\S]*\]/);
    if (!jsonMatch) return new Map();

    let jsonStr = jsonMatch[0];
    jsonStr = jsonStr.replace(/[\x00-\x1F\x7F]/g, c => c === '\n' || c === '\r' || c === '\t' ? ' ' : '');

    const scores = JSON.parse(jsonStr);
    const result = new Map<string, DomainScore>();

    for (const s of scores) {
      result.set(s.domain, {
        baseScore: s.baseScore || 7,
        memorability: s.memorability || 7,
        pronounceability: s.pronounceability || 7,
        uniqueness: s.uniqueness || 7,
        professionalism: s.professionalism || 7,
        seoValue: s.seoValue || 7,
        meaning: s.meaning || '',
        phonetic: s.phonetic || '',
        syllables: s.syllables || 2,
        logoStyles: s.logoStyles || ['Modern', 'Clean', 'Bold']
      });
    }

    return result;
  } catch (error) {
    console.error('[Worker] Scoring error:', error);
    return new Map();
  }
}

/**
 * Generate embedding for a word
 */
function generateEmbedding(word: string): number[] {
  const embedding: number[] = new Array(128).fill(0);
  const lowered = word.toLowerCase();

  // Character frequency
  for (let i = 0; i < lowered.length; i++) {
    const charCode = lowered.charCodeAt(i) - 97;
    if (charCode >= 0 && charCode < 26) {
      embedding[charCode] += 1 / lowered.length;
    }
  }

  // Bigrams
  for (let i = 0; i < lowered.length - 1; i++) {
    const bigram = lowered.substring(i, i + 2);
    const hash = (bigram.charCodeAt(0) * 31 + bigram.charCodeAt(1)) % 26;
    embedding[26 + hash] += 0.5 / lowered.length;
  }

  // Patterns
  const vowels = (lowered.match(/[aeiou]/g) || []).length;
  const consonants = (lowered.match(/[bcdfghjklmnpqrstvwxyz]/g) || []).length;
  embedding[52] = vowels / lowered.length;
  embedding[53] = consonants / lowered.length;
  embedding[54] = lowered.length / 15;

  // Syllable pattern
  const syllablePattern = lowered.replace(/[aeiou]+/g, 'V').replace(/[^V]/g, 'C');
  for (let i = 0; i < syllablePattern.length && i < 15; i++) {
    embedding[55 + i] = syllablePattern[i] === 'V' ? 1 : 0;
  }

  // Starting/ending
  embedding[71] = /^[aeiou]/.test(lowered) ? 1 : 0;
  embedding[72] = /[aeiou]$/.test(lowered) ? 1 : 0;

  // Prefixes/suffixes
  const prefixes = ['un', 'pre', 're', 'pro', 'ex', 'co', 'de', 'in', 'en', 'em'];
  const suffixes = ['ly', 'er', 'ed', 'ing', 'ion', 'ify', 'ous', 'ful', 'less', 'ness'];
  prefixes.forEach((p, i) => { embedding[81 + i] = lowered.startsWith(p) ? 1 : 0; });
  suffixes.forEach((s, i) => { embedding[91 + i] = lowered.endsWith(s) ? 1 : 0; });

  // Phonetics
  embedding[101] = (lowered.match(/[kptbdg]/g) || []).length / lowered.length;
  embedding[102] = (lowered.match(/[sflmnr]/g) || []).length / lowered.length;

  // Hash features
  let hash = 0;
  for (let i = 0; i < lowered.length; i++) {
    hash = ((hash << 5) - hash) + lowered.charCodeAt(i);
    hash = hash & hash;
  }
  for (let i = 111; i < 128; i++) {
    embedding[i] = Math.abs(Math.sin(hash * (i - 110))) * 0.5;
  }

  // Normalize
  const magnitude = Math.sqrt(embedding.reduce((sum, v) => sum + v * v, 0));
  if (magnitude > 0) {
    for (let i = 0; i < embedding.length; i++) {
      embedding[i] /= magnitude;
    }
  }

  return embedding;
}

/**
 * Score unscored domains
 */
async function scoreUnscoredDomains(): Promise<number> {
  const unscored = await prisma.availableDomain.findMany({
    where: { scoredAt: null },
    take: SCORING_BATCH_SIZE,
    orderBy: { checkedAt: 'desc' }
  });

  if (unscored.length === 0) {
    return 0;
  }

  console.log(`[Worker] Scoring ${unscored.length} domains...`);

  const domainNames = unscored.map(d => d.domain);
  const scores = await scoreDomainsBatch(domainNames);

  let processed = 0;
  for (const domain of unscored) {
    try {
      const score = scores.get(domain.domain);
      const embedding = generateEmbedding(domain.word);

      await prisma.availableDomain.update({
        where: { id: domain.id },
        data: {
          baseScore: score?.baseScore || 7.0,
          memorability: score?.memorability || 7.0,
          pronounceability: score?.pronounceability || 7.0,
          uniqueness: score?.uniqueness || 7.0,
          professionalism: score?.professionalism || 7.0,
          seoValue: score?.seoValue || 7.0,
          meaning: score?.meaning || '',
          phonetic: score?.phonetic || domain.word.toUpperCase(),
          syllables: score?.syllables || Math.ceil(domain.word.length / 3),
          logoStyles: score?.logoStyles || ['Modern', 'Clean', 'Bold'],
          embedding,
          scoredAt: new Date()
        }
      });
      processed++;
      console.log(`  ✅ ${domain.domain}: ${score?.baseScore?.toFixed(1) || '7.0'}`);
    } catch (error) {
      console.error(`  ❌ ${domain.domain}:`, error);
    }
  }

  return processed;
}

/**
 * Main worker loop
 */
async function main() {
  console.log('🚀 DomainSeek Background Worker Started');
  console.log(`   Scoring batch size: ${SCORING_BATCH_SIZE}`);
  console.log(`   Check interval: ${CHECK_INTERVAL_MS / 1000}s`);
  console.log('');

  // Continuous loop
  while (true) {
    try {
      // Get stats
      const [total, scored] = await Promise.all([
        prisma.availableDomain.count(),
        prisma.availableDomain.count({ where: { scoredAt: { not: null } } })
      ]);

      console.log(`\n📊 Pool: ${total} domains, ${scored} scored (${Math.round((scored / total) * 100)}%)`);

      // Score unscored domains
      const processed = await scoreUnscoredDomains();

      if (processed > 0) {
        console.log(`[Worker] Scored ${processed} domains`);
        // Short delay between batches when there's work
        await new Promise(resolve => setTimeout(resolve, SCORING_DELAY_MS));
      } else {
        // Longer wait when no work
        console.log('[Worker] No unscored domains. Waiting...');
        await new Promise(resolve => setTimeout(resolve, CHECK_INTERVAL_MS));
      }
    } catch (error) {
      console.error('[Worker] Error:', error);
      await new Promise(resolve => setTimeout(resolve, CHECK_INTERVAL_MS));
    }
  }
}

// Handle graceful shutdown
process.on('SIGTERM', async () => {
  console.log('[Worker] Received SIGTERM, shutting down...');
  await prisma.$disconnect();
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('[Worker] Received SIGINT, shutting down...');
  await prisma.$disconnect();
  process.exit(0);
});

main().catch(console.error);
