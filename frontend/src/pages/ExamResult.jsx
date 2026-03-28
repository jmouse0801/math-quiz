import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { api, getUser } from '../api'
import MathText from '../components/MathText'

const TYPE_LABELS = { single: '單選題', multiple: '多選題', fill: '填充題', truefalse: '是非題' }

function ExamResult() {
  const { id } = useParams()
  const [result, setResult] = useState(null)
  const user = getUser()

  useEffect(() => {
    const fetchResult = async () => {
      try {
        const data = await api(`/submissions/${id}`)
        setResult(data)
      } catch (err) {
        console.error(err)
      }
    }
    fetchResult()
  }, [id])

  if (!result) return <div className="text-center mt-24">載入中...</div>

  const percentage = result.total_points > 0
    ? Math.round((result.score / result.total_points) * 100)
    : 0

  return (
    <div>
      <div style={{ marginBottom: 16 }}>
        <Link
          to={user?.role === 'teacher' ? '/admin/results' : '/my-results'}
          style={{ color: 'var(--gray-500)', textDecoration: 'none', fontSize: 14 }}
        >
          ← 返回
        </Link>
      </div>

      <div className="card">
        <div className="score-display">
          <div className="score-number">{percentage}%</div>
          <div className="score-label">
            {result.score} / {result.total_points} 分
          </div>
          {result.student_name && (
            <div style={{ marginTop: 8, color: 'var(--gray-500)', fontSize: 14 }}>
              學生：{result.student_name} · {result.exam_title}
            </div>
          )}
          <div style={{ marginTop: 4, color: 'var(--gray-500)', fontSize: 13 }}>
            {new Date(result.submitted_at).toLocaleString('zh-TW')}
          </div>
        </div>
      </div>

      <h2 style={{ marginBottom: 16 }}>作答詳情</h2>

      {result.answers.map((a, index) => {
        let options = []
        try { if (a.question_options) options = JSON.parse(a.question_options) } catch {}

        return (
          <div className="question-card" key={a.id} style={{ borderLeft: `4px solid ${a.is_correct ? 'var(--success)' : 'var(--danger)'}` }}>
            <div className="question-header">
              <span className="question-number">第 {index + 1} 題</span>
              <span className={`q-type q-type-${a.question_type}`}>{TYPE_LABELS[a.question_type]}</span>
              <span style={{ fontSize: 13, color: 'var(--gray-500)' }}>{a.points} 分</span>
              {a.is_correct ? (
                <span className="badge badge-success">正確</span>
              ) : (
                <span className="badge badge-danger">錯誤</span>
              )}
            </div>
            <div style={{ marginBottom: 12, fontSize: 16 }}>
              <MathText text={a.question_content} />
            </div>

            {options.length > 0 && (
              <ul className="options-list">
                {options.map((opt, i) => {
                  const letter = String.fromCharCode(65 + i)
                  const studentAnswers = a.student_answer ? a.student_answer.split(',') : []
                  const correctAnswers = a.correct_answer ? a.correct_answer.split(',') : []
                  const isStudentAnswer = studentAnswers.includes(letter)
                  const isCorrectAnswer = correctAnswers.includes(letter)

                  let className = ''
                  if (isCorrectAnswer) className = 'correct'
                  if (isStudentAnswer && !isCorrectAnswer) className = 'wrong'

                  return (
                    <li key={i} className={className} style={{ cursor: 'default' }}>
                      <span style={{ fontWeight: 600 }}>{letter}.</span>
                      <MathText text={opt} />
                      {isCorrectAnswer && <span style={{ marginLeft: 'auto', fontSize: 12, color: 'var(--success)' }}>正確答案</span>}
                      {isStudentAnswer && !isCorrectAnswer && <span style={{ marginLeft: 'auto', fontSize: 12, color: 'var(--danger)' }}>你的答案</span>}
                    </li>
                  )
                })}
              </ul>
            )}

            {a.question_type === 'truefalse' && (
              <ul className="options-list">
                {['O', 'X'].map((opt) => {
                  const isStudentAnswer = a.student_answer === opt
                  const isCorrectAnswer = a.correct_answer === opt
                  let className = ''
                  if (isCorrectAnswer) className = 'correct'
                  if (isStudentAnswer && !isCorrectAnswer) className = 'wrong'
                  return (
                    <li key={opt} className={className} style={{ cursor: 'default' }}>
                      <span style={{ fontWeight: 600, fontSize: 18 }}>{opt}</span>
                      <span>{opt === 'O' ? '正確' : '錯誤'}</span>
                      {isCorrectAnswer && <span style={{ marginLeft: 'auto', fontSize: 12, color: 'var(--success)' }}>正確答案</span>}
                      {isStudentAnswer && !isCorrectAnswer && <span style={{ marginLeft: 'auto', fontSize: 12, color: 'var(--danger)' }}>你的答案</span>}
                    </li>
                  )
                })}
              </ul>
            )}

            {a.question_type === 'fill' && (
              <div style={{ fontSize: 14, marginTop: 8 }}>
                <div>你的答案：<strong style={{ color: a.is_correct ? 'var(--success)' : 'var(--danger)' }}>{a.student_answer || '（未作答）'}</strong></div>
                {!a.is_correct && <div>正確答案：<strong style={{ color: 'var(--success)' }}>{a.correct_answer}</strong></div>}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}

export default ExamResult
