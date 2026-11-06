const pool = require("../config/db")
async function startQueueSession(req, res) {
    const serviceId = Number(req.params.serviceId)
    if (!Number.isSafeInteger(serviceId) || serviceId <= 0) {
        return res.status(400).json({
            success: false,
            message: "Invalid Service ID"
        })
    }
    let client
    let transactionStarted = false
    try {
    client = await pool.connect()
    await client.query("BEGIN")
    transactionStarted = true
    const serviceResult=await client.query(`select id,name,is_active from services where id=$1 for update`,[serviceId])
    if (serviceResult.rows.length === 0) {
    await client.query("ROLLBACK")
    transactionStarted = false
    return res.status(404).json({
        success: false,
        message: "Service Not Found"
    })
    }
    if (!serviceResult.rows[0].is_active) {
    await client.query("ROLLBACK")
    transactionStarted = false
    return res.status(409).json({
        success: false,
        message: "Cannot Start Queue Session For An Inactive Service"
    })
    }
    const activeSessionResult=await client.query(`select id from queue_sessions where service_id=$1 and status='ACTIVE' limit 1`,[serviceId])
    if (activeSessionResult.rows.length > 0) {
    await client.query("ROLLBACK")
    transactionStarted = false
    return res.status(409).json({
        success: false,
        message: "An Active Queue Session Already Exists For This Service"
    })
    }
    const sessionResult=await client.query(`insert into queue_sessions(service_id,status) values ($1,'ACTIVE')
        returning  id, service_id, status, started_at, ended_at`,[serviceId])
    await client.query("COMMIT")
    transactionStarted = false
    return res.status(201).json({
    success: true,
    message: "Queue Session Started Successfully",
    data: sessionResult.rows[0]
    })
    } catch (error) {
    if (transactionStarted && client) {
        try {
            await client.query("ROLLBACK")
        } catch (rollbackError) {
            console.error("Rollback Error:", rollbackError)
        }
    }
    if (error.code === "23505") {
        return res.status(409).json({
            success: false,
            message: "An Active Queue Session Already Exists For This Service"
        })
    }
    console.error("Start Queue Session Error:", error)
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

module.exports = { startQueueSession }
