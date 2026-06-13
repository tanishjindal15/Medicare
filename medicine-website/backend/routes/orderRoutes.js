const express = require("express")
const router = express.Router()

const mongoose = require("mongoose")
const rateLimit = require("express-rate-limit")
const Order = require("../models/Order")
const User = require("../models/User")
const Medicine = require("../models/Medicine")
const authMiddleware = require("../middleware/authMiddleware")
const adminMiddleware = require("../middleware/adminMiddleware")
const { sendMailSafe } = require("../config/mailer")

/* Limit how many orders a single user can place in a short window (anti-spam).
   Keyed on the authenticated user id, so shared IPs (office/college) are fine. */
const orderLimiter = rateLimit({
  windowMs: 10 * 60 * 1000, // 10 minutes
  max: 12,                  // up to 12 orders per user per window
  message: { message: "You're placing orders too quickly. Please try again in a few minutes." },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => req.user.id
})

/* How long after placing an order a customer may still cancel it */
const CANCEL_WINDOW_MS = 5 * 60 * 1000 // 5 minutes

/* Reusable HTML table listing the order's items */
const itemsTableHtml = (order) => {
  const rows = (order.products || []).map(p => `
    <tr>
      <td style="padding:8px 0;border-bottom:1px solid #eee;">${p.name} &times; ${p.qty}</td>
      <td style="padding:8px 0;border-bottom:1px solid #eee;text-align:right;">&#8377;${p.price * p.qty}</td>
    </tr>`).join("")

  return `
    <table style="width:100%;border-collapse:collapse;margin:12px 0;font-size:14px;">
      ${rows}
      <tr>
        <td style="padding:10px 0 0;font-weight:700;">Total</td>
        <td style="padding:10px 0 0;font-weight:700;text-align:right;">&#8377;${order.total}</td>
      </tr>
    </table>`
}

/* Shipped / Delivered status email sent to the customer */
const statusEmailHtml = (order, status) => {
  const id = order._id.toString().slice(-6).toUpperCase()
  const shipped = status === "Shipped"
  const color = shipped ? "#2c7be5" : "#10b981"
  const title = shipped ? "Order Shipped 🚚" : "Order Delivered ✅"
  const msg = shipped
    ? "Good news! Your order is on its way and will reach you soon."
    : "Your order has been delivered. We hope you're happy with it — thank you for shopping with Medicare!"

  return `
  <div style="font-family:Arial,Helvetica,sans-serif;max-width:560px;margin:0 auto;color:#1f2a37;">
    <div style="background:${color};padding:24px;border-radius:12px 12px 0 0;color:#fff;">
      <h2 style="margin:0;">${title}</h2>
      <p style="margin:6px 0 0;opacity:.9;">Order #${id}</p>
    </div>
    <div style="border:1px solid #e6e9f0;border-top:none;border-radius:0 0 12px 12px;padding:24px;">
      <p>Hi ${order.address?.name || "there"}, ${msg}</p>
      ${itemsTableHtml(order)}
      <p style="margin:6px 0 0;color:#6b7280;">Payment: ${order.paymentMethod} &middot; ${order.paymentStatus}</p>
    </div>
  </div>`
}

/* Cancellation email sent to the customer */
const cancelEmailHtml = (order) => {
  const a = order.address || {}
  const id = order._id.toString().slice(-6).toUpperCase()

  return `
  <div style="font-family:Arial,Helvetica,sans-serif;max-width:560px;margin:0 auto;color:#1f2a37;">
    <div style="background:#ef4444;padding:24px;border-radius:12px 12px 0 0;color:#fff;">
      <h2 style="margin:0;">Order Cancelled</h2>
      <p style="margin:6px 0 0;opacity:.9;">Order #${id}</p>
    </div>
    <div style="border:1px solid #e6e9f0;border-top:none;border-radius:0 0 12px 12px;padding:24px;">
      <p>Hi ${a.name || "there"}, your order <b>#${id}</b> has been cancelled as requested.</p>
      <h4 style="margin:16px 0 0;">Cancelled items</h4>
      ${itemsTableHtml(order)}
      <p style="margin:6px 0 0;color:#6b7280;">Payment: ${order.paymentMethod}</p>
      ${order.paymentMethod === "UPI"
        ? `<p style="margin:12px 0 0;color:#6b7280;">If you already paid online, your refund will be processed shortly.</p>`
        : ``}
      <p style="margin:18px 0 0;color:#6b7280;font-size:13px;">If this wasn't you, please contact us right away.</p>
    </div>
  </div>`
}

