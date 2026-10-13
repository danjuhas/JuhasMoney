import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { usePWAInstall } from '../../src/hooks/usePWAInstall';

describe('usePWAInstall Hook', () => {
  const originalMatchMedia = window.matchMedia;
  const originalNavigator = window.navigator;

  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();

    // Default to non-standalone, desktop
    window.matchMedia = vi.fn().mockImplementation((query) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }));

    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: 1024,
    });
  });

  afterEach(() => {
    window.matchMedia = originalMatchMedia;
  });

  it('detects desktop non-standalone environment and does not show banner', () => {
    const { result } = renderHook(() => usePWAInstall());

    expect(result.current.isStandalone).toBe(false);
    expect(result.current.isMobile).toBe(false);
    expect(result.current.shouldShowBanner).toBe(false);
  });

  it('detects mobile screen and shows banner when not standalone or dismissed', () => {
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: 390,
    });

    const { result } = renderHook(() => usePWAInstall());

    expect(result.current.isMobile).toBe(true);
    expect(result.current.isStandalone).toBe(false);
    expect(result.current.isDismissed).toBe(false);
    expect(result.current.shouldShowBanner).toBe(true);
  });

  it('hides banner if already running in standalone mode', () => {
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: 390,
    });

    window.matchMedia = vi.fn().mockImplementation((query) => ({
      matches: query === '(display-mode: standalone)',
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }));

    const { result } = renderHook(() => usePWAInstall());

    expect(result.current.isStandalone).toBe(true);
    expect(result.current.shouldShowBanner).toBe(false);
  });

  it('stores 7-day dismissal in localStorage and hides banner after dismiss()', () => {
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: 390,
    });

    const { result } = renderHook(() => usePWAInstall());
    expect(result.current.shouldShowBanner).toBe(true);

    act(() => {
      result.current.dismiss();
    });

    expect(result.current.isDismissed).toBe(true);
    expect(result.current.shouldShowBanner).toBe(false);

    const stored = localStorage.getItem('juhas_pwa_banner_dismissed_until');
    expect(stored).not.toBeNull();
    const expiry = parseInt(stored!, 10);
    // Should be roughly 7 days in future (+- 5 seconds)
    const now = Date.now();
    const sevenDaysMs = 7 * 24 * 60 * 60 * 1000;
    expect(expiry).toBeGreaterThan(now + sevenDaysMs - 5000);
  });

  it('respects existing unexpired 7-day dismissal in localStorage', () => {
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: 390,
    });

    // Store expiry 3 days in the future
    const threeDaysFuture = Date.now() + 3 * 24 * 60 * 60 * 1000;
    localStorage.setItem('juhas_pwa_banner_dismissed_until', threeDaysFuture.toString());

    const { result } = renderHook(() => usePWAInstall());
    expect(result.current.isDismissed).toBe(true);
    expect(result.current.shouldShowBanner).toBe(false);
  });

  it('clears expired dismissal and shows banner again after 7 days', () => {
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: 390,
    });

    // Store expiry 1 day in the past
    const oneDayPast = Date.now() - 1 * 24 * 60 * 60 * 1000;
    localStorage.setItem('juhas_pwa_banner_dismissed_until', oneDayPast.toString());

    const { result } = renderHook(() => usePWAInstall());
    expect(result.current.isDismissed).toBe(false);
    expect(result.current.shouldShowBanner).toBe(true);
  });

  it('captures beforeinstallprompt and installs via prompt()', async () => {
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: 390,
    });

    const { result } = renderHook(() => usePWAInstall());
    expect(result.current.canPromptNative).toBe(false);

    const promptMock = vi.fn().mockResolvedValue(undefined);
    const mockEvent = new Event('beforeinstallprompt') as any;
    mockEvent.prompt = promptMock;
    mockEvent.userChoice = Promise.resolve({ outcome: 'accepted', platform: 'web' });

    act(() => {
      window.dispatchEvent(mockEvent);
    });

    expect(result.current.canPromptNative).toBe(true);

    let installed = false;
    await act(async () => {
      installed = await result.current.install();
    });

    expect(promptMock).toHaveBeenCalledTimes(1);
    expect(installed).toBe(true);
    expect(result.current.canPromptNative).toBe(false);
  });
});

