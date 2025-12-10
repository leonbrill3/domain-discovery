/**
 * 📱 SOCIAL MEDIA HANDLE CHECKER - DomainSeek.ai
 *
 * Checks if username is available on major platforms.
 * Helps users maintain consistent branding across web + social.
 */

export interface SocialHandleStatus {
  platform: string;
  handle: string;
  available: boolean;
  url?: string;
  checked: boolean;
}

/**
 * Check Twitter/X handle availability
 */
async function checkTwitterHandle(handle: string): Promise<SocialHandleStatus> {
  try {
    // Check if Twitter profile exists
    const response = await fetch(`https://twitter.com/${handle}`, {
      method: 'HEAD',
      redirect: 'manual',
    });

    // 404 = available, 200 = taken
    const available = response.status === 404;

    return {
      platform: 'Twitter/X',
      handle: `@${handle}`,
      available,
      url: `https://twitter.com/${handle}`,
      checked: true,
    };
  } catch (error) {
    return {
      platform: 'Twitter/X',
      handle: `@${handle}`,
      available: false,
      checked: false,
    };
  }
}

/**
 * Check Instagram handle availability
 */
async function checkInstagramHandle(handle: string): Promise<SocialHandleStatus> {
  try {
    const response = await fetch(`https://www.instagram.com/${handle}/`, {
      method: 'HEAD',
      redirect: 'manual',
    });

    const available = response.status === 404;

    return {
      platform: 'Instagram',
      handle: `@${handle}`,
      available,
      url: `https://instagram.com/${handle}`,
      checked: true,
    };
  } catch (error) {
    return {
      platform: 'Instagram',
      handle: `@${handle}`,
      available: false,
      checked: false,
    };
  }
}

/**
 * Check TikTok handle availability
 */
async function checkTikTokHandle(handle: string): Promise<SocialHandleStatus> {
  try {
    const response = await fetch(`https://www.tiktok.com/@${handle}`, {
      method: 'HEAD',
      redirect: 'manual',
    });

    const available = response.status === 404;

    return {
      platform: 'TikTok',
      handle: `@${handle}`,
      available,
      url: `https://tiktok.com/@${handle}`,
      checked: true,
    };
  } catch (error) {
    return {
      platform: 'TikTok',
      handle: `@${handle}`,
      available: false,
      checked: false,
    };
  }
}

/**
 * Check all major social media platforms
 */
export async function checkSocialHandles(domainName: string): Promise<SocialHandleStatus[]> {
  // Extract handle from domain (remove TLD)
  const handle = domainName.split('.')[0];

  // Check all platforms in parallel
  const results = await Promise.allSettled([
    checkTwitterHandle(handle),
    checkInstagramHandle(handle),
    checkTikTokHandle(handle),
  ]);

  const statuses: SocialHandleStatus[] = [];

  for (const result of results) {
    if (result.status === 'fulfilled') {
      statuses.push(result.value);
    }
  }

  return statuses;
}

/**
 * Get social media availability summary
 */
export function getSocialSummary(statuses: SocialHandleStatus[]): {
  totalChecked: number;
  totalAvailable: number;
  availabilityRate: number;
  allAvailable: boolean;
} {
  const checked = statuses.filter(s => s.checked);
  const available = checked.filter(s => s.available);

  return {
    totalChecked: checked.length,
    totalAvailable: available.length,
    availabilityRate: available.length / checked.length,
    allAvailable: available.length === checked.length,
  };
}
