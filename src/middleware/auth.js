// src/middleware/auth.js

// ログインしているユーザーIDをテンプレートで使えるようにする
function setUserLocals(req, res, next) {
  res.locals.currentUserId = req.session.userId || null;
  next();
}

// ログインしていない場合は /login に飛ばす
function requireLogin(req, res, next) {
  if (!req.session.userId) {
    return res.redirect('/login');
  }
  next();
}

module.exports = {
  setUserLocals,
  requireLogin,
};
