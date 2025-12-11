'use client';

import { useState, useEffect } from 'react';
import { AlertTriangle, X, CheckCircle } from 'lucide-react';

interface IPStatus {
  success: boolean;
  namecheapTest?: string;
  outboundIps?: Record<string, string>;
}

export function AdminAlert() {
  const [status, setStatus] = useState<'loading' | 'ok' | 'error'>('loading');
  const [errorMessage, setErrorMessage] = useState('');
  const [dismissed, setDismissed] = useState(false);
  const [currentIp, setCurrentIp] = useState('');

  useEffect(() => {
    // Only check on admin (you) - check for a specific localStorage flag
    const isAdmin = localStorage.getItem('domainseek_admin') === 'true';
    if (!isAdmin) {
      setStatus('ok');
      return;
    }

    checkStatus();
    // Check every 5 minutes
    const interval = setInterval(checkStatus, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  const checkStatus = async () => {
    try {
      const res = await fetch('/api/ip');
      const data: IPStatus = await res.json();

      const ip = data.outboundIps?.['https://api.ipify.org?format=json'] || 'unknown';
      setCurrentIp(ip);

      if (data.namecheapTest?.startsWith('OK')) {
        setStatus('ok');
      } else if (data.namecheapTest?.includes('ERROR')) {
        setStatus('error');
        setErrorMessage(data.namecheapTest);
      } else {
        setStatus('ok');
      }
    } catch (e) {
      setStatus('error');
      setErrorMessage('Failed to check API status');
    }
  };

  // Don't show anything if OK or dismissed
  if (status === 'ok' || status === 'loading' || dismissed) {
    return null;
  }

  return (
    <div className="fixed top-0 left-0 right-0 z-50 bg-red-600 text-white px-4 py-3">
      <div className="max-w-6xl mx-auto flex items-center justify-between">
        <div className="flex items-center gap-3">
          <AlertTriangle className="w-5 h-5 flex-shrink-0" />
          <div>
            <strong>Namecheap API Issue:</strong>{' '}
            {errorMessage.includes('not whitelisted') ? (
              <>
                IP <code className="bg-red-700 px-1 rounded">{currentIp}</code> needs to be whitelisted in Namecheap.
                Using RDAP fallback (slower).
              </>
            ) : (
              errorMessage
            )}
          </div>
        </div>
        <button
          onClick={() => setDismissed(true)}
          className="p-1 hover:bg-red-700 rounded"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

// Enable admin mode by running in console: localStorage.setItem('domainseek_admin', 'true')
