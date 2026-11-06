require("dotenv").config()

const pool = require("./config/db")

async function testConnection() {
    try {
        const result = await pool.query(
            "SELECT current_database(), NOW()"
        )

        console.log("Connected Database:", result.rows[0].current_database)
        console.log("Connection Time:", result.rows[0].now)
    } catch (error) {
        console.error("Database Connection Failed:", error.message)
    } finally {
        await pool.end()
    }
}

testConnection()