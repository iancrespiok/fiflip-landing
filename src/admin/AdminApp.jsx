import { useState } from 'react'
import AdminLogin from './AdminLogin.jsx'
import AdminHeader from './AdminHeader.jsx'
import AdminProjectsPage from './AdminProjectsPage.jsx'
import AdminBudgetPricingPage from './AdminBudgetPricingPage.jsx'

export default function AdminApp() {
  const [token, setToken] = useState(() => localStorage.getItem('fiflip_admin_token'))
  const [tab, setTab] = useState('projects')

  if (!token) {
    return <AdminLogin onLogin={setToken} />
  }

  const onLogout = () => {
    localStorage.removeItem('fiflip_admin_token')
    setToken(null)
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--gray-100)', padding: '40px 24px' }}>
      <div style={{ maxWidth: 900, margin: '0 auto' }}>
        <AdminHeader tab={tab} onTabChange={setTab} onLogout={onLogout} />
        {tab === 'projects' ? (
          <AdminProjectsPage token={token} onLogout={onLogout} />
        ) : (
          <AdminBudgetPricingPage token={token} onLogout={onLogout} />
        )}
      </div>
    </div>
  )
}
