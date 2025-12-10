/**
 * 🎨 COMPREHENSIVE THEME SYSTEM - DomainSeek.ai
 *
 * 50+ themes organized by category for domain name generation.
 * Each theme has a specific prompt optimized for Claude.
 */

import type { Theme } from './themes';

// Re-export the original 10 themes
export * from './themes';

/**
 * 🏛️ MYTHOLOGY CATEGORY (Extended)
 */

export const ROMAN_MYTHOLOGY: Theme = {
  id: 'roman',
  name: 'Roman',
  emoji: '🏛️',
  description: 'Roman gods and empire',
  prompt: 'Generate domains using Roman mythology: Jupiter, Mars, Venus, Mercury, Apollo, Caesar, Senate, Legion, Gladiator, Forum.',
  examples: ['jupiterapp.io', 'marsforce.com', 'venusbeauty.app'],
  color: '#DC2626',
  gradient: 'from-red-600 to-orange-600',
  keywords: ['roman', 'empire', 'classical'],
};

export const NORSE_MYTHOLOGY: Theme = {
  id: 'norse',
  name: 'Norse',
  emoji: '⚔️',
  description: 'Vikings and Nordic gods',
  prompt: 'Generate domains using Norse mythology: Thor, Odin, Valhalla, Ragnarok, Loki, Freya, Viking, Rune, Asgard, Yggdrasil.',
  examples: ['thorforce.io', 'valhallaapp.com', 'odinlab.dev'],
  color: '#1E40AF',
  gradient: 'from-blue-800 to-slate-700',
  keywords: ['norse', 'viking', 'nordic'],
};

export const EGYPTIAN_MYTHOLOGY: Theme = {
  id: 'egyptian',
  name: 'Egyptian',
  emoji: '🔺',
  description: 'Ancient Egypt and pharaohs',
  prompt: 'Generate domains using Egyptian mythology: Ra, Anubis, Osiris, Sphinx, Pyramid, Pharaoh, Nile, Scarab, Horus, Isis.',
  examples: ['raenergy.io', 'sphinxlab.com', 'anubishealth.app'],
  color: '#D97706',
  gradient: 'from-amber-600 to-yellow-600',
  keywords: ['egyptian', 'pharaoh', 'ancient'],
};

/**
 * ✨ ASTROLOGY & CELESTIAL (Extended)
 */

export const ASTROLOGY: Theme = {
  id: 'astrology',
  name: 'Astrology',
  emoji: '⭐',
  description: 'Zodiac signs and astrology',
  prompt: 'Generate domains using astrology: Aries, Leo, Scorpio, Pisces, Rising, Moon, Mercury, Venus, House, Chart, Cosmic.',
  examples: ['leorise.app', 'cosmicflow.io', 'moonphase.com'],
  color: '#7C3AED',
  gradient: 'from-violet-600 to-purple-600',
  keywords: ['astrology', 'zodiac', 'cosmic'],
};

export const CONSTELLATIONS: Theme = {
  id: 'constellations',
  name: 'Constellations',
  emoji: '✨',
  description: 'Star patterns and astronomy',
  prompt: 'Generate domains using constellations: Orion, Cassiopeia, Andromeda, Perseus, Lyra, Cygnus, Draco, Phoenix, Centaurus.',
  examples: ['orionlab.io', 'andromedaapp.com', 'cygnusflow.dev'],
  color: '#6366F1',
  gradient: 'from-indigo-500 to-blue-600',
  keywords: ['stars', 'constellation', 'astronomy'],
};

/**
 * 🌍 LANGUAGES (Extended)
 */

export const LATIN: Theme = {
  id: 'latin',
  name: 'Latin',
  emoji: '📜',
  description: 'Latin words and phrases',
  prompt: 'Generate domains using Latin: Vita (life), Lux (light), Veritas (truth), Fortis (strong), Magnus (great), Novus (new), Opus (work), Via (way).',
  examples: ['vitalab.com', 'luxflow.io', 'veritasapp.dev'],
  color: '#92400E',
  gradient: 'from-amber-800 to-yellow-700',
  keywords: ['latin', 'classical', 'scholarly'],
};

