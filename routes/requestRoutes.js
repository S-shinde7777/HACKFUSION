const express = require('express');
const fs = require('fs').promises;
const path = require('path');
const router = express.Router();

const requestsFile = path.join(__dirname, '../data/requests.json');
const medicinesFile = path.join(__dirname, '../data/medicines.json');
const dataLoader = require('../utils/dataLoader');

// Helper function to read requests. Always read stored requests first, then
// append any imported consumer orders (so patient-submitted requests are
// preserved and visible even when a consumer order file exists).
async function readRequests() {
    let stored = [];
    try {
        const data = await fs.readFile(requestsFile, 'utf8');
        stored = JSON.parse(data);
    } catch (e) {
        stored = [];
    }

    try {
        const consumerOrders = await dataLoader.readConsumerOrders();
        if (consumerOrders && consumerOrders.length > 0) {
            const existingIds = new Set(stored.map(r => r.id));
            consumerOrders.forEach(r => {
                if (!existingIds.has(r.id)) {
                    stored.push(r);
                }
            });
        }
    } catch (e) {
        // ignore errors from consumer order loading
    }

    return stored;
}

// Helper function to write requests
async function writeRequests(requests) {
    await fs.writeFile(requestsFile, JSON.stringify(requests, null, 2));
}

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

// GET /api/requests - Get all requests
router.get('/requests', async (req, res) => {
    try {
        const requests = await readRequests();
        res.json(requests);
    } catch (error) {
        res.status(500).json({ error: 'Failed to read requests' });
    }
});

// GET /api/requests/patient/:name - Get requests by patient name
router.get('/requests/patient/:name', async (req, res) => {
    try {
        const patientName = req.params.name;
        const requests = await readRequests();
        const patientRequests = requests.filter(r => r.patientName === patientName);
        res.json(patientRequests);
    } catch (error) {
        res.status(500).json({ error: 'Failed to read requests' });
    }
});

// POST /api/add-request - Submit new medicine request
// If medicine is available, automatically accept and deduct stock. Otherwise
// leave pending for pharmacist review. New or auto-accepted requests are always
// stored so they appear in pharmacists' view.
router.post('/add-request', async (req, res) => {
    try {
        const { patientName, medicineName, quantity } = req.body;
        
        if (!patientName || !medicineName || !quantity) {
            return res.status(400).json({ error: 'All fields are required' });
        }

        const requests = await readRequests();
        const medicines = await readMedicines();
        
        // Generate new ID
        const newId = requests.length > 0 ? Math.max(...requests.map(r => r.id)) + 1 : 1;
        
        const reqQuantity = parseInt(quantity);
        let status = 'pending';

        // attempt to auto‑accept based on stock
        const medIndex = medicines.findIndex(m => m.name.toLowerCase() === medicineName.toLowerCase());
        if (medIndex !== -1 && medicines[medIndex].stock >= reqQuantity) {
            status = 'accepted';
            medicines[medIndex].stock -= reqQuantity;
        }

        const newRequest = {
            id: newId,
            patientName,
            medicineName,
            quantity: reqQuantity,
            status,
            requestDate: new Date().toISOString()
        };
        
        requests.push(newRequest);

        // write updates
        await writeRequests(requests);
        if (status === 'accepted') {
            await writeMedicines(medicines);
        }
        
        res.status(201).json({ message: 'Request submitted successfully', request: newRequest });
    } catch (error) {
        res.status(500).json({ error: 'Failed to submit request' });
    }
});

// POST /api/accept-request/:id - Accept request and deduct stock
router.post('/accept-request/:id', async (req, res) => {
    try {
        const requestId = parseInt(req.params.id);
        
        const requests = await readRequests();
        const medicines = await readMedicines();
        
        const requestIndex = requests.findIndex(r => r.id === requestId);
        if (requestIndex === -1) {
            return res.status(404).json({ error: 'Request not found' });
        }
        
        const request = requests[requestIndex];
        
        // Find medicine
        const medicineIndex = medicines.findIndex(m => m.name.toLowerCase() === request.medicineName.toLowerCase());
        if (medicineIndex === -1) {
            return res.status(404).json({ error: 'Medicine not found in inventory' });
        }
        
        // Check stock
        if (medicines[medicineIndex].stock < request.quantity) {
            return res.status(400).json({ error: 'Insufficient stock' });
        }
        
        // Deduct stock
        medicines[medicineIndex].stock -= request.quantity;
        
        // Update request status
        requests[requestIndex].status = 'accepted';
        
        // Save both files
        await writeMedicines(medicines);
        await writeRequests(requests);
        
        res.json({ message: 'Request accepted successfully' });
    } catch (error) {
        res.status(500).json({ error: 'Failed to accept request' });
    }
});

// POST /api/reject-request/:id - Reject request
router.post('/reject-request/:id', async (req, res) => {
    try {
        const requestId = parseInt(req.params.id);
        
        const requests = await readRequests();
        
        const requestIndex = requests.findIndex(r => r.id === requestId);
        if (requestIndex === -1) {
            return res.status(404).json({ error: 'Request not found' });
        }
        
        requests[requestIndex].status = 'rejected';
        await writeRequests(requests);
        
        res.json({ message: 'Request rejected successfully' });
    } catch (error) {
        res.status(500).json({ error: 'Failed to reject request' });
    }
});

module.exports = router;