const createError = require('http-errors');
const express = require('express'); //Framework for building web applications on top of Node.
const path = require('path');
const cookieParser = require('cookie-parser');
const logger = require('morgan');
const session = require('express-session');
const mongoose = require('mongoose'); // manages relationships between data, provides schema validation, and is used to translate between objects.
const flash = require('express-flash');
//const router = express.Router();
var mongo_db_url = "mongodb://localhost:27017/GradeLedger";
var mongoDB = process.env.MONGODB_URI || mongo_db_url
mongoose.connect(mongoDB)
mongoose.Promise = global.Promise //used when we want to get connected in to mongoDB database
var db = mongoose.connection;
db.on("error", console.error.bind(console,"MongoDB connection error:"))

//router
var publicRouter = require("./routes/public")
var privateRouter = require("./routes/grade")

var app = express();
app.engine('pug', require('pug').__express);
app.set('views', path.join(__dirname,'views'))
app.set('view engine','pug')

app.use(logger("dev"))
app.use(express.json())
app.use(express.urlencoded({extended: false}))
app.use(cookieParser())

app.use(session({secret: 'fd83rndfp;353laf;343some scret!',
                proxy: true,
                resave: true,
                saveUninitialized: true
}));

app.use(express.static(path.join(__dirname,'public')))
app.use(flash());
//public router
app.use("/", publicRouter)
app.use("/Gradebook", privateRouter)
app.use(function(req,res, next){
    next(createError(404))
})

app.use(function(err,req,res,next){
    res.locals.message = err.message
    res.locals.error = req.app.get('env') === 'development'? err : {}
    res.status(err.status || 500)
    res.render('error')
})



app.listen(3000, function(){
    console.log("Now listing on port 3000...")
})

module.exports = app;