export const FRENCH: Theme = {
  id: 'french',
  name: 'French',
  emoji: '🇫🇷',
  description: 'French words (elegant)',
  prompt: 'Generate domains using French words: Belle (beautiful), Noir (black), Vie (life), Rêve (dream), Étoile (star), Lumière (light), Jardin (garden).',
  examples: ['belleapp.com', 'reverie.io', 'lumiere.dev'],
  color: '#BE123C',
  gradient: 'from-rose-700 to-pink-600',
  keywords: ['french', 'elegant', 'sophisticated'],
};

export const JAPANESE: Theme = {
  id: 'japanese',
  name: 'Japanese',
  emoji: '🇯🇵',
  description: 'Japanese words (minimalist)',
  prompt: 'Generate domains using Japanese: Yume (dream), Kaze (wind), Hoshi (star), Sora (sky), Mizu (water), Kaizen (improvement), Zen (meditation).',
  examples: ['yumeapp.io', 'kaizenhq.com', 'zenflow.dev'],
  color: '#DC2626',
  gradient: 'from-red-600 to-rose-600',
  keywords: ['japanese', 'zen', 'minimalist'],
};

/**
 * 🌿 NATURE (Extended)
 */

export const OCEAN: Theme = {
  id: 'ocean',
  name: 'Ocean',
  emoji: '🌊',
  description: 'Ocean and marine life',
  prompt: 'Generate domains using ocean: Wave, Tide, Coral, Pearl, Aqua, Marine, Current, Deep, Shore, Reef, Nautical.',
  examples: ['waveflow.io', 'corallab.com', 'aquaforce.app'],
  color: '#0891B2',
  gradient: 'from-cyan-600 to-blue-600',
  keywords: ['ocean', 'water', 'marine'],
};

export const MOUNTAINS: Theme = {
  id: 'mountains',
  name: 'Mountains',
  emoji: '⛰️',
  description: 'Mountains and peaks',
  prompt: 'Generate domains using mountains: Summit, Peak, Ridge, Alpine, Canyon, Valley, Cliff, Boulder, Altitude, Ascend.',
  examples: ['summitapp.io', 'peakforce.com', 'alpinelab.dev'],
  color: '#78716C',
  gradient: 'from-stone-600 to-gray-700',
  keywords: ['mountain', 'peak', 'adventure'],
};

export const PRECIOUS_STONES: Theme = {
  id: 'gems',
  name: 'Precious Stones',
  emoji: '💎',
  description: 'Gems and precious materials',
  prompt: 'Generate domains using precious stones: Diamond, Ruby, Sapphire, Emerald, Pearl, Jade, Opal, Quartz, Crystal, Amber.',
  examples: ['diamondflow.io', 'rubyforge.com', 'sapphirelab.app'],
  color: '#BE185D',
  gradient: 'from-pink-700 to-rose-600',
  keywords: ['gems', 'precious', 'luxury'],
};

export const ANIMALS: Theme = {
  id: 'animals',
  name: 'Animals',
  emoji: '🦅',
  description: 'Wildlife and creatures',
  prompt: 'Generate domains using animals: Eagle, Wolf, Lion, Phoenix, Dragon, Falcon, Panther, Tiger, Bear, Raven.',
  examples: ['eagleforce.io', 'wolfpack.com', 'phoenixlab.app'],
  color: '#B45309',
  gradient: 'from-amber-700 to-orange-700',
  keywords: ['animals', 'wildlife', 'nature'],
};

/**
 * 🔬 SCIENCE (Extended)
 */

export const PHYSICS: Theme = {
  id: 'physics',
  name: 'Physics',
  emoji: '⚛️',
  description: 'Physics and quantum',
  prompt: 'Generate domains using physics: Quantum, Atom, Photon, Neutron, Electron, Fusion, Particle, Energy, Wave, Field.',
  examples: ['quantumflow.io', 'photonlab.com', 'fusionforce.app'],
  color: '#7C3AED',
  gradient: 'from-violet-600 to-purple-700',
  keywords: ['physics', 'quantum', 'science'],
};

