import { useEffect, useState } from 'react'

const initialForm = { nombre: '', email: '', telefono: '', monto: '', mensaje: '' }
const API_URL = import.meta.env.VITE_API_URL

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
      window.fbq?.('track', 'Lead', { content_name: 'inversion' }, { eventID: eventId })
      window.fbq?.('trackCustom', 'LeadInversion', {}, { eventID: customEventId })
      setSent(true)
    } catch {
      setError('No pudimos enviar tu consulta. Probá de nuevo en un momento o escribinos a hola@fiflip.realestate.')
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
              <div className="invest-card" key={p.id}>
                <div className="invest-card-top">
                  <span>{STATUS_LABEL[p.status] || 'Fiflip'}</span>
                </div>
                <h3>{p.title}</h3>
                <p>{p.description}</p>
                {p.tea != null && (
                  <span className="invest-roi">
                    +{p.tea}% TEA {p.teaProjected ? 'est.' : 'real'}
                  </span>
                )}
              </div>
            ))}
          </div>
        )}

        <div className="invest-form-wrap">
          {sent ? (
            <div>
              <h3 style={{ fontSize: '1.8rem' }}>¡Gracias por tu interés!</h3>
              <p style={{ marginTop: 14, color: '#c9c9c9', lineHeight: 1.55, maxWidth: 480 }}>
                Un asesor de Fiflip se va a contactar con vos para compartirte el
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
              {error && <p style={{ color: '#ff8a7a', fontSize: '0.85rem' }}>{error}</p>}
              <button type="submit" className="btn btn-white" style={{ marginTop: 8 }} disabled={sending}>
                {sending ? 'Enviando…' : 'Quiero que me contacten →'}
              </button>
            </form>
          )}
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
          padding: 28px;
          min-width: 0;
        }
        .invest-card-top {
          display: flex;
          justify-content: space-between;
          font-size: 0.75rem;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          color: #8a8a8a;
        }
        .invest-status {
          color: var(--white);
        }
        .invest-card h3 {
          margin-top: 16px;
          font-size: 1.3rem;
        }
        .invest-card p {
          margin-top: 10px;
          color: #c9c9c9;
          line-height: 1.5;
          min-height: 66px;
        }
        .invest-roi {
          display: inline-block;
          margin-top: 14px;
          font-weight: 700;
          font-size: 0.85rem;
          border-top: 2px solid var(--white);
          padding-top: 12px;
          width: 100%;
        }
        .invest-form-wrap {
          margin-top: 70px;
          border: 2px solid var(--white);
          padding: 40px;
          max-width: 560px;
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
        }
        @media (max-width: 620px) {
          .invest-form-wrap { padding: 26px; }
        }
      `}</style>
    </section>
  )
}
