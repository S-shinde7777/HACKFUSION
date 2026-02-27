// API Base URL
const API_BASE = 'http://localhost:3000/api';

// Check if already logged in
window.addEventListener('load', () => {
    const user = sessionStorage.getItem('user');
    if (user) {
        redirectBasedOnRole(JSON.parse(user));
    }
});

// Show message function
function showMessage(message, type) {
    const container = document.getElementById('messageContainer');
    if (container) {
        container.innerHTML = `<div class="message ${type}">${message}</div>`;
    }
}

// Redirect based on user role
function redirectBasedOnRole(user) {
    if (user.role === 'patient') {
        window.location.href = '/patient.html';
    } else if (user.role === 'pharmacist') {
        window.location.href = '/pharmacist.html';
    } else {
        window.location.href = '/login.html';
    }
}

// Login form submission
document.getElementById('loginForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;
    
    try {
        const response = await fetch(`${API_BASE}/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ username, password })
        });
        
        const data = await response.json();
        
        if (response.ok && data.success) {
            // Store user info in session storage
            sessionStorage.setItem('user', JSON.stringify(data.user));
            
            // Show success message
            showMessage('Login successful! Redirecting...', 'success');
            
            // Redirect after short delay
            setTimeout(() => {
                redirectBasedOnRole(data.user);
            }, 1000);
        } else {
            showMessage(data.error || 'Invalid credentials', 'error');
        }
    } catch (error) {
        showMessage('Login failed. Please try again.', 'error');
    }
});