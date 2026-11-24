import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { PWAInstallBanner } from '../../src/components/PWAInstallBanner';
import * as pwaHook from '../../src/hooks/usePWAInstall';

describe('PWAInstallBanner Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders nothing when shouldShowBanner is false', () => {
    vi.spyOn(pwaHook, 'usePWAInstall').mockReturnValue({
      isStandalone: false,
      isMobile: false,
      isIOS: false,
      isDismissed: false,
      canPromptNative: false,
      shouldShowBanner: false,
      dismiss: vi.fn(),
      install: vi.fn(),
    });

    const { container } = render(<PWAInstallBanner />);
    expect(container.firstChild).toBeNull();
  });

  it('renders banner when shouldShowBanner is true', () => {
    vi.spyOn(pwaHook, 'usePWAInstall').mockReturnValue({
      isStandalone: false,
      isMobile: true,
      isIOS: false,
      isDismissed: false,
      canPromptNative: false,
      shouldShowBanner: true,
      dismiss: vi.fn(),
      install: vi.fn(),
    });

    render(<PWAInstallBanner />);
    expect(screen.getByText('Instale o JuhasMoney no celular')).toBeInTheDocument();
    expect(screen.getByText('Ver como adicionar')).toBeInTheDocument();
  });

  it('calls dismiss when clicking the close button', () => {
    const dismissMock = vi.fn();
    vi.spyOn(pwaHook, 'usePWAInstall').mockReturnValue({
      isStandalone: false,
      isMobile: true,
      isIOS: false,
      isDismissed: false,
      canPromptNative: false,
      shouldShowBanner: true,
      dismiss: dismissMock,
      install: vi.fn(),
    });

    render(<PWAInstallBanner />);
    const closeBtn = screen.getByLabelText('Fechar');
    fireEvent.click(closeBtn);

    expect(dismissMock).toHaveBeenCalledTimes(1);
  });

  it('opens step-by-step instruction modal on iOS and closes on "Entendi"', async () => {
    vi.spyOn(pwaHook, 'usePWAInstall').mockReturnValue({
      isStandalone: false,
      isMobile: true,
      isIOS: true,
      isDismissed: false,
      canPromptNative: false,
      shouldShowBanner: true,
      dismiss: vi.fn(),
      install: vi.fn(),
    });

    render(<PWAInstallBanner />);

    // Click to open guide
    fireEvent.click(screen.getByText('Ver como adicionar'));

    // Modal should now be open
    expect(screen.getByText('Adicionar à Tela de Início')).toBeInTheDocument();
    expect(screen.getByText('Compartilhar')).toBeInTheDocument();

    // Click "Entendi" to close
    fireEvent.click(screen.getByRole('button', { name: 'Entendi' }));

    await waitFor(() => {
      expect(screen.queryByText('Adicionar à Tela de Início')).toBeNull();
    });
  });

  it('triggers native install directly when canPromptNative is true', async () => {
    const installMock = vi.fn().mockResolvedValue(true);
    vi.spyOn(pwaHook, 'usePWAInstall').mockReturnValue({
      isStandalone: false,
      isMobile: true,
      isIOS: false,
      isDismissed: false,
      canPromptNative: true,
      shouldShowBanner: true,
      dismiss: vi.fn(),
      install: installMock,
    });

    render(<PWAInstallBanner />);

    const installBtn = screen.getByText('Instalar Aplicativo');
    expect(installBtn).toBeInTheDocument();

    fireEvent.click(installBtn);
    expect(installMock).toHaveBeenCalledTimes(1);
  });
});

