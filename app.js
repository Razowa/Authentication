const ex=require("express");
const cors=require("cors");
const ejs=require("ejs");
const app=ex();
require("./config/database");
require("dotenv").config();
require("./config/passport");
const User=require("./models/user.models")
const bcrypt = require('bcrypt');
const saltRounds = 10;

const passport=require("passport");
const session=require("express-session");
const MongoStore = require("connect-mongo");


app.set("view engine","ejs");
app.use(cors());
app.use(ex.urlencoded({extended:true}));
app.use(ex.json());

app.set('trust proxy', 1) // trust first proxy
app.use(session({
  secret: 'keyboard cat',
  resave: false,
  saveUninitialized: true,
  store: MongoStore.create({
    mongoUrl:process.env.MONGO_URL,
    collectionName:"sessions",
  }),
  //cookie: { secure: true }
}));

app.use(passport.initialize());
app.use(passport.session());

app.get("/",(req,res)=>{
    res.render("indes");
});

//get register
app.get("/register",(req,res)=>{
   res.render("register");
});

//post register
app.post("/register",async(req,res)=>{
   try{
      const user= await User.findOne({username: req.body.username});

if(user) return res.status(400).send("user already exists");



bcrypt.hash(req.body.password, saltRounds, async (err, hash)=> {
   const newUser=new User({
      username: req.body.username,
      password:hash,
   });
   await newUser.save();
   res.redirect("/login");
});

   }
   catch(error){
res.status(500).send(error.message);
   }

 });

 const checkLogged=(req, res, next)=>{
   if(req.isAuthenticated()){
      return res.redirect("/profile")
   }
   next();
 };

 //get login
app.get("/login",checkLogged, (req,res)=>{
   res.render("login");
});

//post login
app.post("/login",
passport.authenticate("local",{
   failureRedirect:"/login",
   successRedirect:"/profile",
}));


const checkAuthenticated=(req, res, next)=>{
   if(req.isAuthenticated()){
      return next();
   }
 res.redirect("/login");
 };

//get profile

app.get("/profile", checkAuthenticated, (req,res)=>{
res.render("profile")
});

//get logout
app.get("/logout",(req,res)=>{
  try{
req.logout((err)=>{
   if(err){
      return next(err)
   }
   res.redirect("/")
})
  }
  catch(error){
res.status(500).send(error.message);
  }
});

module.exports=app;