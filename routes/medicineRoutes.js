const express = require('express');
const fs = require('fs').promises;
const path = require('path');
const router = express.Router();

const medicinesFile = path.join(__dirname, '../data/medicines.json');
const dataLoader = require('../utils/dataLoader');

// Helper function to read medicines. Attempts to merge data from both the
// Excel export and the local JSON store. Excel rows are considered the
// authoritative list of products, but stock/price/other fields edited by the
// pharmacist (stored in medicines.json) are overlaid so that manual updates
// persist even when an Excel file is present.
async function readMedicines() {
    try {
        // always read existing json store (may be empty)
        let jsonData = [];
        try {
            const raw = await fs.readFile(medicinesFile, 'utf8');
            jsonData = JSON.parse(raw);
        } catch (e) {
            jsonData = [];
        }

        const excelProducts = await dataLoader.readProductsFromExcel();
        if (excelProducts && excelProducts.length > 0) {
            // build quick lookup maps from jsonData
            const mapById = new Map(jsonData.map(m => [m.id, m]));
            const mapByName = new Map(jsonData.map(m => [m.name.toLowerCase(), m]));

            return excelProducts.map(p => {
                const updated = { ...p };
                const j = mapById.get(p.id) || mapByName.get((p.name || '').toLowerCase());
                if (j) {
                    if (j.stock !== undefined) updated.stock = j.stock;
                    if (j.price !== undefined) updated.price = j.price;
                    if (j.prescriptionRequired !== undefined) updated.prescriptionRequired = j.prescriptionRequired;
                }
                return updated;
            });
        }

        // no excel, just return the json store
        return jsonData;
    } catch (error) {
        return [];
    }
}

// Helper function to write medicines (writes to medicines.json only)
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

// PUT /api/medicines/:id - update existing medicine (stock, price, name, prescription)
router.put('/medicines/:id', async (req, res) => {
    try {
        const id = parseInt(req.params.id);
        const { name, stock, price, prescriptionRequired } = req.body;

        const medicines = await readMedicines();
        const idx = medicines.findIndex(m => m.id === id);
        if (idx === -1) {
            return res.status(404).json({ error: 'Medicine not found' });
        }

        if (name !== undefined) medicines[idx].name = name;
        if (stock !== undefined) medicines[idx].stock = parseInt(stock, 10) || 0;
        if (price !== undefined) medicines[idx].price = Number(price) || 0;
        if (prescriptionRequired !== undefined) medicines[idx].prescriptionRequired = prescriptionRequired === true || prescriptionRequired === 'true';

        await writeMedicines(medicines);
        res.json({ message: 'Medicine updated', medicine: medicines[idx] });
    } catch (error) {
        res.status(500).json({ error: 'Failed to update medicine' });
    }
});

// POST /api/set-stocks - provide an array of stock quantities which will be
// applied sequentially to medicines in order. This is a quick bulk helper.
router.post('/set-stocks', async (req, res) => {
    try {
        const { stocks } = req.body; // should be an array of numbers
        if (!Array.isArray(stocks)) {
            return res.status(400).json({ error: 'stocks must be an array' });
        }
        const medicines = await readMedicines();
        const updated = medicines.map((m, idx) => {
            if (idx < stocks.length) {
                m.stock = parseInt(stocks[idx], 10) || 0;
            }
            return m;
        });
        await writeMedicines(updated);
        res.json({ message: 'Stocks updated', medicines: updated });
    } catch (err) {
        res.status(500).json({ error: 'Failed to set stocks' });
    }
});


// POST /api/add-medicine - Add new medicine (pharmacist only)
router.post('/add-medicine', async (req, res) => {
    try {
        const { name, stock, prescriptionRequired } = req.body;
        
        if (!name || !stock) {
            return res.status(400).json({ error: 'Name and stock are required' });
        }

        const medicines = await readMedicines();
        
        // Generate new ID
        const newId = medicines.length > 0 ? Math.max(...medicines.map(m => m.id)) + 1 : 1;
        
        const { price } = req.body;

        const newMedicine = {
            id: newId,
            name,
            stock: parseInt(stock),
            price: price ? Number(price) : 0,
            prescriptionRequired: prescriptionRequired === 'true' || prescriptionRequired === true
        };
        
        medicines.push(newMedicine);
        await writeMedicines(medicines);
        
        res.status(201).json({ message: 'Medicine added successfully', medicine: newMedicine });
    } catch (error) {
        res.status(500).json({ error: 'Failed to add medicine' });
    }
});

// POST /api/import-products - Import products from Excel into medicines.json
// This overwrites the existing `medicines.json` with the mapped Excel products.
router.post('/import-products', async (req, res) => {
    try {
        const products = await dataLoader.readProductsFromExcel();
        if (!products || products.length === 0) {
            return res.status(404).json({ error: 'No product export file found in data/' });
        }

        // Normalize IDs to numbers and ensure shape
        // read existing file to preserve stock if present
        let existing = [];
        try {
            const exData = await fs.readFile(medicinesFile, 'utf8');
            existing = JSON.parse(exData);
        } catch (e) {
            existing = [];
        }

        const normalized = products.map((p, idx) => {
            const id = Number(p.id) || idx + 1;
            const name = p.name || p.Name || 'Unknown';
            const price = Number(p.price) || 0;
            // try to find existing to keep stock
            const found = existing.find(m => m.id === id || m.name === name);
            const stock = found ? Number(found.stock) || 0 : Number(p.stock) || 0;
            return {
                id,
                name,
                stock,
                price,
                prescriptionRequired: !!p.prescriptionRequired
            };
        });

        await writeMedicines(normalized);
        res.json({ message: 'Imported products into medicines.json', count: normalized.length });
    } catch (error) {
        console.error('Import error:', error);
        res.status(500).json({ error: 'Failed to import products' });
    }
});

module.exports = router;