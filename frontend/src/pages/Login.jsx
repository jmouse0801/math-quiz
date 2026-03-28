import { useState } from 'react'
import { Link } from 'react-router-dom'
import { api, setAuth } from '../api'

function Login({ onLogin }) {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const data = await api('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ username, password }),
      })
      setAuth(data.token, data.user)
      onLogin(data.user)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        <h1>高中數學題庫</h1>
        <p className="subtitle">登入你的帳號</p>
        {error && <div className="error-msg">{error}</div>}
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>帳號</label>
            <input
              className="form-control"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="請輸入帳號"
              required
            />
          </div>
          <div className="form-group">
            <label>密碼</label>
            <input
              className="form-control"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="請輸入密碼"
              required
            />
          </div>
          <button className="btn btn-primary btn-lg" type="submit" disabled={loading}>
            {loading ? '登入中...' : '登入'}
          </button>
        </form>
        <div className="auth-footer">
          還沒有帳號？<Link to="/register">註冊學生帳號</Link>
        </div>
      </div>
    </div>
  )
}

export default Login
