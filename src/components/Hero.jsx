export default function Hero() {
  return (
    <section
      id="top"
      style={{
        background: 'var(--black)',
        color: 'var(--white)',
        paddingTop: 90,
        paddingBottom: 0,
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      <div className="wrap" style={{ position: 'relative', zIndex: 2 }}>
        <p className="eyebrow" style={{ color: 'var(--white)', marginBottom: 24 }}>
          Fiflip Real Estate
        </p>
        <h1
          style={{
            fontSize: 'clamp(2.6rem, 7vw, 5.2rem)',
            maxWidth: 900,
          }}
        >
          Le damos <span style={{ WebkitTextStroke: '2px var(--white)', color: 'var(--black)' }}>vuelta</span> a tu propiedad.
        </h1>
        <p style={{ maxWidth: 560, fontSize: '1.15rem', color: '#c9c9c9', marginTop: 26, lineHeight: 1.5 }}>
          Renovamos tu propiedad para venderla más cara, dejarla lista para mudarte
          o para transformar un espacio de tu hogar — o invertí con nosotros en
          proyectos de flipping inmobiliario con retornos reales.
        </p>

        <div style={{ display: 'flex', gap: 16, marginTop: 40, flexWrap: 'wrap' }}>
          <a href="#renovacion" className="btn btn-white">
            Quiero renovar →
          </a>
          <a
            href="#inversion"
            className="btn"
            style={{ background: 'transparent', border: '2px solid var(--white)', color: 'var(--white)' }}
          >
            Quiero invertir →
          </a>
        </div>
      </div>

      <div className="wrap hero-split">
        <div className="hero-tile">
          <span className="hero-tile-num">01</span>
          <h3>Renovación</h3>
          <p>Solicitá, mandá fotos y medidas. Presupuesto en 24hs.</p>
        </div>
        <div className="hero-tile hero-tile-alt">
          <span className="hero-tile-num">02</span>
          <h3>Inversión</h3>
          <p>Sumate a proyectos de flipping con retorno proyectado.</p>
        </div>
      </div>

      <style>{`
        .hero-split {
          display: grid;
          grid-template-columns: 1fr 1fr;
          margin-top: 70px;
          border-top: 2px solid var(--white);
        }
        .hero-tile {
          padding: 40px 24px 46px;
          border-right: 2px solid var(--white);
          min-width: 0;
        }
        .hero-tile-alt { border-right: none; }
        .hero-tile-num {
          font-family: 'Archivo Black', sans-serif;
          font-size: 0.8rem;
          color: #8a8a8a;
          letter-spacing: 0.1em;
        }
        .hero-tile h3 {
          margin-top: 10px;
          font-size: 1.5rem;
        }
        .hero-tile p {
          margin-top: 10px;
          color: #c9c9c9;
          max-width: 340px;
          line-height: 1.5;
        }
        @media (max-width: 720px) {
          .hero-split { grid-template-columns: 1fr; }
          .hero-tile { border-right: none; border-bottom: 2px solid var(--white); }
          .hero-tile-alt { border-bottom: none; }
        }
      `}</style>
    </section>
  )
}
