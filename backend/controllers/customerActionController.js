const pool = require("../config/db")

async function updateCustomerStatus(req, res) {
    
    const entryId=Number(req.params.entryId)
    if (!Number.isSafeInteger(entryId) || entryId <= 0) {
    return res.status(400).json({
        success: false,
        message: "Invalid Queue Entry ID"
    })
    }
    const action=req.body.action
    if(!["COMPLETED","SKIPPED"].includes(action)){
    return res.status(400).json({
        success: false,
        message: "Invalid Action. Use COMPLETED or SKIPPED"
    })
    }
    let client
    let transactionStarted = false
    try{
    client = await pool.connect()
    await client.query("BEGIN")
    transactionStarted = true
    const result=await client.query("select id,status from queue_entries where id=$1 and status='SERVING' for update",[entryId])
    if (result.rows.length === 0) {
        await client.query("ROLLBACK")
        transactionStarted = false
        return res.status(404).json({
            success: false,
            message: "Serving Queue Entry Not Found"
        })
    }
    const updateResult=await client.query(`update queue_entries set status=$1,completed_at=CURRENT_TIMESTAMP
        where id=$2 and status='SERVING' returning id, queue_session_id, user_id, ticket_number,
        priority, status, joined_at, started_at, completed_at`,[action,entryId])
    await client.query("COMMIT")
    transactionStarted = false
    const sessionId = updateResult.rows[0].queue_session_id
    const io = req.app.get("io")
    io.to(`queue:${sessionId}`).emit("queue-updated")

    return res.status(200).json({
    success: true,
    message: `Customer ${action} Successfully`,
    data: updateResult.rows[0]
    })
    
    }catch (error) {
    if (transactionStarted && client) {
        try {
            await client.query("ROLLBACK")
        } catch (rollbackError) {
            console.error("Rollback Error:", rollbackError)
        }
    }
    console.error("Update Customer Status Error:", error)
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
module.exports = { updateCustomerStatus }