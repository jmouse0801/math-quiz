import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { api } from '../api'
import MathText from '../components/MathText'

const TYPE_LABELS = { single: '單選題', multiple: '多選題', fill: '填充題', truefalse: '是非題' }

function AdminExamEdit() {
  const { id } = useParams()
  const [exam, setExam] = useState(null)
  const [showAdd, setShowAdd] = useState(false)
  const [editingQuestion, setEditingQuestion] = useState(null)
  const [form, setForm] = useState({
    type: 'single',
    content: '',
    options: ['', '', '', ''],
    correct_answer: '',
    points: 1,
  })

  const fetchExam = async () => {
    try {
      const data = await api(`/exams/${id}`)
      setExam(data)
    } catch (err) {
      console.error(err)
    }
  }

  useEffect(() => { fetchExam() }, [id])

  const resetForm = () => {
    setForm({ type: 'single', content: '', options: ['', '', '', ''], correct_answer: '', points: 1 })
    setEditingQuestion(null)
    setShowAdd(false)
  }

  const handleOptionChange = (index, value) => {
    const newOptions = [...form.options]
    newOptions[index] = value
    setForm({ ...form, options: newOptions })
  }

  const addOption = () => {
    setForm({ ...form, options: [...form.options, ''] })
  }

  const removeOption = (index) => {
    if (form.options.length <= 2) return
    const newOptions = form.options.filter((_, i) => i !== index)
    setForm({ ...form, options: newOptions })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      const payload = {
        exam_id: parseInt(id),
        type: form.type,
        content: form.content,
        correct_answer: form.correct_answer,
        points: parseInt(form.points) || 1,
      }

      if (form.type !== 'fill') {
        payload.options = form.options.filter(o => o.trim())
      }

      if (editingQuestion) {
        await api(`/questions/${editingQuestion.id}`, {
          method: 'PUT',
          body: JSON.stringify(payload),
        })
      } else {
        await api('/questions', {
          method: 'POST',
          body: JSON.stringify(payload),
        })
      }
      resetForm()
      fetchExam()
    } catch (err) {
      alert(err.message)
    }
  }

  const startEdit = (q) => {
    let options = ['', '', '', '']
    try {
      if (q.options) options = JSON.parse(q.options)
    } catch {}
    setForm({
      type: q.type,
      content: q.content,
      options,
      correct_answer: q.correct_answer,
      points: q.points,
    })
    setEditingQuestion(q)
    setShowAdd(true)
  }

  const handleDelete = async (qId) => {
    if (!confirm('確定刪除此題目？')) return
    try {
      await api(`/questions/${qId}`, { method: 'DELETE' })
      fetchExam()
    } catch (err) {
      alert(err.message)
    }
  }

  if (!exam) return <div className="text-center mt-24">載入中...</div>

  return (
    <div>
      <div className="page-header">
        <div>
          <Link to="/admin" style={{ color: 'var(--gray-500)', textDecoration: 'none', fontSize: 14 }}>← 返回考卷列表</Link>
          <h1 style={{ marginTop: 4 }}>{exam.title}</h1>
        </div>
        <button className="btn btn-primary" onClick={() => { resetForm(); setShowAdd(true) }}>
          + 新增題目
        </button>
      </div>

      {showAdd && (
        <div className="modal-overlay" onClick={resetForm}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h2>{editingQuestion ? '編輯題目' : '新增題目'}</h2>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>題目類型</label>
                <select
                  className="form-control"
                  value={form.type}
                  onChange={(e) => setForm({ ...form, type: e.target.value, correct_answer: '' })}
                >
                  <option value="single">單選題</option>
                  <option value="multiple">多選題</option>
                  <option value="fill">填充題</option>
                  <option value="truefalse">是非題</option>
                </select>
              </div>

              <div className="form-group">
                <label>題目內容（支援 LaTeX：用 $...$ 包住公式）</label>
                <textarea
                  className="form-control"
                  value={form.content}
                  onChange={(e) => setForm({ ...form, content: e.target.value })}
                  placeholder="例：求 $x^2 + 2x + 1 = 0$ 的解"
                  required
                  rows={3}
                />
                {form.content && (
                  <div style={{ marginTop: 8, padding: '8px 12px', background: 'var(--gray-50)', borderRadius: 'var(--radius)', fontSize: 14 }}>
                    預覽：<MathText text={form.content} />
                  </div>
                )}
              </div>

              {form.type !== 'fill' && form.type !== 'truefalse' && (
                <div className="form-group">
                  <label>選項（支援 LaTeX）</label>
                  {form.options.map((opt, i) => (
                    <div key={i} style={{ display: 'flex', gap: 8, marginBottom: 6, alignItems: 'center' }}>
                      <span style={{ fontWeight: 600, minWidth: 24 }}>{String.fromCharCode(65 + i)}.</span>
                      <input
                        className="form-control"
                        value={opt}
                        onChange={(e) => handleOptionChange(i, e.target.value)}
                        placeholder={`選項 ${String.fromCharCode(65 + i)}`}
                      />
                      {form.options.length > 2 && (
                        <button type="button" className="btn btn-danger btn-sm" onClick={() => removeOption(i)}>×</button>
                      )}
                    </div>
                  ))}
                  <button type="button" className="btn btn-outline btn-sm" onClick={addOption}>+ 新增選項</button>
                </div>
              )}

              <div className="form-group">
                <label>
                  {form.type === 'single' && '正確答案（填選項代號，如 A）'}
                  {form.type === 'multiple' && '正確答案（多個選項用逗號分隔，如 A,C,D）'}
                  {form.type === 'fill' && '正確答案（多個可接受答案用 | 分隔，如 3|3.0）'}
                  {form.type === 'truefalse' && '正確答案'}
                </label>
                {form.type === 'truefalse' ? (
                  <select
                    className="form-control"
                    value={form.correct_answer}
                    onChange={(e) => setForm({ ...form, correct_answer: e.target.value })}
                    required
                  >
                    <option value="">請選擇</option>
                    <option value="O">O（正確）</option>
                    <option value="X">X（錯誤）</option>
                  </select>
                ) : (
                  <input
                    className="form-control"
                    value={form.correct_answer}
                    onChange={(e) => setForm({ ...form, correct_answer: e.target.value })}
                    placeholder={
                      form.type === 'single' ? 'A' :
                      form.type === 'multiple' ? 'A,C,D' : '3|3.0'
                    }
                    required
                  />
                )}
              </div>

              <div className="form-group">
                <label>配分</label>
                <input
                  className="form-control"
                  type="number"
                  min="1"
                  value={form.points}
                  onChange={(e) => setForm({ ...form, points: e.target.value })}
                />
              </div>

              <div className="modal-actions">
                <button type="button" className="btn btn-outline" onClick={resetForm}>取消</button>
                <button type="submit" className="btn btn-primary">{editingQuestion ? '儲存修改' : '新增題目'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {exam.questions && exam.questions.length > 0 ? (
        exam.questions.map((q, index) => {
          let options = []
          try { if (q.options) options = JSON.parse(q.options) } catch {}

          return (
            <div className="question-card" key={q.id}>
              <div className="question-header">
                <span className="question-number">第 {index + 1} 題</span>
                <span className={`q-type q-type-${q.type}`}>{TYPE_LABELS[q.type]}</span>
                <span style={{ fontSize: 13, color: 'var(--gray-500)' }}>{q.points} 分</span>
              </div>
              <div style={{ marginBottom: 12 }}>
                <MathText text={q.content} />
              </div>
              {options.length > 0 && (
                <div style={{ fontSize: 14, color: 'var(--gray-700)', marginBottom: 8 }}>
                  {options.map((opt, i) => (
                    <div key={i} style={{ padding: '2px 0' }}>
                      <strong>{String.fromCharCode(65 + i)}.</strong> <MathText text={opt} />
                    </div>
                  ))}
                </div>
              )}
              <div style={{ fontSize: 13, color: 'var(--success)', marginBottom: 12 }}>
                正確答案：{q.correct_answer}
              </div>
              <div className="flex gap-8">
                <button className="btn btn-outline btn-sm" onClick={() => startEdit(q)}>編輯</button>
                <button className="btn btn-danger btn-sm" onClick={() => handleDelete(q.id)}>刪除</button>
              </div>
            </div>
          )
        })
      ) : (
        <div className="empty-state">
          <h3>尚未新增任何題目</h3>
          <p>點擊「新增題目」開始出題</p>
        </div>
      )}
    </div>
  )
}

export default AdminExamEdit
