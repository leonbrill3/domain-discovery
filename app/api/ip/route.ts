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

    // Also test Namecheap API to see what IP it reports
    let namecheapIp = 'not tested';
    try {
      const apiUser = process.env.NAMECHEAP_API_USER;
      const apiKey = process.env.NAMECHEAP_API_KEY;
      const clientIp = process.env.NAMECHEAP_CLIENT_IP || '127.0.0.1';

      if (apiUser && apiKey) {
        const url = `https://api.namecheap.com/xml.response?ApiUser=${apiUser}&ApiKey=${apiKey}&UserName=${apiUser}&Command=namecheap.domains.check&ClientIp=${clientIp}&DomainList=test.com`;
        const response = await fetch(url, { signal: AbortSignal.timeout(10000) });
        const xml = await response.text();

        // Extract IP from error message if present
        const ipMatch = xml.match(/Invalid request IP:\s*(\d+\.\d+\.\d+\.\d+)/);
        if (ipMatch) {
          namecheapIp = `ERROR: ${ipMatch[1]} (not whitelisted)`;
        } else if (xml.includes('Status="OK"')) {
          namecheapIp = `OK (using ${clientIp})`;
        } else {
          // Extract any error
          const errorMatch = xml.match(/<Error[^>]*>([^<]+)<\/Error>/);
          namecheapIp = errorMatch ? `ERROR: ${errorMatch[1]}` : 'Unknown response';
        }
      }
    } catch (e) {
      namecheapIp = `Error: ${e}`;
    }

    return NextResponse.json({
      success: true,
      outboundIps: results,
      namecheapTest: namecheapIp,
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
