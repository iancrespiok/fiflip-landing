import { useEffect, useState } from 'react'
import { navigate } from '../router.js'
import Logo from './Logo.jsx'

const API_URL = import.meta.env.VITE_API_URL

const ROOM_TYPES = [
  { key: 'BANO', label: 'Baño' },
  { key: 'COCINA', label: 'Cocina' },
  { key: 'HABITACION', label: 'Habitación' },
  { key: 'PASILLO', label: 'Pasillo o distribuidor' },
  { key: 'TERRAZA', label: 'Terraza o patio' },
]

const MIN_ROOMS = 1
const MAX_ROOMS = 8

// El precio de cada ítem (y la fórmula: fijo, por m² de pared/piso, o pintura)
// se calcula en el backend — acá solo queda lo necesario para la UI.
const HABITACION_QUESTIONS = [
  { key: 'pintar', label: 'Pintar' },
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
  // Un pasillo o distribuidor tiene las mismas opciones que una habitación normal.
  PASILLO: HABITACION_QUESTIONS,
  TERRAZA: [
    { key: 'impermeabilizar', label: 'Impermeabilizar pisos (con membrana)' },
    { key: 'tanque', label: 'Mover tanque de agua' },
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
  abertura: 'VENTANA',
  puerta_corrediza: 'CORREDIZA',
  ampliar: 'AMPLIACION',
  muebles: 'MUEBLES',
  mesadas: 'MESADA',
  pintar: 'PINTURA',
  aire: 'A/A',
  pisos: 'PISO',
  placar: 'PLACAR',
  luminaria: 'LUZ',
  impermeabilizar: 'IMPERMEAB.',
  tanque: 'TANQUE',
}

const DEFAULT_ALTURA = '2.6'

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

// Ítems que se dibujan como capas sobre el plano en vez de como íconos sueltos
const OVERLAY_KEYS = ['techo', 'pisos', 'revestimientos', 'impermeabilizar']

// Aberturas: se dibujan sobre la pared del plano (arriba/abajo), no como ícono suelto
const WALL_KEYS = ['abertura', 'puerta_corrediza']

// Dónde cae cada ícono dentro del plano (top/left en %), para que se ubique
// donde ese elemento realmente iría (contra una pared, en una esquina) en vez
// de amontonarse en el centro. Los índices se corresponden con ICONS[key].
const ICON_POSITIONS = {
  sanitarios: [{ top: 16, left: 20 }, { top: 16, left: 42 }],
  ducha: [{ top: 16, left: 80 }],
  enchufes: [{ top: 45, left: 10 }],
  // La grifería se dibuja pegada al vanitory/mesada (misma fila), no en la pared opuesta.
  griferias: [{ top: 88, left: 46 }],
  vanitory: [{ top: 88, left: 28 }],
  muebles: [{ top: 30, left: 50 }],
  ampliar: [{ top: 65, left: 50 }],
  mesadas: [{ top: 88, left: 28 }],
  pintar: [{ top: 12, left: 15 }],
  aire: [{ top: 10, left: 85 }],
  placar: [{ top: 50, left: 85 }],
  luminaria: [{ top: 18, left: 50 }],
  tanque: [{ top: 24, left: 78 }],
}

function Svg({ children, size = 26 }) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} fill="none" stroke="var(--black)" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      {children}
    </svg>
  )
}

