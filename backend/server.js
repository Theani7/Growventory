require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const { testConnection } = require('./config/db');

// Import routes
const authRoutes = require('./routes/authRoutes');
const categoryRoutes = require('./routes/categoryRoutes');
const plantRoutes = require('./routes/plantRoutes');
const stockRoutes = require('./routes/stockRoutes');
const healthRoutes = require('./routes/healthRoutes');
const dashboardRoutes = require('./routes/dashboardRoutes');
const reportRoutes = require('./routes/reportRoutes');
const notificationRoutes = require('./routes/notificationRoutes');
const userRoutes = require('./routes/userRoutes');
const taskRoutes = require('./routes/taskRoutes');
const settingsRoutes = require('./routes/settingsRoutes');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" }
}));

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100, // Increased to 100 attempts for easier testing
  message: { success: false, message: 'Too many login attempts, please try again later.' }
});

app.use('/api/auth/login', authLimiter);
app.use('/api/auth/register', authLimiter);

app.use(cors({
  origin: process.env.NODE_ENV === 'development' ? true : [
    'http://localhost:3000',
    'http://localhost:5173',
    process.env.FRONTEND_URL
  ].filter(Boolean),
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.get('/', (req, res) => {
  res.json({ success: true, message: 'Welcome to Growventory API', version: '1.1.0' });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/plants', plantRoutes);
app.use('/api/stock', stockRoutes);
app.use('/api/health', healthRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/settings', settingsRoutes);

app.use((req, res) => {
  res.status(404).json({ success: false, message: 'Route not found.' });
});

app.use((err, req, res, next) => {
  console.error(`[ERROR] ${new Date().toISOString()}:`, err.stack);
  
  const isDev = process.env.NODE_ENV === 'development';
  res.status(err.status || 500).json({
    success: false,
    message: isDev ? err.message : 'Internal Server Error',
    ...(isDev && { stack: err.stack })
  });
});

app.listen(PORT, async () => {
  console.log(`🚀 Server running on port ${PORT}`);
  await testConnection();
});
