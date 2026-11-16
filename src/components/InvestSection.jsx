import { useEffect, useState } from 'react'
import { navigate } from '../router.js'

const initialForm = { nombre: '', email: '', telefono: '', monto: '', mensaje: '' }
const API_URL = import.meta.env.VITE_API_URL

const STEPS = [
  { n: '01', title: 'Te contactamos', text: 'Un asesor te comparte los proyectos disponibles y sus números.' },
  { n: '02', title: 'Elegís un proyecto', text: 'Cada proyecto tiene su estado de obra y su retorno proyectado.' },
  { n: '03', title: 'Seguís la obra', text: 'Te mantenemos al tanto del avance, de la compra a la venta.' },
]

const STATUS_LABEL = {
  EN_OBRA: 'En obra',
  TERMINADO: 'Terminado',
  BUSCANDO_INVERSORES: 'Buscando inversores',
}

export default function InvestSection() {
  const [form, setForm] = useState(initialForm)
  const [sent, setSent] = useState(false)
  const [sending, setSending] = useState(false)
  const [error, setError] = useState('')
  const [projects, setProjects] = useState([])

  useEffect(() => {
    fetch(`${API_URL}/api/projects`)
      .then((res) => (res.ok ? res.json() : []))
      .then((all) => setProjects(all.filter((p) => p.category === 'FLIP').slice(0, 3)))
      .catch(() => setProjects([]))
  }, [])

  const update = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setSending(true)
    const eventId = crypto.randomUUID()
    const customEventId = crypto.randomUUID()
    try {
      const res = await fetch(`${API_URL}/api/leads/investor`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, eventId, customEventId }),
      })
      if (!res.ok) throw new Error('request failed')
      setSent(true)
      try {
        window.fbq?.('track', 'Lead', { content_name: 'inversion' }, { eventID: eventId })
        window.fbq?.('trackCustom', 'LeadInversion', {}, { eventID: customEventId })
      } catch {
        // El tracking no debe afectar la confirmación al usuario: el envío ya se hizo.
      }
    } catch {
      setError('No pudimos enviar tu consulta. Probá de nuevo en un momento o escribinos a fiflip.ba@gmail.com.')
    } finally {
      setSending(false)
    }
  }

  return (
    <section id="inversion" className="section" style={{ background: 'var(--black)', color: 'var(--white)' }}>
      <div className="wrap">
        <p className="eyebrow" style={{ color: 'var(--white)' }}>
          Ala de inversión
        </p>
        <h2 style={{ fontSize: 'clamp(2rem, 4.5vw, 3.2rem)', marginTop: 16, maxWidth: 700 }}>
          Invertí en flipping inmobiliario.
        </h2>
        <p style={{ maxWidth: 560, marginTop: 18, color: '#c9c9c9', fontSize: '1.05rem', lineHeight: 1.55 }}>
          Compramos, renovamos y vendemos propiedades. Sumate como inversor a
          proyectos concretos con retorno proyectado y seguimiento de obra.
        </p>

        {projects.length > 0 && (
          <div id="oportunidades" className="invest-projects">
            {projects.map((p) => (
              <a
                className="invest-card"
                key={p.id}
                href={`/proyecto/${p.id}`}
                onClick={(e) => {
                  e.preventDefault()
                  navigate(`/proyecto/${p.id}`)
                }}
              >
                {p.coverImageUrl && (
                  <div className="invest-card-img">
                    <img src={p.coverImageUrl} alt="" loading="lazy" decoding="async" />
                    <span className="invest-status">{STATUS_LABEL[p.status] || 'FiFlip'}</span>
                  </div>
                )}
                <div className="invest-card-body">
                  {!p.coverImageUrl && <span className="invest-card-top">{STATUS_LABEL[p.status] || 'FiFlip'}</span>}
                  <h3>{p.title}</h3>
                  <p>{p.description}</p>
                  {p.tea != null && (
                    <span className="invest-roi">
                      <span className="invest-roi-num">+{p.tea}%</span>
                      <span>TEA {p.teaProjected ? 'estimada' : 'real'}</span>
                    </span>
                  )}
                </div>
              </a>
            ))}
          </div>
        )}

        <div className="invest-bottom">
        <div className="invest-steps">
          <h3 style={{ fontSize: '1.4rem' }}>Cómo funciona</h3>
          {STEPS.map((step) => (
            <div className="invest-step" key={step.n}>
              <span className="invest-step-num">{step.n}</span>
              <div>
                <h4>{step.title}</h4>
                <p>{step.text}</p>
              </div>
            </div>
          ))}
        </div>
        <div className="invest-form-wrap">
          {sent ? (
            <div>
              <h3 style={{ fontSize: '1.8rem' }}>¡Gracias por tu interés!</h3>
              <p style={{ marginTop: 14, color: '#c9c9c9', lineHeight: 1.55, maxWidth: 480 }}>
                Un asesor de FiFlip se va a contactar con vos para compartirte el
                detalle de los proyectos disponibles.
              </p>
              <button
                className="btn btn-white"
                style={{ marginTop: 24 }}
                onClick={() => {
                  setSent(false)
                  setForm(initialForm)
                }}
              >
                Enviar otra consulta
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="invest-form">
              <h3 style={{ fontSize: '1.4rem', marginBottom: 4 }}>Quiero invertir</h3>
              <div className="field">
                <label htmlFor="inv-nombre">Nombre</label>
                <input id="inv-nombre" required value={form.nombre} onChange={update('nombre')} placeholder="Tu nombre" />
              </div>
              <div className="field-row">
              <div className="field">
                <label htmlFor="inv-email">Email</label>
                <input
                  id="inv-email"
                  type="email"
                  required
                  value={form.email}
                  onChange={update('email')}
                  placeholder="vos@email.com"
                />
              </div>
              <div className="field">
                <label htmlFor="inv-telefono">Teléfono</label>
                <input
                  id="inv-telefono"
                  type="tel"
                  required
                  value={form.telefono}
                  onChange={update('telefono')}
                  placeholder="Ej: 11 5555-5555"
                />
              </div>
              </div>
              <div className="field">
                <label htmlFor="monto">Monto aproximado a invertir</label>
                <input id="monto" value={form.monto} onChange={update('monto')} placeholder="Ej: USD 20.000" />
              </div>
              <div className="field">
                <label htmlFor="inv-mensaje">Mensaje (opcional)</label>
                <textarea
                  id="inv-mensaje"
                  rows={3}
                  value={form.mensaje}
                  onChange={update('mensaje')}
                  placeholder="Contanos qué tipo de proyecto te interesa"
                />
              </div>
              {error && (
                <p className="form-error" role="alert">
                  {error}
                </p>
              )}
              <button type="submit" className="btn btn-white" style={{ marginTop: 8 }} disabled={sending}>
                {sending ? 'Enviando…' : 'Quiero que me contacten →'}
              </button>
            </form>
          )}
        </div>
        </div>
      </div>

      <style>{`
        .invest-projects {
          margin-top: 64px;
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 2px;
          background: var(--white);
          border: 2px solid var(--white);
        }
        .invest-card {
          background: var(--black);
          min-width: 0;
          display: flex;
          flex-direction: column;
          text-decoration: none;
          color: inherit;
          transition: background 0.2s ease;
        }
        .invest-card:hover { background: var(--gray-900); }
        .invest-card-img {
          position: relative;
          aspect-ratio: 16 / 10;
          overflow: hidden;
          border-bottom: 2px solid var(--white);
        }
        .invest-card-img img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          transition: transform 0.4s ease;
        }
        .invest-card:hover .invest-card-img img { transform: scale(1.04); }
        .invest-status {
          position: absolute;
          top: 14px;
          left: 14px;
          padding: 6px 10px;
          background: var(--white);
          color: var(--black);
          font-size: 0.7rem;
          font-weight: 700;
          letter-spacing: 0.08em;
          text-transform: uppercase;
        }
        .invest-card-body {
          padding: 24px 28px 28px;
          flex: 1;
          display: flex;
          flex-direction: column;
        }
        .invest-card-top {
          font-size: 0.75rem;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          color: #8a8a8a;
          margin-bottom: 16px;
        }
        .invest-card h3 {
          font-size: 1.3rem;
        }
        .invest-card p {
          margin-top: 10px;
          color: #c9c9c9;
          line-height: 1.5;
        }
        .invest-roi {
          display: flex;
          align-items: baseline;
          gap: 10px;
          margin-top: auto;
          padding-top: 18px;
          font-weight: 700;
          font-size: 0.8rem;
          text-transform: uppercase;
          letter-spacing: 0.06em;
          color: #c9c9c9;
        }
        .invest-roi-num {
          font-family: 'Archivo Black', sans-serif;
          font-size: 2rem;
          letter-spacing: -0.02em;
          color: var(--white);
        }
        .invest-bottom {
          margin-top: 70px;
          display: grid;
          grid-template-columns: 0.85fr 1.15fr;
          gap: 60px;
          align-items: start;
        }
        .invest-steps {
          display: flex;
          flex-direction: column;
          gap: 26px;
          min-width: 0;
        }
        .invest-step {
          display: flex;
          gap: 20px;
          padding-top: 22px;
          border-top: 2px solid var(--white);
        }
        .invest-step-num {
          font-family: 'Archivo Black', sans-serif;
          font-size: 0.8rem;
          color: #8a8a8a;
          letter-spacing: 0.1em;
          padding-top: 4px;
        }
        .invest-step h4 {
          font-size: 1.1rem;
        }
        .invest-step p {
          margin-top: 6px;
          color: #c9c9c9;
          line-height: 1.5;
        }
        .invest-form-wrap {
          border: 2px solid var(--white);
          padding: 40px;
          min-width: 0;
        }
        .invest-form {
          display: flex;
          flex-direction: column;
          gap: 18px;
        }
        .invest-form .field label {
          color: #c9c9c9;
        }
        .invest-form .field input,
        .invest-form .field textarea {
          border-color: #4d4d4d;
          color: var(--white);
        }
        .invest-form .field input::placeholder,
        .invest-form .field textarea::placeholder {
          color: #6b6b6b;
        }
        .invest-form .field input:focus,
        .invest-form .field textarea:focus {
          border-color: var(--white);
        }
        @media (max-width: 900px) {
          .invest-projects { grid-template-columns: 1fr; }
          .invest-bottom { grid-template-columns: 1fr; gap: 44px; }
        }
        @media (max-width: 620px) {
          .invest-form-wrap { padding: 26px; }
        }
      `}</style>
    </section>
  )
}
