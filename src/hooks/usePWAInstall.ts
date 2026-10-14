import { useState, useEffect, useCallback } from 'react';

const DISMISS_KEY = 'juhas_pwa_banner_dismissed_until';
const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;

export interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed';
    platform: string;
  }>;
  prompt(): Promise<void>;
}

export function usePWAInstall() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isStandalone, setIsStandalone] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isDismissed, setIsDismissed] = useState(true); // default true until verified client-side

  useEffect(() => {
    if (typeof window === 'undefined') return;

    // 1. Check Standalone mode
    const checkStandalone = () => {
      const isStandaloneMedia = typeof window.matchMedia === 'function'
        ? window.matchMedia('(display-mode: standalone)').matches
        : false;
      const isIOSStandalone = typeof window.navigator !== 'undefined' && (window.navigator as any).standalone === true;
      const isAndroidApp = typeof document !== 'undefined' && document.referrer
        ? document.referrer.includes('android-app://')
        : false;
      return isStandaloneMedia || isIOSStandalone || isAndroidApp;
    };
    setIsStandalone(checkStandalone());

    // 2. Check Mobile environment
    const checkMobile = () => {
      const ua = window.navigator.userAgent || '';
      const isMobileUA = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(ua);
      const isSmallScreen = window.innerWidth < 768;
      return isMobileUA || isSmallScreen;
    };
    setIsMobile(checkMobile());

    // 3. Check iOS
    const checkIOS = () => {
      const ua = window.navigator.userAgent || '';
      return /iPad|iPhone|iPod/.test(ua) && !(window as any).MSStream;
    };
    setIsIOS(checkIOS());

    // 4. Check 7-day dismissal state
    try {
      const rawDismissed = localStorage.getItem(DISMISS_KEY);
      if (rawDismissed) {
        const expiry = parseInt(rawDismissed, 10);
        if (!isNaN(expiry) && Date.now() < expiry) {
          setIsDismissed(true);
        } else {
          localStorage.removeItem(DISMISS_KEY);
          setIsDismissed(false);
        }
      } else {
        setIsDismissed(false);
      }
    } catch {
      setIsDismissed(false);
    }

    // 5. Capture beforeinstallprompt for Android / Chromium
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const dismiss = useCallback(() => {
    try {
      const expiry = Date.now() + SEVEN_DAYS_MS;
      localStorage.setItem(DISMISS_KEY, expiry.toString());
    } catch {
      // Ignore localStorage errors (e.g. private browsing quota)
    }
    setIsDismissed(true);
  }, []);

  const install = useCallback(async (): Promise<boolean> => {
    if (!deferredPrompt) {
      return false;
    }

    try {
      await deferredPrompt.prompt();
      const choiceResult = await deferredPrompt.userChoice;
      if (choiceResult.outcome === 'accepted') {
        setDeferredPrompt(null);
        return true;
      }
    } catch (err) {
      console.error('Error triggering PWA install prompt:', err);
    }
    return false;
  }, [deferredPrompt]);

  const shouldShowBanner = isMobile && !isStandalone && !isDismissed;

  return {
    isStandalone,
    isMobile,
    isIOS,
    isDismissed,
    canPromptNative: !!deferredPrompt,
    shouldShowBanner,
    dismiss,
    install,
  };
}
