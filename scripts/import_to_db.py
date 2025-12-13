#!/usr/bin/env python3
"""
Import available domains from txt file to PostgreSQL (Neon)
"""
import os
import sys
import argparse
from datetime import datetime

# Install if needed: pip install psycopg2-binary
try:
    import psycopg2
    from psycopg2.extras import execute_batch
except ImportError:
    print("Installing psycopg2-binary...")
    os.system("pip3 install psycopg2-binary")
    import psycopg2
    from psycopg2.extras import execute_batch

# Pattern detection
VOWELS = set('aeiou')
CONSONANTS = set('bcdfghjklmnprstvwz')

def detect_pattern(word: str) -> str:
    """Detect phonetic pattern like CVCV, CVCVC, etc."""
    pattern = []
    i = 0
    while i < len(word):
        # Check for digraphs (2-char clusters)
        if i < len(word) - 1:
            digraph = word[i:i+2].lower()
            if digraph in {'ch', 'sh', 'th', 'wh', 'wr', 'ck', 'ng', 'nk'}:
                pattern.append('C')
                i += 2
                continue

        char = word[i].lower()
        if char in VOWELS:
            pattern.append('V')
        elif char in CONSONANTS:
            pattern.append('C')
        else:
            pattern.append('?')
        i += 1

    # Merge consecutive same letters
    merged = []
    for p in pattern:
        if not merged or merged[-1] != p:
            merged.append(p)

    return ''.join(merged)

def import_domains(file_path: str, tld: str, db_url: str, batch_size: int = 1000):
    """Import domains from file to database."""

    if not os.path.exists(file_path):
        print(f"Error: File not found: {file_path}")
        sys.exit(1)

    # Count lines first
    with open(file_path, 'r') as f:
        total_lines = sum(1 for _ in f)

    print(f"Found {total_lines:,} domains to import")

    # Connect to database
    print(f"Connecting to database...")
    conn = psycopg2.connect(db_url)
    cur = conn.cursor()

    # Prepare insert query
    insert_query = """
        INSERT INTO available_domains (id, domain, word, tld, length, pattern, "checkedAt")
        VALUES (gen_random_uuid(), %s, %s, %s, %s, %s, %s)
        ON CONFLICT (domain) DO NOTHING
    """

    imported = 0
    skipped = 0
    now = datetime.utcnow()

    with open(file_path, 'r') as f:
        batch = []
        for i, line in enumerate(f, 1):
            domain = line.strip()
            if not domain:
                continue

            # Parse domain
            parts = domain.rsplit('.', 1)
            if len(parts) != 2:
                skipped += 1
                continue

            word = parts[0]
            domain_tld = parts[1]

            # Skip if TLD doesn't match
            if domain_tld != tld:
                skipped += 1
                continue

            pattern = detect_pattern(word)

            batch.append((
                domain,
                word,
                domain_tld,
                len(word),
                pattern,
                now
            ))

            # Execute batch
            if len(batch) >= batch_size:
                execute_batch(cur, insert_query, batch)
                conn.commit()
                imported += len(batch)
                batch = []
                print(f"Imported {imported:,}/{total_lines:,} ({100*imported//total_lines}%)", end='\r')

        # Final batch
        if batch:
            execute_batch(cur, insert_query, batch)
            conn.commit()
            imported += len(batch)

    cur.close()
    conn.close()

    print(f"\n\nDone!")
    print(f"  Imported: {imported:,}")
    print(f"  Skipped: {skipped:,}")

def main():
    parser = argparse.ArgumentParser(description='Import available domains to PostgreSQL')
    parser.add_argument('--file', '-f', default='available_ai.txt', help='Input file with domains')
    parser.add_argument('--tld', '-t', default='ai', help='TLD to import')
    parser.add_argument('--db', '-d', help='Database URL (or set DATABASE_URL env var)')
    parser.add_argument('--batch', '-b', type=int, default=1000, help='Batch size')

    args = parser.parse_args()

    db_url = args.db or os.environ.get('DATABASE_URL')
    if not db_url:
        print("Error: Database URL required. Use --db or set DATABASE_URL env var")
        print("\nFor Neon, get your connection string from:")
        print("  https://console.neon.tech -> Your project -> Connection Details")
        print("\nExample:")
        print("  export DATABASE_URL='postgresql://user:pass@ep-xxx.us-east-2.aws.neon.tech/neondb?sslmode=require'")
        sys.exit(1)

    import_domains(args.file, args.tld, db_url, args.batch)

if __name__ == '__main__':
    main()
