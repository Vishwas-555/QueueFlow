const pool = require("../config/db")

async function getActiveQueueCount(req, res) {
    try {
        const result = await pool.query(`
            SELECT COUNT(*) AS active_queues
            FROM queue_sessions
            WHERE status = 'ACTIVE'
        `)

        return res.status(200).json({
            success: true,
            data: {
                active_queues: Number(result.rows[0].active_queues)
            }
        })
    } catch (error) {
        console.error("Get Active Queue Count Error:", error)

        return res.status(500).json({
            success: false,
            message: "Internal Server Error"
        })
    }
}

module.exports = { getActiveQueueCount }