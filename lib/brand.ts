/**
 * 🏷️ BRAND CONFIGURATION - SINGLE SOURCE OF TRUTH
 *
 * This is the ONLY place to change the project name.
 * All other files reference this config.
 *
 * When rebranding:
 * 1. Update values in this file
 * 2. See NAME_CHANGE_LOG.md for manual changes
 * 3. Everything else auto-updates
 */

export const BRAND = {
  // Display names
  name: 'DomainSeek',
  fullName: 'DomainSeek.ai',
  tagline: 'Find Your Perfect Domain Name',

  // URLs
  domain: 'domainseek.ai',
  url: 'https://domainseek.ai',

  // Technical identifiers (lowercase, no spaces)
  slug: 'domainseek',              // For file names, URLs
  prefix: 'ds',                    // For CSS classes, env vars

  // Database/Redis prefixes
  dbPrefix: 'ds',                  // Redis keys: ds:domain:*
  cachePrefix: 'ds',               // Cache keys

  // Social
  twitter: '@domainseek',
  github: 'domainseek',

  // Contact
  email: 'hello@domainseek.ai',
  supportEmail: 'support@domainseek.ai',

  // Legal
  companyName: 'DomainSeek Inc.',

  // Meta
  description: 'AI-powered domain name discovery platform with themed suggestions. Find creative, available domain names instantly.',
  keywords: [
    'domain names',
    'domain search',
    'AI domain generator',
    'domain availability',
    'domain finder',
    'domain discovery',
    'creative domains',
    'startup names',
  ],

  // Features
  features: {
    aiPowered: true,
    realTimeStreaming: true,
    themeBasedGeneration: true,
    zeroFalsePositives: true,
  },
} as const;

// Helper functions for easy access
export const getBrandName = () => BRAND.name;
export const getFullBrandName = () => BRAND.fullName;
export const getBrandUrl = () => BRAND.url;
export const getBrandPrefix = () => BRAND.prefix;
export const getDbPrefix = () => BRAND.dbPrefix;
export const getCacheKey = (key: string) => `${BRAND.cachePrefix}:${key}`;

// Type exports
export type BrandConfig = typeof BRAND;
