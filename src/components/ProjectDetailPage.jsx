import { useEffect, useState } from 'react'
import { navigate } from '../router.js'
import Logo from './Logo.jsx'

const API_URL = import.meta.env.VITE_API_URL

export default function ProjectDetailPage({ id }) {
  const [project, setProject] = useState(null)
  const [notFound, setNotFound] = useState(false)
  const [lightbox, setLightbox] = useState(null)

  useEffect(() => {
    window.scrollTo(0, 0)
    fetch(`${API_URL}/api/projects/${id}`)
      .then((res) => {
        if (!res.ok) throw new Error('not found')
        return res.json()
      })
      .then(setProject)
      .catch(() => setNotFound(true))
  }, [id])

  useEffect(() => {
    if (project) document.title = `${project.title} | FiFlip`
    else if (notFound) document.title = 'Proyecto no encontrado | FiFlip'
  }, [project, notFound])

  if (notFound) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 20 }}>
        <p>No encontramos este proyecto.</p>
        <button className="btn" onClick={() => navigate('/')}>
          Volver al inicio
        </button>
      </div>
    )
  }

  if (!project) {
    return <div style={{ minHeight: '100vh' }} />
  }

  return (
    <div>
      <header style={{ background: 'var(--black)' }}>
        <div className="wrap" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: 78 }}>
          <a
            href="/"
            onClick={(e) => {
              e.preventDefault()
              navigate('/')
            }}
            style={{ textDecoration: 'none' }}
          >
            <Logo variant="light" />
          </a>
          <button
            className="btn"
            style={{ background: 'transparent', border: '2px solid var(--white)', color: 'var(--white)' }}
            onClick={() => (window.history.length > 1 ? window.history.back() : navigate('/'))}
          >
            ← Volver
          </button>
        </div>
      </header>

      <div className="wrap" style={{ paddingTop: 56, paddingBottom: 40 }}>
        <p className="eyebrow">{project.category === 'FLIP' ? 'Flip' : 'Refacción'}</p>
        <h1 style={{ fontSize: 'clamp(2rem, 5vw, 3.4rem)', marginTop: 16, maxWidth: 800 }}>{project.title}</h1>
        <p style={{ maxWidth: 640, marginTop: 20, color: 'var(--gray-700)', fontSize: '1.1rem', lineHeight: 1.6 }}>
          {project.description}
        </p>
      </div>

      {project.beforeImageUrls?.length > 0 && (
        <section style={{ background: 'var(--black)', padding: '48px 0' }}>
          <div className="wrap">
            <p className="eyebrow" style={{ color: 'var(--white)' }}>
              Antes
            </p>
          </div>
          <Carousel images={project.beforeImageUrls} alt="Antes" onOpen={(i) => setLightbox({ set: project.beforeImageUrls, index: i })} />
        </section>
      )}

      {project.afterImageUrls?.length > 0 && (
        <section style={{ background: 'var(--white)', padding: '48px 0' }}>
          <div className="wrap">
            <p className="eyebrow">Después</p>
          </div>
          <Carousel images={project.afterImageUrls} alt="Después" onOpen={(i) => setLightbox({ set: project.afterImageUrls, index: i })} />
        </section>
      )}

      <section className="pd-cta">
        <div className="wrap pd-cta-inner">
          <div>
            <p className="eyebrow" style={{ color: 'var(--white)' }}>
              {project.category === 'FLIP' ? 'Invertí con FiFlip' : 'Tu próximo proyecto'}
            </p>
            <h2>{project.category === 'FLIP' ? 'Sumate al próximo flip.' : '¿Querés algo así en tu casa?'}</h2>
          </div>
          <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
            <a
              href={project.category === 'FLIP' ? '/#inversion' : '/#renovacion-form'}
              className="btn btn-white"
              onClick={(e) => {
                e.preventDefault()
                goToSection(project.category === 'FLIP' ? 'inversion' : 'renovacion-form')
              }}
            >
              {project.category === 'FLIP' ? 'Quiero invertir →' : 'Pedir presupuesto →'}
            </a>
            <a
              href="/#portfolio"
              className="btn"
              style={{ background: 'transparent', border: '2px solid var(--white)', color: 'var(--white)' }}
              onClick={(e) => {
                e.preventDefault()
                goToSection('portfolio')
              }}
            >
              Ver más proyectos
            </a>
          </div>
        </div>
        <style>{`
          .pd-cta {
            background: var(--black);
            color: var(--white);
            padding: 72px 0 112px;
            border-top: 2px solid var(--white);
          }
          .pd-cta-inner {
            display: flex;
            align-items: flex-end;
            justify-content: space-between;
            gap: 32px;
            flex-wrap: wrap;
          }
          .pd-cta h2 {
            margin-top: 16px;
            font-size: clamp(1.8rem, 4vw, 2.8rem);
            max-width: 620px;
          }
        `}</style>
      </section>

      {lightbox && (
        <Lightbox
          images={lightbox.set}
          index={lightbox.index}
          onClose={() => setLightbox(null)}
          onNavigate={(i) => setLightbox((lb) => ({ ...lb, index: i }))}
        />
      )}
    </div>
  )
}

