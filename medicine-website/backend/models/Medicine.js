const mongoose = require("mongoose")

const medicineSchema = new mongoose.Schema({

  name:{
    type:String,
    required:true,
    maxlength:120
  },

  price:{
    type:Number,
    required:true,
    min:0
  },

  image:{
    type:String,
    required:true
  },

  category:{
    type:String,
    required:true
  },

  description:{
    type:String,
    required:true,
    maxlength:1000
  }

})

module.exports = mongoose.model("Medicine", medicineSchema)