const bcrypt=require("bcrypt")
const jwt=require("jsonwebtoken")
const pool=require("../config/db")
async function registerUser(req,res){
    try{
    const { name, email, password } = req.body
    if(!name || !email || !password){
        return res.status(400).json({
            success:false,
            message:"Name Email Password are Required"
        })
    }
    const hashedPassword=await bcrypt.hash(password,10)

    const existinguser=await pool.query("SELECT id from users where email=$1",[email])
    if(existinguser.rows.length>0){
        return res.status(409).json({
            success:false,
            message:"Email Already Registered"
        })
    }
    const result=await pool.query(`INSERT INTO users (name,email,password) values ($1,$2,$3) returning id,name,email,role`,[name,email,hashedPassword])
    const newUser=result.rows[0]
    return res.status(201).json({
        success:true,
        message:"User Has Been Registered Successfully!",
        data:newUser
    })
    }catch(error){
        console.error("Registration Error : ",error)
        if(error.code==="23505"){
            return res.status(409).json({
            success:false,
            message:"Email Already Exists"
        })
        }

        return res.status(500).json({
            success:false,
            message:"Internal Server Error"
        })
    }
}

async function loginUser(req,res) {
    try{
    const {email,password}=req.body
    if(!email || !password){
        return res.status(400).json({
            success:false,
            message:"Email And Password are Required"
        })
    }
    const result=await pool.query("select * from users where email=$1",[email])
    if(result.rows.length===0){
        return res.status(401).json({
            success:false,
            message:"Invalid Email Or Password"
        })
    }

    const user=result.rows[0]
    const isPasswordValid= await bcrypt.compare(password,user.password)
    if(!isPasswordValid){
        return res.status(401).json({
            success:false,
            message:"Invalid Email Or Password"
        })
    }

    const token=jwt.sign({id:user.id,role:user.role},process.env.JWT_SECRET,{expiresIn:"1d"})
    return res.status(200).json({
        success:true,
        message:"Login Successful!",
        data:{
            token,
            user:{
                id:user.id,
                name:user.name,
                email:user.email,
                role:user.role
            }
        }
    })
    }catch (error) {
        console.error("Login Error:", error)

        return res.status(500).json({
            success: false,
            message: "Internal Server Error"
        })
    }
}

async function getMe(req,res) {
    try{
    const result=await pool.query("select id,name,email,role from users where id=$1",[req.user.id])
    if(result.rows.length===0){
        return res.status(404).json({
            success:false,
            message:"User Not Found"
        })
    }
    return res.json({
        success:true,
        data:result.rows[0]
    })
    }catch(error){
        console.error("Get Profile Error:", error)
        return res.status(500).json({
            success: false,
            message: "Internal server error"
        })
    }
}

module.exports={registerUser, loginUser,getMe}