const WHATSAPP_URL = 'https://wa.me/5491154911333?text=' + encodeURIComponent('Hola FiFlip, quiero hacer una consulta.')

export default function WhatsAppButton() {
  return (
    <a href={WHATSAPP_URL} target="_blank" rel="noopener noreferrer" className="wa-float" aria-label="Escribinos por WhatsApp">
      <svg viewBox="0 0 24 24" width="26" height="26" aria-hidden="true" fill="currentColor">
        <path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.75.46 3.45 1.32 4.95L2.05 22l5.25-1.38a9.9 9.9 0 0 0 4.74 1.21h.01c5.46 0 9.91-4.45 9.91-9.91A9.85 9.85 0 0 0 12.04 2Zm0 18.15h-.01a8.23 8.23 0 0 1-4.2-1.15l-.3-.18-3.12.82.83-3.04-.2-.31a8.2 8.2 0 0 1-1.26-4.38c0-4.54 3.7-8.24 8.25-8.24a8.24 8.24 0 0 1 8.24 8.25c0 4.54-3.7 8.23-8.23 8.23Zm4.52-6.16c-.25-.12-1.47-.72-1.69-.81-.23-.08-.39-.12-.56.13-.16.25-.64.81-.79.97-.14.17-.29.19-.54.06-.25-.12-1.05-.39-1.99-1.23-.74-.66-1.23-1.47-1.38-1.72-.14-.25-.01-.38.11-.51.11-.11.25-.29.37-.43.12-.15.17-.25.25-.42.08-.17.04-.31-.02-.43-.06-.13-.56-1.35-.77-1.85-.2-.48-.41-.42-.56-.43h-.48c-.17 0-.43.06-.66.31-.23.25-.87.85-.87 2.07 0 1.22.89 2.4 1.01 2.56.12.17 1.75 2.67 4.24 3.74.59.26 1.05.41 1.41.52.59.19 1.13.16 1.56.1.48-.07 1.47-.6 1.67-1.18.21-.58.21-1.07.15-1.18-.06-.1-.23-.16-.48-.29Z" />
      </svg>
      <span className="wa-float-label">Escribinos</span>
      <style>{`
        .wa-float {
          position: fixed;
          right: 20px;
          bottom: 20px;
          z-index: 40;
          display: inline-flex;
          align-items: center;
          gap: 10px;
          height: 56px;
          padding: 0 15px;
          background: var(--black);
          color: var(--white);
          border: 2px solid var(--white);
          outline: 2px solid var(--black);
          text-decoration: none;
          font-weight: 700;
          font-size: 0.85rem;
          text-transform: uppercase;
          letter-spacing: 0.06em;
          transition: transform 0.15s ease, box-shadow 0.15s ease;
        }
        .wa-float:hover {
          transform: translate(-3px, -3px);
          box-shadow: 5px 5px 0 var(--black);
        }
        @media (max-width: 620px) {
          .wa-float { right: 14px; bottom: 14px; }
          .wa-float-label { display: none; }
        }
      `}</style>
    </a>
  )
}