/* Notify the store admin about order activity (best-effort).
   The email is shown as coming from the customer (display name + Reply-To),
   so the admin can reply straight back to them. */
const notifyAdmin = (subject, order, action, customer = {}) => {
  const adminEmail = process.env.ADMIN_EMAIL || process.env.EMAIL_USER
  if (!adminEmail) return

  const id = order._id.toString().slice(-6).toUpperCase()
  const customerName = customer.name || order.address?.name || "Customer"
  const customerEmail = customer.email

  sendMailSafe({
    // Gmail keeps the authenticated account as the sender address, but we set
    // the display name to the customer and Reply-To to their email.
    from: `"${customerName} (Medicare order)" <${process.env.EMAIL_USER}>`,
    replyTo: customerEmail || undefined,
    to: adminEmail,
    subject,
    html: `
      <div style="font-family:Arial,sans-serif;max-width:520px;margin:0 auto;color:#1f2a37;">
        <h2 style="margin:0 0 12px;">${action}</h2>
        <p style="margin:0 0 6px;"><b>Order #${id}</b></p>
        <p style="margin:0 0 6px;">Customer: ${customerName} ${order.address?.phone ? "· " + order.address.phone : ""}</p>
        ${customerEmail ? `<p style="margin:0 0 6px;">Email: ${customerEmail}</p>` : ""}
        <h4 style="margin:14px 0 0;">Items</h4>
        ${itemsTableHtml(order)}
        <p style="margin:6px 0 6px;">Payment: ${order.paymentMethod}${order.paymentRef ? " · Ref: " + order.paymentRef : ""}</p>
        ${order.address?.street ? `<p style="margin:0 0 6px;color:#6b7280;">Deliver to: ${order.address.street}, ${order.address.city || ""} ${order.address.pincode || ""}</p>` : ""}
        <p style="margin:0;color:#6b7280;">Status: ${order.status}</p>
      </div>`
  })
}

/* Build a clean HTML order-confirmation email */
const orderEmailHtml = (order) => {
  const rows = order.products.map(p => `
    <tr>
      <td style="padding:8px 0;border-bottom:1px solid #eee;">${p.name} &times; ${p.qty}</td>
      <td style="padding:8px 0;border-bottom:1px solid #eee;text-align:right;">&#8377;${p.price * p.qty}</td>
    </tr>`).join("")

  const a = order.address || {}

  return `
  <div style="font-family:Arial,Helvetica,sans-serif;max-width:560px;margin:0 auto;color:#1f2a37;">
    <div style="background:linear-gradient(120deg,#2c7be5,#10b981);padding:24px;border-radius:12px 12px 0 0;color:#fff;">
      <h2 style="margin:0;">Order Confirmed &#10004;</h2>
      <p style="margin:6px 0 0;opacity:.9;">Order #${order._id.toString().slice(-6).toUpperCase()}</p>
    </div>
    <div style="border:1px solid #e6e9f0;border-top:none;border-radius:0 0 12px 12px;padding:24px;">
      <p>Hi ${a.name || "there"}, thanks for your order! We'll get it ready right away.</p>
      <table style="width:100%;border-collapse:collapse;margin:16px 0;">${rows}
        <tr>
          <td style="padding:12px 0 0;font-weight:700;">Total</td>
          <td style="padding:12px 0 0;font-weight:700;text-align:right;">&#8377;${order.total}</td>
        </tr>
      </table>
      <h4 style="margin:0 0 6px;">Delivery Address</h4>
      <p style="margin:0;color:#6b7280;">
        ${a.name || ""}<br/>${a.street || ""}<br/>
        ${a.city || ""}, ${a.state || ""} ${a.pincode || ""}<br/>${a.phone || ""}
      </p>
      <p style="margin:18px 0 0;color:#6b7280;font-size:13px;">
        Payment: ${order.paymentMethod} &middot; Status: ${order.status}
      </p>
    </div>
  </div>`
}


