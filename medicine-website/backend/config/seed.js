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
  try {
    for (const m of jsonMedicines) {
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
    }
    console.log("Medicine catalogue seeded")
  } catch (err) {
    console.error("Seed error:", err.message)
  }
}

module.exports = seedMedicines