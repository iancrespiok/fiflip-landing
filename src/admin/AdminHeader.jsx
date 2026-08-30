export default function AdminHeader({ tab, onTabChange, onLogout }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32, flexWrap: 'wrap', gap: 16 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
        <h1 style={{ fontFamily: "'Archivo Black', sans-serif", fontSize: '1.5rem' }}>Fiflip Admin</h1>
        <nav style={{ display: 'flex', gap: 10 }}>
          <button
            className={tab === 'projects' ? 'btn' : 'btn btn-outline'}
            onClick={() => onTabChange('projects')}
          >
            Proyectos
          </button>
          <button
            className={tab === 'pricing' ? 'btn' : 'btn btn-outline'}
            onClick={() => onTabChange('pricing')}
          >
            Precios
          </button>
        </nav>
      </div>
      <button className="btn btn-outline" onClick={onLogout}>
        Salir
      </button>
    </div>
  )
}
