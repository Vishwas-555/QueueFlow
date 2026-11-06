function adminMiddleware(req,res,next){
    if(req.user.role !== "ADMIN"){
        return res.status(403).json({
            success:false,
            message:"Admin Access Required"
        })
    }
    next()
}
module.exports=adminMiddleware