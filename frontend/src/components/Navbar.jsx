import { Link } from 'react-router-dom'

function Navbar({ user, onLogout }) {
  return (
    <nav className="navbar">
      <div className="navbar-inner">
        <Link to={user.role === 'teacher' ? '/admin' : '/'} className="navbar-brand">
          高中數學題庫
        </Link>
        <div className="navbar-links">
          {user.role === 'teacher' ? (
            <>
              <Link to="/admin">考卷管理</Link>
              <Link to="/admin/results">成績總覽</Link>
            </>
          ) : (
            <>
              <Link to="/">測驗列表</Link>
              <Link to="/my-results">我的成績</Link>
            </>
          )}
          <span className="navbar-user">{user.display_name}</span>
          <button onClick={onLogout} className="btn btn-outline btn-sm">登出</button>
        </div>
      </div>
    </nav>
  )
}

export default Navbar
