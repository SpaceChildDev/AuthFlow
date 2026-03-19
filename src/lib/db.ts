import postgres from 'postgres'

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL environment variable is missing!')
}

const connectionString = process.env.DATABASE_URL
export const sql = postgres(connectionString, {
  ssl: 'require',
  max: 10,
  idle_timeout: 20,
  connect_timeout: 30,
  prepare: false,
  onnotice: () => {}, // Silences protocol notices from pooler
})
