/**
 * 🎯 Domain Scoring & Embedding Script
 *
 * Pre-computes AI scores and embeddings for all domains in the database.
 * This allows instant search results without waiting for Claude.
 *
 * Usage:
 *   npx ts-node scripts/score-domains.ts
 *   npx ts-node scripts/score-domains.ts --limit 100
 *   npx ts-node scripts/score-domains.ts --batch 20
 */

import { PrismaClient } from '@prisma/client';
import Anthropic from '@anthropic-ai/sdk';

const prisma = new PrismaClient();
const anthropic = new Anthropic();

// Configuration
const BATCH_SIZE = parseInt(process.argv.find(a => a.startsWith('--batch'))?.split('=')[1] || '10');
const LIMIT = parseInt(process.argv.find(a => a.startsWith('--limit'))?.split('=')[1] || '0');
const DELAY_MS = 500; // Rate limiting between batches

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
 * Get AI scores for a batch of domains using Claude
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

    // Extract JSON
    const jsonMatch = text.match(/\[[\s\S]*\]/);
    if (!jsonMatch) {
      console.error('Failed to parse AI response');
      return new Map();
    }

    // Clean and parse JSON
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
    console.error('Error scoring batch:', error);
    return new Map();
  }
}

/**
 * Generate embedding for a domain name
 * Using a simple approach: hash the word into a pseudo-embedding
 * For production, use OpenAI text-embedding-3-small ($0.02/1M tokens)
 */
function generateSimpleEmbedding(word: string): number[] {
  // Create a 128-dimension embedding based on character patterns
  // This is a cheap alternative to API embeddings
  const embedding: number[] = new Array(128).fill(0);

  const lowered = word.toLowerCase();

  // Character frequency features (0-25)
  for (let i = 0; i < lowered.length; i++) {
    const charCode = lowered.charCodeAt(i) - 97;
    if (charCode >= 0 && charCode < 26) {
      embedding[charCode] += 1 / lowered.length;
    }
  }

  // Bigram features (26-51)
  for (let i = 0; i < lowered.length - 1; i++) {
    const bigram = lowered.substring(i, i + 2);
    const hash = (bigram.charCodeAt(0) * 31 + bigram.charCodeAt(1)) % 26;
    embedding[26 + hash] += 0.5 / lowered.length;
  }

  // Pattern features (52-77)
  const vowels = (lowered.match(/[aeiou]/g) || []).length;
  const consonants = (lowered.match(/[bcdfghjklmnpqrstvwxyz]/g) || []).length;
  embedding[52] = vowels / lowered.length;
  embedding[53] = consonants / lowered.length;
  embedding[54] = lowered.length / 15; // normalized length

  // Syllable pattern (55-70)
  const syllablePattern = lowered.replace(/[aeiou]+/g, 'V').replace(/[^V]/g, 'C');
  for (let i = 0; i < syllablePattern.length && i < 15; i++) {
    embedding[55 + i] = syllablePattern[i] === 'V' ? 1 : 0;
  }

  // Starting/ending patterns (71-80)
  const startsVowel = /^[aeiou]/.test(lowered) ? 1 : 0;
  const endsVowel = /[aeiou]$/.test(lowered) ? 1 : 0;
  embedding[71] = startsVowel;
  embedding[72] = endsVowel;

  // Common prefixes/suffixes features (81-100)
  const prefixes = ['un', 'pre', 're', 'pro', 'ex', 'co', 'de', 'in', 'en', 'em'];
  const suffixes = ['ly', 'er', 'ed', 'ing', 'ion', 'ify', 'ous', 'ful', 'less', 'ness'];

  prefixes.forEach((p, i) => {
    embedding[81 + i] = lowered.startsWith(p) ? 1 : 0;
  });
  suffixes.forEach((s, i) => {
    embedding[91 + i] = lowered.endsWith(s) ? 1 : 0;
  });

  // Phonetic hardness (101-110)
  const hardConsonants = (lowered.match(/[kptbdg]/g) || []).length;
  const softConsonants = (lowered.match(/[sflmnr]/g) || []).length;
  embedding[101] = hardConsonants / lowered.length;
  embedding[102] = softConsonants / lowered.length;

  // Fill remaining with hash-based features (111-127)
  let hash = 0;
  for (let i = 0; i < lowered.length; i++) {
    hash = ((hash << 5) - hash) + lowered.charCodeAt(i);
    hash = hash & hash;
  }
  for (let i = 111; i < 128; i++) {
    embedding[i] = Math.abs(Math.sin(hash * (i - 110))) * 0.5;
  }

  // Normalize to unit length
  const magnitude = Math.sqrt(embedding.reduce((sum, v) => sum + v * v, 0));
  if (magnitude > 0) {
    for (let i = 0; i < embedding.length; i++) {
      embedding[i] /= magnitude;
    }
  }

  return embedding;
}

/**
 * Calculate cosine similarity between two embeddings
 */
export function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length) return 0;

  let dotProduct = 0;
  let magA = 0;
  let magB = 0;

  for (let i = 0; i < a.length; i++) {
    dotProduct += a[i] * b[i];
    magA += a[i] * a[i];
    magB += b[i] * b[i];
  }

  const magnitude = Math.sqrt(magA) * Math.sqrt(magB);
  return magnitude > 0 ? dotProduct / magnitude : 0;
}

async function main() {
  console.log('🎯 Domain Scoring & Embedding Script');
  console.log(`   Batch size: ${BATCH_SIZE}`);
  console.log(`   Limit: ${LIMIT || 'all'}`);
  console.log('');

  // Get unscored domains
  const whereClause = { scoredAt: null };
  const domains = await prisma.availableDomain.findMany({
    where: whereClause,
    take: LIMIT || undefined,
    orderBy: { checkedAt: 'desc' }
  });

  console.log(`📊 Found ${domains.length} unscored domains`);

  if (domains.length === 0) {
    console.log('✅ All domains are already scored!');
    return;
  }

  let processed = 0;
  let errors = 0;

  // Process in batches
  for (let i = 0; i < domains.length; i += BATCH_SIZE) {
    const batch = domains.slice(i, i + BATCH_SIZE);
    const domainNames = batch.map(d => d.domain);

    console.log(`\n🔄 Processing batch ${Math.floor(i / BATCH_SIZE) + 1}/${Math.ceil(domains.length / BATCH_SIZE)}`);
    console.log(`   Domains: ${domainNames.join(', ')}`);

    // Get AI scores for batch
    const scores = await scoreDomainsBatch(domainNames);

    // Update each domain
    for (const domain of batch) {
      try {
        const score = scores.get(domain.domain);
        const embedding = generateSimpleEmbedding(domain.word);

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
        console.log(`   ✅ ${domain.domain}: ${score?.baseScore?.toFixed(1) || '7.0'}`);
      } catch (error) {
        errors++;
        console.error(`   ❌ ${domain.domain}: ${error}`);
      }
    }

    // Rate limiting
    if (i + BATCH_SIZE < domains.length) {
      await new Promise(resolve => setTimeout(resolve, DELAY_MS));
    }
  }

  console.log('\n📊 Summary:');
  console.log(`   Processed: ${processed}`);
  console.log(`   Errors: ${errors}`);
  console.log(`   Success rate: ${((processed / (processed + errors)) * 100).toFixed(1)}%`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
