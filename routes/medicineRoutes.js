const express = require('express');
const fs = require('fs').promises;
const path = require('path');
const router = express.Router();

const medicinesFile = path.join(__dirname, '../data/medicines.json');

// Helper function to read medicines
async function readMedicines() {
    try {
        const data = await fs.readFile(medicinesFile, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        return [];
    }
}

// Helper function to write medicines
async function writeMedicines(medicines) {
    await fs.writeFile(medicinesFile, JSON.stringify(medicines, null, 2));
}

// GET /api/medicines - Get all medicines
router.get('/medicines', async (req, res) => {
    try {
        const medicines = await readMedicines();
        res.json(medicines);
    } catch (error) {
        res.status(500).json({ error: 'Failed to read medicines' });
    }
});

// POST /api/add-medicine - Add new medicine
router.post('/add-medicine', async (req, res) => {
    try {
        const { name, stock, prescriptionRequired } = req.body;
        
        if (!name || !stock) {
            return res.status(400).json({ error: 'Name and stock are required' });
        }

        const medicines = await readMedicines();
        
        // Generate new ID
        const newId = medicines.length > 0 ? Math.max(...medicines.map(m => m.id)) + 1 : 1;
        
        const newMedicine = {
            id: newId,
            name,
            stock: parseInt(stock),
            prescriptionRequired: prescriptionRequired === 'true' || prescriptionRequired === true
        };
        
        medicines.push(newMedicine);
        await writeMedicines(medicines);
        
        res.status(201).json({ message: 'Medicine added successfully', medicine: newMedicine });
    } catch (error) {
        res.status(500).json({ error: 'Failed to add medicine' });
    }
});

module.exports = router;