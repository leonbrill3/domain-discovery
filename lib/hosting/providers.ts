/**
 * 🏢 HOSTING PROVIDERS - DomainSeek.ai
 *
 * Configuration for hosting affiliate partners.
 * These are our PRIMARY revenue drivers (15-20x more profitable than domains!)
 */

export interface HostingProvider {
  id: string;
  name: string;
  description: string;
  logo: string;
  commission: number;         // Average commission per sale
  commissionType: 'percentage' | 'flat';

  // Pricing tiers
  plans: HostingPlan[];

  // Affiliate info
  affiliateId: string;        // From env variable
  affiliateUrl: string;       // Base URL for affiliate links

  // Features/USPs
  features: string[];
  recommended: boolean;

  // Analytics
  popularity: number;         // 1-10 rating
}

export interface HostingPlan {
  id: string;
  name: string;
  price: number;              // Monthly price
  annualPrice: number;        // Annual price (usually discounted)
  features: string[];
  recommended: boolean;
}

/**
 * 🟠 HOSTINGER - BEST COMMISSION (60%)
 */
export const HOSTINGER: HostingProvider = {
  id: 'hostinger',
  name: 'Hostinger',
  description: 'Fast, affordable hosting with 99.9% uptime. Perfect for startups.',
  logo: '/assets/hosting/hostinger-logo.svg',
  commission: 40,              // $40 average (60% of $67 average sale)
  commissionType: 'percentage',

  plans: [
    {
      id: 'single',
      name: 'Single',
      price: 2.99,
      annualPrice: 35.88,
      features: [
        '1 website',
        '50 GB SSD storage',
        'Free SSL certificate',
        '100 GB bandwidth',
        'Free email',
      ],
      recommended: false,
    },
    {
      id: 'premium',
      name: 'Premium',
      price: 3.99,
      annualPrice: 47.88,
      features: [
        '100 websites',
        '100 GB SSD storage',
        'Free SSL certificate',
        'Unlimited bandwidth',
        'Free email',
        'Free domain',
      ],
      recommended: true,
    },
    {
      id: 'business',
      name: 'Business',
      price: 4.99,
      annualPrice: 59.88,
      features: [
        '100 websites',
        '200 GB SSD storage',
        'Free SSL certificate',
        'Unlimited bandwidth',
        'Free email',
        'Free domain',
        'Daily backups',
      ],
      recommended: false,
    },
  ],

  affiliateId: process.env.HOSTINGER_AFFILIATE_ID || 'YOUR_AFFILIATE_ID',
  affiliateUrl: 'https://www.hostinger.com',

  features: [
    '99.9% uptime guarantee',
    '24/7 support',
    'Free SSL',
    'Free CDN',
    'One-click installer',
  ],

  recommended: true,
  popularity: 9,
};

/**
 * 🔵 BLUEHOST - HIGH COMMISSION ($65+)
 */
export const BLUEHOST: HostingProvider = {
  id: 'bluehost',
  name: 'Bluehost',
  description: 'WordPress recommended hosting. Reliable and beginner-friendly.',
  logo: '/assets/hosting/bluehost-logo.svg',
  commission: 65,              // $65+ flat commission
  commissionType: 'flat',

  plans: [
    {
      id: 'basic',
      name: 'Basic',
      price: 2.95,
      annualPrice: 35.40,
      features: [
        '1 website',
        '50 GB SSD storage',
        'Free SSL',
        'Unmetered bandwidth',
        'Free domain (1 year)',
      ],
      recommended: false,
    },
    {
      id: 'plus',
      name: 'Plus',
      price: 5.45,
      annualPrice: 65.40,
      features: [
        'Unlimited websites',
        'Unlimited SSD storage',
        'Free SSL',
        'Unmetered bandwidth',
        'Free domain (1 year)',
        'Spam protection',
      ],
      recommended: true,
    },
    {
      id: 'choice-plus',
      name: 'Choice Plus',
      price: 5.45,
      annualPrice: 65.40,
      features: [
        'Unlimited websites',
        'Unlimited SSD storage',
        'Free SSL',
        'Unmetered bandwidth',
        'Free domain (1 year)',
        'Domain privacy',
        'Automated backups',
      ],
      recommended: false,
    },
  ],

  affiliateId: process.env.BLUEHOST_AFFILIATE_ID || 'YOUR_AFFILIATE_ID',
  affiliateUrl: 'https://www.bluehost.com',

  features: [
    'WordPress recommended',
    '24/7 expert support',
    'Free domain (1 year)',
    'One-click WordPress install',
    '30-day money-back guarantee',
  ],

  recommended: true,
  popularity: 10,
};

