const pool=require("../config/db")
async function getAdminQueue(req,res) {
    try{
    const sessionId=Number(req.params.sessionId)
    if(!Number.isSafeInteger(sessionId) || sessionId<=0){
        return res.status(400).json({
            success: false,
            message: "Invalid Queue Session ID"
        })  
    }
    const sessionResult=await pool.query("select id from queue_sessions where id=$1",[sessionId])
    if (sessionResult.rows.length === 0) {
        return res.status(404).json({
            success: false,
            message: "Queue Session Not Found"
        })
    }
    const result=await pool.query(`select qe.id,qe.ticket_number,qe.user_id,u.name as customer_name,
        qe.priority,qe.status,qe.joined_at from queue_entries qe join users u on qe.user_id=u.id
        where qe.queue_session_id=$1 and qe.status IN ('WAITING', 'SERVING') 
        order by qe.priority desc,qe.joined_at asc,qe.id asc`,[sessionId])
        return res.status(200).json({
            success: true,
            data: result.rows
        })
    }catch(error){
        console.error("Get Admin Queue Error:", error)
        return res.status(500).json({
            success: false,
            message: "Internal Server Error"
        })
    }

}
module.exports = { getAdminQueue }