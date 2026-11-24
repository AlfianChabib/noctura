import { config } from 'dotenv'
import { defineConfig } from 'drizzle-kit'

// Determine the active mode: APP_ENV, NODE_ENV, or default to 'development'
const mode = process.env.APP_ENV || process.env.NODE_ENV || 'development'

// Load environment variables with fallback cascading:
// 1. .env.[mode].local (highest priority local override for the specific mode)
// 2. .env.[mode] (default configurations for the specific mode)
// 3. .env.local (generic local overrides)
// 4. .env (base defaults)
config({
  path: [
    `.env.${mode}.local`,
    `.env.${mode}`,
    '.env.local',
    '.env',
  ],
})

const dbUrl = process.env.DATABASE_URL_UNPOOLED || process.env.DATABASE_URL

if (!dbUrl) {
  console.warn(
    `[drizzle.config.ts] Warning: Neither DATABASE_URL_UNPOOLED nor DATABASE_URL is set for environment '${mode}'.\n` +
    `Ensure .env.${mode}.local or .env.local exists with direct database URL configured.`
  )
}

export default defineConfig({
  out: './drizzle',
  schema: './src/db/schema/index.ts',
  dialect: 'postgresql',
  dbCredentials: {
    url: dbUrl as string,
  },
})
