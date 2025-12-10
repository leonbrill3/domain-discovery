/**
 * 🎨 THEME SYSTEM - DomainSeek.ai
 *
 * Each theme is crafted to inspire and delight.
 * Prompts are optimized for Claude to generate creative, memorable domain names.
 */

export interface Theme {
  id: string;
  name: string;
  emoji: string;
  description: string;
  prompt: string;
  examples: string[];
  color: string;
  gradient: string;
  keywords: string[];
}

/**
 * 🏛️ ANCIENT GREEK - Timeless, Sophisticated, Legendary
 *
 * For brands that want to feel established, trustworthy, and epic.
 * Perfect for: SaaS, consulting, education, premium products
 */
const ANCIENT_GREEK: Theme = {
  id: 'ancient-greek',
  name: 'Ancient Greek',
  emoji: '🏛️',
  description: 'Mythological, timeless, sophisticated. Channel the power of the gods.',

  prompt: `Generate creative domain names inspired by Ancient Greek mythology and culture.

THEME ELEMENTS:
- Gods and goddesses: Zeus, Athena, Apollo, Artemis, Hermes, Hera
- Heroes and mortals: Hercules, Odysseus, Achilles, Perseus
- Places: Olympus, Delphi, Sparta, Athens, Elysium
- Concepts: Aether (pure air), Chronos (time), Kairos (opportunity), Ethos
- Mythology: Titan, Phoenix, Oracle, Muse, Aegis

NAMING PATTERNS:
1. Direct mythological references: olympus.io, athena.dev, apollo.app
2. Modern combinations: zeusrun.com, hermesmail.io, titanforge.dev
3. Conceptual blends: aetherflow.app, chronosync.io, kairosmoment.com

RULES:
- Mix classical names with modern tech suffixes (Run, App, Hub, Lab, Link, Flow, Sync)
- Names should feel powerful, trustworthy, established
- Prefer 6-15 characters (excluding TLD)
- Use only .com, .io, .ai, .app, .dev TLDs

OUTPUT FORMAT:
Return ONLY domain names, one per line. No numbering, no explanations.`,

  examples: [
    'olympusrun.com',
    'athenaai.io',
    'zeusapp.dev',
    'hermeslink.io',
    'titanforge.app',
    'apolloflow.com',
  ],

  color: '#3B82F6',  // Blue - wisdom, trust
  gradient: 'from-blue-500 via-blue-600 to-violet-600',

  keywords: [
    'mythology',
    'gods',
    'legendary',
    'timeless',
    'classical',
    'epic',
    'heroic',
    'olympian',
  ],
};

/**
 * 🌞 SOLAR SYSTEM - Futuristic, Expansive, Cosmic
 *
 * For brands that want to feel innovative, boundless, and visionary.
 * Perfect for: AI/ML startups, space tech, innovation, future-focused products
 */
const SOLAR_SYSTEM: Theme = {
  id: 'solar-system',
  name: 'Solar System',
  emoji: '🌞',
  description: 'Cosmic, futuristic, limitless. Reach for the stars.',

  prompt: `Generate creative domain names inspired by space, astronomy, and the solar system.

THEME ELEMENTS:
- Planets: Mars, Venus, Jupiter, Saturn, Neptune, Uranus
- Moons: Luna, Titan, Europa, Io, Callisto, Enceladus
- Celestial objects: Nova, Stellar, Nebula, Pulsar, Quasar, Comet
- Space concepts: Orbit, Eclipse, Gravity, Velocity, Cosmic, Astro
- Phenomena: Aurora, Supernova, Meteor, Galaxy, Constellation

NAMING PATTERNS:
1. Celestial names: nova.io, stellar.dev, lunar.app
2. Space concepts: orbitlab.com, cosmicflow.io, astrohub.dev
3. Creative blends: stellarscope.app, novaforge.io, lunalink.com

RULES:
- Combine space terms with action verbs (Scope, Stream, Link, Forge, Flow, Vision)
- Names should feel expansive, innovative, futuristic
- Prefer 6-14 characters (excluding TLD)
- Use only .com, .io, .ai, .app, .dev TLDs
- Avoid overused terms (space, star, rocket)

OUTPUT FORMAT:
Return ONLY domain names, one per line. No numbering, no explanations.`,

  examples: [
    'novaforge.io',
    'stellarlink.com',
    'lunaflow.app',
    'orbitlab.dev',
    'titanscope.io',
    'cosmicrun.com',
  ],

  color: '#F59E0B',  // Amber - energy, warmth
  gradient: 'from-amber-500 via-orange-500 to-red-600',

  keywords: [
    'space',
    'cosmic',
    'futuristic',
    'celestial',
    'astronomical',
    'stellar',
    'galactic',
    'orbital',
  ],
};

