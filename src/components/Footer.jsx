import Logo from './Logo.jsx'

export default function Footer() {
  return (
    <footer id="contacto" style={{ borderTop: '2px solid var(--black)', padding: '60px 0 30px' }}>
      <div className="wrap footer-grid">
        <div>
          <Logo />
          <p style={{ marginTop: 16, maxWidth: 320, color: 'var(--gray-700)', lineHeight: 1.5 }}>
            Renovamos propiedades y desarrollamos proyectos de flipping
            inmobiliario en conjunto con inversores.
          </p>
        </div>

        <div>
          <h4 style={{ fontSize: '0.85rem', letterSpacing: '0.08em' }}>Contacto</h4>
          <div style={{ marginTop: 14, display: 'flex', flexDirection: 'column', gap: 8, color: 'var(--gray-700)' }}>
            <a href="mailto:hola@fiflip.realestate" style={{ textDecoration: 'none' }}>
              hola@fiflip.realestate
            </a>
            <a href="#renovacion" style={{ textDecoration: 'none' }}>
              Pedir presupuesto de renovación
            </a>
            <a href="#inversion" style={{ textDecoration: 'none' }}>
              Invertir en un proyecto
            </a>
          </div>
        </div>

        <div>
          <h4 style={{ fontSize: '0.85rem', letterSpacing: '0.08em' }}>Fiflip</h4>
          <div style={{ marginTop: 14, display: 'flex', flexDirection: 'column', gap: 8, color: 'var(--gray-700)' }}>
            <a href="#top" style={{ textDecoration: 'none' }}>
              Inicio
            </a>
            <a href="#proyectos" style={{ textDecoration: 'none' }}>
              Proyectos
            </a>
          </div>
        </div>
      </div>

      <div className="wrap" style={{ marginTop: 50, paddingTop: 24, borderTop: '2px solid var(--gray-200)' }}>
        <p style={{ fontSize: '0.8rem', color: 'var(--gray-400)' }}>
          © {new Date().getFullYear()} Fiflip Real Estate. Todos los derechos reservados.
        </p>
      </div>

      <style>{`
        .footer-grid {
          display: grid;
          grid-template-columns: 1.4fr 1fr 1fr;
          gap: 40px;
        }
        @media (max-width: 720px) {
          .footer-grid { grid-template-columns: 1fr; gap: 32px; }
        }
      `}</style>
    </footer>
  )
}
