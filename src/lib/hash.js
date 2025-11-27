// src/lib/hash.js

const bcrypt = require('bcryptjs');

// 負荷が高すぎない程度のラウンド数
const SALT_ROUNDS = 10;

/**
 * プレーンなパスワードをハッシュ化する
 * @param {string} plain
 * @returns {Promise<string>}
 */
async function hashPassword(plain) {
  return bcrypt.hash(plain, SALT_ROUNDS);
}

/**
 * 入力されたパスワードと保存されたハッシュを比較する
 * @param {string} plain
 * @param {string} hash
 * @returns {Promise<boolean>}
 */
async function comparePassword(plain, hash) {
  return bcrypt.compare(plain, hash);
}

// ★ これが超重要：オブジェクトで2つとも export する
module.exports = {
  hashPassword,
  comparePassword,
};
