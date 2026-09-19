import { useEffect, useState } from 'react'
import { navigate } from '../router.js'
import Logo from './Logo.jsx'

const API_URL = import.meta.env.VITE_API_URL

const ROOM_TYPES = [
  { key: 'BANO', label: 'Baño' },
  { key: 'COCINA', label: 'Cocina' },
  { key: 'HABITACION', label: 'Habitación' },
  { key: 'PASILLO', label: 'Pasillo o distribuidor' },
  { key: 'TERRAZA', label: 'Espacio exterior' },
]

const MIN_ROOMS = 1
const MAX_ROOMS = 20

// El precio de cada ítem (y la fórmula: fijo, por m² de pared/piso, o pintura)
// se calcula en el backend — acá solo queda lo necesario para la UI.
const HABITACION_QUESTIONS = [
  { key: 'pintar', label: 'Pintar paredes y techo' },
  { key: 'pisos', label: 'Cambiar pisos' },
  { key: 'placar', label: 'Si tiene placar, cambiar las puertas' },
  { key: 'luminaria', label: 'Cambiar luminaria' },
  { key: 'aire', label: 'Colocar aire acondicionado' },
  { key: 'abertura', label: 'Cambiar abertura (si tiene)' },
]

const QUESTIONS = {
  BANO: [
    { key: 'sanitarios', label: 'Cambiar sanitarios (inodoro y/o bidet)' },
    { key: 'techo', label: 'Bajar el techo con placas de yeso y colocar luces dicroicas' },
    { key: 'revestimientos', label: 'Cambiar los revestimientos (cerámicos de piso y pared)' },
    { key: 'ducha', label: 'Cambiar bañadera por sector de ducha con mampara de vidrio' },
    { key: 'enchufes', label: 'Cambiar tapas de los enchufes' },
    { key: 'vanitory', label: 'Cambiar mueble vanitory y espejo' },
    { key: 'griferias', label: 'Cambiar griferías de vanitory, bidet y cuadro de ducha' },
    { key: 'abertura', label: 'Cambiar ventana (si tiene)' },
    { key: 'puerta_corrediza', label: 'Cambiar puerta abatible por puerta corrediza' },
  ],
  COCINA: [
    { key: 'ampliar', label: 'Ampliar el espacio actual (integración con living o ampliación de espacio de mesada)' },
    { key: 'muebles', label: 'Cambiar muebles bajo mesada y alacenas' },
    { key: 'revestimientos', label: 'Cambiar revestimientos (cerámicos pared y piso)' },
    { key: 'griferias', label: 'Cambiar grifería' },
    { key: 'mesadas', label: 'Cambiar mesada' },
    { key: 'enchufes', label: 'Cambiar tapas de los enchufes' },
    { key: 'techo', label: 'Bajar el techo con placas de yeso y colocar luces dicroicas' },
    { key: 'pintar', label: 'Pintar paredes y techo' },
    { key: 'abertura', label: 'Cambiar ventana (si tiene)' },
    { key: 'aire', label: 'Colocar aire acondicionado' },
  ],
  HABITACION: HABITACION_QUESTIONS,
  // Un pasillo o distribuidor: como una habitación, pero sin aire acondicionado ni aberturas.
  PASILLO: HABITACION_QUESTIONS.filter((q) => q.key !== 'aire' && q.key !== 'abertura'),
  // Espacio exterior (patio, balcón, terraza). El backend lo conoce como TERRAZA.
  TERRAZA: [
    { key: 'pintar', label: 'Pintar paredes' },
    { key: 'pisos', label: 'Cambiar pisos' },
    { key: 'impermeabilizar', label: 'Impermeabilizar pisos (con membrana)' },
    { key: 'luminaria', label: 'Cambiar luminaria' },
    { key: 'tanque', label: 'Mover tanque de agua' },
  ],
}

const DEFAULT_ALTURA = '2.6'
const DEFAULT_ALTURA_EXTERIOR = '1.5' // altura de las paredes de un patio, balcón o terraza (no tiene techo)

function defaultAltura(type) {
  return type === 'TERRAZA' ? DEFAULT_ALTURA_EXTERIOR : DEFAULT_ALTURA
}

