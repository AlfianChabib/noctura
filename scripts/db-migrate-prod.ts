import { execSync } from 'node:child_process'

// Force production mode for Drizzle Kit execution
process.env.APP_ENV = 'production'
process.env.NODE_ENV = 'production'

console.log('🚀 Running Drizzle migration in PRODUCTION mode...')
try {
  execSync('npx drizzle-kit migrate', { stdio: 'inherit', env: process.env })
} catch (error) {
  console.error('❌ Migration failed:', error)
  process.exit(1)
}
