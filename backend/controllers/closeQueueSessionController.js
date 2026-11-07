const pool = require("../config/db")
async function closeQueueSession(req, res) {
    const sessionId=Number(req.params.sessionId)
    if (!Number.isSafeInteger(sessionId) || sessionId <= 0) {
    return res.status(400).json({
        success: false,
        message: "Invalid Queue Session ID"
    })
    }
    let client
    let transactionStarted = false
    try {
    client = await pool.connect()
    await client.query("BEGIN")
    transactionStarted = true
    const sessionResult = await client.query(`
    SELECT qs.id, qs.service_id, qs.status, s.name AS service_name
    FROM queue_sessions qs
    JOIN services s ON qs.service_id = s.id
    WHERE qs.id = $1 AND qs.status = 'ACTIVE'
    FOR UPDATE OF qs
    `, [sessionId])
    if (sessionResult.rows.length === 0) {
    await client.query("ROLLBACK")
    transactionStarted = false
    return res.status(404).json({
        success: false,
        message: "Active Queue Session Not Found"
    })
    }
    const customerResult=await client.query("select id from queue_entries where queue_session_id=$1 and status in('WAITING','SERVING') limit 1",[sessionId])
    if (customerResult.rows.length > 0) {
    await client.query("ROLLBACK")
    transactionStarted = false
    return res.status(409).json({
        success: false,
        message: "Cannot Close Queue Session While Customers Are Waiting Or Being Served"
    })
    }
    const updateResult=await client.query(`update queue_sessions set status='CLOSED',ended_at=CURRENT_TIMESTAMP
        where id=$1 and status='ACTIVE' returning id, service_id, status, started_at, ended_at`,[sessionId])
    if (updateResult.rows.length === 0) {
    await client.query("ROLLBACK")
    transactionStarted = false

    return res.status(404).json({
        success: false,
        message: "Active Queue Session Not Found"
    })
    }
        await client.query("COMMIT")
    transactionStarted = false
    const io = req.app.get("io")
    io.to(`queue:${sessionId}`).emit("queue-session-closed", {sessionId,serviceName: sessionResult.rows[0].service_name})
    return res.status(200).json({
        success: true,
        message: "Queue Session Closed Successfully",
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
    console.error("Close Queue Session Error:", error)
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

module.exports = { closeQueueSession }
