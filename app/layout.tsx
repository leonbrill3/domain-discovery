/**
 * 🎨 ROOT LAYOUT - DomainSeek.ai
 *
 * Dark theme, SEO-optimized, beautiful typography.
 * Every page inherits this elegant foundation.
 */

import type { Metadata } from 'next';
import { generateMetadata, generateHomeSchema } from '@/lib/seo/meta';
import { BRAND } from '@/lib/brand';
import './globals.css';

// Generate SEO metadata
export const metadata: Metadata = generateMetadata();

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Generate Schema.org structured data
  const schema = generateHomeSchema();

  return (
    <html lang="en">
      <head>
        {/* Structured Data for SEO */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
        />

        {/* Fonts from Google Fonts */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&family=JetBrains+Mono:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />

        {/* Preload critical assets */}
        <link rel="dns-prefetch" href="https://api.anthropic.com" />
        <link rel="dns-prefetch" href="https://domainr.p.rapidapi.com" />
      </head>
      <body className="bg-white text-text-primary antialiased font-sans">
        {/* Main content */}
        {children}

        {/* Analytics (when enabled) */}
        {process.env.NEXT_PUBLIC_GA_ID && (
          <script
            async
            src={`https://www.googletagmanager.com/gtag/js?id=${process.env.NEXT_PUBLIC_GA_ID}`}
          />
        )}
      </body>
    </html>
  );
}
