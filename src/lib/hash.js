// src/lib/hash.js
const bcrypt = require('bcrypt');

const SALT_ROUNDS = 10;

// 平文パスワードをハッシュする
async function hashPassword(plainPassword) {
  const hash = await bcrypt.hash(plainPassword, SALT_ROUNDS);
  return hash;
}

// 入力されたパスワードとハッシュを比較する
async function verifyPassword(plainPassword, hashedPassword) {
  const match = await bcrypt.compare(plainPassword, hashedPassword);
  return match;
}

module.exports = {
  hashPassword,
  verifyPassword,
};
