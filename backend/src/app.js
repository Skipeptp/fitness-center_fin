// =============================================================
// VOLT - точка входа backend
// =============================================================
require('dotenv').config();

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const http = require('http');
const { Server } = require('socket.io');

const errorHandler = require('./middleware/errorHandler');
const { globalLimiter } = require('./middleware/rateLimiter');

// Routes
const authRoutes        = require('./routes/auth');
const clientRoutes      = require('./routes/clients');
const scheduleRoutes    = require('./routes/schedule');
const bookingRoutes     = require('./routes/bookings');
const membershipRoutes  = require('./routes/memberships');
const trainerRoutes     = require('./routes/trainers');
const paymentRoutes     = require('./routes/payments');
const reviewRoutes      = require('./routes/reviews');
const supportRoutes     = require('./routes/support');
const achievementRoutes = require('./routes/achievements');
const programRoutes     = require('./routes/programs');
const hallRoutes        = require('./routes/halls');
const analyticsRoutes   = require('./routes/analytics');
const notificationRoutes= require('./routes/notifications');

const app = express();
const server = http.createServer(app);

// Socket.io
const io = new Server(server, {
  cors: { origin: process.env.FRONTEND_ORIGIN || '*' }
});
require('./utils/chatHandler')(io);
app.set('io', io);

// Middleware
app.use(helmet());
app.use(cors({
  origin: process.env.FRONTEND_ORIGIN || '*',
  credentials: true
}));
app.use(express.json({ limit: '1mb' }));
app.use(morgan('dev'));
app.use(globalLimiter);

// Healthcheck
app.get('/api/health', (req, res) => res.json({ status: 'ok', service: 'VOLT API' }));

// Routes
app.use('/api/auth',          authRoutes);
app.use('/api/clients',       clientRoutes);
app.use('/api/schedule',      scheduleRoutes);
app.use('/api/bookings',      bookingRoutes);
app.use('/api/memberships',   membershipRoutes);
app.use('/api/trainers',      trainerRoutes);
app.use('/api/payments',      paymentRoutes);
app.use('/api/reviews',       reviewRoutes);
app.use('/api/support',       supportRoutes);
app.use('/api/achievements',  achievementRoutes);
app.use('/api/programs',      programRoutes);
app.use('/api/halls',         hallRoutes);
app.use('/api/analytics',     analyticsRoutes);
app.use('/api/notifications', notificationRoutes);

// 404
app.use((req, res) => res.status(404).json({ success: false, error: 'Not found' }));

// Error handler (последний)
app.use(errorHandler);

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`⚡ VOLT API running on http://localhost:${PORT}`);
});
