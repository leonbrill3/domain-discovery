/**
 * 🔍 Domain Availability Checker Worker
 *
 * Continuously checks domain availability and adds available ones to the database.
 * Runs on Render as a Background Worker.
 *
 * Sources:
 * 1. English word list (94k words)
 * 2. Phonetic patterns (1M+ patterns)
 *
 * Rate: 30 checks/minute to avoid RDAP rate limits
 */

import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';

const prisma = new PrismaClient();

const CHECKS_PER_MINUTE = 30;
const DELAY_MS = Math.ceil(60000 / CHECKS_PER_MINUTE); // ~2000ms between checks
const BATCH_SIZE = 10;
// Support multiple TLDs: CHECK_TLDS=ai,com (comma-separated)
const TLDS = (process.env.CHECK_TLDS || process.env.CHECK_TLD || 'ai').split(',').map(t => t.trim());

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
 * Get or create progress tracker for a specific TLD
 */
async function getProgress(tld: string): Promise<{ lastWord: string | null; totalChecked: number; availableCount: number }> {
  const progress = await prisma.checkProgress.findUnique({
    where: { tld }
  });

  if (!progress) {
    await prisma.checkProgress.create({
      data: { tld, totalChecked: 0, availableCount: 0, takenCount: 0 }
    });
    return { lastWord: null, totalChecked: 0, availableCount: 0 };
  }

  return {
    lastWord: progress.lastWord,
    totalChecked: progress.totalChecked,
    availableCount: progress.availableCount
  };
}

/**
 * Update progress for a specific TLD
 */
async function updateProgress(tld: string, lastWord: string, checked: number, available: number, taken: number): Promise<void> {
  await prisma.checkProgress.update({
    where: { tld },
    data: {
      lastWord,
      totalChecked: { increment: checked },
      availableCount: { increment: available },
      takenCount: { increment: taken },
      updatedAt: new Date()
    }
  });
}

/**
 * Add available domain to database
 */
async function addToPool(word: string, tld: string): Promise<boolean> {
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
 * Load word list
 */
function loadWordList(): string[] {
  // Try multiple possible locations
  const possiblePaths = [
    path.join(process.cwd(), 'data', 'english_words.txt'),
    path.join(process.cwd(), 'scripts', 'english_words.txt'),
    '/opt/render/project/src/data/english_words.txt',
    '/opt/render/project/src/scripts/english_words.txt'
  ];

  for (const p of possiblePaths) {
    if (fs.existsSync(p)) {
      console.log(`[Checker] Loading words from: ${p}`);
      const content = fs.readFileSync(p, 'utf-8');
      return content.split('\n').filter(w => w.length >= 3 && w.length <= 15);
    }
  }

  console.log('[Checker] No word list found, generating phonetic patterns...');
  return generatePhoneticPatterns(5000);
}

/**
 * Generate phonetic patterns (CVCV, CVCVC, etc.)
 */
function generatePhoneticPatterns(limit: number): string[] {
  const consonants = 'bcdfghjklmnprstvwz'.split('');
  const vowels = 'aeiou'.split('');
  const patterns: string[] = [];

  // CVCV (4 letters)
  for (const c1 of consonants) {
    for (const v1 of vowels) {
      for (const c2 of consonants) {
        for (const v2 of vowels) {
          patterns.push(c1 + v1 + c2 + v2);
          if (patterns.length >= limit) return patterns;
        }
      }
    }
  }

  // CVCVC (5 letters)
  for (const c1 of consonants) {
    for (const v1 of vowels) {
      for (const c2 of consonants) {
        for (const v2 of vowels) {
          for (const c3 of consonants) {
            patterns.push(c1 + v1 + c2 + v2 + c3);
            if (patterns.length >= limit) return patterns;
          }
        }
      }
    }
  }

  return patterns;
}

/**
 * Check words for a specific TLD
 */
async function checkTLD(tld: string, allWords: string[]): Promise<void> {
  console.log(`\n🔍 Checking .${tld} domains...`);

  // Get progress for this TLD
  const progress = await getProgress(tld);
  console.log(`📊 .${tld} Progress: ${progress.totalChecked} checked, ${progress.availableCount} available`);

  // Find starting point
  let startIndex = 0;
  if (progress.lastWord) {
    const idx = allWords.indexOf(progress.lastWord);
    if (idx >= 0) {
      startIndex = idx + 1;
      console.log(`▶️  Resuming .${tld} from: ${progress.lastWord} (index ${startIndex})`);
    }
  }

  if (startIndex >= allWords.length) {
    console.log(`✅ All .${tld} words have been checked!`);
    return;
  }

  // Process words
  let checked = 0;
  let available = 0;
  let taken = 0;

  for (let i = startIndex; i < allWords.length; i += BATCH_SIZE) {
    const batch = allWords.slice(i, i + BATCH_SIZE);

    for (const word of batch) {
      const domain = `${word}.${tld}`;

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

      if (result.available) {
        const added = await addToPool(word, tld);
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
    }

    // Update progress
    const lastWord = batch[batch.length - 1];
    await updateProgress(tld, lastWord, batch.length, available, taken);

    // Log progress
    const pct = ((i + batch.length) / allWords.length * 100).toFixed(1);
    console.log(`\n📊 .${tld} Progress: ${i + batch.length}/${allWords.length} (${pct}%) | Available: ${available} | Taken: ${taken}\n`);

    // Reset counters for next batch
    available = 0;
    taken = 0;
  }

  console.log(`\n✅ Finished checking all .${tld} words!`);
}

/**
 * Main checker loop - processes all TLDs
 */
async function main() {
  console.log('🔍 Domain Availability Checker Worker Started');
  console.log(`   TLDs: ${TLDS.map(t => '.' + t).join(', ')}`);
  console.log(`   Rate: ${CHECKS_PER_MINUTE} checks/minute`);
  console.log(`   Batch size: ${BATCH_SIZE}`);
  console.log('');

  // Load word list
  const allWords = loadWordList();
  console.log(`📚 Loaded ${allWords.length} words to check`);

  // Process each TLD
  while (true) {
    for (const tld of TLDS) {
      await checkTLD(tld, allWords);
    }

    console.log('\n[Checker] All TLDs checked. Waiting 1 hour before rechecking...');
    await new Promise(resolve => setTimeout(resolve, 3600000));
  }
}

// Handle shutdown
process.on('SIGTERM', async () => {
  console.log('[Checker] Shutting down...');
  await prisma.$disconnect();
  process.exit(0);
});

main().catch(console.error);