// Vuelve a la landing y baja hasta la sección (la landing se monta recién después de navegar).
function goToSection(id, tries = 20) {
  if (tries === 20) navigate('/')
  const el = document.getElementById(id)
  if (el) el.scrollIntoView()
  else if (tries > 0) requestAnimationFrame(() => goToSection(id, tries - 1))
}

function Carousel({ images, alt, onOpen }) {
  return (
    <div className="pd-carousel">
      {images.map((url, i) => (
        <button key={url} className="pd-carousel-item" onClick={() => onOpen(i)}>
          <img src={url} alt={alt} loading="lazy" decoding="async" />
        </button>
      ))}
      <style>{`
        .pd-carousel {
          margin-top: 24px;
          display: flex;
          gap: 16px;
          overflow-x: auto;
          padding: 0 24px;
          scroll-snap-type: x proximity;
        }
        .pd-carousel-item {
          flex-shrink: 0;
          scroll-snap-align: start;
          border: none;
          padding: 0;
          background: none;
          cursor: pointer;
          width: min(80vw, 520px);
        }
        .pd-carousel-item img {
          width: 100%;
          height: min(60vw, 380px);
          object-fit: cover;
          display: block;
        }
      `}</style>
    </div>
  )
}

function Lightbox({ images, index, onClose, onNavigate }) {
  const hasPrev = index > 0
  const hasNext = index < images.length - 1

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') onClose()
      else if (e.key === 'ArrowLeft' && hasPrev) onNavigate(index - 1)
      else if (e.key === 'ArrowRight' && hasNext) onNavigate(index + 1)
    }
    window.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    return () => {
      window.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
    }
  }, [index, hasPrev, hasNext, onClose, onNavigate])

  return (
    <div className="pd-lightbox" onClick={onClose} role="dialog" aria-modal="true" aria-label="Galería de fotos">
      {images.length > 1 && (
        <span className="pd-lightbox-count">
          {index + 1} / {images.length}
        </span>
      )}
      <button className="pd-lightbox-close" onClick={onClose} aria-label="Cerrar">
        ✕
      </button>
      {hasPrev && (
        <button
          className="pd-lightbox-nav pd-lightbox-prev"
          onClick={(e) => {
            e.stopPropagation()
            onNavigate(index - 1)
          }}
          aria-label="Anterior"
        >
          ‹
        </button>
      )}
      <img src={images[index]} alt="" onClick={(e) => e.stopPropagation()} />
      {hasNext && (
        <button
          className="pd-lightbox-nav pd-lightbox-next"
          onClick={(e) => {
            e.stopPropagation()
            onNavigate(index + 1)
          }}
          aria-label="Siguiente"
        >
          ›
        </button>
      )}
      <style>{`
        .pd-lightbox {
          position: fixed;
          inset: 0;
          background: rgba(0,0,0,0.92);
          z-index: 200;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 20px;
        }
        .pd-lightbox img {
          max-width: 100%;
          max-height: 90vh;
          object-fit: contain;
        }
        .pd-lightbox-count {
          position: absolute;
          top: 28px;
          left: 24px;
          color: var(--white);
          font-weight: 700;
          font-size: 0.85rem;
          letter-spacing: 0.1em;
        }
        .pd-lightbox-close {
          position: absolute;
          top: 20px;
          right: 20px;
          background: none;
          border: 2px solid var(--white);
          color: var(--white);
          width: 40px;
          height: 40px;
          font-size: 1.1rem;
        }
        .pd-lightbox-nav {
          position: absolute;
          top: 50%;
          transform: translateY(-50%);
          background: none;
          border: 2px solid var(--white);
          color: var(--white);
          width: 48px;
          height: 48px;
          font-size: 1.6rem;
          line-height: 1;
        }
        .pd-lightbox-prev { left: 20px; }
        .pd-lightbox-next { right: 20px; }
        @media (max-width: 620px) {
          .pd-lightbox-nav { width: 36px; height: 36px; font-size: 1.2rem; }
        }
      `}</style>
    </div>
  )
}
