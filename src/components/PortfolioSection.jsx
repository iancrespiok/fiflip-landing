import { useEffect, useState } from 'react'
import { navigate } from '../router.js'

const API_URL = import.meta.env.VITE_API_URL

const TABS = [
  { key: 'FLIP', label: 'Flips' },
  { key: 'RENOVATION', label: 'Refacciones' },
]

export default function PortfolioSection() {
  const [projects, setProjects] = useState([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState('FLIP')

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
          Proyectos de FiFlip.
        </h2>
        <p style={{ maxWidth: 560, marginTop: 18, color: 'var(--gray-700)', fontSize: '1.05rem', lineHeight: 1.55 }}>
          Proyectos de flipping y refacciones entregadas, con fotos de antes y después.
        </p>

        <div className="portfolio-tabs" role="tablist">
          {TABS.map((t) => {
            const count = projects.filter((p) => p.category === t.key).length
            return (
              <button
                key={t.key}
                role="tab"
                aria-selected={tab === t.key}
                className={`portfolio-tab ${tab === t.key ? 'active' : ''}`}
                onClick={() => setTab(t.key)}
              >
                {t.label}
                {!loading && <span className="portfolio-tab-count">{count}</span>}
              </button>
            )
          })}
        </div>

        {loading ? (
          <div className="portfolio-grid" aria-busy="true" aria-label="Cargando proyectos">
            {[0, 1, 2].map((i) => (
              <div key={i} className="portfolio-card portfolio-card-skeleton">
                <div className="portfolio-card-img skeleton" />
                <div className="portfolio-card-body">
                  <div className="skeleton" style={{ height: 18, width: '70%' }} />
                  <div className="skeleton" style={{ height: 12, width: '100%', marginTop: 14 }} />
                  <div className="skeleton" style={{ height: 12, width: '80%', marginTop: 8 }} />
                </div>
              </div>
            ))}
          </div>
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
                <div className="portfolio-card-img">
                  <img src={p.coverImageUrl} alt="" loading="lazy" decoding="async" />
                </div>
                <div className="portfolio-card-body">
                  <h3>{p.title}</h3>
                  <p>{p.description}</p>
                  <span className="portfolio-card-cta">
                    Ver antes y después <span aria-hidden="true">→</span>
                  </span>
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
        .portfolio-tab {
          display: inline-flex;
          align-items: center;
          gap: 10px;
        }
        .portfolio-tab.active {
          background: var(--black);
          color: var(--white);
        }
        .portfolio-tab-count {
          min-width: 22px;
          padding: 2px 6px;
          font-size: 0.75rem;
          border: 2px solid currentColor;
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
          display: flex;
          flex-direction: column;
          transition: transform 0.15s ease, box-shadow 0.15s ease;
        }
        a.portfolio-card:hover {
          transform: translate(-4px, -4px);
          box-shadow: 6px 6px 0 var(--black);
        }
        .portfolio-card-img {
          aspect-ratio: 4 / 3;
          background-color: var(--gray-200);
          overflow: hidden;
          border-bottom: 2px solid var(--black);
        }
        .portfolio-card-img img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          display: block;
          transition: transform 0.4s ease;
        }
        a.portfolio-card:hover .portfolio-card-img img {
          transform: scale(1.04);
        }
        .portfolio-card-cta {
          display: inline-flex;
          gap: 8px;
          margin-top: auto;
          padding-top: 16px;
          font-size: 0.75rem;
          font-weight: 700;
          letter-spacing: 0.08em;
          text-transform: uppercase;
        }
        .portfolio-card-cta span {
          transition: transform 0.15s ease;
        }
        a.portfolio-card:hover .portfolio-card-cta span {
          transform: translateX(6px);
        }
        .portfolio-card-body {
          padding: 20px;
          flex: 1;
          display: flex;
          flex-direction: column;
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
