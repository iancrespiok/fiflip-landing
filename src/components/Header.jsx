import { useEffect, useState } from 'react'
import Logo from './Logo.jsx'

export default function Header() {
  const [scrolled, setScrolled] = useState(false)
  const [open, setOpen] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10)
    window.addEventListener('scroll', onScroll)
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  const links = [
    { href: '#renovacion', label: 'Renovación' },
    { href: '#inversion', label: 'Inversión' },
    { href: '#portfolio', label: 'Proyectos' },
    { href: '#contacto', label: 'Contacto' },
  ]

  return (
    <header
      style={{
        position: 'sticky',
        top: 0,
        zIndex: 50,
        background: scrolled ? 'rgba(255,255,255,0.92)' : 'transparent',
        backdropFilter: scrolled ? 'blur(8px)' : 'none',
        borderBottom: scrolled ? '2px solid var(--black)' : '2px solid transparent',
        transition: 'all 0.2s ease',
      }}
    >
      <div className="wrap" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: 78 }}>
        <a href="#top" style={{ textDecoration: 'none' }}>
          <Logo />
        </a>

        <nav className="desktop-nav" style={{ display: 'flex', gap: 36, alignItems: 'center' }}>
          {links.map((l) => (
            <a
              key={l.href}
              href={l.href}
              style={{
                textDecoration: 'none',
                fontSize: '0.85rem',
                fontWeight: 600,
                textTransform: 'uppercase',
                letterSpacing: '0.06em',
              }}
            >
              {l.label}
            </a>
          ))}
          <a href="#contacto" className="btn" style={{ padding: '12px 22px' }}>
            Empezar
          </a>
        </nav>

        <button
          className="mobile-toggle"
          onClick={() => setOpen(!open)}
          aria-label="Abrir menú"
          style={{
            display: 'none',
            background: 'none',
            border: 'var(--border)',
            width: 44,
            height: 44,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <span style={{ fontSize: '1.2rem', fontWeight: 700 }}>{open ? '✕' : '☰'}</span>
        </button>
      </div>

      {open && (
        <div className="mobile-menu" style={{ borderTop: '2px solid var(--black)', background: 'var(--white)' }}>
          <div className="wrap" style={{ display: 'flex', flexDirection: 'column', padding: '20px 24px', gap: 18 }}>
            {links.map((l) => (
              <a
                key={l.href}
                href={l.href}
                onClick={() => setOpen(false)}
                style={{ textDecoration: 'none', fontWeight: 700, textTransform: 'uppercase', fontSize: '1rem' }}
              >
                {l.label}
              </a>
            ))}
            <a href="#contacto" className="btn" onClick={() => setOpen(false)} style={{ justifyContent: 'center' }}>
              Empezar
            </a>
          </div>
        </div>
      )}

      <style>{`
        @media (max-width: 860px) {
          .desktop-nav { display: none !important; }
          .mobile-toggle { display: flex !important; }
        }
      `}</style>
    </header>
  )
}
