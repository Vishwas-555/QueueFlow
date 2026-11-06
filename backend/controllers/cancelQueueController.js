const pool = require("../config/db")

async function cancelQueueEntry(req, res) {
    const userId = req.user.id
    const entryId = Number(req.params.entryId)

    if (!Number.isInteger(entryId) || entryId <= 0) {
        return res.status(400).json({
            success: false,
            message: "Invalid Queue Entry ID"
        })
    }

    let client
    let transactionStarted = false

    try {
        client = await pool.connect()

        await client.query("BEGIN")
        transactionStarted = true

        const result = await client.query(
            `SELECT id, queue_session_id, user_id, ticket_number,
                    priority, status, joined_at
             FROM queue_entries
             WHERE id = $1 AND user_id = $2 AND status = 'WAITING'
             FOR UPDATE`,
            [entryId, userId]
        )

        if (result.rows.length === 0) {
            await client.query("ROLLBACK")
            transactionStarted = false

            return res.status(404).json({
                success: false,
                message: "Waiting Queue Entry Not Found"
            })
        }

        const updateResult = await client.query(
            `UPDATE queue_entries
             SET status = 'CANCELLED',
                 completed_at = CURRENT_TIMESTAMP
             WHERE id = $1 AND user_id = $2 AND status = 'WAITING'
             RETURNING id, queue_session_id, user_id, ticket_number,
                       priority, status, joined_at, completed_at`,
            [entryId, userId]
        )

        if (updateResult.rows.length === 0) {
            await client.query("ROLLBACK")
            transactionStarted = false

            return res.status(409).json({
                success: false,
                message: "Queue Entry Is No Longer Waiting"
            })
        }

        await client.query("COMMIT")
        transactionStarted = false

        const io = req.app.get("io")
        io.to(`queue:${result.rows[0].queue_session_id}`).emit("queue-updated", {
            sessionId: result.rows[0].queue_session_id
        })

        return res.status(200).json({
            success: true,
            message: "Queue Entry Cancelled Successfully",
            data: updateResult.rows[0]
        })

    } catch (error) {
        if (transactionStarted && client) {
            try {
                await client.query("ROLLBACK")
            } catch (rollbackError) {
                console.error("Rollback Error:", rollbackError)
            }
        }

        console.error("Cancel Queue Entry Error:", error)

        return res.status(500).json({
            success: false,
            message: "Internal Server Error"
        })

    } finally {
        if (client) {
            client.release()
        }
    }
}

module.exports = { cancelQueueEntry }
