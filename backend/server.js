require("dotenv").config()
const express = require("express")
const http = require("http")
const { Server } = require("socket.io")
const cors = require("cors")
const authRoutes = require("./routes/authRoutes")
const serviceRoutes = require("./routes/serviceRoutes")
const queueRoutes = require("./routes/queueRoutes")
const registerQueueSocket = require("./sockets/queueSocket")
const app = express()
const server = http.createServer(app)
const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:5173"
const io = new Server(server, {
    cors: {
        origin: FRONTEND_URL,
        methods: ["GET", "POST", "PATCH"]
    }
})

app.set("io", io)

app.use(cors({
    origin: FRONTEND_URL
}))

app.use(express.json())

app.use("/api/v1/auth", authRoutes)
app.use("/api/v1/services", serviceRoutes)
app.use("/api/v1/queues", queueRoutes)

app.get("/", (req, res) => {
    res.send("Queue Managment System is Running!!!")
})

io.use((socket,next)=>{
    const token=socket.handshake.auth?.token
    if(!token){
        return next(new Error("Authentication Token Required"))
    }
    try{
        const jwt=require("jsonwebtoken")
        const decoded=jwt.verify(token,process.env.JWT_SECRET)
        socket.user={
            id:decoded.id,
            role:decoded.role
        }
        next()
    }catch (error) {
        next(new Error("Invalid or expired token"))
    }
})

io.on("connection", (socket) => {
    console.log("Client connected:", socket.id)
    socket.on("disconnect", () => {
        console.log("Client disconnected:", socket.id)
    })
})
registerQueueSocket(io)

const PORT = process.env.PORT || 5000

server.listen(PORT, () => {
    console.log(`App is running on Port ${PORT}`)
})
