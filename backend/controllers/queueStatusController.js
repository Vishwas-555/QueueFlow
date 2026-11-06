const pool = require("../config/db")

async function getMyQueueStatus(req, res) {
    try {
        const userId = req.user.id

        const result = await pool.query(
            `
                SELECT
                    qe.id,
                    qe.queue_session_id,
                    qe.ticket_number,
                    qe.priority,
                    qe.status,
                    qe.joined_at,
                    s.name AS service_name,
                    s.estimated_duration,
                    CASE
                        WHEN qe.status = 'SERVING' THEN 0
                        ELSE (
                            SELECT COUNT(*) + 1
                            FROM queue_entries other
                            WHERE other.queue_session_id = qe.queue_session_id
                            AND other.status = 'WAITING'
                            AND (
                                other.priority > qe.priority
                                OR (
                                    other.priority = qe.priority
                                    AND (
                                        other.joined_at < qe.joined_at
                                        OR (
                                            other.joined_at = qe.joined_at
                                            AND other.id < qe.id
                                        )
                                    )
                                )
                            )
                        )
                    END AS position
                FROM queue_entries qe
                JOIN queue_sessions qs
                    ON qe.queue_session_id = qs.id
                JOIN services s
                    ON qs.service_id = s.id
                WHERE qe.user_id = $1
                AND qe.status IN ('WAITING', 'SERVING')
                AND qs.status = 'ACTIVE'
                AND s.is_active = TRUE
                ORDER BY qe.joined_at DESC, qe.id DESC
            `,
            [userId]
        )

        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: "You are not currently in an active queue"
            })
        }

        const queues = result.rows.map((queue) => {
            const position = Number(queue.position)

            const estimatedWaitMinutes = queue.status === 'SERVING' ? 0 : (position - 1) * Number(queue.estimated_duration)

            return {
                id: queue.id,
                queue_session_id: queue.queue_session_id,
                ticket_number: queue.ticket_number,
                status: queue.status,
                position,
                service_name: queue.service_name,
                estimated_wait_minutes: estimatedWaitMinutes
            }
        })

        return res.status(200).json({
            success: true,
            data: queues
        })

    } catch (error) {
        console.error("Get Queue Status Error:", error)

        return res.status(500).json({
            success: false,
            message: "Internal Server Error"
        })
    }
}

module.exports = { getMyQueueStatus }