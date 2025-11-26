// src/app.js
require('dotenv').config();

const path = require('path');
const express = require('express');
const session = require('express-session');

const { setUserLocals } = require('./middleware/auth');  
const authRoutes = require('./routes/auth');             
const itemsRoutes = require('./routes/items');  
const app = express();


// ----- 基本設定 -----
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// 静的ファイル（CSSなど）を配信
app.use(express.static(path.join(__dirname, 'public')));

// フォームのPOSTデータを受け取るための設定
app.use(express.urlencoded({ extended: true }));


app.use(
  session({
    secret: process.env.SESSION_SECRET || 'dev-secret',
    resave: false,
    saveUninitialized: false,
  })
);


app.use(setUserLocals);   
app.use(authRoutes); 
app.use(itemsRoutes);     



app.get('/', (req, res) => {
  res.redirect('/items');
});

// この app を server.js から使えるようにする
module.exports = app;
