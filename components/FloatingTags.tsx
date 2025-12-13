'use client';

import { useEffect, useState, useRef, useCallback } from 'react';

interface FloatingTagsProps {
  onTagClick: (tag: string) => void;
}

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

// Inspiration sources - 3 rows, 10 items each = 30 items
// Arrays rotate between multiple options
const LANE_ITEMS: (string | string[])[] = [
  // Row 1 (10 items)
  'greek mythology',
  'biblical names',
  'latin roots',
  ['japanese words', 'hawaiian words', 'sanskrit terms'],
  'pearl jam lyrics',
  'famous paintings',
  'gemstone names',
  'obscure colors',
  'types of rock',
  'athlete nicknames',
  // Row 2 (10 items)
  'astronomy terms',
  'ocean creatures',
  ['spice names', 'coffee terms', 'wine terminology'],
  'fabric types',
  'chess terms',
  'poker hands',
  'dance styles',
  'cloud types',
  ['tree species', 'flower names', 'botanical terms'],
  'cocktail names',
  // Row 3 (10 items)
  'typeface names',
  'architecture terms',
  'pasta shapes',
  'sword types',
  ['weather terms', 'nautical terms', 'aviation terms'],
  'photography terms',
  'whiskey terms',
  'musical instruments',
  'car models',
  'constellation names',
];

interface LaneItem {
  id: number;
  text: string | string[];
  row: number;
  x: number;
  vx: number;
}

// Stagger delays for rotating items
const ROTATION_DELAYS = [0, 2500, 5000, 7500];

// Single floating tag with optional rotation
function FloatingTag({
  item,
  y,
  onClick,
  rotatingIndex,
}: {
  item: LaneItem;
  y: number;
  onClick: (text: string) => void;
  rotatingIndex: number;
}) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isVisible, setIsVisible] = useState(true);
  const isRotating = Array.isArray(item.text);
  const texts: string[] = isRotating ? (item.text as string[]) : [item.text as string];
  const currentText = texts[currentIndex];

  useEffect(() => {
    if (!isRotating) return;

    const delay = ROTATION_DELAYS[rotatingIndex % ROTATION_DELAYS.length];
    const startTimeout = setTimeout(() => {
      const interval = setInterval(() => {
        setIsVisible(false);
        setTimeout(() => {
          setCurrentIndex((prev) => (prev + 1) % texts.length);
          setIsVisible(true);
        }, 400);
      }, 8000); // Rotate every 8 seconds

      return () => clearInterval(interval);
    }, delay);

    return () => clearTimeout(startTimeout);
  }, [isRotating, texts.length, rotatingIndex]);

  return (
    <button
      onClick={() => onClick(currentText)}
      className="absolute whitespace-nowrap text-slate-500 hover:text-slate-300 text-base cursor-pointer transition-colors duration-200"
      style={{
        left: item.x,
        top: y,
        transform: 'translate(-50%, -50%)',
      }}
    >
      <span
        className="inline-block transition-all duration-400 ease-in-out"
        style={{
          opacity: isVisible ? 1 : 0,
          transform: isVisible ? 'translateY(0)' : 'translateY(-4px)',
        }}
      >
        {currentText}
      </span>
    </button>
  );
}

export function FloatingTags({ onTagClick }: FloatingTagsProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [items, setItems] = useState<LaneItem[]>([]);
  const [isClient, setIsClient] = useState(false);
  const [containerWidth, setContainerWidth] = useState(800);
  const animationRef = useRef<number>();
  const itemsRef = useRef<LaneItem[]>([]);
  const initializedRef = useRef(false);

  const NUM_ROWS = 3;
  const ITEMS_PER_ROW = 10;

  // Set client flag
  useEffect(() => {
    setIsClient(true);
  }, []);

  // Initialize items in horizontal lanes
  useEffect(() => {
    if (!isClient || initializedRef.current) return;

    const container = containerRef.current;
    if (!container) return;

    const rect = container.getBoundingClientRect();
    const width = rect.width || 800;

    if (width === 0) return;

    initializedRef.current = true;
    setContainerWidth(width);

    // Space items evenly across the TOTAL track length (visible width + offscreen buffer)
    // CRITICAL: All items in same row MUST have identical speed to prevent overlap
    const rowSpeeds = [0.2, -0.18, 0.22]; // Fixed speed per row (no randomness!)

    // Total track length - items are spread across this entire distance
    // This ensures equal spacing even when items wrap around
    const trackLength = width * 2; // 2x screen width - balanced spacing
    const spacing = trackLength / ITEMS_PER_ROW; // Equal spacing between items

    const initialItems: LaneItem[] = LANE_ITEMS.map((text, i) => {
      const row = Math.floor(i / ITEMS_PER_ROW);
      const col = i % ITEMS_PER_ROW;

      // Spread items evenly across the track
      const x = spacing * col + spacing / 2;

      // All items in same row have SAME speed - no overlap possible
      return { id: i, text, row, x, vx: rowSpeeds[row] };
    });

    setItems(initialItems);
    itemsRef.current = initialItems;
  }, [isClient]);

  // Animation loop - items only move horizontally in their lane
  const animate = useCallback(() => {
    const container = containerRef.current;
    if (!container) {
      animationRef.current = requestAnimationFrame(animate);
      return;
    }

    const width = container.getBoundingClientRect().width;
    const trackLength = width * 2; // Must match initialization

    const updatedItems = itemsRef.current.map((item) => {
      let { x, vx } = item;

      // Move horizontally
      x += vx;

      // Wrap around using track length (maintains equal spacing)
      if (x < -150) {
        x += trackLength;
      } else if (x > trackLength - 150) {
        x -= trackLength;
      }

      return { ...item, x };
    });

    itemsRef.current = updatedItems;
    setItems(updatedItems);
    animationRef.current = requestAnimationFrame(animate);
  }, []);

  // Start animation
  useEffect(() => {
    if (!isClient) return;

    animationRef.current = requestAnimationFrame(animate);
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [isClient, animate]);

  if (!isClient) {
    return <div className="h-28" />;
  }

  // Calculate Y position for each row
  const containerHeight = 112; // h-28 = 112px
  const rowHeight = containerHeight / NUM_ROWS;
  const getRowY = (row: number) => rowHeight * row + rowHeight / 2;

  return (
    <div ref={containerRef} className="relative w-full h-28 overflow-hidden">
      {/* Gradient fade edges */}
      <div className="pointer-events-none absolute left-0 top-0 bottom-0 w-20 bg-gradient-to-r from-slate-950 to-transparent z-10" />
      <div className="pointer-events-none absolute right-0 top-0 bottom-0 w-20 bg-gradient-to-l from-slate-950 to-transparent z-10" />

      {items.map((item) => {
        const isRotating = Array.isArray(item.text);
        return (
          <FloatingTag
            key={item.id}
            item={item}
            y={getRowY(item.row)}
            onClick={onTagClick}
            rotatingIndex={isRotating ? item.id : 0}
          />
        );
      })}
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

export default FloatingTags;