const ICONS = {
  sanitarios: [
    {
      label: 'Inodoro',
      render: () => (
        <Svg size={36}>
          <rect x="7" y="2" width="10" height="5" rx="1" />
          <path d="M6 9h12a1 1 0 0 1 1 1v3a7 6 0 0 1-14 0v-3a1 1 0 0 1 1-1z" />
        </Svg>
      ),
    },
    {
      label: 'Bidet',
      render: () => (
        <Svg size={36}>
          <path d="M6 8h12a1 1 0 0 1 1 1v4a7 6 0 0 1-14 0v-4a1 1 0 0 1 1-1z" />
          <circle cx="12" cy="6" r="1.3" fill="var(--black)" stroke="none" />
        </Svg>
      ),
    },
  ],
  ducha: [
    {
      label: 'Ducha',
      render: () => (
        <Svg>
          <rect x="3" y="3" width="18" height="18" />
          <line x1="3" y1="21" x2="21" y2="3" />
          <circle cx="18" cy="6" r="2" />
        </Svg>
      ),
    },
  ],
  vanitory: [
    {
      label: 'Vanitory',
      render: () => (
        // Vista en planta: mesada (rectángulo) + bacha (óvalo inscripto). La grifería se
        // dibuja aparte, sobre la mesada, como su propio ícono cuando está tildada.
        <Svg size={36}>
          <rect x="3" y="4" width="18" height="16" rx="1" />
          <ellipse cx="12" cy="13" rx="6" ry="4.5" />
        </Svg>
      ),
    },
  ],
  griferias: [
    {
      label: 'Grifería',
      render: () => (
        // Grifo visto desde arriba: cuerpo + canilla + mando — pensado para apoyarse
        // sobre la mesada del vanitory/mesada, no como pieza aparte contra la pared.
        <Svg size={18}>
          <circle cx="12" cy="16" r="2.2" />
          <path d="M12 14V6" />
          <path d="M8 6h8" />
        </Svg>
      ),
    },
  ],
  enchufes: [
    {
      label: 'Enchufe',
      render: () => (
        <Svg>
          <rect x="4" y="4" width="16" height="16" rx="3" />
          <line x1="10" y1="9" x2="10" y2="15" />
          <line x1="14" y1="9" x2="14" y2="15" />
        </Svg>
      ),
    },
  ],
  muebles: [
    {
      label: 'Muebles',
      render: () => (
        <Svg>
          <rect x="2" y="4" width="9" height="16" />
          <rect x="13" y="4" width="9" height="16" />
          <circle cx="9" cy="12" r="0.8" fill="var(--black)" stroke="none" />
          <circle cx="15" cy="12" r="0.8" fill="var(--black)" stroke="none" />
        </Svg>
      ),
    },
  ],
  mesadas: [
    {
      label: 'Mesada',
      render: () => (
        <Svg>
          <rect x="2" y="9" width="20" height="6" />
        </Svg>
      ),
    },
  ],
  placar: [
    {
      label: 'Placar',
      render: () => (
        <Svg>
          <rect x="3" y="2" width="18" height="20" />
          <line x1="12" y1="2" x2="12" y2="22" />
          <circle cx="9.5" cy="12" r="0.9" fill="var(--black)" stroke="none" />
          <circle cx="14.5" cy="12" r="0.9" fill="var(--black)" stroke="none" />
        </Svg>
      ),
    },
  ],
  luminaria: [
    {
      label: 'Luminaria',
      render: () => (
        <Svg>
          <circle cx="12" cy="12" r="5" />
          <line x1="12" y1="1" x2="12" y2="4" />
          <line x1="12" y1="20" x2="12" y2="23" />
          <line x1="1" y1="12" x2="4" y2="12" />
          <line x1="20" y1="12" x2="23" y2="12" />
        </Svg>
      ),
    },
  ],
  aire: [
    {
      label: 'Aire ac.',
      render: () => (
        <Svg>
          <rect x="2" y="5" width="20" height="7" rx="1.5" />
          <line x1="5" y1="8.5" x2="19" y2="8.5" />
          <path d="M8 15l-2 4M12 15v4M16 15l2 4" />
        </Svg>
      ),
    },
  ],
  tanque: [
    {
      label: 'Tanque de agua',
      render: () => (
        // Tanque visto desde arriba: tapa circular con su borde interior.
        <Svg size={34}>
          <circle cx="12" cy="12" r="9" />
          <circle cx="12" cy="12" r="5.5" />
        </Svg>
      ),
    },
  ],
  ampliar: [
    {
      label: 'Ampliación',
      render: () => (
        <Svg>
          <path d="M4 10V4h6" />
          <path d="M20 14v6h-6" />
          <line x1="4" y1="4" x2="10" y2="10" />
          <line x1="20" y1="20" x2="14" y2="14" />
        </Svg>
      ),
    },
  ],
  pintar: [
    {
      label: 'Pintura',
      render: () => (
        <Svg>
          <rect x="3" y="4" width="14" height="6" rx="1" />
          <line x1="17" y1="7" x2="17" y2="14" />
          <line x1="17" y1="14" x2="21" y2="18" />
        </Svg>
      ),
    },
  ],
}

// Abertura dibujada sobre la pared superior o inferior del plano, como se vería
// en un corte de planta: dos líneas de pared con el vidrio (ventana) o la hoja
// corrediza (puerta) cruzando el vano.
// Glyph de abertura al ras del muro (top:0 / bottom:0, sin desplazamiento
// vertical), como se vería en el corte de pared de un plano real.
function WallOpening({ kind, edge }) {
  return (
    <svg
      viewBox="0 0 100 16"
      width="76"
      height="12"
      style={{ position: 'absolute', [edge]: 0, left: '50%', transform: 'translate(-50%, 0)', zIndex: 2, display: 'block' }}
    >
      <line x1="2" y1="2" x2="98" y2="2" stroke="var(--black)" strokeWidth="2.5" />
      <line x1="2" y1="14" x2="98" y2="14" stroke="var(--black)" strokeWidth="2.5" />
      {kind === 'ventana' ? (
        <line x1="2" y1="8" x2="98" y2="8" stroke="var(--black)" strokeWidth="1.6" />
      ) : (
        <>
          <line x1="2" y1="8" x2="45" y2="8" stroke="var(--black)" strokeWidth="1.2" strokeDasharray="3 2" />
          <rect x="45" y="4" width="50" height="8" fill="var(--black)" />
        </>
      )}
    </svg>
  )
}

