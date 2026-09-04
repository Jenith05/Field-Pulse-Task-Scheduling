const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
require("dotenv").config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// MongoDB connection
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/field_service_dispatch')
  .then(() => console.log('MongoDB connected successfully'))
  .catch((err) => console.error('MongoDB connection error:', err));

// Routes
const authRoutes = require('./routes/auth');
const jobRoutes = require('./routes/jobs');
const assignmentRoutes = require('./routes/assignments');
const lifecycleRoutes = require('./routes/lifecycle');
const partsRoutes = require('./routes/parts');
const dashboardRoutes = require('./routes/dashboard');

app.use('/api/auth', authRoutes);
app.use('/api/jobs', jobRoutes);
app.use('/api/assignments', assignmentRoutes);
app.use('/api/lifecycle', lifecycleRoutes);
app.use('/api/parts', partsRoutes);
app.use('/api/dashboard', dashboardRoutes);

// Root route
app.get("/", (req, res) => {
  res.json({ message: "Field Service Dispatch API is running" });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});