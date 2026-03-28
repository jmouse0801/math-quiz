const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'math-quiz-secret-key-change-in-production';

// 驗證 JWT Token
function authenticate(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: '未提供認證令牌' });
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ error: '認證令牌無效或已過期' });
  }
}

// 驗證是否為老師
function requireTeacher(req, res, next) {
  if (req.user.role !== 'teacher') {
    return res.status(403).json({ error: '需要老師權限' });
  }
  next();
}

module.exports = { authenticate, requireTeacher, JWT_SECRET };
