import { useEffect, useState } from 'react'
import { navigate } from '../router.js'
import Logo from './Logo.jsx'
import BudgetWizard, { QUESTIONS, RoomReport, formatM2, formatMoney, roomFloorM2, roomTitle, roomTypeLabel } from './BudgetWizard.jsx'

const API_URL = import.meta.env.VITE_API_URL

export default function BudgetCalculatorPage() {
  useEffect(() => {
    window.scrollTo(0, 0)
  }, [])

  return (
    <div style={{ minHeight: '100vh' }}>
      <header style={{ background: 'var(--black)' }}>
        <div className="wrap" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: 78 }}>
          <a href="/" onClick={(e) => { e.preventDefault(); navigate('/') }} style={{ textDecoration: 'none' }}>
            <Logo variant="light" />
          </a>
          <button
            className="btn"
            style={{ background: 'transparent', border: '2px solid var(--white)', color: 'var(--white)' }}
            onClick={() => navigate('/')}
          >
            ← Volver al inicio
          </button>
        </div>
      </header>

      <div className="wrap" style={{ paddingTop: 56, paddingBottom: 80, maxWidth: 720 }}>
        <p className="eyebrow">Calculadora</p>
        <h1 style={{ fontSize: 'clamp(2rem, 5vw, 3rem)', marginTop: 16 }}>Presupuesto estimado</h1>

        <BudgetWizard
          endpoint="/api/budget/calculate"
          renderSummary={({ rooms, result, onBack }) => <BudgetSummary rooms={rooms} result={result} onBack={onBack} />}
        />
      </div>
    </div>
  )
}

function BudgetSummary({ rooms, result, onBack }) {
  const { total, roomTotals } = result
  const [showReport, setShowReport] = useState(false)
  const [sent, setSent] = useState(false)
  const [sending, setSending] = useState(false)
  const [error, setError] = useState('')
  const [form, setForm] = useState({ nombre: '', email: '', telefono: '' })

  const descripcion = rooms
    .map((r, i) => {
      const checked = QUESTIONS[r.type].filter((q) => r.answers[q.key]).map((q) => q.label)
      return `${roomTitle(r, i)} (${roomTypeLabel(r)}, ${r.largo}m x ${r.ancho}m = ${formatM2(roomFloorM2(r))}m²) — ${formatMoney(roomTotals[i])}: ${checked.length ? checked.join(', ') : 'sin ítems seleccionados'}`
    })
    .join('\n')

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setSending(true)
    const eventId = crypto.randomUUID()
    const customEventId = crypto.randomUUID()
    try {
      const res = await fetch(`${API_URL}/api/leads/renovation`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nombre: form.nombre,
          email: form.email,
          telefono: form.telefono,
          tipo: 'Presupuesto calculado en la web',
          descripcion: `Presupuesto estimado: ${formatMoney(total)}\n\n${descripcion}`,
          eventId,
          customEventId,
        }),
      })
      if (!res.ok) throw new Error('request failed')
      setSent(true)
      try {
        window.fbq?.('track', 'Lead', { content_name: 'calculadora' }, { eventID: eventId })
        window.fbq?.('trackCustom', 'LeadCalculadora', {}, { eventID: customEventId })
      } catch {
        // El tracking no debe afectar la confirmación al usuario: el envío ya se hizo.
      }
    } catch {
      setError('No pudimos enviar tus datos. Probá de nuevo o escribinos a fiflip.ba@gmail.com.')
    } finally {
      setSending(false)
    }
  }

  return (
    <div style={{ marginTop: 36 }}>
      {!sent && (
        <button className="btn btn-outline" onClick={onBack} style={{ marginBottom: 24 }}>
          ← Anterior
        </button>
      )}
      <div style={{ border: '2px solid var(--black)', padding: 28 }}>
        {rooms.map((r, i) => {
          const checked = QUESTIONS[r.type].filter((q) => r.answers[q.key])
          return (
            <div key={i} style={{ paddingBottom: 18, marginBottom: 18, borderBottom: '2px solid var(--gray-200)' }}>
              <strong>
                {roomTitle(r, i)} — {roomTypeLabel(r)} ({formatM2(roomFloorM2(r))}m²)
              </strong>
              {checked.length > 0 ? (
                <ul style={{ marginTop: 8, paddingLeft: 20, color: 'var(--gray-700)', fontSize: '0.9rem' }}>
                  {checked.map((q) => (
                    <li key={q.key}>{q.label}</li>
                  ))}
                </ul>
              ) : (
                <p style={{ marginTop: 8, color: 'var(--gray-400)', fontSize: '0.9rem' }}>Sin ítems seleccionados</p>
              )}
            </div>
          )
        })}
        <p style={{ fontSize: '0.85rem', color: 'var(--gray-400)' }}>Presupuesto estimado</p>
        <p style={{ fontSize: 'clamp(1.8rem, 5vw, 2.6rem)', fontFamily: "'Archivo Black', sans-serif", marginTop: 6 }}>
          {formatMoney(total)}
        </p>
        <p className="eyebrow" style={{ marginTop: 16 }}>
          Trabajo llave en mano
        </p>
        <p style={{ marginTop: 8, fontSize: '0.9rem', color: 'var(--gray-700)', lineHeight: 1.5 }}>
          Este valor incluye <strong>materiales, mano de obra</strong> y la{' '}
          <strong>coordinación y control completo de la obra</strong> de principio a fin — no
          contratás gremios por separado, nos ocupamos nosotros.
        </p>
        <p style={{ marginTop: 10, fontSize: '0.85rem', color: 'var(--gray-400)' }}>
          Este es un valor aproximado. El presupuesto final puede variar según relevamiento en el lugar.
        </p>

        <button
          type="button"
          className="btn btn-outline"
          style={{ marginTop: 22 }}
          aria-expanded={showReport}
          onClick={() => setShowReport((v) => !v)}
        >
          {showReport ? 'Ocultar informe' : 'Ver informe por habitación'}
        </button>
        {showReport && <RoomReport rooms={rooms} roomTotals={roomTotals} total={total} />}
      </div>

      <div style={{ marginTop: 36, border: '2px solid var(--black)', padding: 28, background: 'var(--gray-100)' }}>
        {sent ? (
          <div>
            <h3 style={{ fontSize: '1.4rem' }}>¡Listo!</h3>
            <p style={{ marginTop: 10, color: 'var(--gray-700)', lineHeight: 1.55 }}>
              Recibimos tu solicitud con el detalle del presupuesto. Te vamos a contactar para confirmarlo.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <h3 style={{ fontSize: '1.2rem' }}>¿Querés que te confirmemos este presupuesto?</h3>
            <div className="field">
              <label htmlFor="calc-nombre">Nombre</label>
              <input
                id="calc-nombre"
                required
                value={form.nombre}
                onChange={(e) => setForm((f) => ({ ...f, nombre: e.target.value }))}
              />
            </div>
            <div className="field">
              <label htmlFor="calc-email">Email</label>
              <input
                id="calc-email"
                type="email"
                required
                value={form.email}
                onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
              />
            </div>
            <div className="field">
              <label htmlFor="calc-telefono">Teléfono</label>
              <input
                id="calc-telefono"
                type="tel"
                required
                value={form.telefono}
                onChange={(e) => setForm((f) => ({ ...f, telefono: e.target.value }))}
              />
            </div>
            {error && <p style={{ color: '#c0392b', fontSize: '0.85rem' }}>{error}</p>}
            <button type="submit" className="btn" disabled={sending}>
              {sending ? 'Enviando…' : 'Quiero este presupuesto →'}
            </button>
          </form>
        )}
      </div>
    </div>
  )
}

