const express=require("express")

const dotenv=require("dotenv").config()
const PORT= process.env.port
const app=express()
const mongoose=require("mongoose")
app.use(express.json())

//I am tryting to test run something
mongoose.connect(process.env.db).then(()=>{
    console.log("connection  to db successfully established")
    app.listen(PORT,()=>{
        console.log(`server is running on port ${PORT}`);
    })
}).catch((err)=>{
    console.log("unable to connect to db"+err.message)
})

app.get("/",(req,res)=>{
    res.status(200).json("Welcome to mongoDB")

})
 

const date=new Date
const scoreSchema=new mongoose.Schema({
    firstName:{type:String,required:[true,"kindly fill your first name"]},
    lastName:{type:String,required:[true,"kindly fill your last name"]},
    birthYear:{type:Number,required:[true,"birth year is required"]},
    age:{type:Number},
    sex:{type:String, enum:["male","female"]},
    state:{type:String,required:[true,"kindly fill your state"]},
    subjects:{type:Array,required:[true,"kindly fill your subjects"]},
    scores:{type:Object,required:[true,"kindly fill your scores"]},
    total:{type:Number},
    isPassed:{type:Boolean,default:function(){
        if(this.total<200){
            return false
        }else{
            return true
        }
    }}
},{timestamps:true})


const scoreModel=mongoose.model("examScore",scoreSchema)

app.post("/createuser",async(req,res)=>{
    try {
        const{firstName,lastName,birthYear,sex,state,subjects,scores}=req.body

        if(!(subjects.includes(Object.keys(scores)[0]) && subjects.includes(Object.keys(scores)[1]) && subjects.includes(Object.keys(scores)[2]) &&subjects.includes(Object.keys(scores)[3]))){
            return res.status(400).json("scores column doesnt match with the subject provided")
        }else{
        const data={firstName,
            lastName,
            birthYear,
            sex,
            state,
            subjects,
            age:date.getFullYear()-birthYear,
            scores,
            total:Object.values(scores).reduce((a,b)=>{
                return a+b
            }),
        }
        if(data.age<18){return res.status(400).json("you are not eligible to register for this exam")}
        const newData= await scoreModel.create(data)

        res.status(201).json({message:`new user created`, newData})
    }
    } catch (error) {
        res.status(500).json(error.message)
    }
}) 

app.get("/getall",async(req,res)=>{
    try{
    const allStudent=await scoreModel.find()
    res.status(200).json({message:`kindly find below the ${allStudent.length}registered students`, allStudent})
    }catch(error){
        res.status(500).json(error.message)
    }
})


app.get("/getone/:id",async(req,res)=>{
    try {
        let userId=req.params.id
        const getOneStudent=await scoreModel.findById(userId)
        res.status(200).json({message:`below is the  ${userId} of the requested student`, data:getOneStudent})
    } catch (error) {
        res.status(500).json(error.message)
    }
})


app.get("/:status",async(req,res)=>{
    try {
        let status=req.params.status.toLowerCase()==="true"
        const getPass=await scoreModel.find({isPassed:status})
        if(status==true){res.status(200).json({message:`kindly find below the  ${getPass.length} passed students`, getPass})
        }else{
            res.status(200).json({message:`kindly find below the  ${getPass.length} passed students`,getPass})
        }
    } catch (error) {
     res.status(500).json(error.message)   
    }
})

//update user
app.put("/updateuser/:id",async(req,res)=>{
    try {
        let userId =req.params.id

        
        if(req.params.id !==({userId}) ){
            return res.status(400).json("The provided userID is incorrect")
        }
        let{yb,subjects,scores}=req.body
        let data={
            birthYear:yb,
            age:date.getFullYear() - yb,
            subjects,
            scores,
            total:Object.values(scores).reduce((a,b)=>{
              return  a+b

            }), 

        }
        if(data.total<200){
            data.isPassed=false
        }else{
            data.isPassed=true
        }
        //data.total<200 ? isPassed = false : isPassed = true
        if(!(subjects.includes(Object.keys(scores)[0]) && subjects.includes(Object.keys(scores)[1]) && subjects.includes(Object.keys(scores)[2]) && subjects.includes(Object.keys(scores)[3]))){
            return res.status(400).json("scores column doesnt match with the subject provided")
        }else{

        const updatedUser = await scoreModel.findByIdAndUpdate(userId,data,{new:true})
        res.status(200).json({message:`${updatedUser.firstName} information has been successfully updated`, data:updatedUser})
        }
    } catch (error) {
        res.status(400).json(error.message)
    }
})

//updateuserinfo
app.put("/updateinfo/:id",async(req,res)=>{
    try {
        const{firstName,lastName,state,sex}=req.body
        let firstLetter=firstName.charAt(0).toUpperCase()
        let remainingChar=firstName.slice(1).toLowerCase()
        let allTogether=firstLetter.concat(remainingChar)

        let firstLetter2=lastName.charAt(0).toUpperCase()
        let remainingChar2=lastName.slice(1).toLowerCase()
        let allTogether2=firstLetter2.concat(remainingChar2)

        
        let firstLetter3=state.charAt(0).toUpperCase()
        let remainingChar3=state.slice(1).toLowerCase()
        let allTogether3=firstLetter3.concat(remainingChar3)

        const userInfo={
            firstName:allTogether,
            lastName:allTogether2,
            state:allTogether3,
            sex
        }
        if(userInfo.sex !== "male" && userInfo.sex !== "female"){
            return res.status(400).json("sex can either be male or female")
        }
        let updateUserInfo = await scoreModel.findByIdAndUpdate(req.params.id,userInfo,{new:true})
        res.status(200).json({message:`${updateUserInfo.firstName} information has been updated`,userInfo:updateUserInfo})
    } catch (error) {
        res.status(500).json(error.message)
    }
})


