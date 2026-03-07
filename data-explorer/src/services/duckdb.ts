import * as duckdb from '@duckdb/duckdb-wasm';

let db: duckdb.AsyncDuckDB | null = null;
let connection: duckdb.AsyncDuckDBConnection | null = null;

export const initializeDuckDB = async (): Promise<duckdb.AsyncDuckDB> => {
  if (db) return db;

  try {
    console.log('Loading DuckDB...');
    
    const JSDELIVR_BUNDLES = {
      mvp: {
        mainModule: '/duckdb-mvp.wasm',
        mainWorker: '/duckdb-browser-mvp.worker.js',
      },
      eh: {
        mainModule: '/duckdb-eh.wasm',
        mainWorker: '/duckdb-browser-eh.worker.js',
      },
    };
    
    const bundle = await duckdb.selectBundle(JSDELIVR_BUNDLES);
    if (!bundle.mainModule || !bundle.mainWorker) {
      throw new Error('Failed to select DuckDB bundle');
    }
    const logger = new duckdb.ConsoleLogger();
    const worker = new Worker(bundle.mainWorker);
    db = new duckdb.AsyncDuckDB(logger, worker);
    
    await db.instantiate(bundle.mainModule);
    
    console.log('DuckDB initialized successfully');
    return db;
  } catch (error) {
    console.error('Failed to initialize DuckDB:', error);
    throw new Error(`Failed to initialize DuckDB: ${error}`);
  }
};

export const getDuckDBConnection = async (): Promise<duckdb.AsyncDuckDBConnection> => {
  if (!db) {
    await initializeDuckDB();
  }
  
  if (!connection) {
    if (!db) {
      throw new Error('Database not initialized');
    }
    connection = await db.connect();
  }
  
  return connection;
};

export const closeDuckDBConnection = async () => {
  if (connection) {
    await connection.close();
    connection = null;
  }
};

export const isDuckDBInitialized = (): boolean => {
  return db !== null && connection !== null;
};