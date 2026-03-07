import { DataFormatter } from '../dataFormatters';

describe('DataFormatter', () => {
  describe('formatValue', () => {
    it('should format numeric values correctly', () => {
      const result = DataFormatter.formatValue(1234.56, 'INTEGER');
      expect(result.type).toBe('numeric');
      expect(result.sortable).toBe(1234.56);
    });

    it('should format large numbers with K/M/B suffixes', () => {
      const result1 = DataFormatter.formatValue(1500, 'INTEGER');
      expect(result1.formatted).toContain('K');
      
      const result2 = DataFormatter.formatValue(2500000, 'INTEGER');
      expect(result2.formatted).toContain('M');
      
      const result3 = DataFormatter.formatValue(3500000000, 'INTEGER');
      expect(result3.formatted).toContain('B');
    });

    it('should handle NULL values', () => {
      const result = DataFormatter.formatValue(null, 'INTEGER');
      expect(result.formatted).toBe('NULL');
      expect(result.sortable).toBe('');
    });

    it('should format currency values', () => {
      const result = DataFormatter.formatValue(99.99, 'DECIMAL', { type: 'currency', currency: 'USD' });
      expect(result.type).toBe('currency');
      expect(result.formatted).toContain('$');
    });

    it('should format percentage values', () => {
      const result = DataFormatter.formatValue(0.75, 'FLOAT', { type: 'percentage' });
      expect(result.type).toBe('percentage');
      expect(result.formatted).toContain('%');
    });

    it('should format boolean values', () => {
      const result1 = DataFormatter.formatValue(true, 'BOOLEAN');
      expect(result1.formatted).toBe('TRUE');
      
      const result2 = DataFormatter.formatValue(false, 'BOOLEAN');
      expect(result2.formatted).toBe('FALSE');
    });

    it('should format text values and truncate long strings', () => {
      const shortText = 'Short text';
      const result1 = DataFormatter.formatValue(shortText, 'VARCHAR');
      expect(result1.formatted).toBe(shortText);
      expect(result1.tooltip).toBeUndefined();

      const longText = 'A'.repeat(100);
      const result2 = DataFormatter.formatValue(longText, 'VARCHAR');
      expect(result2.formatted.length).toBeLessThan(longText.length);
      expect(result2.tooltip).toBe(longText);
    });
  });

  describe('detectColumnType', () => {
    it('should detect INTEGER type', () => {
      const samples = [1, 2, 3, 4, 5];
      const type = DataFormatter.detectColumnType(samples);
      expect(type).toBe('INTEGER');
    });

    it('should detect FLOAT type', () => {
      const samples = [1.5, 2.3, 3.7, 4.2, 5.9];
      const type = DataFormatter.detectColumnType(samples);
      expect(type).toBe('FLOAT');
    });

    it('should detect TEXT type for mixed values', () => {
      const samples = ['apple', 'banana', 'cherry', 'date'];
      const type = DataFormatter.detectColumnType(samples);
      expect(type).toBe('TEXT');
    });

    it('should handle empty samples', () => {
      const samples: any[] = [];
      const type = DataFormatter.detectColumnType(samples);
      expect(type).toBe('TEXT');
    });

    it('should handle null values', () => {
      const samples = [null, null, null];
      const type = DataFormatter.detectColumnType(samples);
      expect(type).toBe('TEXT');
    });
  });

  describe('formatDate', () => {
    it('should format date in short format', () => {
      const date = new Date('2024-01-15');
      const result = DataFormatter.formatValue(date, 'TIMESTAMP', { type: 'date', dateFormat: 'short' });
      expect(result.type).toBe('date');
      expect(result.formatted).toBeTruthy();
    });

    it('should format date in long format', () => {
      const date = new Date('2024-01-15');
      const result = DataFormatter.formatValue(date, 'TIMESTAMP', { type: 'date', dateFormat: 'long' });
      expect(result.formatted).toBeTruthy();
    });

    it('should handle invalid date strings', () => {
      const result = DataFormatter.formatValue('invalid-date', 'TIMESTAMP');
      expect(result.formatted).toBe('invalid-date');
    });
  });
});
