import { useState } from 'react'

const API_URL = import.meta.env.VITE_API_URL

export default function AdminLogin({ onLogin }) {
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const res = await fetch(`${API_URL}/api/admin/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      })
      if (!res.ok) throw new Error('bad credentials')
      const { token } = await res.json()
      localStorage.setItem('fiflip_admin_token', token)
      onLogin(token)
    } catch {
      setError('Contraseña incorrecta.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'var(--black)',
        color: 'var(--white)',
        padding: 24,
      }}
    >
      <form onSubmit={handleSubmit} style={{ width: '100%', maxWidth: 360 }}>
        <h1 style={{ fontFamily: "'Archivo Black', sans-serif", fontSize: '1.6rem', marginBottom: 24 }}>
          FIFLIP ADMIN
        </h1>
        <div className="field">
          <label htmlFor="password" style={{ color: '#c9c9c9' }}>
            Contraseña
          </label>
          <input
            id="password"
            type="password"
            autoFocus
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            style={{ borderColor: '#4d4d4d', color: 'var(--white)' }}
          />
        </div>
        {error && <p style={{ color: '#ff8a7a', fontSize: '0.85rem', marginTop: 10 }}>{error}</p>}
        <button type="submit" className="btn btn-white" style={{ marginTop: 20, width: '100%' }} disabled={loading}>
          {loading ? 'Entrando…' : 'Entrar'}
        </button>
      </form>
    </div>
  )
}
