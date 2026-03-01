// API Base URL
const API_BASE = 'http://localhost:3000/api';

// Check authentication
window.addEventListener('load', () => {
    const user = sessionStorage.getItem('user');
    if (!user) {
        window.location.href = '/login.html';
        return;
    }
    
    const userData = JSON.parse(user);
    if (userData.role !== 'pharmacist') {
        window.location.href = '/login.html';
        return;
    }
    
    // Display user name
    document.getElementById('userDisplay').textContent = `Welcome, ${userData.name}`;
    
    // Load data
    loadMedicines();
    loadRequests();
});

// Show message function
function showMessage(message, type) {
    const container = document.getElementById('messageContainer');
    container.innerHTML = `<div class="message ${type}">${message}</div>`;
    setTimeout(() => {
        container.innerHTML = '';
    }, 5000);
}

// Load medicines
async function loadMedicines() {
    try {
        const response = await fetch(`${API_BASE}/medicines`);
        const medicines = await response.json();
        
        const tbody = document.getElementById('medicinesTableBody');
        tbody.innerHTML = '';
        
        medicines.forEach(medicine => {
            const row = tbody.insertRow();
            row.innerHTML = `
                <td>${medicine.id}</td>
                <td>${medicine.name}</td>
                <td>${medicine.stock}</td>
                <td>${medicine.price !== undefined ? Number(medicine.price).toFixed(2) : '0.00'}</td>
                <td>${medicine.prescriptionRequired ? 'Yes' : 'No'}</td>
                <td><button onclick="editMedicine(${medicine.id})">Edit</button></td>
            `;
        });

    } catch (error) {
        showMessage('Error loading medicines', 'error');
    }
}

// Load requests
async function loadRequests() {
    try {
        const response = await fetch(`${API_BASE}/requests`);
        const requests = await response.json();
        
        const tbody = document.getElementById('requestsTableBody');
        tbody.innerHTML = '';
        
        requests.forEach(request => {
            const row = tbody.insertRow();
            const statusClass = `status-${request.status}`;
            
            row.innerHTML = `
                <td>${request.id}</td>
                <td>${request.patientName}</td>
                <td>${request.medicineName}</td>
                <td>${request.quantity}</td>
                <td><span class="${statusClass}">${request.status}</span></td>
                <td>${new Date(request.requestDate).toLocaleDateString()}</td>
                <td>
                    ${request.status === 'pending' ? `
                        <button class="btn-accept" onclick="acceptRequest(${request.id})">Accept</button>
                        <button class="btn-reject" onclick="rejectRequest(${request.id})">Reject</button>
                    ` : '-'}
                </td>
            `;
        });
    } catch (error) {
        showMessage('Error loading requests', 'error');
    }
}

// Accept request
async function acceptRequest(requestId) {
    try {
        const response = await fetch(`${API_BASE}/accept-request/${requestId}`, {
            method: 'POST'
        });
        
        const data = await response.json();
        
        if (response.ok) {
            showMessage('Request accepted successfully', 'success');
            loadRequests();
            loadMedicines(); // Reload medicines to update stock
        } else {
            showMessage(data.error || 'Error accepting request', 'error');
        }
    } catch (error) {
        showMessage('Error accepting request', 'error');
    }
}

// Reject request
async function rejectRequest(requestId) {
    try {
        const response = await fetch(`${API_BASE}/reject-request/${requestId}`, {
            method: 'POST'
        });
        
        const data = await response.json();
        
        if (response.ok) {
            showMessage('Request rejected successfully', 'success');
            loadRequests();
        } else {
            showMessage(data.error || 'Error rejecting request', 'error');
        }
    } catch (error) {
        showMessage('Error rejecting request', 'error');
    }
}

// Add medicine form submission
// also used for edit: form will have data-id when editing
document.getElementById('addMedicineForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const id = document.getElementById('addMedicineForm').dataset.id;
    const medicineData = {
        name: document.getElementById('medicineName').value,
        stock: document.getElementById('stock').value,
        price: document.getElementById('price').value,
        prescriptionRequired: document.getElementById('prescriptionRequired').checked
    };

    let url = `${API_BASE}/add-medicine`;
    let method = 'POST';
    if (id) {
        url = `${API_BASE}/medicines/${id}`;
        method = 'PUT';
    }
    
    try {
        const response = await fetch(url, {
            method,
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(medicineData)
        });
        
        const data = await response.json();
        
        if (response.ok) {
            if (id) {
                showMessage('Medicine updated successfully', 'success');
                delete document.getElementById('addMedicineForm').dataset.id;
                document.getElementById('addMedicineForm').querySelector('button').textContent = 'Add Medicine';
            } else {
                showMessage('Medicine added successfully', 'success');
            }
            document.getElementById('addMedicineForm').reset();
            loadMedicines();
        } else {
            showMessage(data.error || (id ? 'Error updating medicine' : 'Error adding medicine'), 'error');
        }
    } catch (error) {
        showMessage(id ? 'Error updating medicine' : 'Error adding medicine', 'error');
    }
});

// Edit medicine helper
window.editMedicine = async function(id) {
    try {
        const response = await fetch(`${API_BASE}/medicines`);
        const medicines = await response.json();
        const med = medicines.find(m => m.id === id);
        if (!med) return;

        document.getElementById('medicineName').value = med.name;
        document.getElementById('stock').value = med.stock;
        document.getElementById('price').value = med.price || 0;
        document.getElementById('prescriptionRequired').checked = med.prescriptionRequired;
        document.getElementById('addMedicineForm').dataset.id = id;
        document.getElementById('addMedicineForm').querySelector('button').textContent = 'Save Changes';
    } catch (e) {
        showMessage('Error loading medicine for edit', 'error');
    }
};


// Bulk stock apply handler
document.getElementById('applyBulkStocks').addEventListener('click', async (e) => {
    e.preventDefault();
    const val = document.getElementById('bulkStocks').value.trim();
    if (!val) return;
    const stocks = val.split(',').map(s => parseInt(s, 10) || 0);
    try {
        const resp = await fetch(`${API_BASE}/set-stocks`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ stocks })
        });
        const data = await resp.json();
        if (resp.ok) {
            showMessage('Bulk stocks applied', 'success');
            loadMedicines();
        } else {
            showMessage(data.error || 'Error applying stocks', 'error');
        }
    } catch (err) {
        showMessage('Error applying stocks', 'error');
    }
});

// Refresh data every 30 seconds
setInterval(() => {
    loadMedicines();
    loadRequests();
}, 30000);