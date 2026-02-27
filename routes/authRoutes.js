const express = require('express');
const fs = require('fs').promises;
const path = require('path');
const router = express.Router();

const usersFile = path.join(__dirname, '../data/users.json');

// Helper function to read users
async function readUsers() {
    try {
        const data = await fs.readFile(usersFile, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        return [];
    }
}

// POST /api/login - Simple login verification
router.post('/login', async (req, res) => {
    try {
        const { username, password } = req.body;
        
        if (!username || !password) {
            return res.status(400).json({ error: 'Username and password are required' });
        }

        const users = await readUsers();
        
        // Find user with matching credentials
        const user = users.find(u => u.username === username && u.password === password);
        
        if (user) {
            // Return user info without password
            const { password, ...userWithoutPassword } = user;
            res.json({ 
                success: true, 
                message: 'Login successful',
                user: userWithoutPassword
            });
        } else {
            res.status(401).json({ error: 'Invalid username or password' });
        }
    } catch (error) {
        res.status(500).json({ error: 'Login failed' });
    }
});

// GET /api/users - Get all users (for demo purposes)
router.get('/users', async (req, res) => {
    try {
        const users = await readUsers();
        // Remove passwords from response
        const usersWithoutPasswords = users.map(({ password, ...user }) => user);
        res.json(usersWithoutPasswords);
    } catch (error) {
        res.status(500).json({ error: 'Failed to read users' });
    }
});

module.exports = router;