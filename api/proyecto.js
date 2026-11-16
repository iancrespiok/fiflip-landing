// Vista previa de /proyecto/:id para los bots que arman la tarjeta de un link
// compartido (WhatsApp, Facebook, Telegram, etc.). Esos bots no ejecutan JS, así
// que acá se les devuelve un HTML mínimo con el título, la descripción y la
// portada del proyecto. vercel.json solo manda acá a esos user-agents: las
// personas reciben la SPA normal.

const API_URL = process.env.VITE_API_URL
const DEFAULT_DESCRIPTION = 'Renová tu propiedad al mejor valor o invertí en proyectos de flipping inmobiliario con FiFlip.'

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

function truncate(text, max) {
  const clean = text.replace(/\s+/g, ' ').trim()
  return clean.length > max ? `${clean.slice(0, max - 1).trimEnd()}…` : clean
}

async function fetchProject(id) {
  if (!API_URL || !/^\d+$/.test(id)) return null
  try {
    const res = await fetch(`${API_URL}/api/projects/${id}`, { signal: AbortSignal.timeout(4000) })
    return res.ok ? await res.json() : null
  } catch {
    return null
  }
}

export function renderPreview(project, pageUrl) {
  const title = project ? `${project.title} | FiFlip` : 'FiFlip'
  const description = project?.description ? truncate(project.description, 200) : DEFAULT_DESCRIPTION
  const image = project && (project.coverImageUrl || project.afterImageUrls?.[0] || project.beforeImageUrls?.[0])

  const meta = [
    ['og:type', 'article'],
    ['og:site_name', 'FiFlip'],
    ['og:title', title],
    ['og:description', description],
    ['og:url', pageUrl],
    image && ['og:image', image],
  ]
    .filter(Boolean)
    .map(([property, content]) => `<meta property="${property}" content="${escapeHtml(content)}" />`)

  return `<!doctype html>
<html lang="es">
  <head>
    <meta charset="UTF-8" />
    <title>${escapeHtml(title)}</title>
    <meta name="description" content="${escapeHtml(description)}" />
    ${meta.join('\n    ')}
    <meta name="twitter:card" content="${image ? 'summary_large_image' : 'summary'}" />
  </head>
  <body>
    <a href="${escapeHtml(pageUrl)}">${escapeHtml(title)}</a>
  </body>
</html>
`
}

export default async function handler(req, res) {
  const id = String(req.query.id ?? '')
  const host = req.headers['x-forwarded-host'] || req.headers.host
  const proto = req.headers['x-forwarded-proto'] || 'https'
  const project = await fetchProject(id)

  res.setHeader('Content-Type', 'text/html; charset=utf-8')
  res.setHeader('Cache-Control', project ? 'public, s-maxage=300, stale-while-revalidate=86400' : 'no-store')
  res.status(200).send(renderPreview(project, `${proto}://${host}/proyecto/${id}`))
}