/**
 * 💬 GEN Z - Modern, Playful, Internet Culture
 *
 * For brands that want to feel fresh, relatable, and on-trend.
 * Perfect for: Social apps, content platforms, lifestyle brands, consumer products
 */
const GEN_Z: Theme = {
  id: 'gen-z',
  name: 'Gen Z',
  emoji: '💬',
  description: 'Playful, modern, authentic. Speak their language.',

  prompt: `Generate creative domain names inspired by Gen Z culture and internet trends.

THEME ELEMENTS:
- Modern slang: Vibe, Squad, Mood, Flex, Based, Fire, Slay, Drip
- Internet culture: Meme, Feed, Story, Stream, Post, Share, Snap
- Emotional states: Joy, Hype, Chill, Cozy, Zen, Energy, Glow
- Actions: Create, Build, Make, Share, Connect, Discover
- Aesthetics: Pixel, Retro, Neon, Pastel, Gradient

NAMING PATTERNS:
1. Slang + Tech: vibecheck.app, squadhub.io, moodfeed.com
2. Emotional + Action: joyflow.io, hypelabs.com, chillzone.app
3. Playful compounds: nocapfitness.app, dripsquad.io, vibestudio.com

RULES:
- Names should feel casual, friendly, approachable
- Use modern, trendy vocabulary that resonates with 18-30 year olds
- Keep it short and punchy (5-12 characters ideal)
- Make it memorable and easy to share
- Use only .com, .io, .ai, .app, .dev TLDs
- Avoid anything that feels corporate or stuffy

OUTPUT FORMAT:
Return ONLY domain names, one per line. No numbering, no explanations.`,

  examples: [
    'vibecheck.app',
    'squadflow.io',
    'nocapfit.com',
    'hyp elabs.dev',
    'driphub.io',
    'moodboard.app',
  ],

  color: '#EC4899',  // Pink - energy, youth
  gradient: 'from-pink-500 via-rose-500 to-purple-600',

  keywords: [
    'trendy',
    'modern',
    'playful',
    'internet',
    'social',
    'youthful',
    'authentic',
    'relatable',
  ],
};

/**
 * 🌿 NATURE - Organic, Natural, Grounded
 */
const NATURE: Theme = {
  id: 'nature',
  name: 'Nature',
  emoji: '🌿',
  description: 'Organic, earthy, natural',
  prompt: `Generate domain names inspired by nature and natural elements.
Elements: Mountains, rivers, forests, wildlife, weather, earth, flora, fauna.
Examples: willow, canyon, forest, river, summit, terra, cedar, moss.`,
  examples: ['willowapp.com', 'canyon.io', 'summitrun.dev'],
  color: '#10B981',
  gradient: 'from-green-500 to-emerald-600',
  keywords: ['nature', 'organic', 'earth', 'natural'],
};

/**
 * ⚡ TECH - Modern, Innovation, Silicon Valley
 */
