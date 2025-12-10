/**
 * ™️ TRADEMARK API - USPTO Search
 *
 * Checks USPTO database for trademark conflicts
 */

import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const query = searchParams.get('query');

  if (!query) {
    return NextResponse.json({ error: 'Query required' }, { status: 400 });
  }

  try {
    // USPTO TESS API (Trademark Electronic Search System)
    // Note: USPTO doesn't have a simple REST API, so we'll use a simplified approach

    // For development, return mock data
    // In production, you'd integrate with a proper trademark API like Trademarkia or Corsearch

    const mockData = {
      hasConflicts: Math.random() > 0.7, // 30% chance of conflicts
      exactMatches: Math.random() > 0.8 ? [
        {
          mark: query.toUpperCase(),
          status: 'Live',
          serialNumber: '88888888',
        }
      ] : [],
      similarMarks: Math.random() > 0.5 ? [
        {
          mark: query.slice(0, -1).toUpperCase(),
          status: 'Live',
          serialNumber: '87777777',
        }
      ] : [],
    };

    return NextResponse.json(mockData);

  } catch (error) {
    console.error('[Trademark API] Error:', error);
    return NextResponse.json(
      { error: 'Trademark search failed' },
      { status: 500 }
    );
  }
}
