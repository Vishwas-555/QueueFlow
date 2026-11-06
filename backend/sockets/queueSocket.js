const pool = require("../config/db")

function registerQueueSocket(io) {
    io.on("connection", (socket) => {
        socket.on("join-queue-room", async (sessionId) => {
            try {
                if (!Number.isSafeInteger(sessionId) || sessionId <= 0) {
                    return
                }
                if (socket.user.role === "ADMIN") {
                    const result = await pool.query(
                        `SELECT id FROM queue_sessions
                         WHERE id = $1 AND status = 'ACTIVE'`,[sessionId])

                    if (result.rows.length === 0) {
                        socket.emit("queue-room-error", {
                            message: "Active Queue Session Not Found"
                        })
                        return
                    }
                } else {
                    const result = await pool.query(
                        `SELECT qs.id FROM queue_sessions qs JOIN queue_entries qe ON qe.queue_session_id = qs.id 
                        WHERE qs.id = $1 AND qe.user_id = $2 AND qs.status = 'ACTIVE' AND qe.status IN ('WAITING', 'SERVING') LIMIT 1`,
                        [sessionId, socket.user.id]
                    )
                    if (result.rows.length === 0) {
                        socket.emit("queue-room-error", {
                            message: "You are Not Authorised To Join this Queue Room"
                        })
                        return
                    }
                }
                socket.join(`queue:${sessionId}`)
                socket.emit("queue-room-joined", sessionId)
            } catch (error) {
                console.error("Join Queue Room Error:", error)
                socket.emit("queue-room-error", {
                    message: "Unable to join queue room."
                })
            }
        })
    })
}

module.exports = registerQueueSocket