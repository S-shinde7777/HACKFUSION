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

app.use('/api', medicineRoutes);
app.use('/api', requestRoutes);
app.use('/api', aiRoutes);

// Root route - serve admin dashboard
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'Frontend', 'index.html'));
});

// Patient route
app.get('/patient', (req, res) => {
    res.sendFile(path.join(__dirname, 'Frontend', 'patient.html'));
});

// Start server
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
    console.log(`Admin Dashboard: http://localhost:${PORT}`);
    console.log(`Patient Portal: http://localhost:${PORT}/patient`);
});