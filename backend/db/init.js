const Database = require('better-sqlite3');
const path = require('path');
const bcrypt = require('bcryptjs');

const DB_PATH = path.join(__dirname, '..', 'quiz.db');

function initDB() {
  const db = new Database(DB_PATH);

  // 啟用 WAL 模式提升效能
  db.pragma('journal_mode = WAL');
  db.pragma('foreign_keys = ON');

  // 建立使用者表
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      display_name TEXT NOT NULL,
      role TEXT NOT NULL CHECK(role IN ('teacher', 'student')),
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // 建立考卷表
  db.exec(`
    CREATE TABLE IF NOT EXISTS exams (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      description TEXT,
      created_by INTEGER NOT NULL,
      is_published INTEGER DEFAULT 0,
      time_limit INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (created_by) REFERENCES users(id)
    )
  `);

  // 建立題目表
  db.exec(`
    CREATE TABLE IF NOT EXISTS questions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      exam_id INTEGER NOT NULL,
      type TEXT NOT NULL CHECK(type IN ('single', 'multiple', 'fill', 'truefalse')),
      content TEXT NOT NULL,
      options TEXT,
      correct_answer TEXT NOT NULL,
      points INTEGER DEFAULT 1,
      sort_order INTEGER DEFAULT 0,
      FOREIGN KEY (exam_id) REFERENCES exams(id) ON DELETE CASCADE
    )
  `);

  // 建立測驗提交表
  db.exec(`
    CREATE TABLE IF NOT EXISTS submissions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      exam_id INTEGER NOT NULL,
      student_id INTEGER NOT NULL,
      score REAL,
      total_points INTEGER,
      submitted_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (exam_id) REFERENCES exams(id),
      FOREIGN KEY (student_id) REFERENCES users(id)
    )
  `);

  // 建立作答明細表
  db.exec(`
    CREATE TABLE IF NOT EXISTS answers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      submission_id INTEGER NOT NULL,
      question_id INTEGER NOT NULL,
      student_answer TEXT,
      is_correct INTEGER DEFAULT 0,
      FOREIGN KEY (submission_id) REFERENCES submissions(id) ON DELETE CASCADE,
      FOREIGN KEY (question_id) REFERENCES questions(id)
    )
  `);

  // 建立預設老師帳號
  const existingTeacher = db.prepare('SELECT id FROM users WHERE username = ?').get('teacher');
  if (!existingTeacher) {
    const hashedPassword = bcrypt.hashSync('teacher123', 10);
    db.prepare('INSERT INTO users (username, password, display_name, role) VALUES (?, ?, ?, ?)').run(
      'teacher', hashedPassword, '數學老師', 'teacher'
    );
    console.log('已建立預設老師帳號: teacher / teacher123');
  }

  return db;
}

const db = initDB();
module.exports = db;
