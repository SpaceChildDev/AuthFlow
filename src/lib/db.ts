import postgres from 'postgres'

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL environment variable is missing!')
}

// Strip pgbouncer=true — postgres package handles pooler compat via prepare:false
const connectionString = process.env.DATABASE_URL
  .replace('?pgbouncer=true', '')
  .replace('&pgbouncer=true', '')

export const sql = postgres(connectionString, {
  ssl: 'require',
  max: 10,
  idle_timeout: 20,
  connect_timeout: 30,
  prepare: false,
})
