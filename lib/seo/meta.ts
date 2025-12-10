/**
 * 🔍 SEO UTILITIES - DomainSeek.ai
 *
 * Meta tags, Schema.org, Open Graph, Twitter Cards
 * Optimized for organic search growth.
 */

import { BRAND } from '../brand';
import type { Metadata } from 'next';

/**
 * Generate base metadata for pages
 */
export function generateMetadata(overrides?: Partial<Metadata>): Metadata {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || BRAND.url;

  const defaultMetadata: Metadata = {
    metadataBase: new URL(baseUrl),
    title: {
      default: `${BRAND.fullName} - ${BRAND.tagline}`,
      template: `%s | ${BRAND.name}`,
    },
    description: BRAND.description,
    keywords: BRAND.keywords,

    // Open Graph (Facebook, LinkedIn)
    openGraph: {
      type: 'website',
      locale: 'en_US',
      url: baseUrl,
      siteName: BRAND.name,
      title: `${BRAND.fullName} - ${BRAND.tagline}`,
      description: BRAND.description,
      images: [
        {
          url: `${baseUrl}/api/og`,
          width: 1200,
          height: 630,
          alt: BRAND.name,
        },
      ],
    },

    // Twitter Card
    twitter: {
      card: 'summary_large_image',
      title: `${BRAND.fullName} - ${BRAND.tagline}`,
      description: BRAND.description,
      creator: BRAND.twitter,
      images: [`${baseUrl}/api/og`],
    },

    // Icons
    icons: {
      icon: '/favicon.ico',
      apple: '/apple-touch-icon.png',
    },

    // PWA
    manifest: '/manifest.json',
    appleWebApp: {
      capable: true,
      statusBarStyle: 'black',
      title: BRAND.name,
    },

    // Theme
    themeColor: '#0e1623',

    // Alternate links
    alternates: {
      canonical: baseUrl,
    },

    // Robots
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        'max-video-preview': -1,
        'max-image-preview': 'large',
        'max-snippet': -1,
      },
    },

    // Verification
    verification: {
      google: process.env.GOOGLE_SITE_VERIFICATION,
    },
  };

  return {
    ...defaultMetadata,
    ...overrides,
  };
}

/**
 * Generate Schema.org structured data for homepage
 */
export function generateHomeSchema() {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || BRAND.url;

  return {
    '@context': 'https://schema.org',
    '@type': 'WebApplication',
    name: BRAND.name,
    url: baseUrl,
    description: BRAND.description,
    applicationCategory: 'BusinessApplication',
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'USD',
    },
    potentialAction: {
      '@type': 'SearchAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: `${baseUrl}/?project={search_term_string}`,
      },
      'query-input': 'required name=search_term_string',
    },
    publisher: {
      '@type': 'Organization',
      name: BRAND.companyName,
      url: baseUrl,
    },
  };
}

/**
 * Generate Schema.org for blog post
 */
export function generateArticleSchema(article: {
  title: string;
  description: string;
  publishedAt: Date;
  modifiedAt?: Date;
  author: string;
  image?: string;
}) {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || BRAND.url;

  return {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: article.title,
    description: article.description,
    image: article.image || `${baseUrl}/api/og?title=${encodeURIComponent(article.title)}`,
    datePublished: article.publishedAt.toISOString(),
    dateModified: (article.modifiedAt || article.publishedAt).toISOString(),
    author: {
      '@type': 'Person',
      name: article.author,
    },
    publisher: {
      '@type': 'Organization',
      name: BRAND.companyName,
      url: baseUrl,
    },
  };
}

/**
 * Generate SEO-friendly title
 */
export function generateTitle(title: string): string {
  return `${title} | ${BRAND.name}`;
}

/**
 * Generate meta description with optimal length (150-160 chars)
 */
export function generateDescription(text: string, maxLength: number = 160): string {
  if (text.length <= maxLength) {
    return text;
  }

  // Truncate at word boundary
  const truncated = text.substring(0, maxLength - 3);
  const lastSpace = truncated.lastIndexOf(' ');

  return truncated.substring(0, lastSpace) + '...';
}

/**
 * Generate canonical URL
 */
export function generateCanonicalUrl(path: string): string {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || BRAND.url;
  return `${baseUrl}${path.startsWith('/') ? path : `/${path}`}`;
}

/**
 * Generate sitemap entry
 */
export interface SitemapEntry {
  url: string;
  lastModified: Date;
  changeFrequency: 'always' | 'hourly' | 'daily' | 'weekly' | 'monthly' | 'yearly' | 'never';
  priority: number;  // 0.0-1.0
}

export function generateSitemapEntry(
  path: string,
  options?: Partial<SitemapEntry>
): SitemapEntry {
  return {
    url: generateCanonicalUrl(path),
    lastModified: new Date(),
    changeFrequency: 'weekly',
    priority: 0.5,
    ...options,
  };
}
