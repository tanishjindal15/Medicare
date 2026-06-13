const mongoose = require("mongoose")

const addressSchema = new mongoose.Schema({

  user:{
    type:mongoose.Schema.Types.ObjectId,
    ref:"User",
    required:true
  },

  name:{ type:String, maxlength:80 },
  phone:{ type:String, maxlength:15 },
  street:{ type:String, maxlength:200 },
  city:{ type:String, maxlength:80 },
  state:{ type:String, maxlength:80 },
  pincode:{ type:String, maxlength:12 },

  createdAt:{
    type:Date,
    default:Date.now
  }

})

module.exports = mongoose.model("Address",addressSchema)