/**
 * ☁️ CLOUDWAYS - PREMIUM OPTION ($50-125)
 */
export const CLOUDWAYS: HostingProvider = {
  id: 'cloudways',
  name: 'Cloudways',
  description: 'Managed cloud hosting for developers. Blazing fast performance.',
  logo: '/assets/hosting/cloudways-logo.svg',
  commission: 87.5,            // Average of $50-125 range
  commissionType: 'flat',

  plans: [
    {
      id: 'do-1gb',
      name: 'DigitalOcean 1GB',
      price: 12,
      annualPrice: 144,
      features: [
        '1 GB RAM',
        '25 GB storage',
        '1 TB bandwidth',
        'Free SSL',
        'Automated backups',
      ],
      recommended: false,
    },
    {
      id: 'do-2gb',
      name: 'DigitalOcean 2GB',
      price: 26,
      annualPrice: 312,
      features: [
        '2 GB RAM',
        '50 GB storage',
        '2 TB bandwidth',
        'Free SSL',
        'Automated backups',
        'Staging environment',
      ],
      recommended: true,
    },
    {
      id: 'do-4gb',
      name: 'DigitalOcean 4GB',
      price: 52,
      annualPrice: 624,
      features: [
        '4 GB RAM',
        '80 GB storage',
        '4 TB bandwidth',
        'Free SSL',
        'Automated backups',
        'Staging environment',
        'Priority support',
      ],
      recommended: false,
    },
  ],

  affiliateId: process.env.CLOUDWAYS_AFFILIATE_ID || 'YOUR_AFFILIATE_ID',
  affiliateUrl: 'https://www.cloudways.com',

  features: [
    'Managed cloud hosting',
    'Choose your cloud (AWS, GCP, DO)',
    'Advanced caching',
    'Free migrations',
    '24/7 expert support',
  ],

  recommended: false,
  popularity: 7,
};

/**
 * Export all providers
 */
export const HOSTING_PROVIDERS = {
  hostinger: HOSTINGER,
  bluehost: BLUEHOST,
  cloudways: CLOUDWAYS,
} as const;

export type HostingProviderId = keyof typeof HOSTING_PROVIDERS;

/**
 * Get recommended providers (sorted by commission)
 */
export function getRecommendedProviders(): HostingProvider[] {
  return [HOSTINGER, BLUEHOST];
}

/**
 * Get all providers
 */
export function getAllProviders(): HostingProvider[] {
  return Object.values(HOSTING_PROVIDERS);
}

/**
 * Get provider by ID
 */
export function getProvider(id: HostingProviderId): HostingProvider {
  return HOSTING_PROVIDERS[id];
}

/**
 * Generate affiliate link for hosting
 */
export function generateHostingAffiliateLink(
  providerId: HostingProviderId,
  domain: string,
  planId?: string
): string {
  const provider = getProvider(providerId);
  const url = new URL(provider.affiliateUrl);

  // Add affiliate tracking
  url.searchParams.set('ref', provider.affiliateId);
  url.searchParams.set('utm_source', 'domainseek');
  url.searchParams.set('utm_medium', 'affiliate');
  url.searchParams.set('utm_campaign', 'domain-hosting-bundle');

  // Pre-fill domain if supported
  if (domain) {
    url.searchParams.set('domain', domain);
  }

  // Pre-select plan if specified
  if (planId) {
    url.searchParams.set('plan', planId);
  }

  return url.toString();
}

/**
 * Calculate bundle savings
 */
export function calculateBundleSavings(
  domainPrice: number,
  hostingPrice: number
): number {
  // Typical bundle discount: 10-15%
  const discount = 0.10;
  const regularTotal = domainPrice + hostingPrice;
  const bundlePrice = regularTotal * (1 - discount);

  return regularTotal - bundlePrice;
}