const TECH: Theme = {
  id: 'tech',
  name: 'Tech',
  emoji: '⚡',
  description: 'Futuristic, innovative, cutting-edge',
  prompt: `Generate domain names inspired by technology and innovation.
Elements: Nexus, pixel, circuit, binary, quantum, neural, cyber, digital, matrix.
Examples: nexusai, pixelflow, quantumlab, neurallink, cyberforge.`,
  examples: ['nexusai.com', 'pixelflow.io', 'quantumlab.dev'],
  color: '#8B5CF6',
  gradient: 'from-violet-500 to-purple-600',
  keywords: ['tech', 'innovation', 'futuristic', 'digital'],
};

/**
 * 📚 LITERARY - Classic, Bookish, Sophisticated
 */
const LITERARY: Theme = {
  id: 'literary',
  name: 'Literary',
  emoji: '📚',
  description: 'Classic literature references',
  prompt: `Generate domain names inspired by classic literature and authors.
Elements: Authors (Hemingway, Austen, Dickens), Characters, Literary terms.
Examples: gatsbyapp, sherlockrun, danteflow, byronlab.`,
  examples: ['gatsbyapp.com', 'sherlockrun.io', 'byronlab.dev'],
  color: '#D97706',
  gradient: 'from-amber-600 to-orange-600',
  keywords: ['literary', 'classic', 'sophisticated'],
};

/**
 * 🎭 ABSTRACT - Conceptual, Philosophical, Unique
 */
const ABSTRACT: Theme = {
  id: 'abstract',
  name: 'Abstract',
  emoji: '🎭',
  description: 'Conceptual and philosophical',
  prompt: `Generate domain names inspired by abstract concepts and philosophy.
Elements: Essence, zenith, paradigm, nexus, kinetic, ethereal, quantum.
Examples: zenithapp, paradigmflow, kineticlab.`,
  examples: ['zenithapp.com', 'paradigmflow.io', 'kineticlab.dev'],
  color: '#A855F7',
  gradient: 'from-purple-500 to-fuchsia-600',
  keywords: ['abstract', 'conceptual', 'philosophical'],
};

/**
 * 🏙️ URBAN - Metropolitan, Modern, Cityscape
 */
const URBAN: Theme = {
  id: 'urban',
  name: 'Urban',
  emoji: '🏙️',
  description: 'Metropolitan and modern',
  prompt: `Generate domain names inspired by urban life and cityscapes.
Elements: Metro, urban, street, borough, district, avenue, plaza.
Examples: metrofit, urbanflow, avenuehub.`,
  examples: ['metrofit.com', 'urbanflow.io', 'avenuehub.dev'],
  color: '#64748B',
  gradient: 'from-slate-500 to-gray-600',
  keywords: ['urban', 'city', 'metropolitan'],
};

/**
 * 🎮 GAMING - Playful, Competitive, Action
 */
const GAMING: Theme = {
  id: 'gaming',
  name: 'Gaming',
  emoji: '🎮',
  description: 'Gaming and esports inspired',
  prompt: `Generate domain names inspired by gaming and esports.
Elements: Quest, arcade, pixel, player, guild, arena, nexus, raid.
Examples: questforge, arcadeflow, playerone, guildhub.`,
  examples: ['questforge.com', 'arcadeflow.io', 'playerone.gg'],
  color: '#EF4444',
  gradient: 'from-red-500 to-rose-600',
  keywords: ['gaming', 'esports', 'playful'],
};

/**
 * 🍰 FOOD & LIFESTYLE - Culinary, Wellness, Lifestyle
 */
const FOOD_LIFESTYLE: Theme = {
  id: 'food-lifestyle',
  name: 'Food & Lifestyle',
  emoji: '🍰',
  description: 'Culinary and wellness',
  prompt: `Generate domain names inspired by food, wellness, and lifestyle.
Elements: Fresh, sage, mint, blend, savor, nourish, pure, zen.
Examples: freshblend, sagewell, mintflow, nourishapp.`,
  examples: ['freshblend.com', 'sagewell.io', 'mintflow.app'],
  color: '#F97316',
  gradient: 'from-orange-500 to-amber-600',
  keywords: ['food', 'lifestyle', 'wellness'],
};

