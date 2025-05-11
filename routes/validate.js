const express = require('express');
const router = express.Router();
const { db, admin } = require('../firebase');
const logger = require('../logger');

router.post('/email', async (req, res) => {
  try {
    const { email } = req.body;

    if (!email || typeof email !== 'string' || !email.includes('@')) {
      return res.status(400).json({
        valid: false,
        error: 'Email inválido',
      });
    }

    try {
      const userExists = await admin.auth().getUserByEmail(email);
      if (userExists) {
        logger.info(`Validação de email: ${email} já está em uso`);
        return res.status(200).json({
          valid: false,
          error: 'Este email já está em uso',
        });
      }
    } catch (error) {
      if (error.code !== 'auth/user-not-found') {
        throw error;
      }
    }

    logger.info(`Validação de email: ${email} está disponível`);
    return res.status(200).json({ valid: true });
  } catch (error) {
    logger.error('Erro na validação de email:', {
      message: error.message,
      code: error.code,
      stack: error.stack,
    });
    return res.status(500).json({
      valid: false,
      error: 'Erro ao validar email',
      details: process.env.NODE_ENV === 'development' ? error.message : 'Erro interno',
    });
  }
});

router.post('/document', async (req, res) => {
  try {
    const { type, number } = req.body;

    if (!type || !number) {
      return res.status(400).json({ error: 'Tipo e número do documento são obrigatórios' });
    }

    if (!['cpf', 'cnpj'].includes(type)) {
      return res.status(400).json({ error: 'Tipo de documento inválido' });
    }

    const existingDocs = await db.collection('users')
      .where(type, '==', number)
      .where('status', 'in', ['trial', 'active'])
      .get();

    if (!existingDocs.empty) {
      return res.status(409).json({
        error: 'Documento já registrado',
        message: `Este ${type.toUpperCase()} já está em uso por outra conta ativa ou em período de teste.`,
      });
    }

    res.json({ valid: true });
  } catch (error) {
    logger.error('Erro ao validar documento:', {
      message: error.message,
      code: error.code,
      stack: error.stack,
    });
    res.status(500).json({
      error: 'Erro interno',
      message: 'Erro ao validar documento',
      details: process.env.NODE_ENV === 'development' ? error.message : 'Erro interno',
    });
  }
});

module.exports = router;