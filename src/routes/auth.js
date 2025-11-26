// src/routes/auth.js
const express = require('express');
const prisma = require('../lib/prisma');
const { hashPassword, verifyPassword } = require('../lib/hash');

const router = express.Router();

// 新規登録フォーム
router.get('/register', (req, res) => {
  res.render('auth/register', { error: null });
});

// 新規登録の送信
router.post('/register', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.render('auth/register', {
      error: 'メールアドレスとパスワードを入力してください。',
    });
  }

  try {
    // すでに同じメールアドレスが使われていないかチェック
    const existing = await prisma.user.findUnique({
      where: { email },
    });

    if (existing) {
      return res.render('auth/register', {
        error: 'このメールアドレスはすでに登録されています。',
      });
    }

    const hashed = await hashPassword(password);

    const user = await prisma.user.create({
      data: {
        email,
        password: hashed,
      },
    });

    // ログイン状態にする
    req.session.userId = user.id;

    // とりあえずトップへ（あとで /items に変える）
    res.redirect('/');
  } catch (err) {
    console.error(err);
    res.render('auth/register', {
      error: '登録中にエラーが発生しました。',
    });
  }
});

// ログインフォーム
router.get('/login', (req, res) => {
  res.render('auth/login', { error: null });
});

// ログイン送信
router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.render('auth/login', {
      error: 'メールアドレスとパスワードを入力してください。',
    });
  }

  try {
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      return res.render('auth/login', {
        error: 'メールアドレスまたはパスワードが違います。',
      });
    }

    const ok = await verifyPassword(password, user.password);

    if (!ok) {
      return res.render('auth/login', {
        error: 'メールアドレスまたはパスワードが違います。',
      });
    }

    // ログイン成功
    req.session.userId = user.id;
    res.redirect('/');
  } catch (err) {
    console.error(err);
    res.render('auth/login', {
      error: 'ログイン中にエラーが発生しました。',
    });
  }
});

// ログアウト
router.post('/logout', (req, res) => {
  req.session.destroy(() => {
    res.redirect('/login');
  });
});

module.exports = router;
