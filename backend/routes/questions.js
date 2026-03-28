const express = require('express');
const db = require('../db/init');
const { authenticate, requireTeacher } = require('../middleware/auth');

const router = express.Router();

// 新增題目到考卷（老師）
router.post('/', authenticate, requireTeacher, (req, res) => {
  const { exam_id, type, content, options, correct_answer, points, sort_order } = req.body;

  if (!exam_id || !type || !content || !correct_answer) {
    return res.status(400).json({ error: '請填寫必要欄位' });
  }

  if (!['single', 'multiple', 'fill', 'truefalse'].includes(type)) {
    return res.status(400).json({ error: '題目類型無效' });
  }

  const exam = db.prepare('SELECT * FROM exams WHERE id = ?').get(exam_id);
  if (!exam) {
    return res.status(404).json({ error: '找不到此考卷' });
  }

  // 自動計算 sort_order
  const maxOrder = db.prepare(
    'SELECT MAX(sort_order) as max_order FROM questions WHERE exam_id = ?'
  ).get(exam_id);
  const nextOrder = sort_order ?? ((maxOrder.max_order || 0) + 1);

  const result = db.prepare(
    'INSERT INTO questions (exam_id, type, content, options, correct_answer, points, sort_order) VALUES (?, ?, ?, ?, ?, ?, ?)'
  ).run(exam_id, type, content, options ? JSON.stringify(options) : null, correct_answer, points || 1, nextOrder);

  const question = db.prepare('SELECT * FROM questions WHERE id = ?').get(result.lastInsertRowid);
  res.json(question);
});

// 更新題目（老師）
router.put('/:id', authenticate, requireTeacher, (req, res) => {
  const { type, content, options, correct_answer, points, sort_order } = req.body;

  const question = db.prepare('SELECT * FROM questions WHERE id = ?').get(req.params.id);
  if (!question) {
    return res.status(404).json({ error: '找不到此題目' });
  }

  db.prepare(
    'UPDATE questions SET type = ?, content = ?, options = ?, correct_answer = ?, points = ?, sort_order = ? WHERE id = ?'
  ).run(
    type ?? question.type,
    content ?? question.content,
    options ? JSON.stringify(options) : question.options,
    correct_answer ?? question.correct_answer,
    points ?? question.points,
    sort_order ?? question.sort_order,
    req.params.id
  );

  const updated = db.prepare('SELECT * FROM questions WHERE id = ?').get(req.params.id);
  res.json(updated);
});

// 刪除題目（老師）
router.delete('/:id', authenticate, requireTeacher, (req, res) => {
  const question = db.prepare('SELECT * FROM questions WHERE id = ?').get(req.params.id);
  if (!question) {
    return res.status(404).json({ error: '找不到此題目' });
  }

  db.prepare('DELETE FROM questions WHERE id = ?').run(req.params.id);
  res.json({ message: '已刪除題目' });
});

module.exports = router;
