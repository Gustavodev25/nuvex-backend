const admin = require('firebase-admin');
const logger = require('./logger');

try {
  if (!admin.apps.length) {
    let credential;

    if (process.env.FIREBASE_PROJECT_ID && process.env.FIREBASE_PRIVATE_KEY && process.env.FIREBASE_CLIENT_EMAIL) {
      // Use variáveis de ambiente no Koyeb
      try {
        const serviceAccount = {
          projectId: process.env.FIREBASE_PROJECT_ID,
          privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'), // Converte \n em quebras de linha
          clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        };
        credential = admin.credential.cert(serviceAccount);
      } catch (error) {
        logger.error('Erro ao configurar credenciais do Firebase a partir de variáveis de ambiente:', error);
        process.exit(1);
      }
    } else {
      // Use arquivo local em desenvolvimento
      const path = require('path');
      const serviceAccountPath = path.join(__dirname, 'nuvex-5c9f4-firebase-adminsdk-fbsvc-242757154f.json');
      try {
        const serviceAccount = require(serviceAccountPath);
        credential = admin.credential.cert(serviceAccount);
      } catch (error) {
        if (error.code === 'MODULE_NOT_FOUND') {
          logger.error('Arquivo de credenciais do Firebase não encontrado. Por favor, configure FIREBASE_PROJECT_ID, FIREBASE_PRIVATE_KEY, FIREBASE_CLIENT_EMAIL ou coloque o arquivo em:', serviceAccountPath);
        } else {
          logger.error('Erro ao carregar credenciais do Firebase:', error);
        }
        process.exit(1);
      }
    }

    admin.initializeApp({
      credential: credential,
      storageBucket: 'nuvex-5c9f4.firebasestorage.app', // Opcional, se usar Storage
    });

    logger.info('Firebase Admin inicializado com sucesso');
  }
} catch (error) {
  logger.error('Erro ao inicializar Firebase Admin:', error);
  process.exit(1);
}

const db = admin.firestore();
module.exports = { db, admin };