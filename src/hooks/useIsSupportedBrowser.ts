import { useEffect, useState } from 'react';

/**
 * Checks if the current browser is supported.
 * @returns true if the browser is supported, false otherwise.
 */
export function useIsSupportedBrowser(): boolean {
  const [isSupported, setIsSupported] = useState(true);

  useEffect(() => {
    if (typeof navigator === 'undefined') return;

    const ua = navigator.userAgent;

    // FB Messenger & Instagram in-app browsers
    const isFB =
      ua.includes('FBAN') ||
      ua.includes('FBAV') ||
      ua.includes('FB_IAB');

    const isInstagram = ua.includes('Instagram');

    setIsSupported(!isFB && !isInstagram);
  }, []);

  return isSupported;
}
