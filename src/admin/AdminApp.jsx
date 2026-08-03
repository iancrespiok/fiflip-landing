import { useState } from 'react'
import AdminLogin from './AdminLogin.jsx'
import AdminProjectsPage from './AdminProjectsPage.jsx'

export default function AdminApp() {
  const [token, setToken] = useState(() => localStorage.getItem('fiflip_admin_token'))

  if (!token) {
    return <AdminLogin onLogin={setToken} />
  }

  return <AdminProjectsPage token={token} onLogout={() => setToken(null)} />
}
