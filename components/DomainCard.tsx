/**
 * 💎 DOMAIN CARD - DomainSeek.ai
 *
 * Beautiful domain result card with availability status, pricing, and actions.
 * Every interaction is smooth and satisfying.
 */

'use client';

import { useState } from 'react';
import { THEMES, type ThemeId } from '@/lib/ai/themes';
import { Heart, ExternalLink, CheckCircle2, XCircle, Loader2 } from 'lucide-react';

export interface DomainCardProps {
  domain: string;
  theme: ThemeId;
  available?: boolean;
  price?: number;
  currency?: string;
  loading?: boolean;
  onFavorite?: (domain: string) => void;
  onBuy?: (domain: string) => void;
}

export function DomainCard({
  domain,
  theme,
  available,
  price = 12.99,
  currency = 'USD',
  loading = false,
  onFavorite,
  onBuy,
}: DomainCardProps) {
  const [isFavorite, setIsFavorite] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  const themeConfig = THEMES[theme];

  const handleFavoriteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsFavorite(!isFavorite);
    if (onFavorite) {
      onFavorite(domain);
    }
  };

  const handleBuyClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onBuy && available) {
      onBuy(domain);
    }
  };

  return (
    <div
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={`
        relative
        group
        bg-brand-card
        border border-brand-border
        rounded-card
        p-6
        transition-all duration-normal
        ${isHovered ? 'shadow-card-hover scale-[1.02] border-brand-blue/30' : 'shadow-card'}
        ${loading ? 'animate-pulse' : ''}
      `}
    >
      {/* Theme badge */}
      <div className="flex items-center gap-2 mb-3">
        <div className={`
          flex items-center gap-2
          px-3 py-1
          bg-gradient-to-r ${themeConfig.gradient}
          rounded-full
          text-xs font-medium text-white
          transition-transform duration-fast
          ${isHovered ? 'scale-110' : 'scale-100'}
        `}>
          <span>{themeConfig.emoji}</span>
          <span>{themeConfig.name}</span>
        </div>
      </div>

      {/* Domain name */}
      <h3 className={`
        text-2xl font-bold text-text-primary mb-3
        transition-colors duration-fast
        ${isHovered ? 'text-brand-blue' : ''}
      `}>
        {domain}
      </h3>

      {/* Availability status */}
      <div className="flex items-center gap-2 mb-4">
        {loading ? (
          <>
            <Loader2 className="w-4 h-4 text-text-secondary animate-spin" />
            <span className="text-sm text-text-secondary">Checking availability...</span>
          </>
        ) : available === undefined ? (
          <>
            <div className="w-4 h-4 bg-brand-border rounded-full animate-pulse" />
            <span className="text-sm text-text-tertiary">Checking...</span>
          </>
        ) : available ? (
          <>
            <CheckCircle2 className="w-5 h-5 text-brand-green" />
            <span className="text-sm font-semibold text-brand-green">Available</span>
          </>
        ) : (
          <>
            <XCircle className="w-5 h-5 text-brand-red" />
            <span className="text-sm text-brand-red">Taken</span>
          </>
        )}
      </div>

      {/* Domain details */}
      <div className="flex items-center justify-between text-sm text-text-secondary mb-4">
        <span>{domain.length - domain.lastIndexOf('.') - 1} character{domain.length - domain.lastIndexOf('.') - 1 !== 1 ? 's' : ''}</span>
        <span className="font-mono">.{domain.split('.').pop()}</span>
      </div>

      {/* Price & Actions */}
      {available && !loading && (
        <div className="flex items-center justify-between pt-4 border-t border-brand-border">
          {/* Price */}
          <div>
            <div className="text-2xl font-bold text-text-primary">
              ${price}
              <span className="text-sm font-normal text-text-secondary">/yr</span>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-2">
            {/* Favorite button */}
            <button
              onClick={handleFavoriteClick}
              className={`
                p-2.5
                rounded-lg
                transition-all duration-fast
                ${isFavorite
                  ? 'bg-brand-red/20 text-brand-red'
                  : 'bg-brand-dark/50 text-text-secondary hover:bg-brand-border'
                }
                hover:scale-110
                active:scale-95
              `}
              aria-label="Save to favorites"
            >
              <Heart
                className={`w-5 h-5 transition-all ${isFavorite ? 'fill-current' : ''}`}
              />
            </button>

            {/* Buy button */}
            <button
              onClick={handleBuyClick}
              className="
                px-6 py-2.5
                bg-brand-blue
                text-white font-semibold text-sm
                rounded-lg
                transition-all duration-fast
                hover:bg-brand-blue/90
                hover:scale-105
                hover:shadow-glow-blue
                active:scale-95
                flex items-center gap-2
              "
            >
              <span>Buy Now</span>
              <ExternalLink className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Loading shimmer effect */}
      {loading && (
        <div className="absolute inset-0 overflow-hidden rounded-card pointer-events-none">
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-brand-blue/10 to-transparent animate-shimmer" />
        </div>
      )}

      {/* Hover glow effect */}
      {isHovered && available && !loading && (
        <div className="absolute -inset-0.5 bg-gradient-to-br from-brand-blue/20 to-brand-violet/20 rounded-card -z-10 blur-lg animate-fadeIn" />
      )}
    </div>
  );
}
