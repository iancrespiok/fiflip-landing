import { useEffect, useState } from 'react'
import Logo from './Logo.jsx'

// En el mismo orden en que aparecen las secciones en la página.
const LINKS = [
  { href: '#renovacion', label: 'Renovación' },
  { href: '#portfolio', label: 'Proyectos' },
  { href: '#inversion', label: 'Inversión' },
  { href: '#contacto', label: 'Contacto' },
]

export default function Header() {
  const [scrolled, setScrolled] = useState(false)
  const [open, setOpen] = useState(false)
  const [active, setActive] = useState('')

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  // Marca en el menú la sección que ocupa el centro de la pantalla.
  useEffect(() => {
    const sections = LINKS.map((l) => document.querySelector(l.href)).filter(Boolean)
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) setActive(`#${entry.target.id}`)
        })
      },
      { rootMargin: '-45% 0px -50% 0px' },
    )
    sections.forEach((s) => observer.observe(s))
    return () => observer.disconnect()
  }, [])

  useEffect(() => {
    if (!open) return
    const onKey = (e) => e.key === 'Escape' && setOpen(false)
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open])

  return (
    <header
      style={{
        position: 'sticky',
        top: 0,
        zIndex: 50,
        background: scrolled || open ? 'rgba(255,255,255,0.94)' : 'var(--white)',
        backdropFilter: scrolled ? 'blur(8px)' : 'none',
        borderBottom: scrolled || open ? '2px solid var(--black)' : '2px solid transparent',
        transition: 'all 0.2s ease',
      }}
    >
      <div className="wrap" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: 78 }}>
        <a href="#top" style={{ textDecoration: 'none' }} aria-label="FiFlip, ir al inicio">
          <Logo />
        </a>

        <nav className="desktop-nav" aria-label="Secciones">
          {LINKS.map((l) => (
            <a key={l.href} href={l.href} className={`nav-link ${active === l.href ? 'active' : ''}`}>
              {l.label}
            </a>
          ))}
          <a href="#renovacion-form" className="btn" style={{ padding: '12px 22px' }}>
            Pedir presupuesto
          </a>
        </nav>

        <button
          className="mobile-toggle"
          onClick={() => setOpen(!open)}
          aria-label={open ? 'Cerrar menú' : 'Abrir menú'}
          aria-expanded={open}
          aria-controls="mobile-menu"
        >
          <span aria-hidden="true">{open ? '✕' : '☰'}</span>
        </button>
      </div>

      {open && (
        <div id="mobile-menu" className="mobile-menu">
          <div className="wrap" style={{ display: 'flex', flexDirection: 'column', padding: '8px 24px 24px' }}>
            {LINKS.map((l) => (
              <a key={l.href} href={l.href} onClick={() => setOpen(false)} className="mobile-link">
                {l.label}
                <span aria-hidden="true">→</span>
              </a>
            ))}
            <a href="#renovacion-form" className="btn" onClick={() => setOpen(false)} style={{ marginTop: 20 }}>
              Pedir presupuesto
            </a>
          </div>
        </div>
      )}

      <style>{`
        .desktop-nav {
          display: flex;
          gap: 32px;
          align-items: center;
        }
        .nav-link {
          position: relative;
          text-decoration: none;
          font-size: 0.85rem;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.06em;
          padding: 6px 0;
        }
        .nav-link::after {
          content: '';
          position: absolute;
          left: 0;
          right: 0;
          bottom: 0;
          height: 2px;
          background: currentColor;
          transform: scaleX(0);
          transform-origin: left;
          transition: transform 0.2s ease;
        }
        .nav-link:hover::after,
        .nav-link.active::after {
          transform: scaleX(1);
        }
        .mobile-toggle {
          display: none;
          background: none;
          border: var(--border);
          width: 44px;
          height: 44px;
          align-items: center;
          justify-content: center;
          font-size: 1.2rem;
          font-weight: 700;
        }
        .mobile-menu {
          border-top: 2px solid var(--black);
          background: var(--white);
        }
        .mobile-link {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 16px 0;
          border-bottom: 2px solid var(--gray-200);
          text-decoration: none;
          font-family: 'Archivo Black', sans-serif;
          text-transform: uppercase;
          font-size: 1.15rem;
        }
        @media (max-width: 860px) {
          .desktop-nav { display: none; }
          .mobile-toggle { display: flex; }
        }
      `}</style>
    </header>
  )
}
