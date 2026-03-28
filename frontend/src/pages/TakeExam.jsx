import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { api } from '../api'
import MathText from '../components/MathText'

const TYPE_LABELS = { single: '單選題', multiple: '多選題', fill: '填充題', truefalse: '是非題' }

function TakeExam() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [exam, setExam] = useState(null)
  const [answers, setAnswers] = useState({})
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    const fetchExam = async () => {
      try {
        const data = await api(`/exams/${id}`)
        setExam(data)
      } catch (err) {
        alert(err.message)
        navigate('/')
      }
    }
    fetchExam()
  }, [id])

  const handleSingleSelect = (questionId, option) => {
    setAnswers({ ...answers, [questionId]: option })
  }

  const handleMultipleSelect = (questionId, option) => {
    const current = answers[questionId] ? answers[questionId].split(',').filter(Boolean) : []
    let updated
    if (current.includes(option)) {
      updated = current.filter(o => o !== option)
    } else {
      updated = [...current, option]
    }
    setAnswers({ ...answers, [questionId]: updated.sort().join(',') })
  }

  const handleFillChange = (questionId, value) => {
    setAnswers({ ...answers, [questionId]: value })
  }

  const handleSubmit = async () => {
    if (!exam) return

    const unanswered = exam.questions.filter(q => !answers[q.id] || !answers[q.id].trim())
    if (unanswered.length > 0) {
      if (!confirm(`你還有 ${unanswered.length} 題未作答，確定要交卷嗎？`)) return
    } else {
      if (!confirm('確定要交卷嗎？')) return
    }

    setSubmitting(true)
    try {
      const payload = {
        exam_id: parseInt(id),
        answers: exam.questions.map(q => ({
          question_id: q.id,
          answer: answers[q.id] || '',
        }))
      }
      const result = await api('/submissions', {
        method: 'POST',
        body: JSON.stringify(payload),
      })
      navigate(`/result/${result.submission_id}`)
    } catch (err) {
      alert(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  if (!exam) return <div className="text-center mt-24">載入中...</div>

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>{exam.title}</h1>
          {exam.description && <p style={{ color: 'var(--gray-500)', fontSize: 14, marginTop: 4 }}>{exam.description}</p>}
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: 14, color: 'var(--gray-500)' }}>
            已作答 {Object.keys(answers).filter(k => answers[k] && answers[k].trim()).length} / {exam.questions.length} 題
          </div>
        </div>
      </div>

      {exam.questions.map((q, index) => {
        let options = []
        try { if (q.options) options = JSON.parse(q.options) } catch {}

        return (
          <div className="question-card" key={q.id}>
            <div className="question-header">
              <span className="question-number">第 {index + 1} 題</span>
              <span className={`q-type q-type-${q.type}`}>{TYPE_LABELS[q.type]}</span>
              <span style={{ fontSize: 13, color: 'var(--gray-500)' }}>{q.points} 分</span>
            </div>
            <div style={{ marginBottom: 16, fontSize: 16 }}>
              <MathText text={q.content} />
            </div>

            {q.type === 'single' && (
              <ul className="options-list">
                {options.map((opt, i) => {
                  const letter = String.fromCharCode(65 + i)
                  const isSelected = answers[q.id] === letter
                  return (
                    <li
                      key={i}
                      className={isSelected ? 'selected' : ''}
                      onClick={() => handleSingleSelect(q.id, letter)}
                    >
                      <span style={{ fontWeight: 600 }}>{letter}.</span>
                      <MathText text={opt} />
                    </li>
                  )
                })}
              </ul>
            )}

            {q.type === 'multiple' && (
              <ul className="options-list">
                {options.map((opt, i) => {
                  const letter = String.fromCharCode(65 + i)
                  const selected = answers[q.id] ? answers[q.id].split(',') : []
                  const isSelected = selected.includes(letter)
                  return (
                    <li
                      key={i}
                      className={isSelected ? 'selected' : ''}
                      onClick={() => handleMultipleSelect(q.id, letter)}
                    >
                      <input
                        type="checkbox"
                        className="option-checkbox"
                        checked={isSelected}
                        readOnly
                      />
                      <span style={{ fontWeight: 600 }}>{letter}.</span>
                      <MathText text={opt} />
                    </li>
                  )
                })}
              </ul>
            )}

            {q.type === 'truefalse' && (
              <ul className="options-list">
                {['O', 'X'].map((opt) => {
                  const isSelected = answers[q.id] === opt
                  return (
                    <li
                      key={opt}
                      className={isSelected ? 'selected' : ''}
                      onClick={() => handleSingleSelect(q.id, opt)}
                    >
                      <span style={{ fontWeight: 600, fontSize: 18 }}>{opt}</span>
                      <span>{opt === 'O' ? '正確' : '錯誤'}</span>
                    </li>
                  )
                })}
              </ul>
            )}

            {q.type === 'fill' && (
              <div style={{ marginTop: 8 }}>
                <input
                  className="form-control"
                  placeholder="請輸入答案"
                  value={answers[q.id] || ''}
                  onChange={(e) => handleFillChange(q.id, e.target.value)}
                  style={{ maxWidth: 300 }}
                />
              </div>
            )}
          </div>
        )
      })}

      <div className="text-center mt-24" style={{ marginBottom: 40 }}>
        <button
          className="btn btn-primary btn-lg"
          onClick={handleSubmit}
          disabled={submitting}
        >
          {submitting ? '交卷中...' : '交卷'}
        </button>
      </div>
    </div>
  )
}

export default TakeExam
