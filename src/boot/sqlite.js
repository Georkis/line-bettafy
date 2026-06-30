import { initDatabase } from 'src/services/sqlite'

export default async () => {
  try {
    const timeout = new Promise((_, reject) =>
      setTimeout(() => reject(new Error('SQLite init timed out')), 8000),
    )
    await Promise.race([initDatabase(), timeout])
    console.log('SQLite database initialized')
  } catch (e) {
    console.error('Failed to initialize SQLite:', e)
  }
}
