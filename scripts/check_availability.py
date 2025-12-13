#!/usr/bin/env python3
"""
Check domain availability via RDAP with resume capability.
Saves progress every 100 checks so it can resume after interruption.

Usage:
    python check_availability.py [--tld ai] [--rate 30]

Options:
    --tld: TLD to check (default: ai)
    --rate: Checks per minute (default: 30)
"""

import requests
import time
import json
import argparse
from pathlib import Path
from datetime import datetime
from typing import Optional

# RDAP endpoints by TLD
RDAP_ENDPOINTS = {
    'ai': 'https://rdap.identitydigital.services/rdap/domain/',
    'io': 'https://rdap.identitydigital.services/rdap/domain/',
    'com': 'https://rdap.verisign.com/com/v1/domain/',
    'net': 'https://rdap.verisign.com/net/v1/domain/',
}

# File paths
PATTERNS_FILE = 'patterns.txt'
CHECKPOINT_FILE = 'checkpoint_{tld}.json'
AVAILABLE_FILE = 'available_{tld}.txt'
TAKEN_FILE = 'taken_{tld}.txt'
LOG_FILE = 'check_{tld}.log'


def log(message: str, tld: str):
    """Log message to file and stdout."""
    timestamp = datetime.now().strftime('%Y-%m-%d %H:%M:%S')
    log_line = f"[{timestamp}] {message}"
    print(log_line)
    with open(LOG_FILE.format(tld=tld), 'a') as f:
        f.write(log_line + '\n')


def load_checkpoint(tld: str) -> dict:
    """Load checkpoint or return default state."""
    checkpoint_path = Path(CHECKPOINT_FILE.format(tld=tld))
    if checkpoint_path.exists():
        with open(checkpoint_path) as f:
            return json.load(f)
    return {
        'last_index': 0,
        'checked': 0,
        'available': 0,
        'taken': 0,
        'errors': 0,
        'started_at': datetime.now().isoformat(),
    }


def save_checkpoint(state: dict, tld: str):
    """Save checkpoint state."""
    state['updated_at'] = datetime.now().isoformat()
    with open(CHECKPOINT_FILE.format(tld=tld), 'w') as f:
        json.dump(state, f, indent=2)


def check_rdap(domain: str, tld: str) -> Optional[bool]:
    """
    Check domain availability via RDAP.
    Returns: True if available, False if taken, None if error.
    """
    endpoint = RDAP_ENDPOINTS.get(tld)
    if not endpoint:
        raise ValueError(f"Unknown TLD: {tld}")

    try:
        response = requests.get(
            f"{endpoint}{domain}",
            timeout=10,
            headers={'Accept': 'application/rdap+json'}
        )

        if response.status_code == 404:
            return True  # Available
        elif response.status_code == 200:
            return False  # Taken
        else:
            return None  # Error

    except requests.exceptions.Timeout:
        return None
    except requests.exceptions.RequestException:
        return None


def main():
    parser = argparse.ArgumentParser(description='Check domain availability')
    parser.add_argument('--tld', default='ai', help='TLD to check (default: ai)')
    parser.add_argument('--rate', type=int, default=30, help='Checks per minute (default: 30)')
    parser.add_argument('--limit', type=int, default=0, help='Max domains to check (0=unlimited)')
    args = parser.parse_args()

    tld = args.tld
    rate = args.rate
    delay = 60.0 / rate  # Seconds between checks

    # Load patterns
    if not Path(PATTERNS_FILE).exists():
        print(f"Error: {PATTERNS_FILE} not found. Run generate_patterns.py first.")
        return

    with open(PATTERNS_FILE) as f:
        patterns = [line.strip() for line in f if line.strip()]

    total_patterns = len(patterns)
    log(f"Loaded {total_patterns:,} patterns", tld)

    # Load checkpoint
    state = load_checkpoint(tld)
    start_index = state['last_index']
    log(f"Resuming from index {start_index:,} ({start_index/total_patterns*100:.1f}%)", tld)

    # Open output files in append mode
    available_file = open(AVAILABLE_FILE.format(tld=tld), 'a')
    taken_file = open(TAKEN_FILE.format(tld=tld), 'a')

    try:
        for i, word in enumerate(patterns[start_index:], start=start_index):
            if args.limit and state['checked'] >= args.limit:
                log(f"Reached limit of {args.limit} checks", tld)
                break

            domain = f"{word}.{tld}"
            result = check_rdap(domain, tld)

            if result is True:
                available_file.write(domain + '\n')
                available_file.flush()
                state['available'] += 1
                status = "AVAILABLE"
            elif result is False:
                taken_file.write(domain + '\n')
                taken_file.flush()
                state['taken'] += 1
                status = "taken"
            else:
                state['errors'] += 1
                status = "ERROR"

            state['checked'] += 1
            state['last_index'] = i + 1

            # Progress log every 100
            if state['checked'] % 100 == 0:
                pct = i / total_patterns * 100
                avail_rate = state['available'] / state['checked'] * 100 if state['checked'] > 0 else 0
                log(f"Progress: {i:,}/{total_patterns:,} ({pct:.1f}%) | "
                    f"Available: {state['available']:,} ({avail_rate:.1f}%) | "
                    f"Errors: {state['errors']}", tld)
                save_checkpoint(state, tld)

            # Rate limiting
            time.sleep(delay)

    except KeyboardInterrupt:
        log("Interrupted by user. Saving checkpoint...", tld)
    finally:
        save_checkpoint(state, tld)
        available_file.close()
        taken_file.close()

    # Final summary
    log("=" * 50, tld)
    log(f"Final Stats for .{tld}:", tld)
    log(f"  Checked: {state['checked']:,}", tld)
    log(f"  Available: {state['available']:,}", tld)
    log(f"  Taken: {state['taken']:,}", tld)
    log(f"  Errors: {state['errors']:,}", tld)
    log(f"  Availability Rate: {state['available']/state['checked']*100:.1f}%" if state['checked'] > 0 else "N/A", tld)
    log("=" * 50, tld)


if __name__ == '__main__':
    main()
