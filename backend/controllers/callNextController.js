const pool = require("../config/db")

async function callNextCustomer(req, res) {
    const sessionId = Number(req.params.sessionId)
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
    const sessionResult=await client.query(`select id from queue_sessions where id=$1 and status='ACTIVE' for update`,[sessionId])
    
    if (sessionResult.rows.length === 0) {
    await client.query("ROLLBACK")
    transactionStarted = false
    return res.status(404).json({
        success: false,
        message: "Active Queue Session Not Found"
    })
    }
    const customerResult=await client.query(`select id,user_id,ticket_number,priority,joined_at
        from queue_entries where queue_session_id=$1 and status='WAITING' 
        order by priority desc,joined_at asc,id asc limit 1 for update`,[sessionId])

    if (customerResult.rows.length === 0) {
    await client.query("COMMIT")
    transactionStarted = false
    return res.status(404).json({
        success: false,
        message: "No Waiting Customers In This Queue"
    })
    }
    const customer=customerResult.rows[0]
    const updateResult=await client.query(`update queue_entries set status='SERVING',started_at=CURRENT_TIMESTAMP
        where id=$1 returning id, queue_session_id, user_id, ticket_number,priority, status, joined_at, started_at`,[customer.id])
    await client.query("COMMIT")
    transactionStarted=false
    
    const io = req.app.get("io")
    io.to(`queue:${sessionId}`).emit("queue-updated")

    return res.status(200).json({
    success: true,
    message: "Next Customer Called Successfully",
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
    console.error("Call Next Customer Error:", error)
    return res.status(500).json({
        success: false,
        message: "Internal Server Error"
    })
    }finally {
    if (client) {
        client.release()
    }
    }
}

module.exports = { callNextCustomer }