/* CREATE ORDER */

router.post("/", authMiddleware, orderLimiter, async(req,res)=>{

  try{

    const { products, address } = req.body

    // Basic input validation
    if(!Array.isArray(products) || products.length === 0){
      return res.status(400).json({ message:"Your cart is empty" })
    }
    if(products.length > 100){
      return res.status(400).json({ message:"Too many items in one order" })
    }
    if(!address || !address.name || !address.phone || !address.street || !address.city || !address.pincode){
      return res.status(400).json({ message:"Delivery address is incomplete" })
    }

    // 🔒 Re-price every item from the DB — NEVER trust client-sent prices/total
    const ids = products
      .map(p => p.id)
      .filter(id => mongoose.Types.ObjectId.isValid(id))

    const dbMeds = await Medicine.find({ _id: { $in: ids } })
    const medMap = {}
    dbMeds.forEach(m => { medMap[m._id.toString()] = m })

    const orderProducts = []
    let total = 0

    for(const item of products){
      const med = medMap[String(item.id)]
      if(!med){
        return res.status(400).json({ message:"A product in your cart is no longer available. Please review your cart." })
      }
      const qty = Math.min(99, Math.max(1, parseInt(item.qty, 10) || 1))
      total += med.price * qty
      orderProducts.push({ name: med.name, price: med.price, qty, image: med.image })
    }

    // Accept the chosen payment method (COD or UPI); default to COD
    const paymentMethod = req.body.paymentMethod === "UPI" ? "UPI" : "COD"

    const order = new Order({

      user:req.user.id,

      products:orderProducts,

      total,

      address,

      paymentMethod,

      paymentStatus:"Pending",

      paymentRef: paymentMethod === "UPI" ? (req.body.paymentRef || "") : ""

    })

    await order.save()

    // Email the customer + ping the admin (best-effort, never blocks the order)
    User.findById(req.user.id).then(user => {
      if (user?.email) {
        sendMailSafe({
          to: user.email,
          subject: `Order Confirmed #${order._id.toString().slice(-6).toUpperCase()}`,
          html: orderEmailHtml(order)
        })
      }
      notifyAdmin(
        `🔔 New Order #${order._id.toString().slice(-6).toUpperCase()} — ₹${order.total}`,
        order,
        "🛒 New order received",
        { name: user?.name, email: user?.email }
      )
    }).catch(() => {})

    res.json({
      message:"Order created",
      order
    })

  }catch(err){

    res.status(500).json({
      error:err.message
    })

  }

})


/* GET USER ORDERS */

router.get("/my-orders", authMiddleware, async(req,res)=>{

  try{

    const orders = await Order.find({
      user:req.user.id
    }).sort({createdAt:-1})

    res.json(orders)

  }catch(err){

    res.status(500).json({
      error:err.message
    })

  }

})


/* CANCEL ORDER (USER, OWN PENDING ORDER ONLY) */

