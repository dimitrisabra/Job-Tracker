const fs = require('fs');
const path = require('path');
const express = require('express');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

const authRoutes = require('./routes/authRoutes');
const jobRoutes = require('./routes/jobRoutes');
const jobPostingRoutes = require('./routes/jobPostingRoutes');
const userRoutes = require('./routes/userRoutes');
const adminRoutes = require('./routes/adminRoutes');
const errorHandler = require('./middleware/errorHandler');
const { DATA_FILE, initStore } = require('./utils/devStore');

const app = express();
const LOCAL_DEV_ORIGINS = new Set(['http://localhost:5173', 'http://127.0.0.1:5173']);
const FRONTEND_DIST_DIR = path.join(__dirname, '..', 'frontend', 'dist');
const FRONTEND_INDEX_FILE = path.join(FRONTEND_DIST_DIR, 'index.html');
const HAS_FRONTEND_BUILD = fs.existsSync(FRONTEND_INDEX_FILE);

if (process.env.NODE_ENV === 'production' || process.env.TRUST_PROXY === 'true') {
  app.set('trust proxy', 1);
}

const allowedOrigins = new Set(
  String(process.env.FRONTEND_URL || '')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean)
);

LOCAL_DEV_ORIGINS.forEach((origin) => allowedOrigins.add(origin));

app.use(cors((req, callback) => {
  const requestOrigin = req.header('Origin');
  const requestHost = req.get('host');
  const requestHostOrigin = requestHost ? `${req.protocol}://${requestHost}` : '';
  const isSameOrigin = requestOrigin && requestOrigin === requestHostOrigin;
  const isAllowedOrigin = !requestOrigin || isSameOrigin || allowedOrigins.has(requestOrigin);

  callback(null, {
    origin: isAllowedOrigin,
    credentials: true,
  });
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

let storeReady;

function ensureStoreReady() {
  if (!storeReady) {
    storeReady = initStore();
  }

  return storeReady;
}

app.use(async (req, res, next) => {
  try {
    await ensureStoreReady();
    next();
  } catch (error) {
    next(error);
  }
});

const LOCAL_HOST_MARKERS = ['127.0.0.1', '::1', '::ffff:127.0.0.1', 'localhost'];

function isLocalRequest(req) {
  const forwardedFor = req.headers['x-forwarded-for'];
  const ipCandidates = [req.ip, req.socket?.remoteAddress, forwardedFor]
    .filter(Boolean)
    .join(',');

  return LOCAL_HOST_MARKERS.some((marker) => ipCandidates.includes(marker));
}

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: { message: 'Too many requests from this IP, please try again later.' },
  skip: (req) => process.env.NODE_ENV !== 'production' && isLocalRequest(req),
});
app.use('/api', limiter);

app.use('/api/auth', authRoutes);
app.use('/api/jobs', jobRoutes);
app.use('/api/postings', jobPostingRoutes);
app.use('/api/users', userRoutes);
app.use('/api/admin', adminRoutes);

app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', storage: 'file', timestamp: new Date().toISOString() });
});

if (HAS_FRONTEND_BUILD) {
  app.use(express.static(FRONTEND_DIST_DIR));

  app.get('*', (req, res, next) => {
    if (req.path === '/api' || req.path.startsWith('/api/')) {
      return next();
    }

    return res.sendFile(FRONTEND_INDEX_FILE);
  });
}

app.use('/api', (req, res) => {
  res.status(404).json({ message: `Route ${req.originalUrl} not found` });
});

app.use((req, res) => {
  res.status(404).json({ message: `Route ${req.originalUrl} not found` });
});

app.use(errorHandler);

const PORT = process.env.PORT || 5000;

async function startServer() {
  await ensureStoreReady();

  app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
    console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`Dev store: ${DATA_FILE}`);
    console.log(`Frontend bundle: ${HAS_FRONTEND_BUILD ? FRONTEND_DIST_DIR : 'not found'}`);
  });
}

if (require.main === module) {
  startServer().catch((error) => {
    console.error('Startup error:', error.message);
    process.exit(1);
  });
}

module.exports = app;
