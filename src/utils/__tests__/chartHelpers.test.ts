import { mapQueryResultToChartData } from '../chartHelpers';
import { QueryResult } from '../database';

describe('mapQueryResultToChartData', () => {
  const mockResult: QueryResult = {
    columns: ['CITY', 'AGE_AVG'],
    rows: [
      ['Boston', BigInt(28)],
      ['Chicago', 34],
    ],
    rowCount: 2,
  };

  test('should convert BigInt values to numbers', () => {
    const data = mapQueryResultToChartData(mockResult, 'city', ['age']);
    
    expect(data).toHaveLength(2);
    expect(data[0].age).toBe(28);
    expect(typeof data[0].age).toBe('number');
    expect(data[1].age).toBe(34);
    expect(typeof data[1].age).toBe('number');
  });

  test('should handle case-insensitive column matching', () => {
    const data = mapQueryResultToChartData(mockResult, 'city', ['age_avg']);
    expect(data[0].city).toBe('Boston');
    expect(data[0].age_avg).toBe(28);
  });

  test('should handle aliased/suffixed measure columns', () => {
    const data = mapQueryResultToChartData(mockResult, 'city', ['age']);
    expect(data[0].age).toBe(28);
  });

  test('should return empty array if results are empty', () => {
    const emptyResult: QueryResult = { columns: [], rows: [], rowCount: 0 };
    const data = mapQueryResultToChartData(emptyResult, 'city', ['age']);
    expect(data).toEqual([]);
  });

  test('should return empty array if xAxis is not provided', () => {
    const data = mapQueryResultToChartData(mockResult, null, ['age']);
    expect(data).toEqual([]);
  });
});
