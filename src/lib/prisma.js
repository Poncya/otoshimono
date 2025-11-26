// src/lib/prisma.js
const { PrismaClient } = require('@prisma/client');

// PrismaClient はアプリ全体で1つだけ作って共有する
const prisma = new PrismaClient();

module.exports = prisma;
