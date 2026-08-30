import { useEffect, useState } from 'react'
import { navigate } from '../router.js'
import Logo from './Logo.jsx'

const API_URL = import.meta.env.VITE_API_URL

const ROOM_TYPES = [
  { key: 'BANO', label: 'Baño' },
  { key: 'COCINA', label: 'Cocina' },
  { key: 'HABITACION', label: 'Habitación' },
]

const QUESTIONS = {
  BANO: [
    { key: 'sanitarios', label: 'Cambiar sanitarios', priceKey: 'sanitary_fixed' },
    { key: 'techo', label: 'Bajar el techo con placas de yeso y luces dicroicas', priceKey: 'ceiling_gypsum_m2', perM2: true },
    { key: 'revestimientos', label: 'Cambiar los revestimientos', priceKey: 'wall_covering_m2', perM2: true },
    { key: 'ducha', label: 'Cambiar bañadera por ducha con mampara de vidrio', priceKey: 'shower_glass_fixed' },
    { key: 'enchufes', label: 'Cambiar enchufes', priceKey: 'outlets_fixed' },
    { key: 'vanitory', label: 'Cambiar vanitory con espejo nuevo', priceKey: 'vanity_mirror_fixed' },
    { key: 'abertura', label: 'Cambiar abertura (si tiene)', priceKey: 'door_window_fixed' },
  ],
  COCINA: [
    { key: 'ampliar', label: 'Ampliar el espacio actual', priceKey: 'kitchen_expand_fixed' },
    { key: 'muebles', label: 'Cambiar muebles', priceKey: 'kitchen_furniture_fixed' },
    { key: 'revestimientos', label: 'Cambiar revestimientos', priceKey: 'wall_covering_m2', perM2: true },
    { key: 'griferias', label: 'Cambiar griferías', priceKey: 'faucet_fixed' },
    { key: 'mesadas', label: 'Cambiar mesadas', priceKey: 'countertop_fixed' },
    { key: 'enchufes', label: 'Cambiar enchufes', priceKey: 'outlets_fixed' },
    { key: 'techo', label: 'Bajar el techo con placas de yeso y luces dicroicas', priceKey: 'ceiling_gypsum_m2', perM2: true },
    { key: 'pintar', label: 'Pintar', priceKey: 'paint_m2', perM2: true },
    { key: 'abertura', label: 'Cambiar abertura (si tiene)', priceKey: 'door_window_fixed' },
    { key: 'aire', label: 'Colocar aire acondicionado', priceKey: 'ac_fixed' },
  ],
  HABITACION: [
    { key: 'pintar', label: 'Pintar', priceKey: 'paint_m2', perM2: true },
    { key: 'pisos', label: 'Cambiar pisos', priceKey: 'floor_m2', perM2: true },
    { key: 'placar', label: 'Si tiene placar, cambiar las puertas', priceKey: 'closet_doors_fixed' },
    { key: 'luminaria', label: 'Cambiar luminaria', priceKey: 'lighting_fixed' },
    { key: 'aire', label: 'Colocar aire acondicionado', priceKey: 'ac_fixed' },
    { key: 'abertura', label: 'Cambiar abertura (si tiene)', priceKey: 'door_window_fixed' },
  ],
}

function emptyRoom() {
  return { type: null, m2: '', answers: {} }
}

function roomSubtotal(room, priceMap) {
  const questions = QUESTIONS[room.type] || []
  const m2 = Number(room.m2) || 0
  return questions.reduce((sum, q) => {
    if (!room.answers[q.key]) return sum
    const unitPrice = priceMap[q.priceKey] || 0
    return sum + (q.perM2 ? unitPrice * m2 : unitPrice)
  }, 0)
}

function formatMoney(n) {
  return '$' + Math.round(n).toLocaleString('es-AR')
}

