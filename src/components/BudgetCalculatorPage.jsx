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
    { key: 'sanitarios', label: 'Cambiar sanitarios (inodoro y/o bidet)', compute: 'FIXED_SPLIT', materialKey: 'sanitary_material_fixed', laborKey: 'sanitary_labor_fixed' },
    { key: 'techo', label: 'Bajar el techo con placas de yeso y colocar luces dicroicas', compute: 'M2_SPLIT', surface: 'FLOOR', materialKey: 'ceiling_gypsum_material_m2', laborKey: 'ceiling_gypsum_labor_m2' },
    { key: 'revestimientos', label: 'Cambiar los revestimientos (cerámicos de piso y pared)', compute: 'M2_SPLIT', surface: 'WALL', materialKey: 'wall_covering_material_m2', laborKey: 'wall_covering_labor_m2' },
    { key: 'ducha', label: 'Cambiar bañadera por sector de ducha con mampara de vidrio', compute: 'FIXED_SPLIT', materialKey: 'shower_glass_material_fixed', laborKey: 'shower_glass_labor_fixed' },
    { key: 'enchufes', label: 'Cambiar tapas de los enchufes', compute: 'FIXED_SPLIT', materialKey: 'outlets_material_fixed', laborKey: 'outlets_labor_fixed' },
    { key: 'vanitory', label: 'Cambiar mueble vanitory y espejo', compute: 'FIXED_SPLIT', materialKey: 'vanity_mirror_material_fixed', laborKey: 'vanity_mirror_labor_fixed' },
    { key: 'griferias', label: 'Cambiar griferías de vanitory, bidet y cuadro de ducha', compute: 'FIXED_SPLIT', materialKey: 'faucet_material_fixed', laborKey: 'faucet_labor_fixed' },
    { key: 'abertura', label: 'Cambiar ventana (si tiene)', compute: 'FIXED_SPLIT', materialKey: 'door_window_material_fixed', laborKey: 'door_window_labor_fixed' },
    { key: 'puerta_corrediza', label: 'Cambiar puerta abatible por puerta corrediza', compute: 'FIXED_SPLIT', materialKey: 'sliding_door_material_fixed', laborKey: 'sliding_door_labor_fixed' },
  ],
  COCINA: [
    { key: 'ampliar', label: 'Ampliar el espacio actual (integración con living o ampliación de espacio de mesada)', compute: 'FIXED_SPLIT', materialKey: 'kitchen_expand_material_fixed', laborKey: 'kitchen_expand_labor_fixed' },
    { key: 'muebles', label: 'Cambiar muebles bajo mesada y alacenas', compute: 'FIXED_SPLIT', materialKey: 'kitchen_furniture_material_fixed', laborKey: 'kitchen_furniture_labor_fixed' },
    { key: 'revestimientos', label: 'Cambiar revestimientos (cerámicos pared y piso)', compute: 'M2_SPLIT', surface: 'WALL', materialKey: 'wall_covering_material_m2', laborKey: 'wall_covering_labor_m2' },
    { key: 'griferias', label: 'Cambiar grifería', compute: 'FIXED_SPLIT', materialKey: 'faucet_material_fixed', laborKey: 'faucet_labor_fixed' },
    { key: 'mesadas', label: 'Cambiar mesada', compute: 'FIXED_SPLIT', materialKey: 'countertop_material_fixed', laborKey: 'countertop_labor_fixed' },
    { key: 'enchufes', label: 'Cambiar tapas de los enchufes', compute: 'FIXED_SPLIT', materialKey: 'outlets_material_fixed', laborKey: 'outlets_labor_fixed' },
    { key: 'techo', label: 'Bajar el techo con placas de yeso y colocar luces dicroicas', compute: 'M2_SPLIT', surface: 'FLOOR', materialKey: 'ceiling_gypsum_material_m2', laborKey: 'ceiling_gypsum_labor_m2' },
    { key: 'pintar', label: 'Pintar paredes y techo', compute: 'PAINT' },
    { key: 'abertura', label: 'Cambiar ventana (si tiene)', compute: 'FIXED_SPLIT', materialKey: 'door_window_material_fixed', laborKey: 'door_window_labor_fixed' },
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

function formatMoney(n) {
  return '$' + Math.round(n).toLocaleString('es-AR')
}

// Ítems que se dibujan como capas sobre el plano en vez de como íconos sueltos
const OVERLAY_KEYS = ['techo', 'pisos', 'revestimientos']

// Aberturas: se dibujan sobre la pared del plano (arriba/abajo), no como ícono suelto
const WALL_KEYS = ['abertura', 'puerta_corrediza']

// Dónde cae cada ícono dentro del plano (top/left en %), para que se ubique
// donde ese elemento realmente iría (contra una pared, en una esquina) en vez
// de amontonarse en el centro. Los índices se corresponden con ICONS[key].
const ICON_POSITIONS = {
  sanitarios: [{ top: 23, left: 20 }, { top: 23, left: 42 }],
  ducha: [{ top: 23, left: 80 }],
  enchufes: [{ top: 45, left: 10 }],
  griferias: [{ top: 45, left: 88 }],
  vanitory: [{ top: 78, left: 30 }],
  muebles: [{ top: 30, left: 50 }],
  ampliar: [{ top: 65, left: 50 }],
  mesadas: [{ top: 78, left: 30 }],
  pintar: [{ top: 12, left: 15 }],
  aire: [{ top: 10, left: 85 }],
  placar: [{ top: 50, left: 85 }],
  luminaria: [{ top: 18, left: 50 }],
}

function Svg({ children }) {
  return (
    <svg viewBox="0 0 24 24" width="26" height="26" fill="none" stroke="var(--black)" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      {children}
    </svg>
  )
}

const ICONS = {
  sanitarios: [
    {
      label: 'Inodoro',
      render: () => (
        <Svg>
          <rect x="7" y="2" width="10" height="5" rx="1" />
          <path d="M6 9h12a1 1 0 0 1 1 1v3a7 6 0 0 1-14 0v-3a1 1 0 0 1 1-1z" />
        </Svg>
      ),
    },
    {
      label: 'Bidet',
      render: () => (
        <Svg>
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
        // Vista en planta: mesada (rectángulo) + bacha (óvalo inscripto) + grifería (punto trasero)
        <Svg>
          <rect x="3" y="4" width="18" height="16" rx="1" />
          <ellipse cx="12" cy="13" rx="6" ry="4.5" />
          <circle cx="12" cy="7" r="1" fill="var(--black)" stroke="none" />
        </Svg>
      ),
    },
  ],
  griferias: [
    {
      label: 'Grifería',
      render: () => (
        <Svg>
          <path d="M6 20v-9a6 6 0 0 1 12 0v3" />
          <line x1="18" y1="14" x2="18" y2="17" />
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
        {hasRevestimientos && (
          <div
            style={{
              position: 'absolute',
              inset: 10,
              border: '2.5px solid var(--gray-400)',
              pointerEvents: 'none',
            }}
          />
        )}

        {hasTecho && (
          <div style={{ position: 'absolute', top: 28, left: 0, right: 0, display: 'flex', justifyContent: 'space-evenly' }}>
            {[0, 1, 2].map((i) => (
              <span
                key={i}
                style={{
                  width: 9,
                  height: 9,
                  borderRadius: '50%',
                  background: 'var(--black)',
                  boxShadow: '0 0 6px 2px rgba(0,0,0,0.25)',
                }}
              />
            ))}
          </div>
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
    setRooms((prev) => {
      if (prev.length === count) return prev
      if (prev.length > count) return prev.slice(0, count)
      return [...prev, ...Array.from({ length: count - prev.length }, () => emptyRoom())]
    })
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

            <div style={{ display: 'flex', gap: 12, marginTop: 36 }}>
              <button className="btn btn-outline" onClick={() => setStep((s) => s - 1)}>
                ← Anterior
              </button>
              <button className="btn" disabled={!canAdvance} onClick={() => setStep((s) => s + 1)}>
                {isLastRoom ? 'Ver presupuesto →' : 'Siguiente habitación →'}
              </button>
            </div>
          </div>
        ) : (
          <BudgetSummary rooms={rooms} prices={prices} total={total} finalTotal={finalTotal} onBack={() => setStep(roomCount)} />
        )}
      </div>
    </div>
  )
}

function BudgetSummary({ rooms, prices, total, finalTotal, onBack }) {
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
      {!sent && (
        <button className="btn btn-outline" onClick={onBack} style={{ marginBottom: 24 }}>
          ← Anterior
        </button>
      )}
      <div style={{ border: '2px solid var(--black)', padding: 28 }}>
        {rooms.map((r, i) => {
          const label = ROOM_TYPES.find((t) => t.key === r.type)?.label || r.type
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
            </div>
          )
        })}
        <p style={{ fontSize: '0.85rem', color: 'var(--gray-400)' }}>Presupuesto estimado</p>
        <p style={{ fontSize: 'clamp(1.8rem, 5vw, 2.6rem)', fontFamily: "'Archivo Black', sans-serif", marginTop: 6 }}>
          {formatMoney(finalTotal)}
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
