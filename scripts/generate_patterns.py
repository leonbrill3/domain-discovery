#!/usr/bin/env python3
"""
Generate phonetically valid, brandable word patterns.
Outputs to patterns.txt - one word per line.
"""

import itertools
from typing import Generator
import sys

# Good consonants (removed q, x which rarely appear in brandable words)
CONSONANTS = list('bcdfghjklmnprstvwz')

# Vowels
VOWELS = list('aeiou')

# Valid starting consonant clusters
START_CLUSTERS = [
    'bl', 'br', 'ch', 'cl', 'cr', 'dr', 'fl', 'fr', 'gl', 'gr',
    'pl', 'pr', 'sc', 'sh', 'sk', 'sl', 'sm', 'sn', 'sp', 'st',
    'sw', 'th', 'tr', 'tw', 'wh', 'wr'
]

# Valid ending consonant clusters
END_CLUSTERS = [
    'ch', 'ck', 'ct', 'ft', 'ld', 'lf', 'lk', 'lm', 'lp', 'lt',
    'mp', 'nd', 'ng', 'nk', 'nt', 'pt', 'rb', 'rd', 'rf', 'rg',
    'rk', 'rl', 'rm', 'rn', 'rp', 'rt', 'sh', 'sk', 'sp', 'st', 'th'
]

# Bad patterns to filter out
BAD_PATTERNS = {
    # Double letters that look weird
    'aa', 'ii', 'uu',
    # Hard to pronounce
    'bv', 'fv', 'gj', 'hj', 'kj', 'pv', 'vb', 'vf', 'vp',
    # Just ugly
    'jr', 'rj', 'wj', 'jw', 'zj', 'jz',
}


def is_pronounceable(word: str) -> bool:
    """Filter out unpronounceable combinations."""
    word = word.lower()

    # Check for bad patterns
    for bad in BAD_PATTERNS:
        if bad in word:
            return False

    # No triple consonants
    consonant_count = 0
    for char in word:
        if char in CONSONANTS:
            consonant_count += 1
            if consonant_count >= 3:
                return False
        else:
            consonant_count = 0

    # No triple vowels
    vowel_count = 0
    for char in word:
        if char in VOWELS:
            vowel_count += 1
            if vowel_count >= 3:
                return False
        else:
            vowel_count = 0

    return True


def generate_cvcv() -> Generator[str, None, None]:
    """Generate CVCV patterns (4 letters): zova, bira, melo"""
    for c1 in CONSONANTS:
        for v1 in VOWELS:
            for c2 in CONSONANTS:
                for v2 in VOWELS:
                    word = c1 + v1 + c2 + v2
                    if is_pronounceable(word):
                        yield word


def generate_cvcvc() -> Generator[str, None, None]:
    """Generate CVCVC patterns (5 letters): zovax, birak"""
    for c1 in CONSONANTS:
        for v1 in VOWELS:
            for c2 in CONSONANTS:
                for v2 in VOWELS:
                    for c3 in CONSONANTS:
                        word = c1 + v1 + c2 + v2 + c3
                        if is_pronounceable(word):
                            yield word


def generate_ccvcv() -> Generator[str, None, None]:
    """Generate CCVCV patterns (5 letters): blaze, crivo"""
    for cc in START_CLUSTERS:
        for v1 in VOWELS:
            for c in CONSONANTS:
                for v2 in VOWELS:
                    word = cc + v1 + c + v2
                    if is_pronounceable(word):
                        yield word


def generate_cvccv() -> Generator[str, None, None]:
    """Generate CVCCV patterns (5 letters): bolta, melpa"""
    for c1 in CONSONANTS:
        for v1 in VOWELS:
            for cc in END_CLUSTERS:
                for v2 in VOWELS:
                    # Only use end clusters that work mid-word
                    if cc in ['ld', 'lf', 'lk', 'lm', 'lp', 'lt', 'mp', 'nd', 'ng', 'nk', 'nt', 'rb', 'rd', 'rg', 'rk', 'rm', 'rn', 'rp', 'rt']:
                        word = c1 + v1 + cc + v2
                        if is_pronounceable(word):
                            yield word


def generate_cvcvcv() -> Generator[str, None, None]:
    """Generate CVCVCV patterns (6 letters): banana, zenova"""
    for c1 in CONSONANTS:
        for v1 in VOWELS:
            for c2 in CONSONANTS:
                for v2 in VOWELS:
                    for c3 in CONSONANTS:
                        for v3 in VOWELS:
                            word = c1 + v1 + c2 + v2 + c3 + v3
                            if is_pronounceable(word):
                                yield word


def generate_ccvcvc() -> Generator[str, None, None]:
    """Generate CCVCVC patterns (6 letters): blazer, crispy"""
    for cc in START_CLUSTERS:
        for v1 in VOWELS:
            for c in CONSONANTS:
                for v2 in VOWELS:
                    for c2 in CONSONANTS:
                        word = cc + v1 + c + v2 + c2
                        if is_pronounceable(word):
                            yield word


def main():
    output_file = 'patterns.txt'

    print("Generating phonetically valid patterns...")
    print("=" * 50)

    patterns = {
        'CVCV (4)': generate_cvcv,
        'CVCVC (5)': generate_cvcvc,
        'CCVCV (5)': generate_ccvcv,
        'CVCCV (5)': generate_cvccv,
        'CVCVCV (6)': generate_cvcvcv,
        'CCVCVC (6)': generate_ccvcvc,
    }

    total = 0
    all_words = set()  # Deduplicate

    for pattern_name, generator in patterns.items():
        count = 0
        for word in generator():
            if word not in all_words:
                all_words.add(word)
                count += 1
        print(f"{pattern_name}: {count:,} words")
        total += count

    print("=" * 50)
    print(f"Total unique patterns: {len(all_words):,}")

    # Write to file
    print(f"\nWriting to {output_file}...")
    with open(output_file, 'w') as f:
        for word in sorted(all_words):
            f.write(word + '\n')

    print(f"Done! Saved {len(all_words):,} patterns to {output_file}")

    # Show sample
    print("\nSample patterns:")
    import random
    sample = random.sample(list(all_words), 20)
    for word in sorted(sample):
        print(f"  {word}")


if __name__ == '__main__':
    main()
