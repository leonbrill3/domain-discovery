/**
 * 📊 ANALYTICS & TRACKING - DomainSeek.ai
 *
 * Multi-channel attribution for Google Ads, Meta Ads, and Organic traffic.
 * Track which channels drive conversions and optimize accordingly.
 */

import { prisma } from '../prisma';

export type TrafficSource = 'google-ads' | 'meta-ads' | 'instagram-ads' | 'organic' | 'direct' | 'referral';

export interface AnalyticsEvent {
  event: string;
  properties: Record<string, any>;
  timestamp: Date;
  sessionId: string;
  source: TrafficSource;
}

/**
 * Detect traffic source from URL parameters or referrer
 */
export function detectTrafficSource(
  searchParams: URLSearchParams,
  referrer?: string
): TrafficSource {
  // Check UTM parameters first
  const utmSource = searchParams.get('utm_source');
  const utmMedium = searchParams.get('utm_medium');

  // Google Ads
  if (utmSource === 'google' || utmMedium === 'cpc' || searchParams.has('gclid')) {
    return 'google-ads';
  }

  // Meta/Facebook Ads
  if (utmSource === 'facebook' || utmSource === 'meta' || searchParams.has('fbclid')) {
    return 'meta-ads';
  }

  // Instagram Ads
  if (utmSource === 'instagram' || utmSource?.includes('ig')) {
    return 'instagram-ads';
  }

  // Referral traffic
  if (referrer && !referrer.includes(process.env.NEXT_PUBLIC_BASE_URL || '')) {
    return 'referral';
  }

  // Organic (from search engines)
  if (referrer && (
    referrer.includes('google.com') ||
    referrer.includes('bing.com') ||
    referrer.includes('duckduckgo.com')
  )) {
    return 'organic';
  }

  // Default: direct
  return 'direct';
}

/**
 * Track domain generation event
 */
export async function trackGeneration(data: {
  sessionId: string;
  project: string;
  themes: string[];
  domainsCount: number;
  source: TrafficSource;
}): Promise<void> {
  try {
    await prisma.session.create({
      data: {
        id: data.sessionId,
        project: data.project,
        themes: data.themes,
        domainsCount: data.domainsCount,
        createdAt: new Date(),
      },
    });

    console.log(`[Analytics] Tracked generation for session ${data.sessionId} from ${data.source}`);

  } catch (error) {
    console.error('[Analytics] Track generation error:', error);
  }
}

/**
 * Track domain favorite
 */
export async function trackFavorite(data: {
  sessionId: string;
  domain: string;
  theme: string;
}): Promise<void> {
  try {
    await prisma.favorite.create({
      data: {
        sessionId: data.sessionId,
        domain: data.domain,
        theme: data.theme,
        savedAt: new Date(),
      },
    });

    console.log(`[Analytics] Tracked favorite: ${data.domain}`);

  } catch (error) {
    console.error('[Analytics] Track favorite error:', error);
  }
}

/**
 * Track affiliate click
 */
export async function trackAffiliateClick(data: {
  sessionId: string;
  domain: string;
  registrar: string;
  type: 'domain' | 'hosting' | 'ssl' | 'email';
}): Promise<void> {
  try {
    await prisma.affiliateClick.create({
      data: {
        sessionId: data.sessionId,
        domain: data.domain,
        registrar: `${data.registrar}-${data.type}`,
        clickedAt: new Date(),
      },
    });

    console.log(`[Analytics] Tracked affiliate click: ${data.domain} → ${data.registrar} (${data.type})`);

  } catch (error) {
    console.error('[Analytics] Track affiliate click error:', error);
  }
}

/**
 * Track conversion (when user reports they purchased)
 */
export async function trackConversion(data: {
  sessionId: string;
  domain: string;
  registrar: string;
  revenue?: number;
}): Promise<void> {
  try {
    // Find the affiliate click
    const click = await prisma.affiliateClick.findFirst({
      where: {
        sessionId: data.sessionId,
        domain: data.domain,
        registrar: {
          contains: data.registrar,
        },
        converted: false,
      },
      orderBy: {
        clickedAt: 'desc',
      },
    });

    if (click) {
      // Update with conversion
      await prisma.affiliateClick.update({
        where: { id: click.id },
        data: {
          converted: true,
          convertedAt: new Date(),
          revenue: data.revenue,
        },
      });

      console.log(`[Analytics] ✅ Conversion tracked: ${data.domain} ($${data.revenue})`);
    }

  } catch (error) {
    console.error('[Analytics] Track conversion error:', error);
  }
}

/**
 * Get analytics dashboard data
 */
export async function getAnalyticsDashboard(days: number = 30) {
  const since = new Date();
  since.setDate(since.getDate() - days);

  const [
    totalSessions,
    totalFavorites,
    totalClicks,
    totalConversions,
    themeStats,
  ] = await Promise.all([
    // Total sessions
    prisma.session.count({
      where: { createdAt: { gte: since } },
    }),

    // Total favorites
    prisma.favorite.count({
      where: { savedAt: { gte: since } },
    }),

    // Total affiliate clicks
    prisma.affiliateClick.count({
      where: { clickedAt: { gte: since } },
    }),

    // Total conversions
    prisma.affiliateClick.count({
      where: {
        clickedAt: { gte: since },
        converted: true,
      },
    }),

    // Theme performance
    prisma.themeStats.findMany(),
  ]);

  // Calculate metrics
  const clickThroughRate = totalSessions > 0 ? (totalClicks / totalSessions) * 100 : 0;
  const conversionRate = totalClicks > 0 ? (totalConversions / totalClicks) * 100 : 0;

  return {
    totalSessions,
    totalFavorites,
    totalClicks,
    totalConversions,
    clickThroughRate,
    conversionRate,
    themeStats,
  };
}

/**
 * Generate SEO-optimized keywords for a project
 */
export function generateSEOKeywords(project: string): string[] {
  const baseKeywords = [
    'domain name',
    'domain generator',
    'domain finder',
    'domain search',
    'available domains',
  ];

  // Extract keywords from project
  const projectKeywords = project
    .toLowerCase()
    .split(/\s+/)
    .filter(word => word.length > 3);

  return [...baseKeywords, ...projectKeywords];
}
