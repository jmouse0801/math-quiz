import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../api'

function StudentHome() {
  const [exams, setExams] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
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
    fetchExams()
  }, [])

  if (loading) return <div className="text-center mt-24">載入中...</div>

  return (
    <div>
      <div className="page-header">
        <h1>可用測驗</h1>
      </div>

      {exams.length === 0 ? (
        <div className="empty-state">
          <h3>目前沒有可用的測驗</h3>
          <p>老師發佈測驗後會顯示在這裡</p>
        </div>
      ) : (
        exams.map((exam) => (
          <div className="card" key={exam.id}>
            <div className="card-header">
              <h3>{exam.title}</h3>
              <span className="badge badge-info">{exam.question_count} 題</span>
            </div>
            {exam.description && (
              <p style={{ color: 'var(--gray-500)', fontSize: 14, marginBottom: 12 }}>{exam.description}</p>
            )}
            <Link to={`/exam/${exam.id}`} className="btn btn-primary">開始測驗</Link>
          </div>
        ))
      )}
    </div>
  )
}

export default StudentHome
