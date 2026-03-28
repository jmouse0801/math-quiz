const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../db/init');
const { JWT_SECRET, authenticate } = require('../middleware/auth');

const router = express.Router();

// 註冊（僅限學生）
router.post('/register', (req, res) => {
  const { username, password, display_name } = req.body;

  if (!username || !password || !display_name) {
    return res.status(400).json({ error: '請填寫所有欄位' });
  }

  if (username.length < 3 || password.length < 4) {
    return res.status(400).json({ error: '帳號至少 3 字元，密碼至少 4 字元' });
  }

  const existing = db.prepare('SELECT id FROM users WHERE username = ?').get(username);
  if (existing) {
    return res.status(400).json({ error: '此帳號已被使用' });
  }

  const hashedPassword = bcrypt.hashSync(password, 10);
  const result = db.prepare(
    'INSERT INTO users (username, password, display_name, role) VALUES (?, ?, ?, ?)'
  ).run(username, hashedPassword, display_name, 'student');

  const token = jwt.sign(
    { id: result.lastInsertRowid, username, display_name, role: 'student' },
    JWT_SECRET,
    { expiresIn: '7d' }
  );

  res.json({ token, user: { id: result.lastInsertRowid, username, display_name, role: 'student' } });
});

// 登入
router.post('/login', (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ error: '請填寫帳號和密碼' });
  }

  const user = db.prepare('SELECT * FROM users WHERE username = ?').get(username);
  if (!user) {
    return res.status(401).json({ error: '帳號或密碼錯誤' });
  }

  const valid = bcrypt.compareSync(password, user.password);
  if (!valid) {
    return res.status(401).json({ error: '帳號或密碼錯誤' });
  }

  const token = jwt.sign(
    { id: user.id, username: user.username, display_name: user.display_name, role: user.role },
    JWT_SECRET,
    { expiresIn: '7d' }
  );

  res.json({
    token,
    user: { id: user.id, username: user.username, display_name: user.display_name, role: user.role }
  });
});

// 取得目前使用者資訊
router.get('/me', authenticate, (req, res) => {
  res.json({ user: req.user });
});

module.exports = router;
