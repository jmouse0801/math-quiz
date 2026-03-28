import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../api'

function AdminHome() {
  const [exams, setExams] = useState([])
  const [showCreate, setShowCreate] = useState(false)
  const [newExam, setNewExam] = useState({ title: '', description: '' })
  const [loading, setLoading] = useState(true)

  const fetchExams = async () => {
    try {
      const data = await api('/exams')
      setExams(data)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchExams() }, [])

  const handleCreate = async (e) => {
    e.preventDefault()
    try {
      await api('/exams', {
        method: 'POST',
        body: JSON.stringify(newExam),
      })
      setNewExam({ title: '', description: '' })
      setShowCreate(false)
      fetchExams()
    } catch (err) {
      alert(err.message)
    }
  }

  const handleDelete = async (id) => {
    if (!confirm('確定要刪除此考卷？所有題目和成績都會被刪除。')) return
    try {
      await api(`/exams/${id}`, { method: 'DELETE' })
      fetchExams()
    } catch (err) {
      alert(err.message)
    }
  }

  const togglePublish = async (exam) => {
    try {
      await api(`/exams/${exam.id}`, {
        method: 'PUT',
        body: JSON.stringify({ is_published: exam.is_published ? 0 : 1 }),
      })
      fetchExams()
    } catch (err) {
      alert(err.message)
    }
  }

  if (loading) return <div className="text-center mt-24">載入中...</div>

  return (
    <div>
      <div className="page-header">
        <h1>考卷管理</h1>
        <button className="btn btn-primary" onClick={() => setShowCreate(true)}>
          + 建立考卷
        </button>
      </div>

      {showCreate && (
        <div className="modal-overlay" onClick={() => setShowCreate(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h2>建立新考卷</h2>
            <form onSubmit={handleCreate}>
              <div className="form-group">
                <label>考卷標題</label>
                <input
                  className="form-control"
                  value={newExam.title}
                  onChange={(e) => setNewExam({ ...newExam, title: e.target.value })}
                  placeholder="例：第一章 數與式 小考"
                  required
                />
              </div>
              <div className="form-group">
                <label>說明（選填）</label>
                <textarea
                  className="form-control"
                  value={newExam.description}
                  onChange={(e) => setNewExam({ ...newExam, description: e.target.value })}
                  placeholder="考試範圍、注意事項等"
                />
              </div>
              <div className="modal-actions">
                <button type="button" className="btn btn-outline" onClick={() => setShowCreate(false)}>取消</button>
                <button type="submit" className="btn btn-primary">建立</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {exams.length === 0 ? (
        <div className="empty-state">
          <h3>尚未建立任何考卷</h3>
          <p>點擊上方「建立考卷」開始出題</p>
        </div>
      ) : (
        exams.map((exam) => (
          <div className="card" key={exam.id}>
            <div className="card-header">
              <div>
                <h3>{exam.title}</h3>
                {exam.description && <p style={{ color: 'var(--gray-500)', fontSize: 14, marginTop: 4 }}>{exam.description}</p>}
              </div>
              <div className="flex gap-8">
                {exam.is_published ? (
                  <span className="badge badge-success">已發佈</span>
                ) : (
                  <span className="badge badge-warning">未發佈</span>
                )}
              </div>
            </div>
            <div style={{ fontSize: 14, color: 'var(--gray-500)', marginBottom: 12 }}>
              {exam.question_count} 題 · 建立於 {new Date(exam.created_at).toLocaleDateString('zh-TW')}
            </div>
            <div className="flex gap-8">
              <Link to={`/admin/exam/${exam.id}`} className="btn btn-primary btn-sm">編輯題目</Link>
              <button className="btn btn-outline btn-sm" onClick={() => togglePublish(exam)}>
                {exam.is_published ? '取消發佈' : '發佈'}
              </button>
              <button className="btn btn-danger btn-sm" onClick={() => handleDelete(exam.id)}>刪除</button>
            </div>
          </div>
        ))
      )}
    </div>
  )
}

export default AdminHome
