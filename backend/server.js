const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// 提供前端靜態檔案
app.use(express.static(path.join(__dirname, '..', 'frontend', 'dist')));

// API 路由
app.use('/api/auth', require('./routes/auth'));
app.use('/api/exams', require('./routes/exams'));
app.use('/api/questions', require('./routes/questions'));
app.use('/api/submissions', require('./routes/submissions'));

// 前端路由 fallback（SPA）
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'frontend', 'dist', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`🚀 伺服器啟動於 http://localhost:${PORT}`);
  console.log(`📝 管理後台：http://localhost:${PORT}/admin`);
  console.log(`📖 學生測驗：http://localhost:${PORT}`);
});
