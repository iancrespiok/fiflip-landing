import { useEffect, useState } from 'react'

const API_URL = import.meta.env.VITE_API_URL

const UNIT_LABEL = {
  M2: 'por m²',
  FIXED: 'fijo',
  PERCENT: '%',
  COVERAGE_M2: 'm² por unidad',
}

const GROUP_ORDER = ['GENERAL', 'PINTURA', 'BAÑO', 'COCINA', 'HABITACIÓN', 'CONFIG']
const GROUP_LABEL = {
  GENERAL: 'General (compartido entre habitaciones)',
  PINTURA: 'Pintura',
  BAÑO: 'Baño',
  COCINA: 'Cocina',
  HABITACIÓN: 'Habitación',
  CONFIG: 'Configuración',
}

export default function AdminBudgetPricingPage({ token, onLogout }) {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    fetch(`${API_URL}/api/budget/pricing`)
      .then((res) => (res.ok ? res.json() : []))
      .then(setItems)
      .catch(() => setError('No pudimos cargar los precios.'))
      .finally(() => setLoading(false))
  }, [])

  const updatePrice = (key, value) => {
    setSaved(false)
    setItems((arr) => arr.map((i) => (i.key === key ? { ...i, price: value } : i)))
  }

  const handleSave = async (e) => {
    e.preventDefault()
    setError('')
    setSaving(true)
    try {
      const res = await fetch(`${API_URL}/api/admin/budget/pricing`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: items.map((i) => ({ key: i.key, price: Number(i.price) || 0 })),
        }),
      })
      if (res.status === 401) {
        onLogout()
        return
      }
      if (!res.ok) throw new Error('save failed')
      setSaved(true)
    } catch {
      setError('No pudimos guardar los precios. Probá de nuevo.')
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <p style={{ color: 'var(--gray-400)' }}>Cargando…</p>

  const groups = GROUP_ORDER.filter((g) => items.some((i) => i.group === g))

  return (
    <form onSubmit={handleSave} style={{ background: 'var(--white)', border: '2px solid var(--black)', padding: 28 }}>
      <h2 style={{ fontSize: '1.1rem', marginBottom: 8 }}>Precios de la calculadora de presupuesto</h2>
      <p style={{ color: 'var(--gray-700)', fontSize: '0.9rem', marginBottom: 24 }}>
        Estos valores se usan para calcular el presupuesto aproximado en{' '}
        <a href="/presupuesto" target="_blank" rel="noreferrer">
          /presupuesto
        </a>
        . El margen de ganancia se aplica sobre el total de todos los ítems.
      </p>

      {groups.map((group) => (
        <div key={group} style={{ marginBottom: 28 }}>
          <h3 style={{ fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 12 }}>
            {GROUP_LABEL[group] || group}
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {items
              .filter((i) => i.group === group)
              .map((i) => (
                <div key={i.key} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <label style={{ flex: 1, fontSize: '0.9rem' }}>{i.label}</label>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, width: 220 }}>
                    <span style={{ fontSize: '0.85rem', color: 'var(--gray-700)' }}>
                      {i.unit === 'PERCENT' || i.unit === 'COVERAGE_M2' ? '' : '$'}
                    </span>
                    <input
                      type="number"
                      step="0.01"
                      value={i.price}
                      onChange={(e) => updatePrice(i.key, e.target.value)}
                      style={{ flex: 1 }}
                    />
                    <span style={{ fontSize: '0.75rem', color: 'var(--gray-400)', width: 50 }}>
                      {UNIT_LABEL[i.unit]}
                    </span>
                  </div>
                </div>
              ))}
          </div>
        </div>
      ))}

      {error && <p style={{ color: '#c0392b', fontSize: '0.85rem', marginBottom: 16 }}>{error}</p>}
      {saved && <p style={{ color: '#2e7d32', fontSize: '0.85rem', marginBottom: 16 }}>Precios guardados.</p>}

      <button type="submit" className="btn" disabled={saving}>
        {saving ? 'Guardando…' : 'Guardar precios'}
      </button>
    </form>
  )
}
