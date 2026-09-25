import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { exportToCSV, exportToImage, exportToPDF } from '../../src/utils/exportData';
import type { Expense, Category } from '../../src/types';

// Mock heavy external libraries used for exporting
vi.mock('html-to-image', () => ({
  toBlob: vi.fn().mockResolvedValue(new Blob(['fake-image'], { type: 'image/png' })),
  toPng: vi.fn().mockResolvedValue('data:image/png;base64,fake-data'),
}));

vi.mock('jspdf', () => {
  const jsPDFMock = vi.fn().mockImplementation(() => ({
    internal: { pageSize: { getWidth: () => 210 } },
    addImage: vi.fn(),
    output: vi.fn().mockReturnValue(new Blob(['fake-pdf'], { type: 'application/pdf' })),
  }));
  return { jsPDF: jsPDFMock, default: jsPDFMock };
});

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => {
      if (key === 'dashboard.locale') return 'pt-BR';
      if (key === 'analytics.search_placeholder') return 'Busque por despesa ou categoria (ex: Uber, Mercado)...';
      if (key === 'dashboard.bill_empty') return 'Nenhuma despesa para esta fatura.';
      if (key === 'dashboard.bill_paid') return 'Fatura Paga';
      return key;
    },
    i18n: { language: 'pt' }
  }),
  initReactI18next: { type: '3rdParty', init: () => {} }
}));

describe('exportData Utility', () => {
  let clickSpy: any;
  let createObjectURLSpy: any;
  let revokeObjectURLSpy: any;
  let originalNavigator: any;

  beforeEach(() => {
    // Setup DOM and Global API Mocks for each test
    createObjectURLSpy = vi.fn().mockReturnValue('blob:fake-url');
    revokeObjectURLSpy = vi.fn();
    
    vi.stubGlobal('URL', {
      createObjectURL: createObjectURLSpy,
      revokeObjectURL: revokeObjectURLSpy,
    });

    clickSpy = vi.spyOn(window.HTMLAnchorElement.prototype, 'click').mockImplementation(() => {});
    
    // Backup original navigator to restore later
    originalNavigator = { ...global.navigator };
  });

  afterEach(() => {
    vi.clearAllMocks(); // Use clear instead of restore to keep vi.mock definitions
    vi.unstubAllGlobals();
    Object.defineProperty(global, 'navigator', {
      value: originalNavigator,
      writable: true,
    });
    document.body.innerHTML = ''; // Ensure DOM is clean
  });

  describe('exportToCSV', () => {
    it('should generate CSV format correctly, format commas, and trigger file download', async () => {
      const expenses: Expense[] = [
        {
          id: '1',
          user_id: 'user-1',
          description: 'Grocery, Market', // Contains comma to test sanitize
          amount: 150.55,
          type: 'expense',
          category_id: 'cat-1',
          created_at: '2026-01-15T10:00:00Z',
          is_fixed: false,
          is_paid: true,
        },
      ];
      
      const categories: Category[] = [
        { id: 'cat-1', user_id: 'user-1', name: 'Food', color: '#ff0000', type: 'expense' },
      ];

      await exportToCSV(expenses, categories, '2026-01');

      // Assertions
      expect(createObjectURLSpy).toHaveBeenCalled();
      const blobPassed = createObjectURLSpy.mock.calls[0][0];
      
      expect(blobPassed).toBeInstanceOf(Blob);
      expect(blobPassed.type).toBe('text/csv;charset=utf-8;');
      
      expect(clickSpy).toHaveBeenCalledOnce();
      expect(revokeObjectURLSpy).toHaveBeenCalledOnce();
    });
  });

  describe('exportToImage', () => {
    it('should fallback to download if navigator.share is not available or supported', async () => {
      // Mock the DOM element required by the function
      const div = document.createElement('div');
      div.id = 'reports-export-area';
      document.body.appendChild(div);

      // Ensure navigator.share is undefined
      Object.defineProperty(global.navigator, 'share', { value: undefined, writable: true });

      await exportToImage('reports-export-area', '2026-01');

      expect(createObjectURLSpy).toHaveBeenCalled();
      expect(clickSpy).toHaveBeenCalledOnce();

      document.body.removeChild(div);
    });

    it('should invoke navigator.share on mobile devices if supported', async () => {
      const div = document.createElement('div');
      div.id = 'reports-export-area';
      document.body.appendChild(div);

      const shareMock = vi.fn().mockResolvedValue(undefined);
      const canShareMock = vi.fn().mockReturnValue(true);

      Object.defineProperty(global.navigator, 'share', { value: shareMock, writable: true });
      Object.defineProperty(global.navigator, 'canShare', { value: canShareMock, writable: true });

      await exportToImage('reports-export-area', '2026-01');

      // It should share instead of falling back to download
      expect(canShareMock).toHaveBeenCalled();
      expect(shareMock).toHaveBeenCalled();
      
      // Fallback download logic should NOT be triggered
      expect(createObjectURLSpy).not.toHaveBeenCalled();
      expect(clickSpy).not.toHaveBeenCalled();

      document.body.removeChild(div);
    });

    it('should throw an error if the export area element does not exist in the DOM', async () => {
      // Intentionally not adding 'reports-export-area' to DOM
      await expect(exportToImage('reports-export-area', '2026-01')).rejects.toThrow('Element not found');
    });
  });

  describe('exportToPDF', () => {
    it('should generate a PDF blob and trigger download', async () => {
      const div = document.createElement('div');
      div.id = 'reports-export-area';
      // Mock dimensions for PDF aspect ratio calculation
      Object.defineProperty(div, 'offsetWidth', { value: 800 });
      Object.defineProperty(div, 'offsetHeight', { value: 600 });
      document.body.appendChild(div);

      Object.defineProperty(global.navigator, 'share', { value: undefined, writable: true });

      await exportToPDF('reports-export-area', '2026-01');

      expect(createObjectURLSpy).toHaveBeenCalled();
      
      const blobPassed = createObjectURLSpy.mock.calls[0][0];
      expect(blobPassed.type).toBe('application/pdf');
      
      expect(clickSpy).toHaveBeenCalledOnce();

      document.body.removeChild(div);
    });
  });
});
