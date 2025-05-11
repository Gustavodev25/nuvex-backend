const admin = require('firebase-admin');
const path = require('path');
const logger = require('./logger');

try {
  if (!admin.apps.length) {
    let credential;
    
    if (process.env.FIREBASE_CREDENTIALS) {
      // Use credenciais de variável de ambiente em produção
      try {
        const serviceAccount = JSON.parse(process.env.FIREBASE_CREDENTIALS);
        credential = admin.credential.cert(serviceAccount);
      } catch (error) {
        logger.error('Erro ao parsear credenciais do Firebase de variável de ambiente:', error);
        process.exit(1);
      }
    } else {
      // Use arquivo local em desenvolvimento
      const serviceAccountPath = path.join(__dirname, 'nuvex-5c9f4-firebase-adminsdk-fbsvc-242757154f.json');
      try {
        const serviceAccount = require(serviceAccountPath);
        credential = admin.credential.cert(serviceAccount);
      } catch (error) {
        if (error.code === 'MODULE_NOT_FOUND') {
          logger.error('Arquivo de credenciais do Firebase não encontrado. Por favor, configure FIREBASE_CREDENTIALS ou coloque o arquivo em:', serviceAccountPath);
        } else {
          logger.error('Erro ao carregar credenciais do Firebase:', error);
        }
        process.exit(1);
      }
    }

    admin.initializeApp({
      credential: credential
    });
    
    logger.info('Firebase Admin inicializado com sucesso');
  }
} catch (error) {
  logger.error('Erro ao inicializar Firebase Admin:', error);
  process.exit(1);
}

const db = admin.firestore();
module.exports = { db, admin };