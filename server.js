const express = require('express');
const cors = require('cors');
const path = require('path');
const dotenv = require('dotenv');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files from Frontend directory
app.use(express.static(path.join(__dirname, 'Frontend')));

// Routes
const medicineRoutes = require('./routes/medicineRoutes');
const requestRoutes = require('./routes/requestRoutes');
const aiRoutes = require('./routes/aiRoutes');
const authRoutes = require('./routes/authRoutes');

app.use('/api', medicineRoutes);
app.use('/api', requestRoutes);
app.use('/api', aiRoutes);
app.use('/api', authRoutes);

// Root route - redirect to login
app.get('/', (req, res) => {
    res.redirect('./login.html');
});

// Start server
app.listen(PORT, () => {
    console.log(`Login Page: http://localhost:${PORT}`);
});