// Nombres típicos de cada tipo de espacio, como placeholder (en gris) del campo de nombre.
const NAME_PLACEHOLDERS = {
  BANO: 'Ej: Baño principal o Toilette',
  COCINA: 'Ej: Cocina o Cocina-comedor',
  HABITACION: 'Ej: Comedor, Living o Playroom',
  PASILLO: 'Ej: Pasillo o Hall de entrada',
  TERRAZA: 'Ej: Patio, Balcón o Terraza',
}
const DEFAULT_NAME_PLACEHOLDER = 'Ej: Dormitorio principal'

function roomFloorM2(room) {
  return (Number(room.largo) || 0) * (Number(room.ancho) || 0)
}

function emptyRoom() {
  return { nombre: '', type: null, largo: '', ancho: '', altura: DEFAULT_ALTURA, answers: {} }
}

// Botones − / + del selector de cantidad; atenuados y sin hover cuando están en el límite.
function stepperButtonStyle(disabled) {
  return { padding: 0, width: 38, height: 38, ...(disabled && { opacity: 0.3, pointerEvents: 'none' }) }
}

function roomTypeLabel(room) {
  return ROOM_TYPES.find((t) => t.key === room.type)?.label || room.type
}

// Nombre que le puso el usuario, o "Habitación N" si lo dejó vacío.
function roomTitle(room, index) {
  return room.nombre.trim() || `Habitación ${index + 1}`
}

// El producto de dos decimales suma ruido de punto flotante (3.3 × 3.6 = 11.879999…).
function formatM2(n) {
  return Math.round(n * 100) / 100
}

function formatMoney(n) {
  return '$' + Math.round(n).toLocaleString('es-AR')
}

// Plano ilustrativo: solo un rectángulo proporcional a largo x ancho, como referencia
// visual del tamaño del espacio. No pretende ser un plano arquitectónico.
function RoomDiagram({ room }) {
  const largo = Number(room.largo) || 0
  const ancho = Number(room.ancho) || 0
  if (largo <= 0 || ancho <= 0) return null

  const maxPx = 320
  const pxPerM = Math.min(maxPx / largo, maxPx / ancho, 90)
  const widthPx = Math.max(ancho * pxPerM, 110)
  const heightPx = Math.max(largo * pxPerM, 110)

  return (
    <div style={{ marginTop: 28 }}>
      <label style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
        Plano ilustrativo
      </label>
      <div
        style={{
          marginTop: 10,
          width: widthPx,
          height: heightPx,
          border: '3px solid var(--black)',
          background: 'var(--white)',
        }}
      />
      <p style={{ marginTop: 8, fontSize: '0.75rem', color: 'var(--gray-400)' }}>
        {ancho}m × {largo}m — plano orientativo, no a escala arquitectónica
      </p>
    </div>
  )
}