// Plano ilustrativo: un rectángulo proporcional a largo x ancho. Los ítems que
// cubren toda una superficie (piso, revestimientos, luces de techo) se dibujan
// como capas sobre el plano; el resto aparece como un ícono representativo.
// No pretende ser un plano arquitectónico real — es una referencia visual.
function RoomDiagram({ room }) {
  const largo = Number(room.largo) || 0
  const ancho = Number(room.ancho) || 0
  if (largo <= 0 || ancho <= 0) return null

  const questions = QUESTIONS[room.type] || []
  const checkedKeys = questions.filter((q) => room.answers[q.key]).map((q) => q.key)
  const hasTecho = checkedKeys.includes('techo')
  const hasPisos = checkedKeys.includes('pisos')
  const hasRevestimientos = checkedKeys.includes('revestimientos')
  const hasImpermeabilizar = checkedKeys.includes('impermeabilizar')
  const hasVentana = checkedKeys.includes('abertura')
  const hasPuertaCorrediza = checkedKeys.includes('puerta_corrediza')
  const iconEntries = checkedKeys
    .filter((k) => !OVERLAY_KEYS.includes(k) && !WALL_KEYS.includes(k))
    .flatMap((k) =>
      (ICONS[k] || [{ label: ITEM_TAGS[k] || k, render: null }]).map((entry, i) => ({
        ...entry,
        mapKey: `${k}-${i}`,
        pos: (ICON_POSITIONS[k] && ICON_POSITIONS[k][i]) || { top: 50, left: 50 },
      }))
    )

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
          position: 'relative',
          width: widthPx,
          height: heightPx,
          border: '3px solid var(--black)',
          background: hasPisos
            ? 'repeating-linear-gradient(45deg, var(--gray-200), var(--gray-200) 2px, var(--white) 2px, var(--white) 9px)'
            : 'var(--white)',
          overflow: 'hidden',
        }}
      >
        {hasTecho && (
          // Luces dicroicas repartidas por todo el cielorraso: una trama de puntos
          // sutil de fondo, en vez de íconos sueltos que compiten por lugar.
          <div
            style={{
              position: 'absolute',
              inset: 0,
              backgroundImage: 'radial-gradient(circle, var(--black) 1.3px, transparent 1.4px)',
              backgroundSize: '30px 30px',
              backgroundPosition: '15px 15px',
              opacity: 0.3,
              pointerEvents: 'none',
            }}
          />
        )}

        {hasImpermeabilizar && (
          // Membrana sobre todo el piso: una grilla fina, distinta de la trama diagonal
          // de "cambiar pisos".
          <div
            style={{
              position: 'absolute',
              inset: 0,
              backgroundImage:
                'repeating-linear-gradient(0deg, var(--gray-400) 0 1px, transparent 1px 14px), repeating-linear-gradient(90deg, var(--gray-400) 0 1px, transparent 1px 14px)',
              opacity: 0.45,
              pointerEvents: 'none',
            }}
          />
        )}

        {hasRevestimientos && (
          <div
            style={{
              position: 'absolute',
              inset: 10,
              border: '2px dashed var(--gray-400)',
              pointerEvents: 'none',
            }}
          />
        )}

        {iconEntries.map((entry) => (
          <div
            key={entry.mapKey}
            style={{
              position: 'absolute',
              top: `${entry.pos.top}%`,
              left: `${entry.pos.left}%`,
              transform: 'translate(-50%, -50%)',
              zIndex: 1,
              width: 'max-content',
            }}
          >
            {entry.render ? entry.render() : null}
          </div>
        ))}

        {hasVentana && <WallOpening kind="ventana" edge="top" />}
        {hasPuertaCorrediza && <WallOpening kind="puerta_corrediza" edge="bottom" />}
      </div>
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

            <div className="field" style={{ marginTop: 20, maxWidth: 360 }}>
              <label htmlFor="room-nombre">Nombre (opcional)</label>
              <input
                id="room-nombre"
                maxLength={40}
                value={currentRoom.nombre}
                onChange={(e) => updateRoom(step - 1, { nombre: e.target.value })}
                placeholder="Ej: Dormitorio principal"
              />
            </div>

            <div style={{ marginTop: 24 }}>
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
