const pool=require("../config/db")
async function joinQueue(req,res) {
    let client
    let transactionStarted = false
    try{
    const {service_id}=req.body
    if (service_id === undefined || service_id === null) {
    return res.status(400).json({
        success: false,
        message: "Service ID Is Required"
    })
    }
    if(!Number.isInteger(Number(service_id)) || Number(service_id)<=0|| !/^[1-9]\d*$/.test(String(service_id))){
    return res.status(400).json({
        success: false,
        message: "Service ID Must Be A Positive Integer"
    })
    }
    
    const serviceId=Number(service_id)
    if (!Number.isSafeInteger(serviceId)) {
    return res.status(400).json({
        success: false,
        message: "Invalid Service ID"
    })
    }
    client=await pool.connect()
    await client.query("BEGIN")
    transactionStarted = true

    const serviceResult=await client.query("select id,name,estimated_duration from services where id=$1 and is_active=TRUE for SHARE",[serviceId])
    if (serviceResult.rows.length === 0) {
    await client.query("ROLLBACK")
    transactionStarted = false
    return res.status(404).json({
        success: false,
        message: "Service Not Found or Inactive"
    })
    }
    const service=serviceResult.rows[0]
    const sessionResult=await client.query("select id from queue_sessions where service_id=$1 and status='ACTIVE' for UPDATE",[service.id])
    if (sessionResult.rows.length === 0) {
    await client.query("ROLLBACK")
    transactionStarted = false
    return res.status(404).json({
        success: false,
        message: "No Active Queue Session Found"
    })
    }
    const session=sessionResult.rows[0]
    const sessionId=session.id
    const existingEntry=await client.query("select id from queue_entries where queue_session_id=$1 and user_id=$2 and status IN ('WAITING', 'SERVING')",[sessionId,req.user.id])
    if (existingEntry.rows.length > 0) {
        await client.query("ROLLBACK")
        transactionStarted = false
    return res.status(409).json({
        success: false,
        message: "You Already Have An Active Entry In This Queue"
    })
    }
    const ticketResult=await client.query("select COALESCE(MAX(ticket_number),0) as last_ticket from queue_entries where queue_session_id=$1",[sessionId])
    const ticketNumber=Number(ticketResult.rows[0].last_ticket)+1

    const entryResult=await client.query("insert into queue_entries(queue_session_id,user_id,ticket_number,priority,status) values ($1,$2,$3,$4,$5) returning id,queue_session_id,user_id,ticket_number,priority,status,joined_at",[sessionId,req.user.id,ticketNumber,0,"WAITING"])
    const entry=entryResult.rows[0]
    
    const positionResult=await client.query("select count(*) from queue_entries where queue_session_id=$1 and status='WAITING' and (priority>$2 or (priority=$2 and (joined_at<$3 or (joined_at=$3 and id<$4))))",[sessionId,entry.priority,entry.joined_at,entry.id])
    const position=Number(positionResult.rows[0].count)+1   
    const estimatedWaitMinutes=(position-1)*service.estimated_duration
    const queueData = {
    ...entry,
    position,
    estimated_wait_minutes: estimatedWaitMinutes
    }

    await client.query("COMMIT")
    transactionStarted=false

    const io = req.app.get("io")
    io.to(`queue:${sessionId}`).emit("queue-updated")

    return res.status(201).json({
    success: true,
    message: "Successfully Joined Queue",
    data: queueData
    })
    
    }catch (error) {
    console.error("Join Queue Error:", error)
          if (client && transactionStarted) {
            try {
                await client.query("ROLLBACK")
            } catch (rollbackError) {
                console.error("Rollback Error:", rollbackError)
            } finally {
                transactionStarted = false
            }
        }
        if (error.code === "23505") {
        return res.status(409).json({
            success: false,
            message: "A queue entry conflict occurred. Please try again."
        })
        }
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
module.exports={joinQueue}