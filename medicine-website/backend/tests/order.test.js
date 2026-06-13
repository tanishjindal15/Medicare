const test = require("node:test")
const assert = require("node:assert")
const mongoose = require("mongoose")
const request = require("supertest")
const bcrypt = require("bcryptjs")
const jwt = require("jsonwebtoken")
const { MongoMemoryServer } = require("mongodb-memory-server")

process.env.NODE_ENV = "test"
process.env.JWT_SECRET = "test-secret"

const mailer = require("../config/mailer")
mailer.transporter.sendMail = async () => ({ messageId: "test" })

const app = require("../app")
const User = require("../models/User")
const Medicine = require("../models/Medicine")
const Order = require("../models/Order")

const tokenFor = (user) =>
  jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, { expiresIn: "1h" })

const validAddress = { name: "Buyer", phone: "9876543210", street: "1 St", city: "City", state: "ST", pincode: "123456" }

let mongo, token, buyer, medicine

test.before(async () => {
  mongo = await MongoMemoryServer.create()
  await mongoose.connect(mongo.getUri())
  buyer = await User.create({
    name: "Buyer", email: "buyer@test.com", phone: "9876543210",
    password: await bcrypt.hash("Abcd123!", 10)
  })
  token = tokenFor(buyer)
  medicine = await Medicine.create({
    name: "Paracetamol", price: 20, category: "Fever", description: "x", image: "/uploads/x.jpg"
  })
})

test.after(async () => {
  await mongoose.disconnect()
  await mongo.stop()
})

test("order total is recomputed server-side (tampered prices are ignored)", async () => {
  const res = await request(app).post("/api/orders").set("Authorization", `Bearer ${token}`).send({
    products: [{ id: medicine._id.toString(), name: "Paracetamol", price: 1, qty: 3, image: "/x" }],
    total: 1,                    // tampered — should be ignored
    address: validAddress,
    paymentMethod: "COD"
  })
  assert.strictEqual(res.status, 200)
  assert.strictEqual(res.body.order.total, 60)            // 20 * 3, not 1
  assert.strictEqual(res.body.order.products[0].price, 20)
})

test("order with an unknown product id is rejected", async () => {
  const res = await request(app).post("/api/orders").set("Authorization", `Bearer ${token}`).send({
    products: [{ id: new mongoose.Types.ObjectId().toString(), qty: 1 }],
    total: 100,
    address: validAddress
  })
  assert.strictEqual(res.status, 400)
})

test("a pending order can be cancelled within the window but not after", async () => {
  const place = await request(app).post("/api/orders").set("Authorization", `Bearer ${token}`).send({
    products: [{ id: medicine._id.toString(), qty: 1 }], total: 20, address: validAddress
  })
  const id = place.body.order._id
  const cancel = await request(app).put(`/api/orders/${id}/cancel`).set("Authorization", `Bearer ${token}`)
  assert.strictEqual(cancel.status, 200)
  assert.strictEqual(cancel.body.status, "Cancelled")

  // An order placed 10 minutes ago is past the 5-minute window
  const old = await Order.create({
    user: buyer._id,
    products: [{ name: "Paracetamol", price: 20, qty: 1 }],
    total: 20, address: validAddress, status: "Pending",
    createdAt: new Date(Date.now() - 10 * 60 * 1000)
  })
  const late = await request(app).put(`/api/orders/${old._id}/cancel`).set("Authorization", `Bearer ${token}`)
  assert.strictEqual(late.status, 400)
})

test("a delivered order can no longer be changed (terminal lock)", async () => {
  const admin = await User.create({
    name: "Admin", email: "admin@test.com", phone: "9876543210",
    password: await bcrypt.hash("Abcd123!", 10), role: "admin"
  })
  const adminToken = tokenFor(admin)

  const place = await request(app).post("/api/orders").set("Authorization", `Bearer ${token}`).send({
    products: [{ id: medicine._id.toString(), qty: 1 }], total: 20, address: validAddress
  })
  const id = place.body.order._id

  const deliver = await request(app).put(`/api/orders/${id}`).set("Authorization", `Bearer ${adminToken}`).send({ status: "Success" })
  assert.strictEqual(deliver.status, 200)

  const change = await request(app).put(`/api/orders/${id}`).set("Authorization", `Bearer ${adminToken}`).send({ status: "Shipped" })
  assert.strictEqual(change.status, 400)
})
