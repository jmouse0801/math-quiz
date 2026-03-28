const express = require('express');
const db = require('../db/init');
const { authenticate, requireTeacher } = require('../middleware/auth');

const router = express.Router();

// 取得所有考卷（老師看全部，學生只看已發佈的）
router.get('/', authenticate, (req, res) => {
  let exams;
  if (req.user.role === 'teacher') {
    exams = db.prepare(`
      SELECT e.*, u.display_name as creator_name,
        (SELECT COUNT(*) FROM questions WHERE exam_id = e.id) as question_count
      FROM exams e
      JOIN users u ON e.created_by = u.id
      ORDER BY e.created_at DESC
    `).all();
  } else {
    exams = db.prepare(`
      SELECT e.*, u.display_name as creator_name,
        (SELECT COUNT(*) FROM questions WHERE exam_id = e.id) as question_count
      FROM exams e
      JOIN users u ON e.created_by = u.id
      WHERE e.is_published = 1
      ORDER BY e.created_at DESC
    `).all();
  }
  res.json(exams);
});

// 取得單一考卷（含題目）
router.get('/:id', authenticate, (req, res) => {
  const exam = db.prepare('SELECT * FROM exams WHERE id = ?').get(req.params.id);
  if (!exam) {
    return res.status(404).json({ error: '找不到此考卷' });
  }

  if (req.user.role !== 'teacher' && !exam.is_published) {
    return res.status(403).json({ error: '此考卷尚未發佈' });
  }

  let questions = db.prepare(
    'SELECT * FROM questions WHERE exam_id = ? ORDER BY sort_order'
  ).all(req.params.id);

  // 學生不能看到正確答案
  if (req.user.role === 'student') {
    questions = questions.map(q => {
      const { correct_answer, ...rest } = q;
      return rest;
    });
  }

  res.json({ ...exam, questions });
});

// 建立考卷（老師）
router.post('/', authenticate, requireTeacher, (req, res) => {
  const { title, description, time_limit } = req.body;

  if (!title) {
    return res.status(400).json({ error: '請輸入考卷標題' });
  }

  const result = db.prepare(
    'INSERT INTO exams (title, description, created_by, time_limit) VALUES (?, ?, ?, ?)'
  ).run(title, description || '', req.user.id, time_limit || 0);

  const exam = db.prepare('SELECT * FROM exams WHERE id = ?').get(result.lastInsertRowid);
  res.json(exam);
});

// 更新考卷（老師）
router.put('/:id', authenticate, requireTeacher, (req, res) => {
  const { title, description, is_published, time_limit } = req.body;

  const exam = db.prepare('SELECT * FROM exams WHERE id = ?').get(req.params.id);
  if (!exam) {
    return res.status(404).json({ error: '找不到此考卷' });
  }

  db.prepare(
    'UPDATE exams SET title = ?, description = ?, is_published = ?, time_limit = ? WHERE id = ?'
  ).run(
    title ?? exam.title,
    description ?? exam.description,
    is_published ?? exam.is_published,
    time_limit ?? exam.time_limit,
    req.params.id
  );

  const updated = db.prepare('SELECT * FROM exams WHERE id = ?').get(req.params.id);
  res.json(updated);
});

// 刪除考卷（老師）
router.delete('/:id', authenticate, requireTeacher, (req, res) => {
  const exam = db.prepare('SELECT * FROM exams WHERE id = ?').get(req.params.id);
  if (!exam) {
    return res.status(404).json({ error: '找不到此考卷' });
  }

  db.prepare('DELETE FROM exams WHERE id = ?').run(req.params.id);
  res.json({ message: '已刪除考卷' });
});

module.exports = router;
