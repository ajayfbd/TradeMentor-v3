import { defineConfig } from 'drizzle-kit';

export default defineConfig({
  schema: './lib/db/schema.ts',
  out: './lib/db/migrations',
  driver: 'better-sqlite3',
  dbCredentials: {
    url: process.env.DATABASE_URL || './data/tradementor.db',
  },
  
  // Performance optimizations for queries
  tablesFilter: ["!__d1_migrations"],
  
  // Migration settings
  migrations: {
    prefix: 'timestamp',
    table: '__drizzle_migrations',
    schema: 'public',
  },
  
  // Development optimizations
  verbose: true,
  strict: true,
});
