import { BrowserRouter, Routes, Route } from 'react-router'
import Home from './pages/Home'
import Login from './pages/Login'
import Register from './pages/Register'
import CustomerDashboard from './pages/CustomerDashboard'
import AdminDashboard from './pages/AdminDashboard'
import AdminQueueManagement from './pages/AdminQueueManagement'
import { useEffect } from 'react'
import socket from './socket'


function App() {

    useEffect(() => {
    const token=localStorage.getItem('token')
    if(!token)return
    socket.auth={token}
    socket.connect()
    socket.on('connect', () => {
      console.log('Socket connected:', socket.id)
    })
    socket.on('disconnect', (reason) => {
      console.log('Socket disconnected:', reason)
    })
    return () => {
      socket.off('connect')
      socket.off('disconnect')
      socket.disconnect()
    }
  }, [])

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/dashboard" element={<CustomerDashboard />}/>
        <Route path="/admin" element={<AdminDashboard />} />
        <Route path="/admin/queues/:sessionId" element={<AdminQueueManagement />}/>
      </Routes>
    </BrowserRouter>
  )
}

export default App