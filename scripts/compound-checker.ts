/**
 * Compound Domain Checker Worker
 *
 * Generates compound domains by combining base words with popular affixes.
 * Base words come from scored pool (best words first).
 *
 * Example: yoga + flow = yogaflow.ai, yoga + hub = yogahub.ai
 *
 * Affixes: flow, hub, lab, now, go, app, pro, plus, ly, ify, io, fy, er, ai
 * 9,903 words × 14 affixes = ~140k compound domains to check
 *
 * Rate: 30 checks/minute to avoid RDAP rate limits
 * ETA: ~77 hours for full run (140k / 30 per min / 60)
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const CHECKS_PER_MINUTE = 30;
const DELAY_MS = Math.ceil(60000 / CHECKS_PER_MINUTE); // ~2000ms between checks
const BATCH_SIZE = 10;
const TLD = 'ai';

// Popular affixes for compound generation
const SUFFIXES = ['flow', 'hub', 'lab', 'now', 'go', 'app', 'pro', 'plus', 'ly', 'ify', 'fy', 'er'];
const PREFIXES = ['go', 'my', 'get', 'try', 'one', 'the', 'hey', 'use'];

// RDAP endpoints by TLD
const RDAP_ENDPOINTS: Record<string, string> = {
  'ai': 'https://rdap.identitydigital.services/rdap/domain/',
  'io': 'https://rdap.identitydigital.services/rdap/domain/',
  'com': 'https://rdap.verisign.com/com/v1/domain/',
  'net': 'https://rdap.verisign.com/net/v1/domain/',
  'org': 'https://rdap.publicinterestregistry.org/rdap/domain/',
};

interface CheckResult {
  domain: string;
  available: boolean;
  error?: string;
}

interface CompoundProgress {
  lastBaseWord: string | null;
  lastAffix: string | null;
  totalChecked: number;
  availableCount: number;
}

/**
 * Check domain availability via RDAP
 */
async function checkDomainRDAP(domain: string): Promise<CheckResult> {
  const tld = domain.split('.').pop() || 'ai';
  const endpoint = RDAP_ENDPOINTS[tld] || RDAP_ENDPOINTS['ai'];

  try {
    const response = await fetch(`${endpoint}${domain}`, {
      method: 'GET',
      headers: { 'Accept': 'application/rdap+json' }
    });

    if (response.status === 404) {
      return { domain, available: true };
    } else if (response.status === 200) {
      return { domain, available: false };
    } else {
      return { domain, available: false, error: `HTTP ${response.status}` };
    }
  } catch (error) {
    return { domain, available: false, error: String(error) };
  }
}

/**
 * Get phonetic pattern for a word
 */
function getPattern(word: string): string {
  const vowels = 'aeiou';
  return word
    .toLowerCase()
    .split('')
    .map(c => vowels.includes(c) ? 'V' : 'C')
    .join('');
}

/**
 * Get or create compound progress tracker
 */
async function getProgress(): Promise<CompoundProgress> {
  const progress = await prisma.checkProgress.findUnique({
    where: { tld: `${TLD}_compounds` }
  });

  if (!progress) {
    await prisma.checkProgress.create({
      data: {
        tld: `${TLD}_compounds`,
        totalChecked: 0,
        availableCount: 0,
        takenCount: 0
      }
    });
    return { lastBaseWord: null, lastAffix: null, totalChecked: 0, availableCount: 0 };
  }

  // Parse lastWord format: "baseword:affix"
  const [lastBaseWord, lastAffix] = (progress.lastWord || ':').split(':');

  return {
    lastBaseWord: lastBaseWord || null,
    lastAffix: lastAffix || null,
    totalChecked: progress.totalChecked,
    availableCount: progress.availableCount
  };
}

/**
 * Update compound progress
 */
async function updateProgress(baseWord: string, affix: string, checked: number, available: number, taken: number): Promise<void> {
  await prisma.checkProgress.update({
    where: { tld: `${TLD}_compounds` },
    data: {
      lastWord: `${baseWord}:${affix}`,
      totalChecked: { increment: checked },
      availableCount: { increment: available },
      takenCount: { increment: taken },
      updatedAt: new Date()
    }
  });
}

/**
 * Add available compound domain to database
 */
async function addToPool(word: string, tld: string, isCompound: boolean = true): Promise<boolean> {
  try {
    await prisma.availableDomain.create({
      data: {
        domain: `${word}.${tld}`,
        word,
        tld,
        length: word.length,
        pattern: getPattern(word),
        checkedAt: new Date()
      }
    });
    return true;
  } catch (error) {
    // Domain already exists
    return false;
  }
}

/**
 * Generate compound words from base word
 */
function generateCompounds(baseWord: string): string[] {
  const compounds: string[] = [];

  // Add suffixes: yoga + flow = yogaflow
  for (const suffix of SUFFIXES) {
    // Skip if would create double letters (yogaapp) or too long
    const compound = baseWord + suffix;
    if (compound.length <= 15 && !hasTripleLetter(compound)) {
      compounds.push(compound);
    }
  }

  // Add prefixes: go + yoga = goyoga (less common, but works for some)
  for (const prefix of PREFIXES) {
    const compound = prefix + baseWord;
    if (compound.length <= 15 && !hasTripleLetter(compound)) {
      compounds.push(compound);
    }
  }

  return compounds;
}

/**
 * Check for triple letters (ugly: goood, apppp)
 */
function hasTripleLetter(word: string): boolean {
  for (let i = 0; i < word.length - 2; i++) {
    if (word[i] === word[i + 1] && word[i] === word[i + 2]) {
      return true;
    }
  }
  return false;
}

