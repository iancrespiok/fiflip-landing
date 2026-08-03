import { useEffect, useState } from 'react'

const API_URL = import.meta.env.VITE_API_URL

const TABS = [
  { key: 'RENOVATION', label: 'Refacciones' },
  { key: 'FLIP', label: 'Flips' },
]

export default function PortfolioSection() {
  const [projects, setProjects] = useState([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState('RENOVATION')
  const [selected, setSelected] = useState(null)

  useEffect(() => {
    fetch(`${API_URL}/api/projects`)
      .then((res) => (res.ok ? res.json() : []))
      .then(setProjects)
      .catch(() => setProjects([]))
      .finally(() => setLoading(false))
  }, [])

  const filtered = projects.filter((p) => p.category === tab)

  return (
    <section id="portfolio" className="section">
      <div className="wrap">
        <p className="eyebrow">Nuestro trabajo</p>
        <h2 style={{ fontSize: 'clamp(2rem, 4.5vw, 3.2rem)', marginTop: 16, maxWidth: 700 }}>
          Proyectos de Fiflip.
        </h2>
        <p style={{ maxWidth: 560, marginTop: 18, color: 'var(--gray-700)', fontSize: '1.05rem', lineHeight: 1.55 }}>
          Refacciones entregadas y proyectos de flipping, con fotos de antes y después.
        </p>

        <div className="portfolio-tabs">
          {TABS.map((t) => (
            <button
              key={t.key}
              className={`portfolio-tab ${tab === t.key ? 'active' : ''}`}
              onClick={() => setTab(t.key)}
            >
              {t.label}
            </button>
          ))}
        </div>

        {loading ? (
          <p style={{ marginTop: 40, color: 'var(--gray-400)' }}>Cargando proyectos…</p>
        ) : filtered.length === 0 ? (
          <p style={{ marginTop: 40, color: 'var(--gray-400)' }}>
            Todavía no hay proyectos cargados en esta categoría.
          </p>
        ) : (
          <div className="portfolio-grid">
            {filtered.map((p) => (
              <button key={p.id} className="portfolio-card" onClick={() => setSelected(p)}>
                <div className="portfolio-card-img" style={{ backgroundImage: `url(${p.coverImageUrl})` }} />
                <div className="portfolio-card-body">
                  <h3>{p.title}</h3>
                  <p>{p.description}</p>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {selected && <ProjectModal project={selected} onClose={() => setSelected(null)} />}

      <style>{`
        .portfolio-tabs {
          display: flex;
          gap: 12px;
          margin-top: 48px;
        }
        .portfolio-tab {
          padding: 12px 24px;
          border: 2px solid var(--black);
          background: transparent;
          font-weight: 700;
          font-size: 0.85rem;
          text-transform: uppercase;
          letter-spacing: 0.04em;
        }
        .portfolio-tab.active {
          background: var(--black);
          color: var(--white);
        }
        .portfolio-grid {
          margin-top: 40px;
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 24px;
        }
        .portfolio-card {
          text-align: left;
          background: none;
          border: 2px solid var(--black);
          padding: 0;
          min-width: 0;
          overflow: hidden;
        }
        .portfolio-card-img {
          aspect-ratio: 4 / 3;
          background-size: cover;
          background-position: center;
          background-color: var(--gray-200);
        }
        .portfolio-card-body {
          padding: 20px;
        }
        .portfolio-card-body h3 {
          font-size: 1.1rem;
        }
        .portfolio-card-body p {
          margin-top: 8px;
          font-size: 0.9rem;
          color: var(--gray-700);
          line-height: 1.5;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
        @media (max-width: 900px) {
          .portfolio-grid { grid-template-columns: 1fr 1fr; }
        }
        @media (max-width: 620px) {
          .portfolio-grid { grid-template-columns: 1fr; }
        }
      `}</style>
    </section>
  )
}

function ProjectModal({ project, onClose }) {
  return (
    <div className="portfolio-modal-backdrop" onClick={onClose}>
      <div className="portfolio-modal" onClick={(e) => e.stopPropagation()}>
        <button className="portfolio-modal-close" onClick={onClose} aria-label="Cerrar">
          ✕
        </button>
        <h3>{project.title}</h3>
        <p className="portfolio-modal-desc">{project.description}</p>

        {(project.beforeImageUrls?.length > 0 || project.afterImageUrls?.length > 0) && (
          <div className="portfolio-modal-columns">
            <div className="portfolio-modal-col">
              <p className="portfolio-modal-label">Antes</p>
              <div className="portfolio-modal-stack">
                {project.beforeImageUrls?.map((url) => (
                  <img key={url} src={url} alt="Antes" />
                ))}
              </div>
            </div>
            <div className="portfolio-modal-col portfolio-modal-col-after">
              <p className="portfolio-modal-label">Después</p>
              <div className="portfolio-modal-stack">
                {project.afterImageUrls?.map((url) => (
                  <img key={url} src={url} alt="Después" />
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      <style>{`
        .portfolio-modal-backdrop {
          position: fixed;
          inset: 0;
          background: rgba(10,10,10,0.85);
          z-index: 100;
          display: flex;
          align-items: flex-start;
          justify-content: center;
          overflow-y: auto;
          padding: 40px 20px;
        }
        .portfolio-modal {
          background: var(--white);
          border: 2px solid var(--black);
          max-width: 920px;
          width: 100%;
          padding: 36px;
          position: relative;
        }
        .portfolio-modal-close {
          position: absolute;
          top: 20px;
          right: 20px;
          background: none;
          border: 2px solid var(--black);
          width: 36px;
          height: 36px;
          font-size: 1rem;
        }
        .portfolio-modal h3 {
          font-size: 1.6rem;
          max-width: 90%;
        }
        .portfolio-modal-desc {
          margin-top: 14px;
          color: var(--gray-700);
          line-height: 1.55;
        }
        .portfolio-modal-columns {
          margin-top: 32px;
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 0;
          border-top: 2px solid var(--black);
        }
        .portfolio-modal-col {
          padding: 20px 20px 0 0;
          min-width: 0;
        }
        .portfolio-modal-col-after {
          padding-left: 20px;
          padding-right: 0;
          border-left: 2px solid var(--black);
        }
        .portfolio-modal-label {
          margin-top: 16px;
          font-size: 0.75rem;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.08em;
        }
        .portfolio-modal-stack {
          margin-top: 12px;
          display: flex;
          flex-direction: column;
          gap: 10px;
        }
        .portfolio-modal-stack img {
          width: 100%;
          height: auto;
          border: 2px solid var(--black);
        }
        @media (max-width: 620px) {
          .portfolio-modal-columns { grid-template-columns: 1fr; }
          .portfolio-modal-col-after {
            border-left: none;
            border-top: 2px solid var(--black);
            padding-left: 0;
            margin-top: 20px;
            padding-top: 20px;
          }
        }
      `}</style>
    </div>
  )
}
