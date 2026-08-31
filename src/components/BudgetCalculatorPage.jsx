import { useEffect, useState } from 'react'
import { navigate } from '../router.js'
import Logo from './Logo.jsx'

const API_URL = import.meta.env.VITE_API_URL

const ROOM_TYPES = [
  { key: 'BANO', label: 'Baño' },
  { key: 'COCINA', label: 'Cocina' },
  { key: 'HABITACION', label: 'Habitación' },
]

// compute: 'PAINT' (mano de obra por m² + materiales por rendimiento),
// 'M2_SPLIT' (material + mano de obra, ambos por m²), 'FIXED_SPLIT' (material + mano de obra, fijos)
const QUESTIONS = {
  BANO: [
    { key: 'sanitarios', label: 'Cambiar sanitarios', compute: 'FIXED_SPLIT', materialKey: 'sanitary_material_fixed', laborKey: 'sanitary_labor_fixed' },
    { key: 'techo', label: 'Bajar el techo con placas de yeso y luces dicroicas', compute: 'M2_SPLIT', surface: 'FLOOR', materialKey: 'ceiling_gypsum_material_m2', laborKey: 'ceiling_gypsum_labor_m2' },
    { key: 'revestimientos', label: 'Cambiar los revestimientos', compute: 'M2_SPLIT', surface: 'WALL', materialKey: 'wall_covering_material_m2', laborKey: 'wall_covering_labor_m2' },
    { key: 'ducha', label: 'Cambiar bañadera por ducha con mampara de vidrio', compute: 'FIXED_SPLIT', materialKey: 'shower_glass_material_fixed', laborKey: 'shower_glass_labor_fixed' },
    { key: 'enchufes', label: 'Cambiar enchufes', compute: 'FIXED_SPLIT', materialKey: 'outlets_material_fixed', laborKey: 'outlets_labor_fixed' },
    { key: 'vanitory', label: 'Cambiar vanitory con espejo nuevo', compute: 'FIXED_SPLIT', materialKey: 'vanity_mirror_material_fixed', laborKey: 'vanity_mirror_labor_fixed' },
    { key: 'griferias', label: 'Cambiar griferías', compute: 'FIXED_SPLIT', materialKey: 'faucet_material_fixed', laborKey: 'faucet_labor_fixed' },
    { key: 'abertura', label: 'Cambiar abertura (si tiene)', compute: 'FIXED_SPLIT', materialKey: 'door_window_material_fixed', laborKey: 'door_window_labor_fixed' },
  ],
  COCINA: [
    { key: 'ampliar', label: 'Ampliar el espacio actual', compute: 'FIXED_SPLIT', materialKey: 'kitchen_expand_material_fixed', laborKey: 'kitchen_expand_labor_fixed' },
    { key: 'muebles', label: 'Cambiar muebles', compute: 'FIXED_SPLIT', materialKey: 'kitchen_furniture_material_fixed', laborKey: 'kitchen_furniture_labor_fixed' },
    { key: 'revestimientos', label: 'Cambiar revestimientos', compute: 'M2_SPLIT', surface: 'WALL', materialKey: 'wall_covering_material_m2', laborKey: 'wall_covering_labor_m2' },
    { key: 'griferias', label: 'Cambiar griferías', compute: 'FIXED_SPLIT', materialKey: 'faucet_material_fixed', laborKey: 'faucet_labor_fixed' },
    { key: 'mesadas', label: 'Cambiar mesadas', compute: 'FIXED_SPLIT', materialKey: 'countertop_material_fixed', laborKey: 'countertop_labor_fixed' },
    { key: 'enchufes', label: 'Cambiar enchufes', compute: 'FIXED_SPLIT', materialKey: 'outlets_material_fixed', laborKey: 'outlets_labor_fixed' },
    { key: 'techo', label: 'Bajar el techo con placas de yeso y luces dicroicas', compute: 'M2_SPLIT', surface: 'FLOOR', materialKey: 'ceiling_gypsum_material_m2', laborKey: 'ceiling_gypsum_labor_m2' },
    { key: 'pintar', label: 'Pintar', compute: 'PAINT' },
    { key: 'abertura', label: 'Cambiar abertura (si tiene)', compute: 'FIXED_SPLIT', materialKey: 'door_window_material_fixed', laborKey: 'door_window_labor_fixed' },
    { key: 'aire', label: 'Colocar aire acondicionado', compute: 'FIXED_SPLIT', materialKey: 'ac_material_fixed', laborKey: 'ac_labor_fixed' },
  ],
  HABITACION: [
    { key: 'pintar', label: 'Pintar', compute: 'PAINT' },
    { key: 'pisos', label: 'Cambiar pisos', compute: 'M2_SPLIT', surface: 'FLOOR', materialKey: 'floor_material_m2', laborKey: 'floor_labor_m2' },
    { key: 'placar', label: 'Si tiene placar, cambiar las puertas', compute: 'FIXED_SPLIT', materialKey: 'closet_doors_material_fixed', laborKey: 'closet_doors_labor_fixed' },
    { key: 'luminaria', label: 'Cambiar luminaria', compute: 'FIXED_SPLIT', materialKey: 'lighting_material_fixed', laborKey: 'lighting_labor_fixed' },
    { key: 'aire', label: 'Colocar aire acondicionado', compute: 'FIXED_SPLIT', materialKey: 'ac_material_fixed', laborKey: 'ac_labor_fixed' },
    { key: 'abertura', label: 'Cambiar abertura (si tiene)', compute: 'FIXED_SPLIT', materialKey: 'door_window_material_fixed', laborKey: 'door_window_labor_fixed' },
  ],
}

