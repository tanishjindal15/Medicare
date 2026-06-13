const mongoose = require("mongoose")

const addressSchema = new mongoose.Schema({

  user:{
    type:mongoose.Schema.Types.ObjectId,
    ref:"User",
    required:true
  },

  name:String,
  phone:String,
  street:String,
  city:String,
  state:String,
  pincode:String,

  createdAt:{
    type:Date,
    default:Date.now
  }

})

module.exports = mongoose.model("Address",addressSchema)