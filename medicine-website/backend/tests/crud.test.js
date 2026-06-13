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

const tokenFor = (u) => jwt.sign({ id: u._id, role: u.role }, process.env.JWT_SECRET, { expiresIn: "1h" })

let mongo, adminToken, userToken

test.before(async () => {
  mongo = await MongoMemoryServer.create()
  await mongoose.connect(mongo.getUri())
  await Medicine.init() // ensure the unique-name index is built
  const admin = await User.create({
    name: "Admin", email: "admin@test.com", phone: "9876543210",
    password: await bcrypt.hash("Abcd123!", 10), role: "admin"
  })
  const user = await User.create({
    name: "User", email: "user@test.com", phone: "9876543210",
    password: await bcrypt.hash("Abcd123!", 10)
  })
  adminToken = tokenFor(admin)
  userToken = tokenFor(user)
})

test.after(async () => {
  await mongoose.disconnect()
  await mongo.stop()
})

/* ---------- Medicine CRUD ---------- */

test("a non-admin cannot add a medicine", async () => {
  const res = await request(app).post("/api/medicines")
    .set("Authorization", `Bearer ${userToken}`)
    .field("name", "Aspirin").field("price", "15").field("category", "Pain").field("description", "x")
    .attach("image", Buffer.from("img"), "a.png")
  assert.strictEqual(res.status, 403)
})

test("admin add-medicine: needs an image, rejects duplicate names", async () => {
  // missing image -> 400
  const noImg = await request(app).post("/api/medicines")
    .set("Authorization", `Bearer ${adminToken}`)
    .field("name", "NoImg").field("price", "10").field("category", "Fever").field("description", "x")
  assert.strictEqual(noImg.status, 400)

  // valid create -> 200
  const created = await request(app).post("/api/medicines")
    .set("Authorization", `Bearer ${adminToken}`)
    .field("name", "Aspirin").field("price", "15").field("category", "Pain").field("description", "x")
    .attach("image", Buffer.from("img"), "a.png")
  assert.strictEqual(created.status, 200)
  assert.strictEqual(created.body.name, "Aspirin")

  // duplicate name -> 400
  const dup = await request(app).post("/api/medicines")
    .set("Authorization", `Bearer ${adminToken}`)
    .field("name", "Aspirin").field("price", "20").field("category", "Pain").field("description", "y")
    .attach("image", Buffer.from("img"), "b.png")
  assert.strictEqual(dup.status, 400)

  // cleanup (also removes the uploaded file)
  const del = await request(app).delete(`/api/medicines/${created.body._id}`).set("Authorization", `Bearer ${adminToken}`)
  assert.strictEqual(del.status, 200)
})

/* ---------- Address CRUD + ownership ---------- */

test("addresses are owner-scoped (create / list / others can't delete)", async () => {
  const create = await request(app).post("/api/address")
    .set("Authorization", `Bearer ${userToken}`)
    .send({ name: "Home", phone: "9876543210", street: "1 St", city: "City", state: "ST", pincode: "123456" })
  assert.strictEqual(create.status, 200)
  const addrId = create.body._id

  const list = await request(app).get("/api/address").set("Authorization", `Bearer ${userToken}`)
  assert.strictEqual(list.status, 200)
  assert.strictEqual(list.body.length, 1)

  // a different user cannot delete someone else's address
  const foreign = await request(app).delete(`/api/address/${addrId}`).set("Authorization", `Bearer ${adminToken}`)
  assert.strictEqual(foreign.status, 404)

  // the owner can
  const del = await request(app).delete(`/api/address/${addrId}`).set("Authorization", `Bearer ${userToken}`)
  assert.strictEqual(del.status, 200)
})

test("an over-length field is rejected with 400, not a generic 500", async () => {
  const res = await request(app).post("/api/address")
    .set("Authorization", `Bearer ${userToken}`)
    .send({ name: "A".repeat(200), phone: "9876543210", street: "1 St", city: "City", state: "ST", pincode: "123456" })
  assert.strictEqual(res.status, 400)
})
