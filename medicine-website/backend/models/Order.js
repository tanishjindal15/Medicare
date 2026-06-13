const mongoose = require("mongoose")

const orderSchema = new mongoose.Schema({

  user:{
    type:mongoose.Schema.Types.ObjectId,
    ref:"User",
    required:true
  },

  products:[
    {
      name:String,
      price:Number,
      qty:Number,
      image:String
    }
  ],

  total:{
    type:Number,
    required:true,
    min:0
  },

  address:{
    name:{ type:String, maxlength:80 },
    phone:{ type:String, maxlength:15 },
    street:{ type:String, maxlength:200 },
    city:{ type:String, maxlength:80 },
    state:{ type:String, maxlength:80 },
    pincode:{ type:String, maxlength:12 }
  },

  paymentMethod:{
    type:String,
    default:"COD"
  },

  paymentStatus:{
    type:String,
    default:"Pending"
  },

  // UPI transaction reference, when the customer pays online
  paymentRef:{
    type:String,
    default:""
  },

  status:{
    type:String,
    enum:["Pending","Shipped","Success","Cancelled"],
    default:"Pending"
  },

  createdAt:{
    type:Date,
    default:Date.now
  }

})

module.exports = mongoose.model("Order",orderSchema)