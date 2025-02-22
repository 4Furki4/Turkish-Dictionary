import postgres from 'postgres'

const MAX_RETRIES = 30 // 30 retries
const RETRY_DELAY = 1000 // 1 second

const { DATABASE_URL } = process.env

if (!DATABASE_URL) {
    console.error('DATABASE_URL is not set')
    process.exit(1)
}

const sql = postgres(DATABASE_URL, { idle_timeout: 5 })

async function checkConnection(retries = MAX_RETRIES) {
    try {
        await sql`SELECT 1`
        console.log('Database is ready!')
        await sql.end()
        return true
    } catch (error) {
        console.log(`Database not ready, retries left: ${retries}`)
        if (retries <= 0) {
            console.error('Max retries reached, exiting')
            await sql.end()
            process.exit(1)
        }
        await new Promise(resolve => setTimeout(resolve, RETRY_DELAY))
        return checkConnection(retries - 1)
    }
}

console.log('Waiting for database...')
checkConnection()