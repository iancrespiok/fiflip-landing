import { useState } from 'react'
import BudgetWizard, { QUESTIONS, RoomReport, formatM2, formatMoney, roomFloorM2, roomTitle, roomTypeLabel } from '../components/BudgetWizard.jsx'

// Misma calculadora que /presupuesto, pero contra el endpoint de admin que no suma el margen:
// el resultado es el costo real (materiales + mano de obra) con los precios de la pestaña "Precios".
export default function AdminBudgetCostPage({ token, onLogout }) {
  const [run, setRun] = useState(0) // cambiar la key reinicia el wizard

  return (
    <div style={{ background: 'var(--white)', border: '2px solid var(--black)', padding: 28 }}>
      <h2 style={{ fontSize: '1.3rem' }}>Calcular costo real</h2>
      <p style={{ marginTop: 8, fontSize: '0.9rem', color: 'var(--gray-700)' }}>
        Mismo cálculo que la calculadora pública, sin el margen de ganancia.
      </p>
      <BudgetWizard
        key={run}
        endpoint="/api/admin/budget/calculate-cost"
        token={token}
        onUnauthorized={onLogout}
        renderSummary={({ rooms, result, onBack }) => (
          <CostSummary rooms={rooms} result={result} onBack={onBack} onRestart={() => setRun((n) => n + 1)} />
        )}
      />
    </div>
  )
}

function CostSummary({ rooms, result, onBack, onRestart }) {
  const { total, roomTotals } = result

  return (
    <div style={{ marginTop: 36 }}>
      <div style={{ display: 'flex', gap: 12, marginBottom: 24, flexWrap: 'wrap' }}>
        <button className="btn btn-outline" onClick={onBack}>
          ← Anterior
        </button>
        <button className="btn btn-outline" onClick={onRestart}>
          Nuevo cálculo
        </button>
      </div>
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
        <p style={{ fontSize: '0.85rem', color: 'var(--gray-400)' }}>Costo real (sin margen)</p>
        <p style={{ fontSize: 'clamp(1.8rem, 5vw, 2.6rem)', fontFamily: "'Archivo Black', sans-serif", marginTop: 6 }}>
          {formatMoney(total)}
        </p>
        <RoomReport rooms={rooms} roomTotals={roomTotals} total={total} />
      </div>
    </div>
  )
}
