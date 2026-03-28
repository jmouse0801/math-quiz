import { Routes, Route, Navigate } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { getUser, clearAuth } from './api'
import Login from './pages/Login'
import Register from './pages/Register'
import StudentHome from './pages/StudentHome'
import TakeExam from './pages/TakeExam'
import ExamResult from './pages/ExamResult'
import MyResults from './pages/MyResults'
import AdminHome from './pages/AdminHome'
import AdminExamEdit from './pages/AdminExamEdit'
import AdminResults from './pages/AdminResults'
import Navbar from './components/Navbar'

function App() {
  const [user, setUser] = useState(getUser())

  const handleLogout = () => {
    clearAuth()
    setUser(null)
  }

  const handleLogin = (userData) => {
    setUser(userData)
  }

  if (!user) {
    return (
      <Routes>
        <Route path="/login" element={<Login onLogin={handleLogin} />} />
        <Route path="/register" element={<Register onLogin={handleLogin} />} />
        <Route path="*" element={<Navigate to="/login" />} />
      </Routes>
    )
  }

  if (user.role === 'teacher') {
    return (
      <>
        <Navbar user={user} onLogout={handleLogout} />
        <div className="container">
          <Routes>
            <Route path="/admin" element={<AdminHome />} />
            <Route path="/admin/exam/:id" element={<AdminExamEdit />} />
            <Route path="/admin/results" element={<AdminResults />} />
            <Route path="/admin/results/:id" element={<ExamResult />} />
            <Route path="*" element={<Navigate to="/admin" />} />
          </Routes>
        </div>
      </>
    )
  }

  return (
    <>
      <Navbar user={user} onLogout={handleLogout} />
      <div className="container">
        <Routes>
          <Route path="/" element={<StudentHome />} />
          <Route path="/exam/:id" element={<TakeExam />} />
          <Route path="/result/:id" element={<ExamResult />} />
          <Route path="/my-results" element={<MyResults />} />
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </div>
    </>
  )
}

export default App
