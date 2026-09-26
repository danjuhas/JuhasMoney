import { describe, it, expect } from 'vitest';
import { getEffectiveMonth } from '../../src/utils/creditCards';

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

describe('creditCards utility', () => {
  describe('getEffectiveMonth', () => {
    it('should place purchase before closing day in the same month (due day > closing day)', () => {
      // Closes 10, Due 20. Purchase Sep 5 -> Closes Sep 10 -> Due Sep 20 (2026-09)
      expect(getEffectiveMonth('2026-09-05T12:00:00Z', 10, 20)).toBe('2026-09');
    });

    it('should place purchase on or after closing day in the next month (due day > closing day)', () => {
      // Closes 10, Due 20. Purchase Sep 10 -> Closes Oct 10 -> Due Oct 20 (2026-10)
      expect(getEffectiveMonth('2026-09-10T12:00:00Z', 10, 20)).toBe('2026-10');
      expect(getEffectiveMonth('2026-09-15T12:00:00Z', 10, 20)).toBe('2026-10');
    });

    it('should place purchase before closing day in the next month if due day < closing day', () => {
      // Closes 25, Due 5. Purchase Sep 20 -> Closes Sep 25 -> Due Oct 5 (2026-10)
      expect(getEffectiveMonth('2026-09-20T12:00:00Z', 25, 5)).toBe('2026-10');
    });

    it('should place purchase on or after closing day in the month after next if due day < closing day', () => {
      // Closes 25, Due 5. Purchase Sep 26 -> Closes Oct 25 -> Due Nov 5 (2026-11)
      expect(getEffectiveMonth('2026-09-26T12:00:00Z', 25, 5)).toBe('2026-11');
    });

    it('should handle year rollover correctly (due day < closing day, purchase in Dec)', () => {
      // Closes 25, Due 5. Purchase Dec 20 -> Closes Dec 25 -> Due Jan 5 (2027-01)
      expect(getEffectiveMonth('2026-12-20T12:00:00Z', 25, 5)).toBe('2027-01');
      // Purchase Dec 26 -> Closes Jan 25 -> Due Feb 5 (2027-02)
      expect(getEffectiveMonth('2026-12-26T12:00:00Z', 25, 5)).toBe('2027-02');
    });

    it('should handle year rollover correctly (due day > closing day, purchase in Dec)', () => {
      // Closes 10, Due 20. Purchase Dec 15 -> Closes Jan 10 -> Due Jan 20 (2027-01)
      expect(getEffectiveMonth('2026-12-15T12:00:00Z', 10, 20)).toBe('2027-01');
    });

    it('should handle leap year February correctly (due day < closing day)', () => {
      // Closes 25, Due 5. Purchase Feb 26 2024 -> Closes Mar 25 -> Due Apr 5 (2024-04)
      expect(getEffectiveMonth('2024-02-26T12:00:00Z', 25, 5)).toBe('2024-04');
    });

    it('should handle short months like February correctly (due day > closing day)', () => {
      // Closes 31, Due 10. Purchase Feb 28 -> Since Feb has no 31, closing is effectively end of Feb. 
      // Purchase Feb 28 -> Closes Feb 28 -> Due Mar 10 (2024-03)
      // Actually, if closing is 31 and month has 28 days, our logic sets closing date to Feb 28 or Mar 3 depending on Date object.
      // JS Date(2024, 1, 31) -> March 2, 2024.
      // So closing is Mar 2. Purchase Feb 28 is BEFORE Mar 2.
      // Let's test standard behavior:
      expect(getEffectiveMonth('2024-02-28T12:00:00Z', 31, 10)).toBe('2024-03');
    });
  });
});
