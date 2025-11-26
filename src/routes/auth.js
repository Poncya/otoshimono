// src/routes/auth.js
const express = require('express');
const router = express.Router();

const prisma = require('../lib/prisma');
const { hashPassword, comparePassword } = require('../lib/hash');

// -------------------------
// 新規登録画面
// -------------------------
router.get('/register', (req, res) => {
  res.render('auth/register', {
    error: null,
    formData: {}
  });
});

// -------------------------
// 新規登録 POST
// -------------------------
router.post('/register', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).render('auth/register', {
      error: 'メールアドレスとパスワードを入力してください。',
      formData: { email }
    });
  }

  try {
    // すでに登録済みかチェック
    const existingUser = await prisma.user.findFirst({
      where: { email }    // ★ findUnique → findFirst
    });

    if (existingUser) {
      return res.status(400).render('auth/register', {
        error: 'このメールアドレスはすでに登録されています。',
        formData: { email }
      });
    }

    // パスワードをハッシュ化して保存
    const hashed = await hashPassword(password);

    const user = await prisma.user.create({
      data: {
        email,
        password: hashed
      }
    });

    req.session.userId = user.id;
    res.redirect('/items');
  } catch (err) {
    console.error('REGISTER ERROR:', err);
    return res.status(500).render('auth/register', {
      error: 'サーバーエラーが発生しました。時間をおいて再度お試しください。',
      formData: { email }
    });
  }
});

// -------------------------
// ログイン画面
// -------------------------
router.get('/login', (req, res) => {
  res.render('auth/login', {
    error: null,
    formData: {}
  });
});

// -------------------------
// ログイン POST
// -------------------------
router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).render('auth/login', {
      error: 'メールアドレスとパスワードを入力してください。',
      formData: { email }
    });
  }

  try {
    const user = await prisma.user.findFirst({
      where: { email }   // ★ findUnique → findFirst
    });

    if (!user) {
      return res.status(400).render('auth/login', {
        error: 'メールアドレスまたはパスワードが正しくありません。',
        formData: { email }
      });
    }

    const ok = await comparePassword(password, user.password);
    if (!ok) {
      return res.status(400).render('auth/login', {
        error: 'メールアドレスまたはパスワードが正しくありません。',
        formData: { email }
      });
    }

    req.session.userId = user.id;
    res.redirect('/items');
  } catch (err) {
    console.error('LOGIN ERROR:', err);
    return res.status(500).render('auth/login', {
      error: 'サーバーエラーが発生しました。時間をおいて再度お試しください。',
      formData: { email }
    });
  }
});

// -------------------------
// ログアウト
// -------------------------
router.post('/logout', (req, res) => {
  req.session.destroy(() => {
    res.redirect('/login');
  });
});

module.exports = router;
