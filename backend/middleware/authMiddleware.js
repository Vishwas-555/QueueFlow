const jwt= require("jsonwebtoken")

function authMiddleware(req,res,next){
    const authHeader = req.headers.authorization
    if(!authHeader || !authHeader.startsWith("Bearer ")){
        return res.status(401).json({
            success:false,
            message:"Authentication Token Required"
        })
    }

    const token=authHeader.split(" ")[1]
    let decoded 
    try{
    decoded=jwt.verify(token,process.env.JWT_SECRET)
    }catch(error){
    return res.status(401).json({
        success: false,
        message: "Invalid or expired token"
    })
}
    req.user=decoded
    next()
}

module.exports=authMiddleware