export default function BudgetCalculatorPage() {
  const [prices, setPrices] = useState(null)
  const [step, setStep] = useState(0) // 0 = cuántas habitaciones, 1..N = cada habitación, N+1 = resumen
  const [roomCount, setRoomCount] = useState(1)
  const [rooms, setRooms] = useState([emptyRoom()])

  useEffect(() => {
    window.scrollTo(0, 0)
    fetch(`${API_URL}/api/budget/pricing`)
      .then((res) => (res.ok ? res.json() : []))
      .then((items) => {
        const map = {}
        items.forEach((i) => (map[i.key] = i.price))
        setPrices(map)
      })
      .catch(() => setPrices({}))
  }, [])

  const updateRoom = (index, patch) => {
    setRooms((rs) => rs.map((r, i) => (i === index ? { ...r, ...patch } : r)))
  }

  const startRooms = () => {
    const count = Math.min(8, Math.max(1, Number(roomCount) || 1))
    setRoomCount(count)
    setRooms(Array.from({ length: count }, () => emptyRoom()))
    setStep(1)
  }

  const currentRoom = step >= 1 && step <= roomCount ? rooms[step - 1] : null
  const isLastRoom = step === roomCount

  const canAdvance = currentRoom && currentRoom.type && Number(currentRoom.m2) > 0

  const total = prices ? rooms.reduce((sum, r) => sum + roomSubtotal(r, prices), 0) : 0
  const margin = prices?.margin_percent || 0
  const finalTotal = total * (1 + margin / 100)

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

        {!prices ? (
          <p style={{ marginTop: 30, color: 'var(--gray-400)' }}>Cargando…</p>
        ) : step === 0 ? (
          <div style={{ marginTop: 36 }}>
            <p style={{ color: 'var(--gray-700)', fontSize: '1.05rem', lineHeight: 1.55 }}>
              ¿Cuántas habitaciones vas a refaccionar?
            </p>
            <div className="field" style={{ marginTop: 20, maxWidth: 160 }}>
              <input
                type="number"
                min="1"
                max="8"
                value={roomCount}
                onChange={(e) => setRoomCount(e.target.value)}
              />
            </div>
            <button className="btn" style={{ marginTop: 28 }} onClick={startRooms}>
              Empezar →
            </button>
          </div>
        ) : currentRoom ? (
          <div style={{ marginTop: 36 }}>
            <p className="eyebrow">
              Habitación {step} de {roomCount}
            </p>

            <div style={{ marginTop: 20 }}>
              <label style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                Tipo de espacio
              </label>
              <div style={{ display: 'flex', gap: 10, marginTop: 10, flexWrap: 'wrap' }}>
                {ROOM_TYPES.map((rt) => (
                  <button
                    key={rt.key}
                    type="button"
                    onClick={() => updateRoom(step - 1, { type: rt.key, answers: {} })}
                    className={rt.key === currentRoom.type ? 'btn' : 'btn btn-outline'}
                  >
                    {rt.label}
                  </button>
                ))}
              </div>
            </div>

            {currentRoom.type && (
              <>
                <div className="field" style={{ marginTop: 24, maxWidth: 220 }}>
                  <label>m² aproximados</label>
                  <input
                    type="number"
                    min="0"
                    value={currentRoom.m2}
                    onChange={(e) => updateRoom(step - 1, { m2: e.target.value })}
                    placeholder="Ej: 6"
                  />
                </div>

                <div style={{ marginTop: 28, display: 'flex', flexDirection: 'column', gap: 14 }}>
                  {QUESTIONS[currentRoom.type].map((q) => (
                    <label key={q.key} style={{ display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer' }}>
                      <input
                        type="checkbox"
                        checked={!!currentRoom.answers[q.key]}
                        onChange={(e) =>
                          updateRoom(step - 1, { answers: { ...currentRoom.answers, [q.key]: e.target.checked } })
                        }
                        style={{ width: 20, height: 20 }}
                      />
                      <span>{q.label}</span>
                    </label>
                  ))}
                </div>
              </>
            )}

            <div style={{ display: 'flex', gap: 12, marginTop: 36 }}>
              {step > 1 && (
                <button className="btn btn-outline" onClick={() => setStep((s) => s - 1)}>
                  ← Anterior
                </button>
              )}
              <button className="btn" disabled={!canAdvance} onClick={() => setStep((s) => s + 1)}>
                {isLastRoom ? 'Ver presupuesto →' : 'Siguiente habitación →'}
              </button>
            </div>
          </div>
        ) : (
          <BudgetSummary rooms={rooms} prices={prices} total={total} finalTotal={finalTotal} />
        )}
      </div>
    </div>
  )
}

function BudgetSummary({ rooms, prices, total, finalTotal }) {
  const [sent, setSent] = useState(false)
  const [sending, setSending] = useState(false)
  const [error, setError] = useState('')
  const [form, setForm] = useState({ nombre: '', email: '', telefono: '' })

  const descripcion = rooms
    .map((r, i) => {
      const label = ROOM_TYPES.find((t) => t.key === r.type)?.label || r.type
      const checked = QUESTIONS[r.type].filter((q) => r.answers[q.key]).map((q) => q.label)
      return `Habitación ${i + 1} (${label}, ${r.m2}m²): ${checked.length ? checked.join(', ') : 'sin ítems seleccionados'}`
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
          descripcion: `Presupuesto estimado: ${formatMoney(finalTotal)}\n\n${descripcion}`,
          eventId,
          customEventId,
        }),
      })
      if (!res.ok) throw new Error('request failed')
      window.fbq?.('track', 'Lead', { content_name: 'calculadora' }, { eventID: eventId })
      window.fbq?.('trackCustom', 'LeadCalculadora', {}, { eventID: customEventId })
      setSent(true)
    } catch {
      setError('No pudimos enviar tus datos. Probá de nuevo o escribinos a hola@fiflip.realestate.')
    } finally {
      setSending(false)
    }
  }

  return (
    <div style={{ marginTop: 36 }}>
      <div style={{ border: '2px solid var(--black)', padding: 28 }}>
        {rooms.map((r, i) => {
          const label = ROOM_TYPES.find((t) => t.key === r.type)?.label || r.type
          const subtotal = roomSubtotal(r, prices)
          const checked = QUESTIONS[r.type].filter((q) => r.answers[q.key])
          return (
            <div key={i} style={{ paddingBottom: 18, marginBottom: 18, borderBottom: '2px solid var(--gray-200)' }}>
              <strong>
                Habitación {i + 1} — {label} ({r.m2}m²)
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
              <p style={{ marginTop: 8, fontWeight: 700 }}>{formatMoney(subtotal)}</p>
            </div>
          )
        })}
        <p style={{ fontSize: '0.85rem', color: 'var(--gray-400)' }}>Subtotal + margen de obra</p>
        <p style={{ fontSize: 'clamp(1.8rem, 5vw, 2.6rem)', fontFamily: "'Archivo Black', sans-serif", marginTop: 6 }}>
          {formatMoney(finalTotal)}
        </p>
        <p style={{ marginTop: 10, fontSize: '0.85rem', color: 'var(--gray-400)' }}>
          Este es un valor aproximado. El presupuesto final puede variar según relevamiento en el lugar.
        </p>
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
