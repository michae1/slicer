import { FileProcessor } from '../fileProcessing';

describe('FileProcessor.parseCSVContent', () => {
  it('should parse simple CSV', () => {
    const csv = 'name,age\nAlice,30\nBob,25';
    const parsed = FileProcessor.parseCSVContent(csv);
    expect(parsed).toEqual([
      ['name', 'age'],
      ['Alice', '30'],
      ['Bob', '25']
    ]);
  });

  it('should parse CSV with quoted fields and commas inside quotes', () => {
    const csv = 'position,description\n"Developer","React, TypeScript, and Node.js"';
    const parsed = FileProcessor.parseCSVContent(csv);
    expect(parsed).toEqual([
      ['position', 'description'],
      ['Developer', 'React, TypeScript, and Node.js']
    ]);
  });

  it('should parse CSV with newlines inside quotes', () => {
    const csv = '"ugc video","Self spoken UGC video\n\nLive commenting on the video"\n"video 2","normal string"';
    const parsed = FileProcessor.parseCSVContent(csv);
    expect(parsed).toEqual([
      ['ugc video', 'Self spoken UGC video\n\nLive commenting on the video'],
      ['video 2', 'normal string']
    ]);
  });

  it('should parse CSV with escaped quotes inside quotes', () => {
    const csv = 'col1,col2\n"He said ""Hello"" to me","world"';
    const parsed = FileProcessor.parseCSVContent(csv);
    expect(parsed).toEqual([
      ['col1', 'col2'],
      ['He said "Hello" to me', 'world']
    ]);
  });
});