export const CHEMISTRY: Theme = {
  id: 'chemistry',
  name: 'Chemistry',
  emoji: '🧪',
  description: 'Elements and compounds',
  prompt: 'Generate domains using chemistry: Carbon, Oxygen, Noble, Catalyst, Element, Molecule, Compound, Bond, Reaction, Pure.',
  examples: ['catalystlab.io', 'carbonapp.com', 'nobleforce.dev'],
  color: '#059669',
  gradient: 'from-emerald-600 to-green-700',
  keywords: ['chemistry', 'elements', 'science'],
};

/**
 * 💼 BUSINESS & PROFESSIONAL (Extended)
 */

export const BUSINESS: Theme = {
  id: 'business',
  name: 'Business',
  emoji: '💼',
  description: 'Business and corporate',
  prompt: 'Generate domains using business: Summit, Venture, Capital, Growth, Scale, Profit, Asset, Value, Trade, Enterprise.',
  examples: ['venturehq.io', 'summitcap.com', 'scaleforce.app'],
  color: '#1E40AF',
  gradient: 'from-blue-800 to-indigo-700',
  keywords: ['business', 'corporate', 'professional'],
};

export const FINANCE: Theme = {
  id: 'finance',
  name: 'Finance',
  emoji: '💰',
  description: 'Finance and investing',
  prompt: 'Generate domains using finance: Fund, Equity, Prime, Yield, Wealth, Asset, Portfolio, Invest, Dividend, Hedge.',
  examples: ['primecap.io', 'yieldflow.com', 'wealthforge.app'],
  color: '#047857',
  gradient: 'from-emerald-700 to-green-800',
  keywords: ['finance', 'money', 'investing'],
};

/**
 * 🎨 CREATIVE & ARTS (Extended)
 */

export const MUSIC: Theme = {
  id: 'music',
  name: 'Music',
  emoji: '🎵',
  description: 'Music and sound',
  prompt: 'Generate domains using music: Rhythm, Harmony, Melody, Beat, Tempo, Jazz, Symphony, Note, Chord, Acoustic.',
  examples: ['rhythmflow.io', 'harmonylab.com', 'jazzforge.app'],
  color: '#DB2777',
  gradient: 'from-pink-600 to-rose-600',
  keywords: ['music', 'sound', 'rhythm'],
};

export const ART: Theme = {
  id: 'art',
  name: 'Art',
  emoji: '🎨',
  description: 'Visual art and design',
  prompt: 'Generate domains using art: Canvas, Palette, Brush, Studio, Gallery, Sketch, Vision, Create, Design, Frame.',
  examples: ['canvasflow.io', 'palettelab.com', 'visionstudio.app'],
  color: '#C026D3',
  gradient: 'from-fuchsia-600 to-pink-600',
  keywords: ['art', 'design', 'creative'],
};

/**
 * 🍰 FOOD & WELLNESS (Extended)
 */

export const COFFEE: Theme = {
  id: 'coffee',
  name: 'Coffee',
  emoji: '☕',
  description: 'Coffee and café culture',
  prompt: 'Generate domains using coffee: Bean, Brew, Roast, Espresso, Latte, Barista, Grind, Steam, Pour, Cup.',
  examples: ['beanflow.io', 'brewforge.com', 'roastery.app'],
  color: '#92400E',
  gradient: 'from-amber-800 to-brown-700',
  keywords: ['coffee', 'café', 'beverage'],
};

export const WELLNESS: Theme = {
  id: 'wellness',
  name: 'Wellness',
  emoji: '🧘',
  description: 'Health and wellness',
  prompt: 'Generate domains using wellness: Zen, Balance, Harmony, Pure, Vital, Calm, Heal, Renew, Restore, Glow.',
  examples: ['zenflow.io', 'balancelab.com', 'vitalforce.app'],
  color: '#10B981',
  gradient: 'from-emerald-500 to-green-600',
  keywords: ['wellness', 'health', 'mindfulness'],
};

