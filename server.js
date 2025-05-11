const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const { admin } = require('./firebase');
const winston = require('winston');
const logger = require('./logger');
const cnpjRoutes = require('./routes/cnpj');
const emailRoutes = require('./routes/email');
const stripeRoutes = require('./routes/stripe');
const teamRoutes = require('./routes/team');
const uploadRoutes = require('./routes/upload');
const storageRoutes = require('./routes/storage');
const notificationsRoutes = require('./routes/notifications');
const signupRoutes = require('./routes/signup');
const securityRoutes = require('./routes/security');
const validateRouter = require('./routes/validate');
const loginRoutes = require('./routes/login');

const app = express();

// Middlewares
app.use(helmet());
app.use(compression());
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:8080',
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.set('trust proxy', 1);

app.use((req, res, next) => {
  logger.info(`${req.method} ${req.path} - IP: ${req.ip}`);
  next();
});

app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', process.env.FRONTEND_URL || 'http://localhost:8080');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  res.header('Access-Control-Allow-Credentials', true);

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  next();
});

// Para webhooks Stripe (raw body)
app.use('/stripe/webhook', express.raw({ type: 'application/json' }));

// Rotas básicas
app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

// Rotas
app.use('/cnpj', cnpjRoutes);
app.use('/email', emailRoutes);
app.use('/stripe', stripeRoutes);
app.use('/team', teamRoutes);
app.use('/upload', uploadRoutes);
app.use('/storage', storageRoutes);
app.use('/notifications', notificationsRoutes);
app.use('/signup', signupRoutes);
app.use('/security', securityRoutes);
app.use('/validate', validateRouter);
app.use('/login', loginRoutes);

app.use((err, req, res, next) => {
  logger.error('Erro inesperado:', err.stack);
  res.status(500).json({ error: 'Erro interno do servidor' });
});

// Handler para erro não tratado
process.on('uncaughtException', (err) => {
  console.error('Erro não tratado:', err);
  process.exit(1);
});

process.on('SIGTERM', () => {
  console.log('Recebido SIGTERM. Encerrando graciosamente...');
  process.exit(0);
});

// Porta dinâmica para Railway
const PORT = process.env.PORT || 3000;

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});