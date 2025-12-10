/**
 * Temporary IP Discovery Endpoint
 * Returns the server's outbound IP by querying an external service
 */

import { NextResponse } from 'next/server';

export async function GET() {
  try {
    // Query multiple IP echo services for reliability
    const services = [
      'https://api.ipify.org?format=json',
      'https://httpbin.org/ip',
      'https://api.my-ip.io/ip.json',
    ];

    const results: Record<string, string | null> = {};

    for (const service of services) {
      try {
        const response = await fetch(service, {
          signal: AbortSignal.timeout(5000),
        });
        const data = await response.json();
        results[service] = data.ip || data.origin || JSON.stringify(data);
      } catch (e) {
        results[service] = `Error: ${e}`;
      }
    }

    return NextResponse.json({
      success: true,
      outboundIps: results,
      env: {
        NAMECHEAP_CLIENT_IP: process.env.NAMECHEAP_CLIENT_IP || 'not set',
        NAMECHEAP_API_USER: process.env.NAMECHEAP_API_USER ? 'set' : 'not set',
        NAMECHEAP_API_KEY: process.env.NAMECHEAP_API_KEY ? 'set' : 'not set',
      },
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: String(error) },
      { status: 500 }
    );
  }
}
