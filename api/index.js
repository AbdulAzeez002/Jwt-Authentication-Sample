const express=require('express')
const app=express()
app.use(express.json())
const jwt=require('jsonwebtoken')

const users=[
    {
        id:'1',
        username:'john',
        password:'John0908',
        isAdmin:true
    },
    {
        id:'2',
        username:'jane',
        password:'Jane0908',
        isAdmin:false
    }

]

let refreshTokens=[]

app.post('/api/refresh',(req,res)=>{
// take refresh token from user
console.log(req.body);
const refreshToken=req.body.token

// send error if there is no token or its invalid

if(!refreshToken){
    return res.status(401).json('You are not authenticated')
}
if(!refreshTokens.includes(refreshToken)){
    console.log(refreshTokens);
    return res.status(403).json("Refresh Token is invalid")
}

jwt.verify(refreshToken,"myRefreshSecretKey",(err,user)=>{
    if(err){
        console.log(err);
    }

    else{
        refreshTokens=refreshTokens.filter((token)=>token!==refreshToken)

        const newAccessToken=generateAccessToken(user)
        const newRefreshToken=generateRefreshToken(user)

        refreshTokens.push(newRefreshToken)

        res.status(200).json({
            AccessToken:newAccessToken,
            RefreshToken:newRefreshToken
        })
    }
    
})

})

const generateAccessToken=(user)=>{
   return jwt.sign({id:user.id,isAdmin:user.isAdmin},"mySecretKey",{expiresIn:"5s"})

}

const generateRefreshToken=(user)=>{
   return jwt.sign({id:user.id,isAdmin:user.isAdmin},"myRefreshSecretKey")

}

app.post('/api/login',(req,res)=>{
    const {username,password}=req.body

    
    const user=users.find((u)=>{
        return u.username===username && u.password===password
    })
   

    if(user){
        //Generate an access token
       const AccessToken= generateAccessToken(user)
       const RefreshToken= generateRefreshToken(user)
       console.log(RefreshToken);

       refreshTokens.push(RefreshToken)
       console.log(refreshTokens);
        

        res.json({
            username:user.username,
            isAdmin:user.isAdmin,
            AccessToken,
            RefreshToken
        })
    }
    else{
        res.status(400).json('username or password incorrect')
    }

})

const verify=(req,res,next)=>{
    const authHeader=req.headers.authorization

    if(authHeader){
        const token=authHeader.split(" ")[1]
        jwt.verify(token,'mySecretKey',(err,user)=>{
            if(err){
                return res.status(403).json('Token is not valid')
            }
            req.user=user;
            next()
        })


    }else{
        res.status(401).json('you are not authenticated')
    }
}

app.delete('/api/users/:userId',verify,(req,res)=>{
    console.log('reached');
    if(req.user.id===req.params.userId || req.user.isAdmin){
        res.status(200).json('user has been deleted')
    }
    else{
        res.status(403).json('you are not eligible to delete this user')
    }
})


app.post('/api/logout',verify,(req,res)=>{
    console.log(req.body);
    console.log('aaaaaaaaaaaaaaaaaa');
    const refreshToken=req.body.token
    refreshTokens=refreshTokens.filter((token)=>token!==refreshToken)

    res.status(200).json("you are logged out successfully")
})

app.listen(5000,()=>{
    console.log('Backend is working')
})