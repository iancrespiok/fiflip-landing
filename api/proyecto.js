// Sirve /proyecto/:id con el título, la descripción y la portada del proyecto
// ya escritos en el HTML. WhatsApp, Facebook, etc. no ejecutan JS, así que sin
// esto la vista previa de un link compartido siempre diría solo "FiFlip".
// Si algo falla, devuelve el index.html tal cual y la SPA sigue funcionando.

const API_URL = process.env.VITE_API_URL

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
    const res = await fetch(`${API_URL}/api/projects/${id}`, { signal: AbortSignal.timeout(3000) })
    return res.ok ? await res.json() : null
  } catch {
    return null
  }
}

export function injectProjectMeta(html, project, pageUrl) {
  const title = `${project.title} | FiFlip`
  const description = project.description ? truncate(project.description, 200) : null
  const image = project.coverImageUrl || project.afterImageUrls?.[0] || project.beforeImageUrls?.[0]

  const tags = [
    ['og:type', 'article'],
    ['og:site_name', 'FiFlip'],
    ['og:title', title],
    ['og:url', pageUrl],
    description && ['og:description', description],
    image && ['og:image', image],
  ]
    .filter(Boolean)
    .map(([property, content]) => `<meta property="${property}" content="${escapeHtml(content)}" />`)
  tags.push(`<meta name="twitter:card" content="${image ? 'summary_large_image' : 'summary'}" />`)

  let out = html
    .replace(/<title>[^<]*<\/title>/, `<title>${escapeHtml(title)}</title>`)
    // Las og:* genéricas de index.html se reemplazan por las del proyecto.
    .replace(/\s*<meta property="og:[^"]*" content="[^"]*" \/>/g, '')
  if (description) {
    out = out.replace(/<meta name="description" content="[^"]*" \/>/, `<meta name="description" content="${escapeHtml(description)}" />`)
  }
  return out.replace('</head>', `    ${tags.join('\n    ')}\n  </head>`)
}

export default async function handler(req, res) {
  const id = String(req.query.id ?? '')
  const host = req.headers['x-forwarded-host'] || req.headers.host
  const proto = req.headers['x-forwarded-proto'] || 'https'
  const origin = `${proto}://${host}`

  const [htmlRes, project] = await Promise.all([fetch(`${origin}/index.html`), fetchProject(id)])
  const html = await htmlRes.text()

  res.setHeader('Content-Type', 'text/html; charset=utf-8')
  if (!project) {
    res.setHeader('Cache-Control', 'no-store')
    return res.status(200).send(html)
  }
  res.setHeader('Cache-Control', 'public, s-maxage=300, stale-while-revalidate=86400')
  res.status(200).send(injectProjectMeta(html, project, `${origin}/proyecto/${id}`))
}
