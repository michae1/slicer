import { DataValidator } from '../fileValidation';

// Mock FileReader for Node.js environment
global.FileReader = class FileReader {
  result: string | ArrayBuffer | null = null;
  onload: ((event: any) => void) | null = null;
  onerror: ((event: any) => void) | null = null;

  readAsText(blob: Blob) {
    blob.text().then(text => {
      this.result = text;
      if (this.onload) {
        this.onload({ target: this });
      }
    }).catch(error => {
      if (this.onerror) {
        this.onerror({ target: this });
      }
    });
  }
} as any;

describe('DataValidator', () => {
  describe('validateCSV', () => {
    it('should validate a correct CSV file', async () => {
      const csvContent = 'id,name,age\n1,Alice,30\n2,Bob,25';
      const file = new File([csvContent], 'test.csv', { type: 'text/csv' });

      const report = await DataValidator.validateCSV(file);

      expect(report.isValid).toBe(true);
      expect(report.errors).toHaveLength(0);
      expect(report.statistics.totalRows).toBe(2);
      expect(report.statistics.totalColumns).toBe(3);
    });

    it('should detect empty CSV files', async () => {
      const file = new File([''], 'empty.csv', { type: 'text/csv' });

      const report = await DataValidator.validateCSV(file);

      expect(report.isValid).toBe(false);
      expect(report.errors.some(e => e.message.includes('empty'))).toBe(true);
    });

    it('should detect inconsistent column counts', async () => {
      const csvContent = 'id,name,age\n1,Alice,30\n2,Bob';
      const file = new File([csvContent], 'test.csv', { type: 'text/csv' });

      const report = await DataValidator.validateCSV(file);

      expect(report.isValid).toBe(false);
      expect(report.errors.some(e => e.message.includes('columns'))).toBe(true);
    });

    it('should warn about empty rows', async () => {
      const csvContent = 'id,name,age\n1,Alice,30\n,,\n2,Bob,25';
      const file = new File([csvContent], 'test.csv', { type: 'text/csv' });

      const report = await DataValidator.validateCSV(file);

      expect(report.warnings.some(w => w.message.includes('empty rows'))).toBe(true);
    });

    it('should warn about files with no data rows', async () => {
      const csvContent = 'id,name,age';
      const file = new File([csvContent], 'test.csv', { type: 'text/csv' });

      const report = await DataValidator.validateCSV(file);

      expect(report.warnings.some(w => w.message.includes('no data rows'))).toBe(true);
    });
  });

  describe('validateParquet', () => {
    it('should validate Parquet files', async () => {
      const file = new File(['parquet-data'], 'test.parquet', { type: 'application/octet-stream' });

      const report = await DataValidator.validateParquet(file);

      expect(report.isValid).toBe(true);
    });

    it('should warn about large Parquet files', async () => {
      const largeData = new Uint8Array(150 * 1024 * 1024); // 150MB
      const file = new File([largeData], 'large.parquet', { type: 'application/octet-stream' });

      const report = await DataValidator.validateParquet(file);

      expect(report.warnings.some(w => w.message.includes('Large'))).toBe(true);
    });
  });

  describe('validateGeoJSON', () => {
    it('should validate correct GeoJSON FeatureCollection', async () => {
      const geoJSON = {
        type: 'FeatureCollection',
        features: [
          {
            type: 'Feature',
            geometry: {
              type: 'Point',
              coordinates: [0, 0]
            },
            properties: { name: 'Test' }
          }
        ]
      };
      const file = new File([JSON.stringify(geoJSON)], 'test.geojson', { type: 'application/json' });

      const report = await DataValidator.validateGeoJSON(file);

      expect(report.isValid).toBe(true);
      expect(report.statistics.totalRows).toBe(1);
    });

    it('should detect missing type property', async () => {
      const invalidGeoJSON = { features: [] };
      const file = new File([JSON.stringify(invalidGeoJSON)], 'test.geojson', { type: 'application/json' });

      const report = await DataValidator.validateGeoJSON(file);

      expect(report.isValid).toBe(false);
      expect(report.errors.some(e => e.message.includes('missing type'))).toBe(true);
    });

    it('should detect invalid GeoJSON type', async () => {
      const invalidGeoJSON = { type: 'InvalidType' };
      const file = new File([JSON.stringify(invalidGeoJSON)], 'test.geojson', { type: 'application/json' });

      const report = await DataValidator.validateGeoJSON(file);

      expect(report.isValid).toBe(false);
      expect(report.errors.some(e => e.message.includes('Invalid GeoJSON type'))).toBe(true);
    });

    it('should detect missing features array in FeatureCollection', async () => {
      const invalidGeoJSON = { type: 'FeatureCollection' };
      const file = new File([JSON.stringify(invalidGeoJSON)], 'test.geojson', { type: 'application/json' });

      const report = await DataValidator.validateGeoJSON(file);

      expect(report.isValid).toBe(false);
      expect(report.errors.some(e => e.message.includes('features array'))).toBe(true);
    });

    it('should detect empty feature collections', async () => {
      const geoJSON = {
        type: 'FeatureCollection',
        features: []
      };
      const file = new File([JSON.stringify(geoJSON)], 'test.geojson', { type: 'application/json' });

      const report = await DataValidator.validateGeoJSON(file);

      expect(report.isValid).toBe(false);
      expect(report.errors.some(e => e.message.includes('No features'))).toBe(true);
    });

    it('should handle invalid JSON', async () => {
      const file = new File(['invalid json {'], 'test.geojson', { type: 'application/json' });

      const report = await DataValidator.validateGeoJSON(file);

      expect(report.isValid).toBe(false);
      expect(report.errors.some(e => e.message.includes('Invalid GeoJSON'))).toBe(true);
    });
  });
});