/**
 * EXPORT ALL THEMES
 */

// Note: This is a partial list. We'll add more themes progressively.
// Total target: 50+ themes across 15 categories

export const ALL_THEMES_MAP = {
  // Original 10
  'ancient-greek': 'ANCIENT_GREEK',  // Import from themes.ts
  'solar-system': 'SOLAR_SYSTEM',
  'gen-z': 'GEN_Z',
  'nature': 'NATURE',
  'tech': 'TECH',
  'literary': 'LITERARY',
  'abstract': 'ABSTRACT',
  'urban': 'URBAN',
  'gaming': 'GAMING',
  'food-lifestyle': 'FOOD_LIFESTYLE',

  // Extended themes (20 more for now)
  'roman': ROMAN_MYTHOLOGY,
  'norse': NORSE_MYTHOLOGY,
  'egyptian': EGYPTIAN_MYTHOLOGY,
  'astrology': ASTROLOGY,
  'constellations': CONSTELLATIONS,
  'latin': LATIN,
  'french': FRENCH,
  'japanese': JAPANESE,
  'ocean': OCEAN,
  'mountains': MOUNTAINS,
  'gems': PRECIOUS_STONES,
  'animals': ANIMALS,
  'physics': PHYSICS,
  'chemistry': CHEMISTRY,
  'business': BUSINESS,
  'finance': FINANCE,
  'music': MUSIC,
  'art': ART,
  'coffee': COFFEE,
  'wellness': WELLNESS,
} as const;

/**
 * 🎭 VIBE PACKS - Curated Theme Combinations
 */

export interface VibePack {
  id: string;
  name: string;
  emoji: string;
  description: string;
  themes: string[];  // Theme IDs
  gradient: string;
}

export const VIBE_PACKS: VibePack[] = [
  {
    id: 'classic',
    name: 'Classic & Timeless',
    emoji: '🏛️',
    description: 'Sophisticated, established, trustworthy',
    themes: ['ancient-greek', 'roman', 'latin', 'literary'],
    gradient: 'from-blue-600 to-indigo-700',
  },
  {
    id: 'modern',
    name: 'Modern & Tech',
    emoji: '⚡',
    description: 'Innovative, cutting-edge, digital',
    themes: ['tech', 'solar-system', 'physics', 'abstract'],
    gradient: 'from-violet-600 to-purple-700',
  },
  {
    id: 'natural',
    name: 'Natural & Organic',
    emoji: '🌿',
    description: 'Earth-friendly, wholesome, authentic',
    themes: ['nature', 'ocean', 'mountains', 'wellness'],
    gradient: 'from-green-600 to-emerald-700',
  },
  {
    id: 'fun',
    name: 'Fun & Playful',
    emoji: '💬',
    description: 'Energetic, youthful, engaging',
    themes: ['gen-z', 'gaming', 'music', 'art'],
    gradient: 'from-pink-600 to-rose-700',
  },
  {
    id: 'mystical',
    name: 'Mystical & Cosmic',
    emoji: '✨',
    description: 'Magical, spiritual, ethereal',
    themes: ['astrology', 'norse', 'egyptian', 'constellations'],
    gradient: 'from-purple-600 to-fuchsia-700',
  },
  {
    id: 'professional',
    name: 'Professional & Business',
    emoji: '🎯',
    description: 'Corporate, trustworthy, authoritative',
    themes: ['business', 'finance', 'urban', 'abstract'],
    gradient: 'from-slate-700 to-gray-800',
  },
];

/**
 * Get vibe pack by ID
 */
export function getVibePack(id: string): VibePack | undefined {
  return VIBE_PACKS.find(pack => pack.id === id);
}

/**
 * Get all vibe packs
 */
export function getAllVibePacks(): VibePack[] {
  return VIBE_PACKS;
}
