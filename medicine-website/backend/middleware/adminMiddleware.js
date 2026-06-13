const User = require("../models/User")

/* Requires authMiddleware to run first so req.user is populated.
   Re-checks the role against the DB so a demoted or deleted admin's
   still-valid JWT can't keep admin access (admin routes are low-traffic,
   so the extra lookup is fine). */
async function adminMiddleware(req, res, next){

  try{

    if(!req.user){
      return res.status(403).json({ message:"Admin access required" })
    }

    const user = await User.findById(req.user.id).select("role")

    if(!user || user.role !== "admin"){
      return res.status(403).json({ message:"Admin access required" })
    }

    next()

  }catch{
    return res.status(403).json({ message:"Admin access required" })
  }

}

module.exports = adminMiddleware
