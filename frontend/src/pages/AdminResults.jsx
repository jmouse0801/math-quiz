import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../api'

function AdminResults() {
  const [submissions, setSubmissions] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchResults = async () => {
      try {
        const data = await api('/submissions/admin/all')
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

  // 統計資料
  const totalStudents = new Set(submissions.map(s => s.student_id)).size
  const totalSubmissions = submissions.length
  const avgScore = submissions.length > 0
    ? Math.round(submissions.reduce((sum, s) => sum + (s.total_points > 0 ? (s.score / s.total_points) * 100 : 0), 0) / submissions.length)
    : 0

  return (
    <div>
      <div className="page-header">
        <h1>成績總覽</h1>
      </div>

      <div className="stat-grid">
        <div className="stat-card">
          <div className="stat-value">{totalStudents}</div>
          <div className="stat-label">參與學生數</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{totalSubmissions}</div>
          <div className="stat-label">總提交次數</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{avgScore}%</div>
          <div className="stat-label">平均得分率</div>
        </div>
      </div>

      {submissions.length === 0 ? (
        <div className="empty-state">
          <h3>尚無測驗紀錄</h3>
          <p>學生完成測驗後，成績會顯示在這裡</p>
        </div>
      ) : (
        <div className="card">
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>學生</th>
                  <th>考卷</th>
                  <th>得分</th>
                  <th>得分率</th>
                  <th>提交時間</th>
                  <th>操作</th>
                </tr>
              </thead>
              <tbody>
                {submissions.map((s) => {
                  const pct = s.total_points > 0 ? Math.round((s.score / s.total_points) * 100) : 0
                  return (
                    <tr key={s.id}>
                      <td><strong>{s.student_name}</strong><br/><span style={{fontSize:12,color:'var(--gray-500)'}}>@{s.username}</span></td>
                      <td>{s.exam_title}</td>
                      <td>{s.score} / {s.total_points}</td>
                      <td>
                        <span className={`badge ${pct >= 80 ? 'badge-success' : pct >= 60 ? 'badge-warning' : 'badge-danger'}`}>
                          {pct}%
                        </span>
                      </td>
                      <td>{new Date(s.submitted_at).toLocaleString('zh-TW')}</td>
                      <td>
                        <Link to={`/admin/results/${s.id}`} className="btn btn-outline btn-sm">查看詳情</Link>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}

export default AdminResults
