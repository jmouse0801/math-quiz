import { useState } from 'react'
import { Link } from 'react-router-dom'
import { api, setAuth } from '../api'

function Register({ onLogin }) {
  const [form, setForm] = useState({ username: '', password: '', display_name: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const data = await api('/auth/register', {
        method: 'POST',
        body: JSON.stringify(form),
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
        <h1>學生註冊</h1>
        <p className="subtitle">建立你的學生帳號</p>
        {error && <div className="error-msg">{error}</div>}
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>帳號</label>
            <input
              className="form-control"
              name="username"
              value={form.username}
              onChange={handleChange}
              placeholder="至少 3 個字元"
              required
            />
          </div>
          <div className="form-group">
            <label>姓名</label>
            <input
              className="form-control"
              name="display_name"
              value={form.display_name}
              onChange={handleChange}
              placeholder="你的真實姓名"
              required
            />
          </div>
          <div className="form-group">
            <label>密碼</label>
            <input
              className="form-control"
              type="password"
              name="password"
              value={form.password}
              onChange={handleChange}
              placeholder="至少 4 個字元"
              required
            />
          </div>
          <button className="btn btn-primary btn-lg" type="submit" disabled={loading}>
            {loading ? '註冊中...' : '註冊'}
          </button>
        </form>
        <div className="auth-footer">
          已有帳號？<Link to="/login">返回登入</Link>
        </div>
      </div>
    </div>
  )
}

export default Register
