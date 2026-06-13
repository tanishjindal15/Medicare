const express = require("express")
const router = express.Router()

const Medicine = require("../models/Medicine")
const multer = require("multer")
const path = require("path")
const fs = require("fs")
const authMiddleware = require("../middleware/authMiddleware")
const adminMiddleware = require("../middleware/adminMiddleware")
const validateObjectId = require("../utils/validateObjectId")

// Best-effort delete of an uploaded image file (ignores seed paths / missing files)
const removeUploadedImage = (imagePath) => {
  if (!imagePath || !imagePath.startsWith("/uploads/")) return
  fs.unlink(path.join(__dirname, "..", imagePath), () => {})
}

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

// Uniform 404 for any malformed :id
router.param("id", validateObjectId)

/* GET ALL MEDICINES */

router.get("/", async(req,res,next)=>{
  try{
    const medicines = await Medicine.find().sort({ _id: -1 })
    res.json(medicines)
  }catch(err){
    next(err)
  }
})

/* GET SINGLE MEDICINE */

router.get("/:id", async(req,res,next)=>{
  try{
    const medicine = await Medicine.findById(req.params.id)
    if(!medicine){
      return res.status(404).json({ message:"Medicine not found" })
    }
    res.json(medicine)
  }catch(err){
    next(err)
  }
})

/* ADD MEDICINE (IMAGE UPLOAD) */

router.post("/", authMiddleware, adminMiddleware, upload.single("image"), async(req,res,next)=>{
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
    // Don't leave the just-uploaded file orphaned on a failed save
    if(req.file) removeUploadedImage(`/uploads/${req.file.filename}`)
    next(err) // central handler maps 11000 / ValidationError -> 400
  }
})

/* DELETE MEDICINE */

router.delete("/:id", authMiddleware, adminMiddleware, async(req,res,next)=>{
  try{
    const deleted = await Medicine.findByIdAndDelete(req.params.id)
    if(!deleted){
      return res.status(404).json({ message:"Medicine not found" })
    }
    removeUploadedImage(deleted.image) // clean up its image file
    res.json({message:"Medicine deleted"})
  }catch(err){
    next(err)
  }
})

/* UPDATE MEDICINE */

router.put("/:id", authMiddleware, adminMiddleware, upload.single("image"), async(req,res,next)=>{
  try{

    const existing = await Medicine.findById(req.params.id)
    if(!existing){
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

    // Could have been deleted by a concurrent request between the read and write
    if(!updatedMedicine){
      if(req.file) removeUploadedImage(`/uploads/${req.file.filename}`)
      return res.status(404).json({ message:"Medicine not found" })
    }

    // A new image replaced the old one — delete the orphaned old file
    if(req.file){
      removeUploadedImage(existing.image)
    }

    res.json(updatedMedicine)

  }catch(err){
    // On a failed update with a new image, don't leak the upload
    if(req.file) removeUploadedImage(`/uploads/${req.file.filename}`)
    next(err) // central handler maps 11000 / ValidationError -> 400
  }
})

module.exports = router