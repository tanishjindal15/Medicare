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
  // Ensure the unique-name index exists before seeding
  try { await Medicine.init() } catch { /* ignore */ }

  for (const m of jsonMedicines) {
    try {
      const exists = await Medicine.findOne({ name: m.name })
      if (!exists) {
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