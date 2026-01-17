// backend/server.js
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('../frontend')); // Serve frontend files

// Database Connection
const connectDB = require('./config/db');
connectDB();

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/products', require('./routes/products'));
app.use('/api/orders', require('./routes/orders'));
app.use('/api/inventory', require('./routes/inventory'));
app.use('/api/customer', require('./routes/customer'));
app.use('/api/chef', require('./routes/chef'));
app.use('/api/delivery', require('./routes/delivery'));
app.use('/api/cashier', require('./routes/cashier'));
app.use('/api/manager', require('./routes/manager'));
app.use('/api/users', require('./routes/users'));

// Test route
app.get('/api/test', (req, res) => {
  res.json({ message: 'SweetBite API is running!' });
});

// Start server
const PORT = process.env.PORT || 5001;
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});