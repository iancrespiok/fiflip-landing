import { useEffect, useState } from 'react'
import { navigate } from '../router.js'

const API_URL = import.meta.env.VITE_API_URL

const TABS = [
  { key: 'RENOVATION', label: 'Refacciones' },
  { key: 'FLIP', label: 'Flips' },
]

export default function PortfolioSection() {
  const [projects, setProjects] = useState([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState('RENOVATION')

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
              <a
                key={p.id}
                href={`/proyecto/${p.id}`}
                className="portfolio-card"
                onClick={(e) => {
                  e.preventDefault()
                  navigate(`/proyecto/${p.id}`)
                }}
              >
                <div className="portfolio-card-img" style={{ backgroundImage: `url(${p.coverImageUrl})` }} />
                <div className="portfolio-card-body">
                  <h3>{p.title}</h3>
                  <p>{p.description}</p>
                </div>
              </a>
            ))}
          </div>
        )}
      </div>

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
          display: block;
          text-align: left;
          text-decoration: none;
          color: inherit;
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
