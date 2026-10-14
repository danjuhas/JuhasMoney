import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Modal } from '../../src/components/ui/Modal';

describe('Modal Component', () => {
  beforeEach(() => {
    document.body.style.overflow = '';
  });

  afterEach(() => {
    document.body.style.overflow = '';
  });

  it('does not render anything when isOpen is false', () => {
    const { container } = render(
      <Modal isOpen={false} onClose={vi.fn()}>
        <div>Modal Content</div>
      </Modal>
    );

    expect(screen.queryByText('Modal Content')).toBeNull();
    expect(container.firstChild).toBeNull();
    expect(document.body.style.overflow).toBe('');
  });

  it('renders modal in document.body via portal and locks body scroll when isOpen is true', () => {
    const { unmount } = render(
      <Modal isOpen={true} onClose={vi.fn()}>
        <div>Modal Content</div>
      </Modal>
    );

    expect(screen.getByText('Modal Content')).toBeInTheDocument();
    expect(document.body.style.overflow).toBe('hidden');

    unmount();
    expect(document.body.style.overflow).toBe('');
  });

  it('calls onClose when clicking outside the modal content', () => {
    const onClose = vi.fn();
    render(
      <Modal isOpen={true} onClose={onClose}>
        <p>Inside Content</p>
      </Modal>
    );

    // The dialog role has the inside content
    const dialog = screen.getByRole('dialog');
    // Clicking inside dialog should NOT trigger onClose
    fireEvent.click(dialog);
    expect(onClose).not.toHaveBeenCalled();

    // Clicking the backdrop container outside should trigger onClose
    const overlay = dialog.parentElement;
    expect(overlay).not.toBeNull();
    if (overlay) {
      fireEvent.click(overlay);
      expect(onClose).toHaveBeenCalledTimes(1);
    }
  });

  it('calls onClose when Escape key is pressed', () => {
    const onClose = vi.fn();
    render(
      <Modal isOpen={true} onClose={onClose}>
        <div>Modal Content</div>
      </Modal>
    );

    fireEvent.keyDown(window, { key: 'Escape' });
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('does not call onClose when other keys are pressed', () => {
    const onClose = vi.fn();
    render(
      <Modal isOpen={true} onClose={onClose}>
        <div>Modal Content</div>
      </Modal>
    );

    fireEvent.keyDown(window, { key: 'Enter' });
    expect(onClose).not.toHaveBeenCalled();
  });

  it('applies the appropriate maxWidth class', () => {
    const { rerender } = render(
      <Modal isOpen={true} onClose={vi.fn()} maxWidth="2xl">
        <div>Content</div>
      </Modal>
    );

    const dialog = screen.getByRole('dialog');
    expect(dialog.className).toContain('max-w-2xl');

    rerender(
      <Modal isOpen={true} onClose={vi.fn()} maxWidth="sm">
        <div>Content</div>
      </Modal>
    );
    expect(dialog.className).toContain('max-w-sm');
  });

  it('manages body scroll correctly when multiple modals are open', () => {
    const { unmount: unmountFirst } = render(
      <Modal isOpen={true} onClose={vi.fn()}>
        <div>First Modal</div>
      </Modal>
    );

    expect(document.body.style.overflow).toBe('hidden');

    const { unmount: unmountSecond } = render(
      <Modal isOpen={true} onClose={vi.fn()}>
        <div>Second Modal</div>
      </Modal>
    );

    expect(document.body.style.overflow).toBe('hidden');

    unmountSecond();
    // One modal still open, body should remain locked
    expect(document.body.style.overflow).toBe('hidden');

    unmountFirst();
    // All modals unmounted, body scroll restored
    expect(document.body.style.overflow).toBe('');
  });
});

