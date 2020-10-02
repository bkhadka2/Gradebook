var express = require("express")
var router = express.Router()
var bcrypt = require("bcryptjs")
var flash = require('express-flash');
var async = require('async');
var crypto = require('crypto');
var nodemailer = require('nodemailer');
var xoauth2 = require('xoauth2');

//var smtpTransport = require('nodemailer-smtp-transport');

const { check, validationResult } = require("express-validator/check")
const { sanitizeBody } = require("express-validator/filter")

var User = require("../models/user")

function Grade(req,res)
{
    //var ans;
    if((parseInt(req.body.test1)+parseInt(req.body.test2)+parseInt(req.body.test3))/3>=90)
        return "A"
    else if((parseInt(req.body.test1)+parseInt(req.body.test2)+parseInt(req.body.test3))/3>=80)
        return "B"
    else if((parseInt(req.body.test1)+parseInt(req.body.test2)+parseInt(req.body.test3))/3>=70)
        return "C"
    else if((parseInt(req.body.test1)+parseInt(req.body.test2)+parseInt(req.body.test3))/3>=60)
        return "D"
    else //if((parseInt(req.body.test1)+parseInt(req.body.test2)+parseInt(req.body.test3)/3)<60)
        return "F"

}
// function findAverage(res,req)
// {
//     var average = parseFloat(req.body.test1+req.body.test2+req.body.test3)/3.0;
//     return average;
// }

router.get("/",(req,res,next)=>{
    var user = req.session.user
    User.find({},function(error,users){
        if(error) throw error
        res.render("./private/dashboard",{
            title:"Student Grades",
            user:users
        })
    })

})

router.get("/dashboard",(req,res,next)=>{
    var user = req.session.user
    if(user){
        res.render("dashboard",{title: "Students Grades with class standing", user: user})
    }
    else
        res.redirect("/GradeBook/signUp")
})

router.get("/dashboard2",function(req,res,next){
    var user = req.session.user
    if(user){
        res.render("./private/dashboard2",{title: "Students Grades with class standing", user: user})
    }
    else
        res.redirect("/GradeBook/signUp")
})



router.get("/login", function(req, res, next) {
    res.render("./private/login", { title: "Log in" }) // pug template
})

router.post("/login", function(req, res, next) {
    var email = req.body.email
    var password = req.body.password
    User.findOne({email:email}, function(err, user) {
        if (err) {
            console.log(err)
            throw err
        }

        var validUser = false
        if (user) {
            // add user to session
            console.log(user)
            var hash = user.password
            //if(!hash) return false;
            validUser = bcrypt.compareSync(password, hash)
        }
        if (validUser) {
            req.session.user = user
            res.redirect("/GradeBook/dashboard2")
        } else {
            let context = {
                title: "Log in",
                error: "Invalid username and/or password"
            }
            res.render("./private/login", context)
        }
    })
})

router.get("/teacher", function(req, res, next) {
    res.render("./private/teacher", { title: "Login for Teacher" }) // pug template
})

router.post("/teacher", function(req, res, next) {
    var email = req.body.email
    var password = req.body.password
    User.findOne({email:email}, function(err, user) {
        if (err) {
            console.log(err)
            throw err
        }
        var validUser = false
        if (user) {
            // add user to session
            console.log(user)
            var hash = user.password
            //console.log(hash);
           // typeof(hash);
            validUser = bcrypt.compareSync(password, hash)
        }
        if (validUser) {
            req.session.user = user
            res.redirect("/GradeBook/")
        } else {
            let context = {
                title: "Login for Teacher",
                error: "Invalid username and/or password"
            }
            res.render("./private/teacher", context)
        }
    })
})

router.get("/signUp",function(req,res,next){
    res.render("./private/signUp",{title:"Signing Up"})
})