/**
 * Get base words from scored pool
 */
async function getBaseWords(): Promise<string[]> {
  // Get scored words from pool, sorted by score (best first)
  // Focus on short words (3-8 chars) that make good compound bases
  const domains = await prisma.availableDomain.findMany({
    where: {
      scoredAt: { not: null },
      length: { gte: 3, lte: 8 }
    },
    orderBy: { baseScore: 'desc' },
    select: { word: true }
  });

  return domains.map(d => d.word);
}

/**
 * Main compound checker loop
 */
async function main() {
  console.log('🔗 Compound Domain Checker Worker Started');
  console.log(`   TLD: .${TLD}`);
  console.log(`   Suffixes: ${SUFFIXES.join(', ')}`);
  console.log(`   Prefixes: ${PREFIXES.join(', ')}`);
  console.log(`   Rate: ${CHECKS_PER_MINUTE} checks/minute`);
  console.log('');

  // Get base words from scored pool
  const baseWords = await getBaseWords();
  console.log(`📚 Found ${baseWords.length} base words in scored pool`);

  if (baseWords.length === 0) {
    console.log('⚠️  No scored words found. Waiting for scoring worker...');
    while (true) {
      await new Promise(resolve => setTimeout(resolve, 300000)); // 5 min
      const newBase = await getBaseWords();
      if (newBase.length > 0) {
        console.log(`📚 Found ${newBase.length} base words, starting...`);
        break;
      }
    }
  }

  // Get progress
  const progress = await getProgress();
  console.log(`📊 Progress: ${progress.totalChecked} checked, ${progress.availableCount} available compounds`);

  // Calculate total compounds to check
  const allAffixes = [...SUFFIXES, ...PREFIXES];
  const totalCompounds = baseWords.length * allAffixes.length;
  console.log(`🎯 Total compounds to generate: ~${totalCompounds.toLocaleString()}`);

  // Find starting point
  let startWordIndex = 0;
  let startAffixIndex = 0;

  if (progress.lastBaseWord && progress.lastAffix) {
    const wordIdx = baseWords.indexOf(progress.lastBaseWord);
    const affixIdx = allAffixes.indexOf(progress.lastAffix);

    if (wordIdx >= 0) {
      startWordIndex = wordIdx;
      if (affixIdx >= 0 && affixIdx < allAffixes.length - 1) {
        startAffixIndex = affixIdx + 1;
      } else {
        startWordIndex++;
        startAffixIndex = 0;
      }
      console.log(`▶️  Resuming from: ${progress.lastBaseWord} + ${progress.lastAffix}`);
    }
  }

  // Process compounds
  let checked = 0;
  let available = 0;
  let taken = 0;
  let batchCount = 0;

  for (let wi = startWordIndex; wi < baseWords.length; wi++) {
    const baseWord = baseWords[wi];
    const compounds = generateCompounds(baseWord);

    for (let ci = (wi === startWordIndex ? startAffixIndex : 0); ci < allAffixes.length; ci++) {
      const affix = allAffixes[ci];

      // Determine compound based on affix type
      let compound: string;
      if (PREFIXES.includes(affix)) {
        compound = affix + baseWord;
      } else {
        compound = baseWord + affix;
      }

      // Skip invalid compounds
      if (compound.length > 15 || hasTripleLetter(compound)) {
        continue;
      }

      const domain = `${compound}.${TLD}`;

      // Check if already in database
      const existing = await prisma.availableDomain.findUnique({
        where: { domain }
      });

      if (existing) {
        console.log(`  ⏭️  ${domain} (already in pool)`);
        continue;
      }

      // Check availability
      const result = await checkDomainRDAP(domain);
      checked++;
      batchCount++;

      if (result.available) {
        const added = await addToPool(compound, TLD, true);
        if (added) {
          available++;
          console.log(`  ✅ ${domain} (AVAILABLE - added to pool)`);
        }
      } else {
        taken++;
        console.log(`  ❌ ${domain} (taken)`);
      }

      // Rate limiting
      await new Promise(resolve => setTimeout(resolve, DELAY_MS));

      // Update progress every BATCH_SIZE checks
      if (batchCount >= BATCH_SIZE) {
        await updateProgress(baseWord, affix, batchCount, available, taken);

        const totalDone = progress.totalChecked + checked;
        const pct = (totalDone / totalCompounds * 100).toFixed(2);
        console.log(`\n📊 Progress: ${totalDone.toLocaleString()}/${totalCompounds.toLocaleString()} (${pct}%) | Available: ${progress.availableCount + available} | Session: +${available}\n`);

        batchCount = 0;
        available = 0;
        taken = 0;
      }
    }
  }

  console.log('\n✅ Finished checking all compounds!');

  // Keep running to handle new base words
  while (true) {
    console.log('[Compound] All compounds checked. Checking for new base words in 1 hour...');
    await new Promise(resolve => setTimeout(resolve, 3600000));

    const newBase = await getBaseWords();
    if (newBase.length > baseWords.length) {
      console.log(`[Compound] Found ${newBase.length - baseWords.length} new base words, restarting...`);
      // Restart main to process new words
      return main();
    }
  }
}

// Handle shutdown
process.on('SIGTERM', async () => {
  console.log('[Compound] Shutting down...');
  await prisma.$disconnect();
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('[Compound] Interrupted, shutting down...');
  await prisma.$disconnect();
  process.exit(0);
});

main().catch(console.error);
