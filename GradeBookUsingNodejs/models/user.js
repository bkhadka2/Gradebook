var mongoose = require("mongoose")

var Schema = mongoose.Schema

var UserSchema = new Schema({
    FirstName: { type: String, required: false, max: 30 },
    LastName: { type: String, required: false, max: 30 },
    email: { type: String, required: true, max: 100 },
    test1: {type:Number, max:110},
    test2: {type:Number, max:110},
    test3: {type:Number,  max:110},
    average:{type:Number,max:5000},
    grade:{type:String,required:true,max:2},
    password: { type: String, required: true, max: 100 }
})

// Export model

module.exports = mongoose.model("User", UserSchema, "users")