// Etiquetas cortas para mostrar dentro del plano cuando se tilda cada ítem
const ITEM_TAGS = {
  sanitarios: 'SANITARIOS',
  techo: 'CIELORRASO',
  revestimientos: 'REVEST.',
  ducha: 'DUCHA',
  enchufes: 'ENCHUFES',
  vanitory: 'VANITORY',
  griferias: 'GRIFERIA',
  abertura: 'ABERTURA',
  ampliar: 'AMPLIACION',
  muebles: 'MUEBLES',
  mesadas: 'MESADA',
  pintar: 'PINTURA',
  aire: 'A/A',
  pisos: 'PISO',
  placar: 'PLACAR',
  luminaria: 'LUZ',
}

const PAINT_BUCKET_COVERAGE_M2 = 100
const PUTTY_BUCKET_COVERAGE_M2 = 60
const PRIMER_COVERAGE_M2 = 60
const DEFAULT_ALTURA = '2.6'

function roomFloorM2(room) {
  return (Number(room.largo) || 0) * (Number(room.ancho) || 0)
}

function wallAreaM2(room) {
  const largo = Number(room.largo) || 0
  const ancho = Number(room.ancho) || 0
  const height = Number(room.altura) || 0
  const perimeter = 2 * (largo + ancho)
  return perimeter * height
}

function unitsNeeded(m2, coverage) {
  return coverage > 0 ? Math.ceil(m2 / coverage) : 0
}

function paintCost(wallM2, priceMap) {
  const labor = (priceMap.paint_labor_m2 || 0) * wallM2
  const paint = unitsNeeded(wallM2, PAINT_BUCKET_COVERAGE_M2) * (priceMap.paint_bucket_price || 0)
  const putty = unitsNeeded(wallM2, PUTTY_BUCKET_COVERAGE_M2) * (priceMap.putty_bucket_price || 0)
  const primer = unitsNeeded(wallM2, PRIMER_COVERAGE_M2) * (priceMap.primer_price || 0)
  return labor + paint + putty + primer
}

function itemCost(q, room, priceMap) {
  if (q.compute === 'PAINT') return paintCost(wallAreaM2(room), priceMap)
  const material = priceMap[q.materialKey] || 0
  const labor = priceMap[q.laborKey] || 0
  if (q.compute === 'FIXED_SPLIT') return material + labor
  const area = q.surface === 'WALL' ? wallAreaM2(room) : roomFloorM2(room)
  return (material + labor) * area
}

function emptyRoom() {
  return { type: null, largo: '', ancho: '', altura: DEFAULT_ALTURA, answers: {} }
}

function roomSubtotal(room, priceMap) {
  const questions = QUESTIONS[room.type] || []
  return questions.reduce((sum, q) => {
    if (!room.answers[q.key]) return sum
    return sum + itemCost(q, room, priceMap)
  }, 0)
}

function checkedTags(room) {
  const questions = QUESTIONS[room.type] || []
  return questions.filter((q) => room.answers[q.key]).map((q) => ITEM_TAGS[q.key] || q.key)
}

function formatMoney(n) {
  return '$' + Math.round(n).toLocaleString('es-AR')
}

// Plano ilustrativo: un rectángulo proporcional a largo x ancho, con las etiquetas
// de lo que se va tildando dentro. No pretende ser un plano arquitectónico real,
// solo darle al cliente una idea visual de la habitación que está armando.
function RoomDiagram({ room, tags }) {
  const largo = Number(room.largo) || 0
  const ancho = Number(room.ancho) || 0
  if (largo <= 0 || ancho <= 0) return null

  const maxPx = 320
  const pxPerM = Math.min(maxPx / largo, maxPx / ancho, 90)
  const widthPx = Math.max(ancho * pxPerM, 90)
  const heightPx = Math.max(largo * pxPerM, 90)

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
          padding: 10,
          display: 'flex',
          flexWrap: 'wrap',
          alignContent: 'flex-start',
          gap: 6,
        }}
      >
        {tags.map((tag, i) => (
          <span
            key={tag + i}
            style={{
              border: '1.5px solid var(--black)',
              background: 'var(--gray-100)',
              fontSize: '0.65rem',
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '0.03em',
              padding: '4px 7px',
              height: 'fit-content',
            }}
          >
            {tag}
          </span>
        ))}
      </div>
      <p style={{ marginTop: 8, fontSize: '0.75rem', color: 'var(--gray-400)' }}>
        {ancho}m × {largo}m — plano orientativo, no a escala arquitectónica
      </p>
    </div>
  )
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

  const canAdvance =
    currentRoom &&
    currentRoom.type &&
    Number(currentRoom.largo) > 0 &&
    Number(currentRoom.ancho) > 0 &&
    Number(currentRoom.altura) > 0

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
                    <label>Altura de techo (m)</label>
                    <input
                      type="number"
                      min="0"
                      step="0.1"
                      value={currentRoom.altura}
                      onChange={(e) => updateRoom(step - 1, { altura: e.target.value })}
                      placeholder="Ej: 2.6"
                    />
                  </div>
                </div>

                {roomFloorM2(currentRoom) > 0 && (
                  <RoomDiagram room={currentRoom} tags={checkedTags(currentRoom)} />
                )}

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
      return `Habitación ${i + 1} (${label}, ${r.largo}m x ${r.ancho}m = ${roomFloorM2(r)}m²): ${checked.length ? checked.join(', ') : 'sin ítems seleccionados'}`
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
                Habitación {i + 1} — {label} ({roomFloorM2(r)}m²)
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
