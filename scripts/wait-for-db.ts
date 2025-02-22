import postgres from 'postgres'

const { DATABASE_URL } = process.env

if (!DATABASE_URL) {
    console.error('DATABASE_URL is not set')
    process.exit(1)
}

const sql = postgres(DATABASE_URL, { timeout: 5000 })

async function checkConnection() {
    try {
        await sql`SELECT 1`
        console.log('Database is ready!')
        process.exit(0)
    } catch (error) {
        console.error('Database is not ready:', error)
        process.exit(1)
    } finally {
        await sql.end()
    }
}

console.log('Waiting for database...')
checkConnection()