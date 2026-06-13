const express = require("express")
const router = express.Router()

const Medicine = require("../models/Medicine")
const mongoose = require("mongoose")
const multer = require("multer")
const path = require("path")
const authMiddleware = require("../middleware/authMiddleware")
const adminMiddleware = require("../middleware/adminMiddleware")

/* MULTER STORAGE CONFIG */

const storage = multer.diskStorage({

  destination: function(req,file,cb){
    cb(null,"uploads/")
  },

  filename: function(req,file,cb){
    cb(null, Date.now() + path.extname(file.originalname))
  }

})

const upload = multer({
  storage,
  limits: { fileSize: 2 * 1024 * 1024 }, // 2 MB max
  fileFilter: (req, file, cb) => {
    if(/^image\/(jpe?g|png|webp|gif)$/.test(file.mimetype)){
      cb(null, true)
    }else{
      cb(new Error("Only image files (jpg, png, webp, gif) are allowed"))
    }
  }
})

/* GET ALL MEDICINES */

router.get("/", async(req,res)=>{

  try{

    const medicines = await Medicine.find().sort({ _id: -1 })
    res.json(medicines)

  }catch(err){

    console.error("Medicine route error:", err.message)
    res.status(500).json({ message:"Something went wrong" })

  }

})

/* GET SINGLE MEDICINE */

router.get("/:id", async(req,res)=>{

  try{

    const { id } = req.params

    // Guard against invalid ObjectIds before hitting the DB
    if(!mongoose.Types.ObjectId.isValid(id)){
      return res.status(404).json({ message:"Medicine not found" })
    }

    const medicine = await Medicine.findById(id)

    if(!medicine){
      return res.status(404).json({ message:"Medicine not found" })
    }

    res.json(medicine)

  }catch(err){

    console.error("Medicine route error:", err.message)
    res.status(500).json({ message:"Something went wrong" })

  }

})

/* ADD MEDICINE (IMAGE UPLOAD) */

router.post("/", authMiddleware, adminMiddleware, upload.single("image"), async(req,res)=>{

  try{

    if(!req.file){
      return res.status(400).json({ message:"A product image is required" })
    }

    const medicine = new Medicine({

      name:req.body.name,
      price:req.body.price,
      category:req.body.category,
      description:req.body.description,

      image:`/uploads/${req.file.filename}`

    })

    await medicine.save()

    res.json(medicine)

  }catch(err){

    console.error("Add medicine error:", err.message)
    res.status(500).json({ message:"Could not add medicine" })

  }

})

/* DELETE MEDICINE */

router.delete("/:id", authMiddleware, adminMiddleware, async(req,res)=>{

  try{

    if(!mongoose.Types.ObjectId.isValid(req.params.id)){
      return res.status(404).json({ message:"Medicine not found" })
    }

    const deleted = await Medicine.findByIdAndDelete(req.params.id)

    if(!deleted){
      return res.status(404).json({ message:"Medicine not found" })
    }

    res.json({message:"Medicine deleted"})

  }catch(err){

    console.error("Medicine route error:", err.message)
    res.status(500).json({ message:"Something went wrong" })

  }

})

/* UPDATE MEDICINE */

router.put("/:id", authMiddleware, adminMiddleware, upload.single("image"), async(req,res)=>{

  try{

    if(!mongoose.Types.ObjectId.isValid(req.params.id)){
      return res.status(404).json({ message:"Medicine not found" })
    }

    const updateData = {
      name:req.body.name,
      price:req.body.price,
      category:req.body.category,
      description:req.body.description
    }

    if(req.file){
      updateData.image = `/uploads/${req.file.filename}`
    }

    const updatedMedicine = await Medicine.findByIdAndUpdate(
      req.params.id,
      updateData,
      {new:true, runValidators:true}
    )

    if(!updatedMedicine){
      return res.status(404).json({ message:"Medicine not found" })
    }

    res.json(updatedMedicine)

  }catch(err){

    console.error("Medicine route error:", err.message)
    res.status(500).json({ message:"Something went wrong" })

  }

})

module.exports = router