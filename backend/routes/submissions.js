const express = require('express');
const db = require('../db/init');
const { authenticate, requireTeacher } = require('../middleware/auth');

const router = express.Router();

// 提交測驗答案（學生）
router.post('/', authenticate, (req, res) => {
  const { exam_id, answers } = req.body;

  if (!exam_id || !answers || !Array.isArray(answers)) {
    return res.status(400).json({ error: '請提供考卷 ID 及答案' });
  }

  const exam = db.prepare('SELECT * FROM exams WHERE id = ? AND is_published = 1').get(exam_id);
  if (!exam) {
    return res.status(404).json({ error: '找不到此考卷或尚未發佈' });
  }

  const questions = db.prepare('SELECT * FROM questions WHERE exam_id = ?').all(exam_id);
  const totalPoints = questions.reduce((sum, q) => sum + q.points, 0);

  let score = 0;
  const graded = [];

  for (const ans of answers) {
    const question = questions.find(q => q.id === ans.question_id);
    if (!question) continue;

    let isCorrect = false;
    const studentAnswer = (ans.answer || '').trim();

    switch (question.type) {
      case 'single':
      case 'truefalse':
        isCorrect = studentAnswer === question.correct_answer;
        break;
      case 'multiple': {
        // 多選：學生答案和正確答案都排序後比較
        const studentChoices = studentAnswer.split(',').map(s => s.trim()).sort().join(',');
        const correctChoices = question.correct_answer.split(',').map(s => s.trim()).sort().join(',');
        isCorrect = studentChoices === correctChoices;
        break;
      }
      case 'fill': {
        // 填充：去除空白後比較，支援多個可接受答案（用 | 分隔）
        const acceptableAnswers = question.correct_answer.split('|').map(a => a.trim());
        isCorrect = acceptableAnswers.includes(studentAnswer);
        break;
      }
    }

    if (isCorrect) {
      score += question.points;
    }

    graded.push({
      question_id: question.id,
      student_answer: studentAnswer,
      is_correct: isCorrect ? 1 : 0
    });
  }

  // 儲存提交紀錄
  const submission = db.prepare(
    'INSERT INTO submissions (exam_id, student_id, score, total_points) VALUES (?, ?, ?, ?)'
  ).run(exam_id, req.user.id, score, totalPoints);

  const insertAnswer = db.prepare(
    'INSERT INTO answers (submission_id, question_id, student_answer, is_correct) VALUES (?, ?, ?, ?)'
  );

  const insertMany = db.transaction((items) => {
    for (const item of items) {
      insertAnswer.run(submission.lastInsertRowid, item.question_id, item.student_answer, item.is_correct);
    }
  });

  insertMany(graded);

  res.json({
    submission_id: submission.lastInsertRowid,
    score,
    total_points: totalPoints,
    percentage: totalPoints > 0 ? Math.round((score / totalPoints) * 100) : 0,
    details: graded
  });
});

// 取得學生自己的測驗紀錄
router.get('/my', authenticate, (req, res) => {
  const submissions = db.prepare(`
    SELECT s.*, e.title as exam_title
    FROM submissions s
    JOIN exams e ON s.exam_id = e.id
    WHERE s.student_id = ?
    ORDER BY s.submitted_at DESC
  `).all(req.user.id);

  res.json(submissions);
});

// 取得單一提交的詳細結果
router.get('/:id', authenticate, (req, res) => {
  const submission = db.prepare(`
    SELECT s.*, e.title as exam_title, u.display_name as student_name
    FROM submissions s
    JOIN exams e ON s.exam_id = e.id
    JOIN users u ON s.student_id = u.id
    WHERE s.id = ?
  `).get(req.params.id);

  if (!submission) {
    return res.status(404).json({ error: '找不到此紀錄' });
  }

  // 學生只能看自己的紀錄
  if (req.user.role === 'student' && submission.student_id !== req.user.id) {
    return res.status(403).json({ error: '無權查看此紀錄' });
  }

  const answers = db.prepare(`
    SELECT a.*, q.content as question_content, q.type as question_type,
           q.options as question_options, q.correct_answer, q.points
    FROM answers a
    JOIN questions q ON a.question_id = q.id
    WHERE a.submission_id = ?
    ORDER BY q.sort_order
  `).all(req.params.id);

  res.json({ ...submission, answers });
});

// 老師查看所有測驗結果
router.get('/admin/all', authenticate, requireTeacher, (req, res) => {
  const submissions = db.prepare(`
    SELECT s.*, e.title as exam_title, u.display_name as student_name, u.username
    FROM submissions s
    JOIN exams e ON s.exam_id = e.id
    JOIN users u ON s.student_id = u.id
    ORDER BY s.submitted_at DESC
  `).all();

  res.json(submissions);
});

// 老師查看某考卷的統計
router.get('/admin/exam/:examId', authenticate, requireTeacher, (req, res) => {
  const submissions = db.prepare(`
    SELECT s.*, u.display_name as student_name, u.username
    FROM submissions s
    JOIN users u ON s.student_id = u.id
    WHERE s.exam_id = ?
    ORDER BY s.submitted_at DESC
  `).all(req.params.examId);

  const stats = {
    total_submissions: submissions.length,
    average_score: 0,
    highest_score: 0,
    lowest_score: 0
  };

  if (submissions.length > 0) {
    const percentages = submissions.map(s => s.total_points > 0 ? (s.score / s.total_points) * 100 : 0);
    stats.average_score = Math.round(percentages.reduce((a, b) => a + b, 0) / percentages.length);
    stats.highest_score = Math.round(Math.max(...percentages));
    stats.lowest_score = Math.round(Math.min(...percentages));
  }

  res.json({ submissions, stats });
});

module.exports = router;