router.post(
    "/signUp",
    [
        // Validate fields.
        check("FirstName", "First name must not be empty.")
            .isLength({ min: 1 })
            .trim(),
        check("LastName", "Last name must not be empty.")
            .isLength({ min: 1 })
            .trim(),
        check("email", "Email must not be empty.")
            .isLength({ min: 1 })
            .trim(),
        // email must be valid
        check("email", "Not a valid email.")
            .isEmail()
            .trim(),
        check("test1", "Not a valid number")
            .isNumeric()
            .trim(),
        check("test2", "Not a valid number")
            .isNumeric()
            .trim(),
        check("test3", "Not a valid number")
            .isNumeric()
            .trim(),
        check("password", "Password must be at leat 5 chars long")
            .isLength({ min: 5 })
            .trim(),
        check("password1", "two passwords do not match")
            .exists()
            .custom((value, { req }) => value === req.body.password),
        // Sanitize fields.
        sanitizeBody("*")
            .trim()
            .escape()
    ],
    function(req, res, next) {
        // extract the validation errors from a request
        var user = req.session.user
        const errors = validationResult(req)
        // check if there are errors
        if (!errors.isEmpty()) {
            let context = {
                title: "SignUp",
                errors: errors.array()
            }
            res.render("./private/signUp", context)
        } else {
            // create a user document and insert into mongodb collection
            let user = new User({
                FirstName: req.body.FirstName,
                LastName: req.body.LastName,
                email: req.body.email,
                test1: req.body.test1,
                test2: req.body.test2,
                test3: req.body.test3,
                average:(parseInt(req.body.test1)+parseInt(req.body.test2)+parseInt(req.body.test3))/3,
                grade: Grade(req,res),

                password: bcrypt.hashSync(req.body.password, 10)
            })
            console.log(user)
            user.save(err => {
                if (err) {
                    return next(err)
                }
                // successful - redirect to dashboard
                // add user to session
                //findAverage(res,req);

                req.session.user = user
                res.redirect("/GradeBook/login")
            })
        }
    }
)

router.get("/logout", (req, res, next) => {
    var user = req.session.user
    if (user) {
        req.session.destroy(function() {
            console.log(`user: ${user.email} logged out...`)
        })
    }
    res.redirect("/")
})

router.get("/update", function(req, res, next) {

    user = req.session.user
    if (user) res.render("./private/update", { title: "Student Updates", user: user })
    else res.redirect("/GradeBook/login")
})

router.post("/update", function(req, res) {
    var user = req.session.user
    if (!user) res.redirect("./private/login")

    let condition = {
        FirstName: req.body.FirstName,
        LastName: req.body.LastName,
        email: req.body.email,
        test1: req.body.test1,
        test2: req.body.test2,
        test3: req.body.test3,
        average:(parseInt(req.body.test1)+parseInt(req.body.test2)+parseInt(req.body.test3))/3,
        grade: Grade(req,res)
    }
    var Email = req.body.email

    console.log(condition);
    User.updateOne({"email":Email},{$set:condition},function(err){
        if(err) throw err

        else{

            console.log(`updated course id: ${condition}`)
            res.redirect("/GradeBook")
        }

    })

})

function updateMember(res,id,user){
    var condition ={_FirstName:FirstName}
    var option = {}
    var update ={}
    User.update(condition,user,option,(err,rowsAffected)=>{
        if(err)
            throw err
    })
}

function addMember(res,user)
{
    var c = new User(user)
    c.save(err=> {
        if(err){
            return next(err)
        }
    })
}


router.get("/delete", function(req, res, next) {

    user = req.session.user
    if (user) res.render("./private/delete", { title: "Delete Students", user: user })
    else res.redirect("/GradeBook/login")
})
router.post("/delete",function(req,res,next){
    //console.log(body);
    let query ={
        FirstName: req.body.FirstName,
        LastName: req.body.LastName,
        email: req.body.email
    }
    console.log(query)
    User.deleteOne(query,function(err){
        if(err) throw err
        else{
            console.log(`Deleted course id: ${query}`)
            res.redirect("/GradeBook")
        }
    })
})


router.get("/addStudent",function(req,res,next){
    res.send("/GradeBook/signUp")
})


module.exports = router
