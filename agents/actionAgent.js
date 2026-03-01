// agents/actionAgent.js
// Responsible for executing side-effect actions such as modifying medicine data

const fs = require('fs').promises;
const path = require('path');

const medicinesFile = path.join(__dirname, '../data/medicines.json');

async function readMedicines() {
    try {
        const data = await fs.readFile(medicinesFile, 'utf8');
        return JSON.parse(data);
    } catch (err) {
        return [];
    }
}

async function writeMedicines(meds) {
    await fs.writeFile(medicinesFile, JSON.stringify(meds, null, 2));
}

async function addMedicine({ name, stock, prescriptionRequired }) {
    if (!name || !stock) {
        throw new Error('Name and stock are required');
    }

    const medicines = await readMedicines();
    const newId = medicines.length > 0 ? Math.max(...medicines.map(m => m.id)) + 1 : 1;

    const newMedicine = {
        id: newId,
        name,
        stock: parseInt(stock, 10),
        prescriptionRequired: prescriptionRequired === 'true' || prescriptionRequired === true,
    };

    medicines.push(newMedicine);
    await writeMedicines(medicines);
    return newMedicine;
}

// export a generic perform function that dispatches to specific action handlers
async function perform(actionName, payload) {
    switch (actionName) {
        case 'addMedicine':
            return await addMedicine(payload);
        // future actions can be added here
        default:
            throw new Error(`Unknown action: ${actionName}`);
    }
}

module.exports = { perform };
