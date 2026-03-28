import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../api'

function MyResults() {
  const [submissions, setSubmissions] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchResults = async () => {
      try {
        const data = await api('/submissions/my')
        setSubmissions(data)
      } catch (err) {
        console.error(err)
      } finally {
        setLoading(false)
      }
    }
    fetchResults()
  }, [])

  if (loading) return <div className="text-center mt-24">載入中...</div>

  return (
    <div>
      <div className="page-header">
        <h1>我的成績</h1>
      </div>

      {submissions.length === 0 ? (
        <div className="empty-state">
          <h3>尚無測驗紀錄</h3>
          <p>完成測驗後，成績會顯示在這裡</p>
        </div>
      ) : (
        submissions.map((s) => {
          const pct = s.total_points > 0 ? Math.round((s.score / s.total_points) * 100) : 0
          return (
            <div className="card" key={s.id}>
              <div className="card-header">
                <h3>{s.exam_title}</h3>
                <span className={`badge ${pct >= 80 ? 'badge-success' : pct >= 60 ? 'badge-warning' : 'badge-danger'}`}>
                  {pct}%
                </span>
              </div>
              <div style={{ fontSize: 14, color: 'var(--gray-500)', marginBottom: 12 }}>
                得分：{s.score} / {s.total_points} · {new Date(s.submitted_at).toLocaleString('zh-TW')}
              </div>
              <Link to={`/result/${s.id}`} className="btn btn-outline btn-sm">查看詳情</Link>
            </div>
          )
        })
      )}
    </div>
  )
}

export default MyResults
