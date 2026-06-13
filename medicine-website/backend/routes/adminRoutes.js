const express = require("express")
const router = express.Router()

const Order = require("../models/Order")
const User = require("../models/User")
const authMiddleware = require("../middleware/authMiddleware")
const adminMiddleware = require("../middleware/adminMiddleware")

// GET ADMIN STATS

router.get("/stats", authMiddleware, adminMiddleware, async(req,res,next)=>{

  try{

    const totalOrders = await Order.countDocuments()

    const totalUsers = await User.countDocuments()

    // Revenue only counts delivered orders (not pending / cancelled)
    const deliveredOrders = await Order.find({ status: "Success" })

    const totalRevenue = deliveredOrders.reduce(
      (sum,order)=> sum + order.total,
      0
    )

    res.json({
      totalOrders,
      totalUsers,
      totalRevenue
    })

  }catch(err){
    next(err)
  }

})

module.exports = router