export default function BudgetCalculatorPage() {
  const [step, setStep] = useState(0) // 0 = cuántas habitaciones, 1..N = cada habitación, N+1 = resumen
  const [countInput, setCountInput] = useState(1) // lo que se tipea en el paso 0
  const [rooms, setRooms] = useState([emptyRoom()])
  const [result, setResult] = useState(null) // { total, roomTotals } devuelto por el backend
  const [calculating, setCalculating] = useState(false)
  const [calcError, setCalcError] = useState('')

  useEffect(() => {
    window.scrollTo(0, 0)
  }, [])

  const updateRoom = (index, patch) => {
    setRooms((rs) => rs.map((r, i) => (i === index ? { ...r, ...patch } : r)))
  }

  // Agrega habitaciones vacías al final o descarta las últimas hasta llegar a `count`.
  const resizeRooms = (count) => {
    setCountInput(count)
    setRooms((prev) => {
      if (prev.length === count) return prev
      if (prev.length > count) return prev.slice(0, count)
      return [...prev, ...Array.from({ length: count - prev.length }, () => emptyRoom())]
    })
    setStep((s) => Math.min(s, count)) // si estabas en una habitación que se descartó, vuelve a la última
  }

  const startRooms = () => {
    resizeRooms(Math.min(MAX_ROOMS, Math.max(MIN_ROOMS, Number(countInput) || MIN_ROOMS)))
    setStep(1)
  }

  const changeRoomCount = (delta) => {
    const next = rooms.length + delta
    if (next < MIN_ROOMS || next > MAX_ROOMS) return
    const dropped = rooms[rooms.length - 1]
    if (delta < 0 && dropped.type && !confirm(`Se va a quitar "${roomTitle(dropped, rooms.length - 1)}" con todo lo que cargaste. ¿Continuar?`)) {
      return
    }
    resizeRooms(next)
  }

  const roomCount = rooms.length
  const currentRoom = step >= 1 && step <= roomCount ? rooms[step - 1] : null
  const isLastRoom = step === roomCount

  const canAdvance =
    currentRoom &&
    currentRoom.type &&
    Number(currentRoom.largo) > 0 &&
    Number(currentRoom.ancho) > 0 &&
    Number(currentRoom.altura) > 0

  const handleSeePresupuesto = async () => {
    setCalcError('')
    setCalculating(true)
    try {
      const res = await fetch(`${API_URL}/api/budget/calculate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          rooms: rooms.map((r) => ({
            type: r.type,
            largo: Number(r.largo),
            ancho: Number(r.ancho),
            altura: Number(r.altura),
            itemKeys: Object.keys(r.answers).filter((k) => r.answers[k]),
          })),
        }),
      })
      if (!res.ok) throw new Error('calculate failed')
      const data = await res.json()
      if (!Array.isArray(data.rooms) || data.rooms.length !== rooms.length) throw new Error('unexpected response')
      setResult({ total: data.total, roomTotals: data.rooms.map((r) => r.total) })
      setStep((s) => s + 1)
    } catch {
      setCalcError('No pudimos calcular el presupuesto. Probá de nuevo.')
    } finally {
      setCalculating(false)
    }
  }

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

        {step === 0 ? (
          <div style={{ marginTop: 36 }}>
            <p style={{ color: 'var(--gray-700)', fontSize: '1.05rem', lineHeight: 1.55 }}>
              ¿Cuántas habitaciones vas a refaccionar?
            </p>
            <div className="field" style={{ marginTop: 20, maxWidth: 160 }}>
              <input
                type="number"
                min={MIN_ROOMS}
                max={MAX_ROOMS}
                value={countInput}
                onChange={(e) => setCountInput(e.target.value)}
              />
            </div>
            <button className="btn" style={{ marginTop: 28 }} onClick={startRooms}>
              Empezar →
            </button>
          </div>
        ) : currentRoom ? (
          <div style={{ marginTop: 36 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
              <p className="eyebrow">
                Habitación {step} de {roomCount}
              </p>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                  Total de habitaciones
                </span>
                <button
                  type="button"
                  className="btn btn-outline"
                  style={stepperButtonStyle(roomCount <= MIN_ROOMS)}
                  disabled={roomCount <= MIN_ROOMS}
                  onClick={() => changeRoomCount(-1)}
                  aria-label="Quitar una habitación"
                >
                  −
                </button>
                <strong style={{ minWidth: 20, textAlign: 'center', fontSize: '1.1rem' }} aria-live="polite">
                  {roomCount}
                </strong>
                <button
                  type="button"
                  className="btn btn-outline"
                  style={stepperButtonStyle(roomCount >= MAX_ROOMS)}
                  disabled={roomCount >= MAX_ROOMS}
                  onClick={() => changeRoomCount(1)}
                  aria-label="Agregar una habitación"
                >
                  +
                </button>
              </div>
            </div>

            <div style={{ marginTop: 20 }}>
              <label style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                Tipo de espacio
              </label>
              <div style={{ display: 'flex', gap: 10, marginTop: 10, flexWrap: 'wrap' }}>
                {ROOM_TYPES.map((rt) => (
                  <button
                    key={rt.key}
                    type="button"
                    onClick={() =>
                      updateRoom(step - 1, {
                        type: rt.key,
                        answers: {},
                        // Si la altura sigue en el valor por defecto del tipo anterior, pasa al del nuevo.
                        altura: currentRoom.altura === defaultAltura(currentRoom.type) ? defaultAltura(rt.key) : currentRoom.altura,
                      })
                    }
                    className={rt.key === currentRoom.type ? 'btn' : 'btn btn-outline'}
                  >
                    {rt.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="field" style={{ marginTop: 24, maxWidth: 360 }}>
              <label htmlFor="room-nombre">Nombre (opcional)</label>
              <input
                id="room-nombre"
                maxLength={40}
                value={currentRoom.nombre}
                onChange={(e) => updateRoom(step - 1, { nombre: e.target.value })}
                placeholder={NAME_PLACEHOLDERS[currentRoom.type] || DEFAULT_NAME_PLACEHOLDER}
              />
            </div>

            {currentRoom.type && (
              <>
                <div style={{ display: 'flex', gap: 16, marginTop: 24, flexWrap: 'wrap' }}>
                  <div className="field" style={{ maxWidth: 160 }}>
                    <label>Largo (m)</label>
                    <input
                      type="number"
                      min="0"
                      step="0.1"
                      value={currentRoom.largo}
                      onChange={(e) => updateRoom(step - 1, { largo: e.target.value })}
                      placeholder="Ej: 4"
                    />
                  </div>
                  <div className="field" style={{ maxWidth: 160 }}>
                    <label>Ancho (m)</label>
                    <input
                      type="number"
                      min="0"
                      step="0.1"
                      value={currentRoom.ancho}
                      onChange={(e) => updateRoom(step - 1, { ancho: e.target.value })}
                      placeholder="Ej: 3"
                    />
                  </div>
                  <div className="field" style={{ maxWidth: 160 }}>
                    <label>{currentRoom.type === 'TERRAZA' ? 'Altura de paredes (m)' : 'Altura de techo (m)'}</label>
                    <input
                      type="number"
                      min="0"
                      step="0.1"
                      value={currentRoom.altura}
                      onChange={(e) => updateRoom(step - 1, { altura: e.target.value })}
                      placeholder={`Ej: ${defaultAltura(currentRoom.type)}`}
                    />
                  </div>
                </div>

                {roomFloorM2(currentRoom) > 0 && <RoomDiagram room={currentRoom} />}

                <div style={{ marginTop: 28 }}>
                  <label
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 12,
                      cursor: 'pointer',
                      paddingBottom: 14,
                      marginBottom: 14,
                      borderBottom: '2px solid var(--black)',
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={QUESTIONS[currentRoom.type].every((q) => currentRoom.answers[q.key])}
                      onChange={(e) => {
                        const checked = e.target.checked
                        const answers = {}
                        QUESTIONS[currentRoom.type].forEach((q) => (answers[q.key] = checked))
                        updateRoom(step - 1, { answers })
                      }}
                      style={{ width: 20, height: 20 }}
                    />
                    <span style={{ fontWeight: 700, textTransform: 'uppercase', fontSize: '0.85rem', letterSpacing: '0.04em' }}>
                      Reforma integral (seleccionar todo)
                    </span>
                  </label>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
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
                </div>
              </>
            )}

            {calcError && <p style={{ marginTop: 16, color: '#c0392b', fontSize: '0.85rem' }}>{calcError}</p>}

            <div style={{ display: 'flex', gap: 12, marginTop: 36 }}>
              <button className="btn btn-outline" onClick={() => setStep((s) => s - 1)}>
                ← Anterior
              </button>
              <button
                className="btn"
                disabled={!canAdvance || calculating}
                onClick={() => (isLastRoom ? handleSeePresupuesto() : setStep((s) => s + 1))}
              >
                {isLastRoom ? (calculating ? 'Calculando…' : 'Ver presupuesto →') : 'Siguiente habitación →'}
              </button>
            </div>
          </div>
        ) : (
          <BudgetSummary rooms={rooms} result={result} onBack={() => setStep(roomCount)} />
        )}
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

// Precio de cada habitación (con margen incluido), en el mismo orden en que se cargaron.
function RoomReport({ rooms, roomTotals, total }) {
  return (
    <div style={{ marginTop: 22, borderTop: '2px solid var(--black)' }}>
      <p className="eyebrow" style={{ marginTop: 18 }}>
        Informe por habitación
      </p>
      {rooms.map((r, i) => (
        <div
          key={i}
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'baseline',
            gap: 16,
            padding: '14px 0',
            borderBottom: '2px solid var(--gray-200)',
          }}
        >
          <div style={{ minWidth: 0 }}>
            <strong style={{ overflowWrap: 'anywhere' }}>{roomTitle(r, i)}</strong>
            <p style={{ marginTop: 4, fontSize: '0.8rem', color: 'var(--gray-400)' }}>
              {roomTypeLabel(r)} · {formatM2(roomFloorM2(r))}m²
            </p>
          </div>
          <strong style={{ whiteSpace: 'nowrap' }}>{formatMoney(roomTotals[i])}</strong>
        </div>
      ))}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 16, paddingTop: 14 }}>
        <strong style={{ textTransform: 'uppercase', letterSpacing: '0.04em' }}>Total</strong>
        <strong style={{ fontFamily: "'Archivo Black', sans-serif", fontSize: '1.2rem' }}>{formatMoney(total)}</strong>
      </div>
    </div>
  )
}
