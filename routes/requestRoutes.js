const express = require("express");
const router = express.Router();
const fs = require("fs");
const path = require("path");

const requestsFile = path.join(__dirname, "../data/requests.json");
const medicinesFile = path.join(__dirname, "../data/medicines.json");

// Add Request
router.post("/add-request", (req, res) => {
  const { patientName, medicineName, quantity } = req.body;

  const requests = JSON.parse(fs.readFileSync(requestsFile));

  const newRequest = {
    id: Date.now(),
    patientName,
    medicineName,
    quantity,
    status: "pending"
  };

  requests.push(newRequest);

  fs.writeFileSync(requestsFile, JSON.stringify(requests, null, 2));

  res.json({ message: "Request submitted successfully" });
});

// Get All Requests
router.get("/requests", (req, res) => {
  const requests = JSON.parse(fs.readFileSync(requestsFile));
  res.json(requests);
});

// ACCEPT REQUEST
router.post("/accept-request/:id", (req, res) => {
  const requestId = parseInt(req.params.id);

  const requests = JSON.parse(fs.readFileSync(requestsFile));
  const medicines = JSON.parse(fs.readFileSync(medicinesFile));

  const request = requests.find(r => r.id === requestId);

  if (!request) {
    return res.status(404).json({ message: "Request not found" });
  }

  const medicine = medicines.find(m => m.name === request.medicineName);

  if (!medicine) {
    return res.status(404).json({ message: "Medicine not found" });
  }

  if (medicine.stock < request.quantity) {
    return res.status(400).json({ message: "Not enough stock" });
  }

  // Deduct Stock
  medicine.stock -= request.quantity;

  // Change Status
  request.status = "accepted";

  fs.writeFileSync(requestsFile, JSON.stringify(requests, null, 2));
  fs.writeFileSync(medicinesFile, JSON.stringify(medicines, null, 2));

  res.json({ message: "Request accepted and stock updated" });
});

// REJECT REQUEST
router.post("/reject-request/:id", (req, res) => {
  const requestId = parseInt(req.params.id);

  const requests = JSON.parse(fs.readFileSync(requestsFile));

  const request = requests.find(r => r.id === requestId);

  if (!request) {
    return res.status(404).json({ message: "Request not found" });
  }

  request.status = "rejected";

  fs.writeFileSync(requestsFile, JSON.stringify(requests, null, 2));

  res.json({ message: "Request rejected" });
});

module.exports = router;