/**
 * 🏛️ ROMAN MYTHOLOGY
 */
const ROMAN_MYTHOLOGY: Theme = {
  id: 'roman',
  name: 'Roman',
  emoji: '🏛️',
  description: 'Roman gods and empire',
  prompt: 'Generate domains using Roman mythology: Jupiter, Mars, Venus, Mercury, Apollo, Caesar.',
  examples: ['jupiterapp.io', 'marsforce.com'],
  color: '#DC2626',
  gradient: 'from-red-600 to-orange-600',
  keywords: ['roman', 'empire'],
};

const NORSE_MYTHOLOGY: Theme = {
  id: 'norse',
  name: 'Norse',
  emoji: '⚔️',
  description: 'Vikings and Nordic gods',
  prompt: 'Generate domains using Norse mythology: Thor, Odin, Valhalla, Viking.',
  examples: ['thorforce.io', 'odinlab.dev'],
  color: '#1E40AF',
  gradient: 'from-blue-800 to-slate-700',
  keywords: ['norse', 'viking'],
};

const LATIN: Theme = {
  id: 'latin',
  name: 'Latin',
  emoji: '📜',
  description: 'Latin words',
  prompt: 'Generate domains using Latin: Vita, Lux, Veritas, Magnus.',
  examples: ['vitalab.com', 'luxflow.io'],
  color: '#92400E',
  gradient: 'from-amber-800 to-yellow-700',
  keywords: ['latin'],
};

const ASTROLOGY: Theme = {
  id: 'astrology',
  name: 'Astrology',
  emoji: '⭐',
  description: 'Zodiac and astrology',
  prompt: 'Generate domains using astrology: Aries, Leo, Cosmic, Moon.',
  examples: ['leorise.app', 'cosmicflow.io'],
  color: '#7C3AED',
  gradient: 'from-violet-600 to-purple-600',
  keywords: ['astrology', 'zodiac'],
};

const PHYSICS: Theme = {
  id: 'physics',
  name: 'Physics',
  emoji: '⚛️',
  description: 'Physics and quantum',
  prompt: 'Generate domains using physics: Quantum, Atom, Energy.',
  examples: ['quantumflow.io', 'atomlab.com'],
  color: '#7C3AED',
  gradient: 'from-violet-600 to-purple-700',
  keywords: ['physics', 'quantum'],
};

const BUSINESS: Theme = {
  id: 'business',
  name: 'Business',
  emoji: '💼',
  description: 'Business terms',
  prompt: 'Generate domains using business: Summit, Venture, Growth.',
  examples: ['venturehq.io', 'summitcap.com'],
  color: '#1E40AF',
  gradient: 'from-blue-800 to-indigo-700',
  keywords: ['business'],
};

// Add missing themes needed for vibe packs
const OCEAN: Theme = {
  id: 'ocean',
  name: 'Ocean',
  emoji: '🌊',
  description: 'Ocean and marine',
  prompt: 'Generate domains using ocean: Wave, Tide, Aqua.',
  examples: ['waveflow.io', 'aquaforce.app'],
  color: '#0891B2',
  gradient: 'from-cyan-600 to-blue-600',
  keywords: ['ocean'],
};

const MOUNTAINS: Theme = {
  id: 'mountains',
  name: 'Mountains',
  emoji: '⛰️',
  description: 'Mountains and peaks',
  prompt: 'Generate domains using mountains: Summit, Peak, Alpine.',
  examples: ['summitapp.io', 'peakforce.com'],
  color: '#78716C',
  gradient: 'from-stone-600 to-gray-700',
  keywords: ['mountain'],
};

const WELLNESS: Theme = {
  id: 'wellness',
  name: 'Wellness',
  emoji: '🧘',
  description: 'Health and wellness',
  prompt: 'Generate domains using wellness: Zen, Balance, Vital.',
  examples: ['zenflow.io', 'vitalforce.app'],
  color: '#10B981',
  gradient: 'from-emerald-500 to-green-600',
  keywords: ['wellness'],
};

