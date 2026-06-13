const mongoose = require("mongoose")

/* router.param("id", validateObjectId) — uniform 404 for any malformed :id,
   so the contract can't be forgotten or drift across handlers. */
function validateObjectId(req, res, next, id) {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(404).json({ message: "Not found" })
  }
  next()
}

module.exports = validateObjectId
