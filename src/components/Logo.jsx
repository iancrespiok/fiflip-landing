export default function Logo({ variant = 'dark', className = '' }) {
  const color = variant === 'light' ? '#ffffff' : '#0a0a0a'
  return (
    <div className={`logo ${className}`} style={{ display: 'inline-flex', alignItems: 'center', gap: 10 }}>
      <img src="/logo.jpg" alt="FiFlip" width="32" height="32" style={{ borderRadius: 4 }} />
      <span
        style={{
          fontFamily: "'Archivo Black', sans-serif",
          fontSize: '1.25rem',
          letterSpacing: '-0.02em',
          color,
        }}
      >
        FiFlip
      </span>
    </div>
  )
}
