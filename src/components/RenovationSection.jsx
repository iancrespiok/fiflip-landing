import { useEffect, useRef, useState } from 'react'
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

  const formRef = useRef(null)

  // Elegir un caso de uso lo deja seleccionado en el formulario.
  const pickCase = (title) => {
    setForm((f) => ({ ...f, tipo: title }))
    setSent(false)
    formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  const handleFiles = (e) => {
    const picked = Array.from(e.target.files || [])
    setFiles((prev) => [...prev, ...picked])
    e.target.value = ''
  }

  const removeFile = (index) => setFiles((prev) => prev.filter((_, i) => i !== index))

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

        <a
          href="/presupuesto"
          className="reno-calc"
          onClick={(e) => {
            e.preventDefault()
            navigate('/presupuesto')
          }}
        >
          <span>
            <strong>¿Querés un número ya?</strong>
            <span className="reno-calc-sub">Calculá un presupuesto aproximado ambiente por ambiente, en 2 minutos.</span>
          </span>
          <span className="reno-calc-arrow" aria-hidden="true">→</span>
        </a>

        <div className="reno-grid">
          <div className="reno-cases">
            {USE_CASES.map((c) => (
              <button
                type="button"
                className={`reno-case ${form.tipo === c.title ? 'active' : ''}`}
                key={c.n}
                onClick={() => pickCase(c.title)}
                aria-pressed={form.tipo === c.title}
              >
                <span className="reno-case-num">{c.n}</span>
                <h3>{c.title}</h3>
                <p>{c.text}</p>
                <span className="reno-case-cta">{form.tipo === c.title ? 'Seleccionado ✓' : 'Elegir →'}</span>
              </button>
            ))}
          </div>

          <div className="reno-form-wrap" id="renovacion-form" ref={formRef}>
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
                <h3 style={{ fontSize: '1.4rem' }}>Pedí tu presupuesto</h3>
                <div className="field">
                  <label htmlFor="nombre">Nombre</label>
                  <input id="nombre" required value={form.nombre} onChange={update('nombre')} placeholder="Tu nombre" />
                </div>
                <div className="field-row">
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
                <div className="field-row">
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
                  <span className="field-label">Fotos del espacio</span>
                  <PhotoPicker files={files} onAdd={handleFiles} onRemove={removeFile} />
                </div>
                {error && (
                  <p className="form-error" role="alert">
                    {error}
                  </p>
                )}
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
        .reno-calc {
          margin-top: 32px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 24px;
          max-width: 640px;
          padding: 20px 24px;
          border: 2px solid var(--black);
          text-decoration: none;
          transition: transform 0.15s ease, box-shadow 0.15s ease;
        }
        .reno-calc:hover {
          transform: translate(-3px, -3px);
          box-shadow: 5px 5px 0 var(--black);
        }
        .reno-calc strong {
          display: block;
          font-family: 'Archivo Black', sans-serif;
          text-transform: uppercase;
          font-size: 1.05rem;
        }
        .reno-calc-sub {
          display: block;
          margin-top: 4px;
          color: var(--gray-700);
          font-size: 0.95rem;
        }
        .reno-calc-arrow {
          flex-shrink: 0;
          width: 48px;
          height: 48px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: var(--black);
          color: var(--white);
          font-size: 1.3rem;
        }
        .reno-cases {
          display: flex;
          flex-direction: column;
          gap: 16px;
          min-width: 0;
        }
        .reno-case {
          display: block;
          width: 100%;
          text-align: left;
          font: inherit;
          color: inherit;
          background: transparent;
          padding: 22px 22px 20px;
          border: 2px solid var(--gray-200);
          border-top-color: var(--black);
          transition: border-color 0.15s ease, background 0.15s ease, color 0.15s ease;
        }
        .reno-case:hover {
          border-color: var(--black);
        }
        .reno-case.active {
          border-color: var(--black);
          box-shadow: inset 8px 0 0 var(--black);
          padding-left: 30px;
        }
        .reno-case-cta {
          display: inline-block;
          margin-top: 14px;
          font-size: 0.75rem;
          font-weight: 700;
          letter-spacing: 0.08em;
          text-transform: uppercase;
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
          scroll-margin-top: 100px;
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
        .field-label {
          font-size: 0.75rem;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.08em;
        }
        @media (max-width: 860px) {
          .reno-grid { grid-template-columns: 1fr; gap: 44px; }
          .reno-form-wrap { padding: 26px; }
        }
      `}</style>
    </section>
  )
}

function PhotoPicker({ files, onAdd, onRemove }) {
  const [previews, setPreviews] = useState([])

  useEffect(() => {
    const urls = files.map((f) => URL.createObjectURL(f))
    setPreviews(urls)
    return () => urls.forEach((u) => URL.revokeObjectURL(u))
  }, [files])

  return (
    <div style={{ position: 'relative' }}>
      <input id="fotos" type="file" accept="image/*" multiple onChange={onAdd} className="photo-input" />
      <label htmlFor="fotos" className="photo-drop">
        <span className="photo-drop-icon" aria-hidden="true">+</span>
        <span>
          <strong>{files.length ? 'Sumar más fotos' : 'Subí fotos del espacio'}</strong>
          <span className="photo-drop-sub">Nos ayudan a darte un presupuesto más preciso.</span>
        </span>
      </label>
      {previews.length > 0 && (
        <ul className="photo-grid">
          {previews.map((url, i) => (
            <li key={url}>
              <img src={url} alt={`Foto ${i + 1}`} />
              <button type="button" onClick={() => onRemove(i)} aria-label={`Quitar foto ${i + 1}`}>
                ✕
              </button>
            </li>
          ))}
        </ul>
      )}
      <style>{`
        .photo-input {
          position: absolute;
          top: 0;
          left: 0;
          width: 1px;
          height: 1px;
          opacity: 0;
          pointer-events: none;
        }
        .photo-drop {
          display: flex;
          align-items: center;
          gap: 16px;
          padding: 16px;
          border: 2px dashed var(--gray-700);
          cursor: pointer;
          transition: border-color 0.15s ease, background 0.15s ease;
        }
        .photo-drop:hover,
        .photo-input:focus-visible + .photo-drop {
          border-style: solid;
          border-color: var(--black);
          background: var(--white);
        }
        .photo-input:focus-visible + .photo-drop { outline: 3px solid var(--black); outline-offset: 3px; }
        .photo-drop-icon {
          flex-shrink: 0;
          width: 40px;
          height: 40px;
          display: flex;
          align-items: center;
          justify-content: center;
          border: 2px solid var(--black);
          font-size: 1.4rem;
          font-weight: 700;
        }
        .field .photo-drop {
          text-transform: none;
          letter-spacing: normal;
          font-weight: 400;
          font-size: 1rem;
        }
        .photo-drop strong {
          display: block;
          font-size: 0.95rem;
        }
        .photo-drop-sub {
          display: block;
          margin-top: 2px;
          font-size: 0.8rem;
          color: var(--gray-400);
        }
        .photo-grid {
          list-style: none;
          margin-top: 12px;
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(76px, 1fr));
          gap: 8px;
        }
        .photo-grid li {
          position: relative;
          aspect-ratio: 1;
          border: 2px solid var(--black);
        }
        .photo-grid img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }
        .photo-grid button {
          position: absolute;
          top: 4px;
          right: 4px;
          width: 24px;
          height: 24px;
          border: none;
          background: var(--black);
          color: var(--white);
          font-size: 0.7rem;
        }
      `}</style>
    </div>
  )
}
