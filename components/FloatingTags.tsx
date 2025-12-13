'use client';

import { useEffect, useState } from 'react';

interface FloatingTagsProps {
  onTagClick: (tag: string) => void;
}

// Example sentences organized by row - teaches users what they can type
const EXAMPLE_ROWS = [
  [
    'meditation app for busy professionals',
    'fintech startup with greek god names',
    'minimalist productivity tool',
    'space exploration game',
  ],
  [
    'short punchy gaming clan name',
    'japanese inspired coffee brand',
    'vintage record label vibes',
    'futuristic AI assistant',
  ],
  [
    'nature inspired wellness brand',
    'astrology app for millennials',
    'made-up word for tech startup',
    'music streaming platform',
  ],
  [
    'creative agency with latin flair',
    'food delivery app, fun and playful',
    'real english words only',
    'abstract art marketplace',
  ],
];

// Animation durations for each row (seconds) - different speeds create depth
const ROW_DURATIONS = [40, 35, 38, 32];

// Words that rotate in the headline like sportsalert.ai
const ROTATING_WORDS = [
  'meditation app',
  'fintech startup',
  'gaming clan',
  'SaaS product',
  'creative agency',
  'AI project',
  'coffee brand',
  'fitness app',
  'music label',
  'tech company',
];

export function FloatingTags({ onTagClick }: FloatingTagsProps) {
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  if (!isClient) {
    return <div className="h-32" />; // Placeholder during SSR
  }

  return (
    <div className="space-y-4 py-4">
      {EXAMPLE_ROWS.map((examples, rowIndex) => (
        <ExampleRow
          key={rowIndex}
          examples={examples}
          delay={rowIndex * 0.8} // Stagger the animations
          onExampleClick={onTagClick}
        />
      ))}
    </div>
  );
}

// Rotating text component like sportsalert.ai
export function RotatingText({ words = ROTATING_WORDS }: { words?: string[] }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      setIsAnimating(true);
      setTimeout(() => {
        setCurrentIndex((prev) => (prev + 1) % words.length);
        setIsAnimating(false);
      }, 500); // Half of total transition time
    }, 3000); // Change every 3 seconds

    return () => clearInterval(interval);
  }, [words.length]);

  return (
    <span className="relative inline-block min-w-[200px]">
      <span
        className={`inline-block transition-all duration-500 ${
          isAnimating
            ? 'opacity-0 transform -translate-y-4'
            : 'opacity-100 transform translate-y-0'
        }`}
      >
        <span className="bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">
          {words[currentIndex]}
        </span>
      </span>
    </span>
  );
}

// Example row with rotating text animation
interface ExampleRowProps {
  examples: string[];
  delay: number;
  onExampleClick: (example: string) => void;
}

function ExampleRow({ examples, delay, onExampleClick }: ExampleRowProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    // Initial delay before starting
    const startDelay = setTimeout(() => {
      const interval = setInterval(() => {
        setIsAnimating(true);
        setTimeout(() => {
          setCurrentIndex((prev) => (prev + 1) % examples.length);
          setIsAnimating(false);
        }, 400);
      }, 6000); // Change every 6 seconds (slower rotation)

      return () => clearInterval(interval);
    }, delay * 1000);

    return () => clearTimeout(startDelay);
  }, [examples.length, delay]);

  const currentExample = examples[currentIndex];

  return (
    <div className="flex justify-center">
      <button
        onClick={() => onExampleClick(currentExample)}
        className="text-center cursor-pointer group"
      >
        <span
          className={`inline-block transition-all duration-400 text-slate-400
                      group-hover:text-slate-200 text-lg
                      ${isAnimating
                        ? 'opacity-0 transform -translate-y-3'
                        : 'opacity-100 transform translate-y-0'
                      }`}
        >
          "{currentExample}"
        </span>
      </button>
    </div>
  );
}

export default FloatingTags;
