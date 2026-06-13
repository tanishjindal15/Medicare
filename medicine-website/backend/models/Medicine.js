const mongoose = require("mongoose")

const medicineSchema = new mongoose.Schema({

  name:{
    type:String,
    required:true
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
    required:true
  }

})

module.exports = mongoose.model("Medicine", medicineSchema)