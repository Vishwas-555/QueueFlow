const pool = require("../config/db")

async function getActiveQueueSessions(req, res) {
    try {
        const result = await pool.query(`
            SELECT
                qs.id,
                qs.service_id,
                qs.status,
                qs.started_at,
                qs.ended_at,
                s.name AS service_name
            FROM queue_sessions qs
            JOIN services s ON qs.service_id = s.id
            WHERE qs.status = 'ACTIVE'
            ORDER BY qs.started_at DESC
        `)

        return res.status(200).json({
            success: true,
            data: result.rows
        })

    } catch (error) {
        console.error("Get Active Queue Sessions Error:", error)

        return res.status(500).json({
            success: false,
            message: "Internal Server Error"
        })
    }
}

module.exports = { getActiveQueueSessions }