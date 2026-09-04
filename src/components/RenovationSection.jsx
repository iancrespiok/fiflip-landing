import { useState } from 'react'
import { navigate } from '../router.js'

const USE_CASES = [
  {
    n: '01',
    title: 'Vender más caro',
    text: 'Preparamos tu propiedad para salir al mercado a un valor mayor al que tiene hoy.',
  },
  {
    n: '02',
    title: 'Lista para mudarte',
    text: 'Compraste una propiedad y querés dejarla a tu gusto antes de mudarte.',
  },
  {
    n: '03',
    title: 'Refaccionar mi espacio',
    text: 'Refaccionamos y/o remodelamos el espacio puntual que necesitás cambiar, sin preocupaciones; hacemos trabajos llave en mano.',
  },
]

const initialForm = {
  nombre: '',
  email: '',
  telefono: '',
  tipo: 'Vender más caro',
  ciudad: '',
  medidas: '',
  descripcion: '',
}

const API_URL = import.meta.env.VITE_API_URL

const CUSTOM_EVENT_BY_TIPO = {
  'Vender más caro': 'LeadVenderMasCaro',
  'Lista para mudarte': 'LeadListoParaMudarte',
  'Refaccionar mi espacio': 'LeadRefaccion',
}

export default function RenovationSection() {
  const [form, setForm] = useState(initialForm)
  const [files, setFiles] = useState([])
  const [sent, setSent] = useState(false)
  const [sending, setSending] = useState(false)
  const [error, setError] = useState('')

  const update = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }))

  const handleFiles = (e) => {
    setFiles(Array.from(e.target.files || []))
  }

  const uploadPhoto = async (file) => {
    const body = new FormData()
    body.append('file', file)
    const res = await fetch(`${API_URL}/api/leads/uploads`, { method: 'POST', body })
    if (!res.ok) throw new Error('upload failed')
    const { url } = await res.json()
    return url
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setSending(true)
    const eventId = crypto.randomUUID()
    const customEventId = crypto.randomUUID()
    try {
      const fotoUrls = await Promise.all(files.map(uploadPhoto))
      const res = await fetch(`${API_URL}/api/leads/renovation`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          eventId,
          customEventId,
          fotoUrls,
        }),
      })
      if (!res.ok) throw new Error('request failed')
      setSent(true)
      try {
        window.fbq?.('track', 'Lead', { content_name: 'renovacion', content_category: form.tipo }, { eventID: eventId })
        const customEventName = CUSTOM_EVENT_BY_TIPO[form.tipo] || 'LeadRenovacionOtro'
        window.fbq?.('trackCustom', customEventName, { content_category: form.tipo }, { eventID: customEventId })
      } catch {
        // El tracking no debe afectar la confirmación al usuario: el envío ya se hizo.
      }
    } catch {
      setError('No pudimos enviar tu solicitud. Probá de nuevo en un momento o escribinos a fiflip.ba@gmail.com.')
    } finally {
      setSending(false)
    }
  }

  return (
    <section id="renovacion" className="section">
      <div className="wrap">
        <p className="eyebrow">Ala de renovación</p>
        <h2 style={{ fontSize: 'clamp(2rem, 4.5vw, 3.2rem)', marginTop: 16, maxWidth: 700 }}>
          Renová tu espacio. Presupuesto en 24hs.
        </h2>
        <p style={{ maxWidth: 560, marginTop: 18, color: 'var(--gray-700)', fontSize: '1.05rem', lineHeight: 1.55 }}>
          Contanos qué querés renovar, mandanos fotos y medidas, y te devolvemos
          un presupuesto en un día hábil.
        </p>

        <button
          className="btn btn-outline"
          style={{ marginTop: 24 }}
          onClick={(e) => {
            e.preventDefault()
            navigate('/presupuesto')
          }}
        >
          Calculá un presupuesto aproximado →
        </button>

        <div className="reno-grid">
          <div className="reno-cases">
            {USE_CASES.map((c) => (
              <div className="reno-case" key={c.n}>
                <span className="reno-case-num">{c.n}</span>
                <h3>{c.title}</h3>
                <p>{c.text}</p>
              </div>
            ))}
          </div>

          <div className="reno-form-wrap">
            {sent ? (
              <div className="reno-success">
                <h3>¡Listo!</h3>
                <p>
                  Recibimos tu solicitud. Nuestro equipo va a revisar las fotos y
                  medidas y te va a enviar un presupuesto dentro de las próximas
                  24 horas a {form.email || 'tu email'}.
                </p>
                <button
                  className="btn btn-outline"
                  style={{ marginTop: 24 }}
                  onClick={() => {
                    setSent(false)
                    setForm(initialForm)
                    setFiles([])
                  }}
                >
                  Enviar otra solicitud
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="reno-form">
                <div className="field">
                  <label htmlFor="nombre">Nombre</label>
                  <input id="nombre" required value={form.nombre} onChange={update('nombre')} placeholder="Tu nombre" />
                </div>
                <div className="field">
                  <label htmlFor="email">Email</label>
                  <input
                    id="email"
                    type="email"
                    required
                    value={form.email}
                    onChange={update('email')}
                    placeholder="vos@email.com"
                  />
                </div>
                <div className="field">
                  <label htmlFor="telefono">Teléfono</label>
                  <input
                    id="telefono"
                    type="tel"
                    required
                    value={form.telefono}
                    onChange={update('telefono')}
                    placeholder="Ej: 11 5555-5555"
                  />
                </div>
                <div className="field">
                  <label htmlFor="tipo">Tipo de proyecto</label>
                  <select id="tipo" value={form.tipo} onChange={update('tipo')}>
                    <option>Vender más caro</option>
                    <option>Lista para mudarte</option>
                    <option>Refaccionar mi espacio</option>
                    <option>Otro</option>
                  </select>
                </div>
                <div className="field">
                  <label htmlFor="ciudad">Ciudad / dirección</label>
                  <input id="ciudad" value={form.ciudad} onChange={update('ciudad')} placeholder="Ciudad, barrio" />
                </div>
                <div className="field">
                  <label htmlFor="medidas">Medidas aproximadas</label>
                  <input
                    id="medidas"
                    value={form.medidas}
                    onChange={update('medidas')}
                    placeholder="Ej: 45 m², cocina 3x4"
                  />
                </div>
                <div className="field">
                  <label htmlFor="descripcion">Contanos qué querés renovar</label>
                  <textarea
                    id="descripcion"
                    rows={4}
                    value={form.descripcion}
                    onChange={update('descripcion')}
                    placeholder="Describí el espacio y qué te gustaría cambiar"
                  />
                </div>
                <div className="field">
                  <label htmlFor="fotos">Fotos del espacio</label>
                  <input id="fotos" type="file" accept="image/*" multiple onChange={handleFiles} />
                  {files.length > 0 && (
                    <span style={{ fontSize: '0.8rem', color: 'var(--gray-400)' }}>
                      {files.length} archivo{files.length > 1 ? 's' : ''} seleccionado{files.length > 1 ? 's' : ''}
                    </span>
                  )}
                </div>
                {error && <p style={{ color: '#c0392b', fontSize: '0.85rem' }}>{error}</p>}
                <button type="submit" className="btn" style={{ marginTop: 8 }} disabled={sending}>
                  {sending ? 'Enviando…' : 'Pedir presupuesto →'}
                </button>
              </form>
            )}
          </div>
        </div>
      </div>

      <style>{`
        .reno-grid {
          display: grid;
          grid-template-columns: 0.85fr 1.15fr;
          gap: 60px;
          margin-top: 64px;
        }
        .reno-cases {
          display: flex;
          flex-direction: column;
          gap: 34px;
          min-width: 0;
        }
        .reno-case {
          padding-top: 22px;
          border-top: 2px solid var(--black);
        }
        .reno-case-num {
          font-family: 'Archivo Black', sans-serif;
          font-size: 0.8rem;
          color: var(--gray-400);
          letter-spacing: 0.1em;
        }
        .reno-case h3 {
          margin-top: 8px;
          font-size: 1.25rem;
        }
        .reno-case p {
          margin-top: 8px;
          color: var(--gray-700);
          line-height: 1.5;
        }
        .reno-form-wrap {
          background: var(--gray-100);
          border: 2px solid var(--black);
          padding: 36px;
          min-width: 0;
        }
        .reno-form {
          display: flex;
          flex-direction: column;
          gap: 20px;
        }
        .reno-success h3 {
          font-size: 1.8rem;
        }
        .reno-success p {
          margin-top: 14px;
          line-height: 1.55;
          color: var(--gray-700);
        }
        @media (max-width: 860px) {
          .reno-grid { grid-template-columns: 1fr; gap: 44px; }
          .reno-form-wrap { padding: 26px; }
        }
      `}</style>
    </section>
  )
}
