// src/app.js
require('dotenv').config();

const path = require('path');
const express = require('express');
const session = require('express-session');

const { setUserLocals } = require('./middleware/auth');

// ルーター読み込み
const authRoutes = require('./routes/auth');
const itemsRoutes = require('./routes/items');

// claims は壊れててもアプリ全体が落ちないように try/catch
let claimsRoutes = null;
try {
  claimsRoutes = require('./routes/claims');
} catch (e) {
  console.warn('claims ルートは読み込めませんでした:', e.message);
}

const app = express();

// ===== ビューエンジン設定 =====
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// ===== 静的ファイル（CSS / 画像など） =====
// ここが超重要：/css/style.css → src/public/css/style.css を見る
app.use(express.static(path.join(__dirname, 'public')));

// ===== フォームのPOSTデータ =====
app.use(express.urlencoded({ extended: true }));

// ===== セッション設定 =====
app.use(
  session({
    secret: process.env.SESSION_SECRET || 'dev-secret',
    resave: false,
    saveUninitialized: false,
  })
);

// ===== ログイン中ユーザー情報を res.locals に入れる =====
app.use(setUserLocals);

// ===== ルーティング =====
if (typeof authRoutes === 'function') {
  app.use(authRoutes); // /login, /register, /logout
} else {
  console.warn('authRoutes が Router ではありません');
}

if (typeof itemsRoutes === 'function') {
  app.use(itemsRoutes); // /items 関係
} else {
  console.warn('itemsRoutes が Router ではありません');
}

if (typeof claimsRoutes === 'function') {
  app.use(claimsRoutes); // /claims 関係
} else if (claimsRoutes !== null) {
  console.warn('claimsRoutes が Router ではありません');
}

// ★ style.css を確実に返すための専用ルート
app.get('/css/style.css', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'css', 'style.css'));
});


// 404 の簡易ハンドラ（お好みで）
app.use((req, res) => {
  res.status(404).send('Not Found');
});

module.exports = app;
