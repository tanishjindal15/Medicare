const Medicine = require("../models/Medicine")
const jsonMedicines = require("../data/medicines.json")

/*
 * Seed the starter catalogue into MongoDB once.
 *
 * Previously these items lived only in medicines.json with string ids ("1", "2"),
 * so admin edits/deletes targeted ids that were never in the DB — changes silently
 * failed and reverted on refresh. Materialising them as real documents (real
 * ObjectIds) means every catalogue item is editable and deletable like any other.
 */
const seedMedicines = async () => {
  // Build the unique-name index. If it fails (e.g. an older DB already holds
  // two same-named medicines) surface it — otherwise the duplicate guard is dead.
  try {
    await Medicine.init()
  } catch (err) {
    console.error("Medicine index build failed (duplicate names in DB?):", err.message)
  }

  // Top-up seeding: insert any medicines.json entry not already present.
  // Fast-path: an empty DB skips the per-item existence check.
  const count = await Medicine.estimatedDocumentCount()

  for (const m of jsonMedicines) {
    try {
      if (count === 0 || !(await Medicine.findOne({ name: m.name }))) {
        await Medicine.create({
          name: m.name,
          price: m.price,
          category: m.category,
          description: m.description,
          image: m.image
        })
      }
    } catch (err) {
      // A concurrent instance may have created it first (duplicate key) — ignore
      if (err.code !== 11000) console.error("Seed error:", err.message)
    }
  }
  console.log("Medicine catalogue seeded")
}

module.exports = seedMedicines