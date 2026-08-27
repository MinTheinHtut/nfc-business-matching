import session from 'express-session';
import expressMySqlSession from 'express-mysql-session';
import pool from './database.js';
import { sessionLifetimeMs } from './session-cookie.js';

const isProduction = process.env.NODE_ENV === 'production';
const storeMode = (process.env.SESSION_STORE || 'mysql').toLowerCase();

if (!['mysql', 'memory'].includes(storeMode)) {
  throw new Error('SESSION_STORE must be either "mysql" or "memory"');
}

if (isProduction && storeMode !== 'mysql') {
  throw new Error('Production requires SESSION_STORE=mysql');
}

let sessionStore;
let sessionStoreReady;

if (storeMode === 'memory') {
  sessionStore = new session.MemoryStore();
  sessionStoreReady = Promise.resolve();
} else {
  const MySQLStore = expressMySqlSession(session);
  sessionStore = new MySQLStore(
    {
      clearExpired: true,
      checkExpirationInterval: 1000 * 60 * 15,
      expiration: sessionLifetimeMs,
      createDatabaseTable: true,
      endConnectionOnClose: false,
      schema: {
        tableName: 'sessions',
      },
    },
    pool,
  );
  sessionStoreReady = sessionStore.onReady();
}

export { sessionStore, sessionStoreReady, storeMode as sessionStoreMode };