router.put("/:id/cancel", authMiddleware, async(req,res)=>{

  try{

    if(!mongoose.Types.ObjectId.isValid(req.params.id)){
      return res.status(404).json({ message:"Order not found" })
    }

    const cutoff = new Date(Date.now() - CANCEL_WINDOW_MS)

    // Atomic: cancel only if owned, still pending, and within the 5-minute window
    const order = await Order.findOneAndUpdate(
      { _id: req.params.id, user: req.user.id, status: "Pending", createdAt: { $gte: cutoff } },
      { status: "Cancelled" },
      { new: true }
    )

    if(!order){
      // Determine why it couldn't be cancelled, for a clear message
      const existing = await Order.findById(req.params.id)
      if(!existing){
        return res.status(404).json({ message:"Order not found" })
      }
      if(existing.user.toString() !== req.user.id){
        return res.status(403).json({ message:"Not allowed" })
      }
      if(existing.status !== "Pending"){
        return res.status(400).json({ message:"Only pending orders can be cancelled" })
      }
      return res.status(400).json({
        message:"This order can no longer be cancelled (the 5-minute cancellation window has passed)."
      })
    }

    const customer = await User.findById(order.user).catch(() => null)

    // Email the customer their cancellation confirmation
    if(customer?.email){
      sendMailSafe({
        to: customer.email,
        subject: `Order #${order._id.toString().slice(-6).toUpperCase()} Cancelled`,
        html: cancelEmailHtml(order)
      })
    }

    // Ping the admin about the cancellation, shown as from the customer
    notifyAdmin(
      `❌ Order #${order._id.toString().slice(-6).toUpperCase()} cancelled`,
      order,
      "❌ Order cancelled by customer",
      { name: customer?.name, email: customer?.email }
    )

    res.json(order)

  }catch(err){

    res.status(500).json({
      error:err.message
    })

  }

})


/* GET ALL ORDERS (ADMIN) */

router.get("/", authMiddleware, adminMiddleware, async(req,res)=>{

  try{

    const orders = await Order.find()
    .populate("user","name email")
    .sort({createdAt:-1})

    res.json(orders)

  }catch(err){

    res.status(500).json({
      error:err.message
    })

  }

})


/* UPDATE ORDER STATUS */

router.put("/:id", authMiddleware, adminMiddleware, async(req,res)=>{

  try{

    const ALLOWED = ["Pending", "Shipped", "Success", "Cancelled"]
    const newStatus = req.body.status

    if(!ALLOWED.includes(newStatus)){
      return res.status(400).json({ message:"Invalid status value" })
    }

    if(!mongoose.Types.ObjectId.isValid(req.params.id)){
      return res.status(404).json({ message:"Order not found" })
    }

    const updateData = { status:newStatus }
    if(newStatus === "Success"){
      updateData.paymentStatus = "Paid"
    }

    // Atomic terminal-lock: only update if NOT already delivered/cancelled
    const updatedOrder = await Order.findOneAndUpdate(
      { _id: req.params.id, status: { $nin: ["Success", "Cancelled"] } },
      updateData,
      { new: true, runValidators: true }
    )

    if(!updatedOrder){
      const existing = await Order.findById(req.params.id)
      if(!existing){
        return res.status(404).json({ message:"Order not found" })
      }
      const label = existing.status === "Success" ? "delivered" : "cancelled"
      return res.status(400).json({ message:`A ${label} order can no longer be changed.` })
    }

    // Notify on shipped / delivered
    if(newStatus === "Shipped" || newStatus === "Success"){
      User.findById(updatedOrder.user).then(user=>{
        const id = updatedOrder._id.toString().slice(-6).toUpperCase()

        // Customer email for both shipped and delivered
        if(user?.email){
          sendMailSafe({
            to: user.email,
            subject: newStatus === "Shipped"
              ? `Your order #${id} has shipped 🚚`
              : `Your order #${id} has been delivered ✅`,
            html: statusEmailHtml(updatedOrder, newStatus)
          })
        }

        // Delivered also notifies the admin (shipped does not)
        if(newStatus === "Success"){
          notifyAdmin(
            `✅ Order #${id} delivered`,
            updatedOrder,
            "✅ Order delivered",
            { name: user?.name, email: user?.email }
          )
        }
      }).catch(()=>{})
    }

    res.json(updatedOrder)

  }catch(err){

    res.status(500).json({
      error:err.message
    })

  }

})

module.exports = router