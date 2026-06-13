const express = require("express")
const router = express.Router()

const Address = require("../models/Address")
const authMiddleware = require("../middleware/authMiddleware")
const validateObjectId = require("../utils/validateObjectId")

router.param("id", validateObjectId)

/* SAVE ADDRESS */
router.post("/", authMiddleware, async(req,res,next)=>{

  try{

    // Strip any client-sent `user` so the owner can't be spoofed via mass assignment
    const { user, ...fields } = req.body

    const address = new Address({
      user:req.user.id,
      ...fields
    })

    await address.save()

    res.json(address)

  }catch(err){
    next(err)
  }

})

/* GET USER ADDRESSES */
router.get("/", authMiddleware, async(req,res,next)=>{

  try{

    const addresses = await Address.find({
      user:req.user.id
    }).sort({createdAt:-1})

    res.json(addresses)

  }catch(err){
    next(err)
  }

})

/* DELETE ADDRESS (owner only) */
router.delete("/:id", authMiddleware, async(req,res,next)=>{

  try{

    const deleted = await Address.findOneAndDelete({
      _id: req.params.id,
      user: req.user.id
    })

    if(!deleted){
      return res.status(404).json({ message:"Address not found" })
    }

    res.json({message:"Deleted"})

  }catch(err){
    next(err)
  }

})
/* UPDATE ADDRESS (owner only) */
router.put("/:id", authMiddleware, async(req,res,next)=>{

  try{

    // Never allow reassigning the owner
    const { user, ...fields } = req.body

    const updated = await Address.findOneAndUpdate(
      { _id: req.params.id, user: req.user.id },
      fields,
      { new:true, runValidators:true }
    )

    if(!updated){
      return res.status(404).json({ message:"Address not found" })
    }

    res.json(updated)

  }catch(err){
    next(err)
  }

})
module.exports = router