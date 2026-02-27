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
    if (userData.role !== 'patient') {
        window.location.href = '/login.html';
        return;
    }
    
    // Display user name
    document.getElementById('userDisplay').textContent = `Welcome, ${userData.name}`;
    document.getElementById('patientName').value = userData.name;
    
    // Load requests
    loadRequests(userData.name);
});

// Show message function
function showMessage(message, type) {
    const container = document.getElementById('messageContainer');
    container.innerHTML = `<div class="message ${type}">${message}</div>`;
    setTimeout(() => {
        container.innerHTML = '';
    }, 5000);
}

// Load requests for current patient
async function loadRequests(patientName) {
    try {
        const response = await fetch(`${API_BASE}/requests/patient/${encodeURIComponent(patientName)}`);
        const requests = await response.json();
        
        const tbody = document.getElementById('requestsTableBody');
        tbody.innerHTML = '';
        
        requests.forEach(request => {
            const row = tbody.insertRow();
            const statusClass = `status-${request.status}`;
            
            row.innerHTML = `
                <td>${request.id}</td>
                <td>${request.medicineName}</td>
                <td>${request.quantity}</td>
                <td><span class="${statusClass}">${request.status}</span></td>
                <td>${new Date(request.requestDate).toLocaleDateString()}</td>
            `;
        });
    } catch (error) {
        showMessage('Error loading requests', 'error');
    }
}

// Request medicine form submission
document.getElementById('requestMedicineForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const user = JSON.parse(sessionStorage.getItem('user'));
    
    const requestData = {
        patientName: user.name,
        medicineName: document.getElementById('medicineName').value,
        quantity: document.getElementById('quantity').value
    };
    
    try {
        const response = await fetch(`${API_BASE}/add-request`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(requestData)
        });
        
        const data = await response.json();
        
        if (response.ok) {
            showMessage('Request submitted successfully', 'success');
            document.getElementById('requestMedicineForm').reset();
            document.getElementById('patientName').value = user.name; // Restore patient name
            
            // Reload requests
            loadRequests(user.name);
        } else {
            showMessage(data.error || 'Error submitting request', 'error');
        }
    } catch (error) {
        showMessage('Error submitting request', 'error');
    }
});

// Chatbot functionality
const chatbotToggle = document.getElementById('chatbotToggle');
const chatbotContainer = document.getElementById('chatbotContainer');
const closeChatbot = document.getElementById('closeChatbot');
const sendMessage = document.getElementById('sendMessage');
const chatInput = document.getElementById('chatInput');
const chatMessages = document.getElementById('chatMessages');

chatbotToggle.addEventListener('click', () => {
    chatbotContainer.classList.remove('hidden');
    chatbotToggle.classList.add('hidden');
});

closeChatbot.addEventListener('click', () => {
    chatbotContainer.classList.add('hidden');
    chatbotToggle.classList.remove('hidden');
});

sendMessage.addEventListener('click', sendChatMessage);
chatInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        sendChatMessage();
    }
});

async function sendChatMessage() {
    const message = chatInput.value.trim();
    if (!message) return;
    
    // Add user message to chat
    addMessageToChat(message, 'user');
    chatInput.value = '';
    
    try {
        const response = await fetch(`${API_BASE}/chat`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ message })
        });
        
        const data = await response.json();
        
        // Add bot response to chat
        addMessageToChat(data.response, 'bot');
    } catch (error) {
        addMessageToChat('Sorry, I encountered an error. Please try again.', 'bot');
    }
}

function addMessageToChat(message, sender) {
    const messageDiv = document.createElement('div');
    messageDiv.classList.add('message', sender);
    messageDiv.textContent = message;
    chatMessages.appendChild(messageDiv);
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

// Refresh data every 30 seconds
setInterval(() => {
    const user = JSON.parse(sessionStorage.getItem('user'));
    if (user) {
        loadRequests(user.name);
    }
}, 30000);