const MUSIC: Theme = {
  id: 'music',
  name: 'Music',
  emoji: '🎵',
  description: 'Music and sound',
  prompt: 'Generate domains using music: Rhythm, Harmony, Beat.',
  examples: ['rhythmflow.io', 'harmonylab.com'],
  color: '#DB2777',
  gradient: 'from-pink-600 to-rose-600',
  keywords: ['music'],
};

const ART: Theme = {
  id: 'art',
  name: 'Art',
  emoji: '🎨',
  description: 'Visual art',
  prompt: 'Generate domains using art: Canvas, Palette, Studio.',
  examples: ['canvasflow.io', 'palettelab.com'],
  color: '#C026D3',
  gradient: 'from-fuchsia-600 to-pink-600',
  keywords: ['art'],
};

const EGYPTIAN_MYTHOLOGY: Theme = {
  id: 'egyptian',
  name: 'Egyptian',
  emoji: '🔺',
  description: 'Ancient Egypt',
  prompt: 'Generate domains using Egyptian: Ra, Sphinx, Pharaoh.',
  examples: ['raenergy.io', 'sphinxlab.com'],
  color: '#D97706',
  gradient: 'from-amber-600 to-yellow-600',
  keywords: ['egyptian'],
};

const CONSTELLATIONS: Theme = {
  id: 'constellations',
  name: 'Constellations',
  emoji: '✨',
  description: 'Star patterns',
  prompt: 'Generate domains using constellations: Orion, Andromeda, Lyra.',
  examples: ['orionlab.io', 'andromedaapp.com'],
  color: '#6366F1',
  gradient: 'from-indigo-500 to-blue-600',
  keywords: ['stars'],
};

const FINANCE: Theme = {
  id: 'finance',
  name: 'Finance',
  emoji: '💰',
  description: 'Finance and investing',
  prompt: 'Generate domains using finance: Fund, Equity, Wealth.',
  examples: ['primecap.io', 'wealthforge.app'],
  color: '#047857',
  gradient: 'from-emerald-700 to-green-800',
  keywords: ['finance'],
};

/**
 * Export all themes (24 total)
 */
export const THEMES = {
  // Original 10
  'ancient-greek': ANCIENT_GREEK,
  'solar-system': SOLAR_SYSTEM,
  'gen-z': GEN_Z,
  'nature': NATURE,
  'tech': TECH,
  'literary': LITERARY,
  'abstract': ABSTRACT,
  'urban': URBAN,
  'gaming': GAMING,
  'food-lifestyle': FOOD_LIFESTYLE,

  // Extended 14 (all needed for vibe packs)
  'roman': ROMAN_MYTHOLOGY,
  'norse': NORSE_MYTHOLOGY,
  'latin': LATIN,
  'astrology': ASTROLOGY,
  'physics': PHYSICS,
  'business': BUSINESS,
  'ocean': OCEAN,
  'mountains': MOUNTAINS,
  'wellness': WELLNESS,
  'music': MUSIC,
  'art': ART,
  'egyptian': EGYPTIAN_MYTHOLOGY,
  'constellations': CONSTELLATIONS,
  'finance': FINANCE,
} as const;

export type ThemeId = keyof typeof THEMES;

/**
 * Get theme by ID
 */
export function getTheme(id: ThemeId): Theme {
  return THEMES[id];
}

/**
 * Get all theme IDs
 */
export function getAllThemeIds(): ThemeId[] {
  return Object.keys(THEMES) as ThemeId[];
}

/**
 * Get all themes as array
 */
export function getAllThemes(): Theme[] {
  return Object.values(THEMES);
}

/**
 * Validate theme ID
 */
export function isValidThemeId(id: string): id is ThemeId {
  return id in THEMES;
}
