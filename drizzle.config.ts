import type { Config } from 'drizzle-kit';

// Drizzle Kit config for expo-sqlite. `driver: 'expo'` makes `drizzle-kit generate`
// emit a bundled `migrations.js` (alongside the .sql files) that we import at runtime.
export default {
  schema: './src/db/schema.ts',
  out: './src/db/migrations',
  dialect: 'sqlite',
  driver: 'expo',
} satisfies Config;
