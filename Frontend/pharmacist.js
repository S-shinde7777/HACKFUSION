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
                <td>${medicine.prescriptionRequired ? 'Yes' : 'No'}</td>
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
document.getElementById('addMedicineForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const medicineData = {
        name: document.getElementById('medicineName').value,
        stock: document.getElementById('stock').value,
        prescriptionRequired: document.getElementById('prescriptionRequired').checked
    };
    
    try {
        const response = await fetch(`${API_BASE}/add-medicine`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(medicineData)
        });
        
        const data = await response.json();
        
        if (response.ok) {
            showMessage('Medicine added successfully', 'success');
            document.getElementById('addMedicineForm').reset();
            loadMedicines();
        } else {
            showMessage(data.error || 'Error adding medicine', 'error');
        }
    } catch (error) {
        showMessage('Error adding medicine', 'error');
    }
});

// Refresh data every 30 seconds
setInterval(() => {
    loadMedicines();
    loadRequests();
}, 30000);