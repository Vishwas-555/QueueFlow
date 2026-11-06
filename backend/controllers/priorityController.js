const pool = require("../config/db")

async function updateQueuePriority(req, res) {
    let client
    let transactionStarted = false
    try {
        const entryId = Number(req.params.entryId)
        const { priority } = req.body

        if (!Number.isSafeInteger(entryId) || entryId <= 0) {
            return res.status(400).json({
                success: false,
                message: "Invalid Queue Entry ID"
            })
        }

            if (![0, 1, 2].includes(priority)) {
                return res.status(400).json({
                    success: false,
                    message: "Priority Must Be 0 (Normal), 1 (Medium), or 2 (High)"
                })
            }
        client = await pool.connect()
        await client.query("BEGIN")
        transactionStarted = true

        const entryResult = await client.query(
            `SELECT id, queue_session_id, priority
             FROM queue_entries
             WHERE id = $1 AND status = 'WAITING'
             FOR UPDATE`,
            [entryId]
        )
        if (entryResult.rows.length === 0) {
            await client.query("ROLLBACK")
            transactionStarted = false
            return res.status(404).json({
                success: false,
                message: "Waiting Queue Entry Not Found"
            })
        }
        const entry = entryResult.rows[0]
    
        await client.query(
            `UPDATE queue_entries
             SET priority = $1
             WHERE id = $2`,
            [priority, entryId]
        )
        await client.query("COMMIT")
        transactionStarted = false

        const io = req.app.get("io")
        io.to(`queue:${entry.queue_session_id}`).emit("queue-updated")
        return res.status(200).json({
            success: true,
            message: "Queue Priority Updated Successfully",
            data: {
                entry_id: entryId,
                previous_priority: entry.priority,
                priority: priority
            }
        })
    } catch (error) {
        console.error("Update Queue Priority Error:", error)
        if (client && transactionStarted) {
            try {
                await client.query("ROLLBACK")
            } catch (rollbackError) {
                console.error("Rollback Error:", rollbackError)
            }
        }
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
module.exports = { updateQueuePriority }