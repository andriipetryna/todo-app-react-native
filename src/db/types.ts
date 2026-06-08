import type { BaseSQLiteDatabase } from 'drizzle-orm/sqlite-core';
import type * as schema from './schema';

/**
 * Driver-agnostic Drizzle database type used by every repository.
 *
 * Both drivers we use are synchronous: `expo-sqlite` in the app and `better-sqlite3`
 * in tests. The middle type param is the driver-specific `.run()` result, which we
 * never inspect — `any` is justified here so a single repository works against both
 * drivers without leaking driver-specific types into the repository layer.
 */
export type DrizzleDb = BaseSQLiteDatabase<'sync', any, typeof schema>;
