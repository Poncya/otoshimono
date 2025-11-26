// src/routes/items.js
const express = require('express');
const prisma = require('../lib/prisma');
const { requireLogin } = require('../middleware/auth');

const router = express.Router();

// 落とし物一覧（ログイン必須 ＋ 検索つき）
router.get('/items', requireLogin, async (req, res) => {
  const { keyword, place, from, to } = req.query;

  // Prisma の where 条件を組み立て
  const where = {};

  if (keyword && keyword.trim() !== '') {
    where.name = {
      contains: keyword.trim(),
      mode: 'insensitive', // 大文字小文字区別しない
    };
  }

  if (place && place.trim() !== '') {
    where.place = {
      contains: place.trim(),
      mode: 'insensitive',
    };
  }

  if (from || to) {
    where.pickedAt = {};
    if (from) {
      // from 以降
      where.pickedAt.gte = new Date(from);
    }
    if (to) {
      // to 以前（その日の終わりまで）
      const end = new Date(to);
      end.setHours(23, 59, 59, 999);
      where.pickedAt.lte = end;
    }
  }

  try {
    const items = await prisma.item.findMany({
      where,
      orderBy: { pickedAt: 'desc' },
      include: {
        registrant: true,
        owner: true,
      },
    });

    res.render('items/index', {
      items,
      filters: {
        keyword: keyword || '',
        place: place || '',
        from: from || '',
        to: to || '',
      },
    });
  } catch (err) {
    console.error(err);
    res.status(500).send('一覧の取得中にエラーが発生しました');
  }
});

// 落とし物の新規登録（ログイン必須）
router.post('/items', requireLogin, async (req, res) => {
  const { name, place, pickedAt } = req.body;

  if (!name || !place) {
    return res.redirect('/items');
  }

  try {
    // 基本の登録データ
    const data = {
      name,
      place,
      subsid: req.session.userId,
    };

    if (pickedAt && pickedAt.trim() !== '') {
      data.pickedAt = new Date(pickedAt);
    }

    await prisma.item.create({ data });

    res.redirect('/items');
  } catch (err) {
    console.error(err);
    res.status(500).send('登録中にエラーが発生しました');
  }
});


// マイページ：自分が登録した落とし物だけ
router.get('/mypage', requireLogin, async (req, res) => {
  try {
    const myItems = await prisma.item.findMany({
      where: { subsid: req.session.userId },
      orderBy: { pickedAt: 'desc' },
      include: {
        claims: {
          include: {
            applicant: true,
          },
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    res.render('items/mypage', { items: myItems });
  } catch (err) {
    console.error(err);
    res.status(500).send('マイページの取得中にエラーが発生しました');
  }
});


// 編集フォーム表示（クエリパラメータで ?id=）
router.get('/items/edit', requireLogin, async (req, res) => {
  const id = Number(req.query.id);
  if (!id) {
    return res.redirect('/mypage');
  }

  try {
    const item = await prisma.item.findUnique({
      where: { id },
    });

    // 存在しない or 自分の登録ではない場合
    if (!item || item.subsid !== req.session.userId) {
      return res.status(403).send('この落とし物を編集する権限がありません。');
    }

    res.render('items/edit', { item });
  } catch (err) {
    console.error(err);
    res.status(500).send('編集画面の取得中にエラーが発生しました');
  }
});

// 編集の保存（POST /items/edit?id=...）
router.post('/items/edit', requireLogin, async (req, res) => {
  const id = Number(req.query.id);
  const { name, place } = req.body;

  if (!id) {
    return res.redirect('/mypage');
  }

  try {
    const item = await prisma.item.findUnique({ where: { id } });

    if (!item || item.subsid !== req.session.userId) {
      return res.status(403).send('この落とし物を編集する権限がありません。');
    }

    await prisma.item.update({
      where: { id },
      data: {
        name,
        place,
      },
    });

    res.redirect('/mypage');
  } catch (err) {
    console.error(err);
    res.status(500).send('更新中にエラーが発生しました');
  }
});

// 削除（POST /items/delete?id=...）
router.post('/items/delete', requireLogin, async (req, res) => {
  const id = Number(req.query.id);
  if (!id) {
    return res.redirect('/mypage');
  }

  try {
    const item = await prisma.item.findUnique({ where: { id } });

    if (!item || item.subsid !== req.session.userId) {
      return res.status(403).send('この落とし物を削除する権限がありません。');
    }

    await prisma.item.delete({
      where: { id },
    });

    res.redirect('/mypage');
  } catch (err) {
    console.error(err);
    res.status(500).send('削除中にエラーが発生しました');
  }
});

// 詳細ページ（?id= で指定）
router.get('/items/detail', requireLogin, async (req, res) => {
  const id = Number(req.query.id);
  if (!id) {
    return res.redirect('/items');
  }

  try {
    const item = await prisma.item.findUnique({
      where: { id },
      include: {
        registrant: true, // 登録者
        owner: true,      // 持ち主（確定していれば）
        claims: {         // ★ 申請一覧も一緒に取得
          include: {
            applicant: true,
          },
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!item) {
      return res.status(404).send('指定された落とし物が見つかりません。');
    }

    res.render('items/detail', { item });
  } catch (err) {
    console.error(err);
    res.status(500).send('詳細の取得中にエラーが発生しました');
  }
});

// 「これは私の物です」申請
router.post('/items/claim', requireLogin, async (req, res) => {
  const { itemId, name, contact, message } = req.body;
  const id = Number(itemId);

  if (!id || !name || !contact) {
    // 必須項目が足りない場合は詳細ページに戻す
    return res.redirect(`/items/detail?id=${id}`);
  }

  try {
    const item = await prisma.item.findUnique({
      where: { id },
    });

    if (!item) {
      return res.status(404).send('指定された落とし物が見つかりません。');
    }

    await prisma.claim.create({
      data: {
        itemId: id,
        applicantId: req.session.userId, // 申請したユーザー
        name,
        contact,
        message: message || null,
      },
    });

    // 申請後は詳細ページに戻る
    res.redirect(`/items/detail?id=${id}`);
  } catch (err) {
    console.error(err);
    res.status(500).send('申請の保存中にエラーが発生しました');
  }
});

module.exports = router;
