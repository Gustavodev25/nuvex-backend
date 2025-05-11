
const express = require('express');
const router = express.Router();
const { db, admin } = require('../firebase');
const logger = require('../logger');

// Rota de cadastro
router.post('/', async (req, res) => {
  const { email, fullName, password, trial } = req.body;

  // Validação detalhada dos campos
  if (!email || typeof email !== 'string' || !email.includes('@')) {
    logger.warn('Email inválido no cadastro');
    return res.status(400).json({ error: 'Email inválido' });
  }

  if (!fullName || typeof fullName !== 'string' || fullName.trim().length < 3) {
    logger.warn('Nome completo inválido no cadastro');
    return res.status(400).json({ error: 'Nome completo inválido' });
  }

  if (!password || typeof password !== 'string' || password.length < 6) {
    logger.warn('Senha inválida no cadastro');
    return res.status(400).json({ error: 'A senha deve ter pelo menos 6 caracteres' });
  }

  const trialPeriod = trial === 'extended' ? 14 : 7;

  try {
    // Verificar se o e-mail já existe
    try {
      const userExists = await admin.auth().getUserByEmail(email);
      if (userExists) {
        logger.warn(`Tentativa de cadastro com email já existente: ${email}`);
        return res.status(400).json({ error: 'Este email já está em uso' });
      }
    } catch (error) {
      // Se o usuário não existe, podemos continuar
      if (error.code !== 'auth/user-not-found') {
        throw error;
      }
    }

    // Criar usuário no Firebase Authentication
    const userRecord = await admin.auth().createUser({
      email: email.trim(),
      password: password,
      displayName: fullName.trim(),
    });

    // Salvar dados no Firestore
    await db.collection('users').doc(userRecord.uid).set({
      fullName: fullName.trim(),
      email: email.trim(),
      createdAt: new Date().toISOString(),
      lastLogin: new Date().toISOString(),
      role: 'user',
      autoBilling: true,
      trialPeriod: trialPeriod,
    });

    const customToken = await admin.auth().createCustomToken(userRecord.uid);

    logger.info(`Usuário ${email} cadastrado com sucesso (trial: ${trialPeriod} dias), UID: ${userRecord.uid}`);
    
    res.status(201).json({ 
      message: 'Usuário criado com sucesso',
      customToken,
      user: {
        uid: userRecord.uid,
        email: userRecord.email,
        displayName: userRecord.displayName
      }
    });
  } catch (error) {
    logger.error('Erro ao criar usuário:', error);
    
    if (error.code === 'auth/email-already-exists') {
      return res.status(400).json({ error: 'Este email já está em uso' });
    }
    
    if (error.code === 'auth/invalid-password') {
      return res.status(400).json({ error: 'Senha inválida' });
    }
    
    res.status(500).json({ error: 'Erro ao criar usuário' });
  }
});

module.exports = router;