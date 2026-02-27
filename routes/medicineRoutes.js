const express = require("express");
const router = express.Router();
const fs = require("fs");
const path = require("path");

const medicinesFile = path.join(__dirname, "../data/medicines.json");

// Add Medicine
router.post("/add-medicine", (req, res) => {
  const { name, stock, requiresPrescription } = req.body;

  const medicines = JSON.parse(fs.readFileSync(medicinesFile));

  const newMedicine = {
    id: Date.now(),
    name,
    stock,
    requiresPrescription
  };

  medicines.push(newMedicine);

  fs.writeFileSync(medicinesFile, JSON.stringify(medicines, null, 2));

  res.json({ message: "Medicine added successfully" });
});

// Get All Medicines
router.get("/medicines", (req, res) => {

  const medicines =
  JSON.parse(fs.readFileSync(medicinesFile));

  const updatedMedicines = medicines.map(med => {

    if (med.stock <= 10) {
      return {
        ...med,
        lowStock: true
      };
    }

    return {
      ...med,
      lowStock: false
    };
  });

  res.json(updatedMedicines);
});

module.exports = router;