/**
 * 🌟 HERO COMPONENT - DomainSeek.ai
 *
 * Cinematic landing experience that captures attention instantly.
 * Inspired by Apple's product pages - clean, bold, emotive.
 */

'use client';

import { useState } from 'react';
import { BRAND } from '@/lib/brand';
import { Sparkles, Search, Zap } from 'lucide-react';

interface HeroProps {
  onProjectSubmit?: (project: string) => void;
}

export function Hero({ onProjectSubmit }: HeroProps) {
  const [project, setProject] = useState('');
  const [isFocused, setIsFocused] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (project.trim() && onProjectSubmit) {
      onProjectSubmit(project.trim());
    }
  };

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden bg-gradient-dark">
      {/* Animated background gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-brand-blue/10 via-transparent to-brand-violet/10 animate-pulse-glow" />

      {/* Floating particles effect */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-brand-blue/20 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-brand-violet/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
      </div>

      {/* Main content */}
      <div className="relative z-10 max-w-5xl mx-auto px-6 py-20 text-center">
        {/* Badge */}
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-brand-card/50 backdrop-blur-glass border border-brand-border mb-8 animate-fadeInDown">
          <Sparkles className="w-4 h-4 text-brand-blue" />
          <span className="text-sm text-text-secondary">
            AI-Powered Domain Discovery
          </span>
        </div>

        {/* Headline */}
        <h1 className="text-5xl md:text-hero font-bold text-text-primary mb-6 animate-fadeIn leading-tight">
          Find Your Perfect
          <br />
          <span className="bg-gradient-to-r from-brand-blue via-brand-violet to-brand-blue bg-clip-text text-transparent animate-shimmer bg-[length:200%_100%]">
            Domain Name
          </span>
        </h1>

        {/* Subheadline */}
        <p className="text-xl md:text-2xl text-text-secondary mb-12 max-w-2xl mx-auto animate-fadeIn" style={{ animationDelay: '0.1s' }}>
          Describe your project. Pick a vibe. Get creative,{' '}
          <span className="text-brand-green font-semibold">available domains</span>{' '}
          instantly.
        </p>

        {/* Input form */}
        <form onSubmit={handleSubmit} className="max-w-2xl mx-auto animate-fadeIn" style={{ animationDelay: '0.2s' }}>
          <div className={`
            relative group
            transition-all duration-normal
            ${isFocused ? 'scale-105' : 'scale-100'}
          `}>
            {/* Input container with glassmorphism */}
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-brand-blue/20 to-brand-violet/20 rounded-2xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-slow" />

              <div className="relative bg-brand-card/80 backdrop-blur-glass border-2 border-brand-border rounded-2xl p-2 transition-all duration-normal hover:border-brand-blue/50 focus-within:border-brand-blue focus-within:shadow-glow-blue">
                {/* Icon */}
                <div className="absolute left-6 top-1/2 -translate-y-1/2 pointer-events-none">
                  <Search className="w-5 h-5 text-text-secondary" />
                </div>

                {/* Input */}
                <input
                  type="text"
                  value={project}
                  onChange={(e) => setProject(e.target.value)}
                  onFocus={() => setIsFocused(true)}
                  onBlur={() => setIsFocused(false)}
                  placeholder="What will you build? (e.g., fitness app for runners)"
                  className="
                    w-full
                    pl-14 pr-32
                    py-5
                    bg-transparent
                    text-text-primary text-lg
                    placeholder:text-text-tertiary
                    border-none
                    outline-none
                    rounded-2xl
                  "
                  autoFocus
                />

                {/* Submit button */}
                <button
                  type="submit"
                  disabled={!project.trim()}
                  className="
                    absolute right-2 top-1/2 -translate-y-1/2
                    px-6 py-3
                    bg-brand-blue
                    text-white font-semibold
                    rounded-xl
                    transition-all duration-fast
                    hover:bg-brand-blue/90
                    hover:scale-105
                    active:scale-95
                    disabled:opacity-50
                    disabled:cursor-not-allowed
                    disabled:hover:scale-100
                    flex items-center gap-2
                  "
                >
                  <span>Generate</span>
                  <Zap className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          {/* Examples */}
          <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
            <span className="text-sm text-text-tertiary">Try:</span>
            {[
              'coffee subscription box',
              'AI writing assistant',
              'meditation app',
              'crypto wallet',
            ].map((example) => (
              <button
                key={example}
                type="button"
                onClick={() => setProject(example)}
                className="
                  px-3 py-1.5
                  text-sm text-text-secondary
                  bg-brand-card/50
                  border border-brand-border
                  rounded-lg
                  transition-all duration-fast
                  hover:text-brand-blue
                  hover:border-brand-blue/50
                  hover:scale-105
                "
              >
                {example}
              </button>
            ))}
          </div>
        </form>

        {/* Features */}
        <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto animate-fadeIn" style={{ animationDelay: '0.3s' }}>
          {[
            {
              icon: <Sparkles className="w-6 h-6" />,
              title: 'AI-Powered',
              description: 'Claude generates creative names tailored to your project',
            },
            {
              icon: <Zap className="w-6 h-6" />,
              title: 'Real-Time Checking',
              description: 'Zero false positives. Only truly available domains.',
            },
            {
              icon: <Search className="w-6 h-6" />,
              title: 'Theme-Based',
              description: 'Ancient Greek, Solar System, Gen Z, and more.',
            },
          ].map((feature, i) => (
            <div
              key={i}
              className="
                p-6
                bg-brand-card/40
                backdrop-blur-glass
                border border-brand-border
                rounded-card
                transition-all duration-normal
                hover:border-brand-blue/30
                hover:shadow-glass
                hover:scale-105
              "
            >
              <div className="text-brand-blue mb-3">{feature.icon}</div>
              <h3 className="text-lg font-semibold text-text-primary mb-2">
                {feature.title}
              </h3>
              <p className="text-sm text-text-secondary">
                {feature.description}
              </p>
            </div>
          ))}
        </div>

        {/* Social proof */}
        <div className="mt-12 flex items-center justify-center gap-6 text-sm text-text-tertiary animate-fadeIn" style={{ animationDelay: '0.4s' }}>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-brand-green rounded-full animate-pulseDot" />
            <span>1,234 domains discovered today</span>
          </div>
          <div className="hidden md:block w-px h-4 bg-brand-border" />
          <div className="hidden md:flex items-center gap-2">
            <span>⚡ Zero false positives</span>
          </div>
        </div>
      </div>

      {/* Scroll indicator */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce">
        <div className="w-6 h-10 border-2 border-brand-border rounded-full flex items-start justify-center p-2">
          <div className="w-1.5 h-1.5 bg-brand-blue rounded-full animate-pulse" />
        </div>
      </div>
    </section>
  );
}
