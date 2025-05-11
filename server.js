const express = require('express');
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
const PORT = process.env.PORT || 3000;
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:8080';
const ALLOWED_ORIGINS = [
  FRONTEND_URL,
  'https://popular-yalonda-gustavodev25-138503a7.koyeb.app',
  'http://localhost:8080'
];

app.set('trust proxy', 1);

app.use((req, res, next) => {
  logger.info(`${req.method} ${req.path} - IP: ${req.ip}`);
  next();
});

// Configuração do CORS
app.use((req, res, next) => {
  const origin = req.headers.origin;
  if (ALLOWED_ORIGINS.includes(origin)) {
    res.header('Access-Control-Allow-Origin', origin);
  }
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  res.header('Access-Control-Allow-Credentials', true);

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  next();
});

// Configuração do body parser
app.use('/stripe/webhook', express.raw({ type: 'application/json' }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

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

// Rota de teste para verificar se o servidor está online
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'OK', message: 'Server is running' });
});

// Middleware de erro
app.use((err, req, res, next) => {
  logger.error('Erro inesperado:', err.stack);
  res.status(500).json({ 
    error: 'Erro interno do servidor',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Um erro ocorreu no servidor'
  });
});

app.listen(PORT, () => {
  logger.info(`Servidor rodando na porta ${PORT}`);
});

module.exports = app;