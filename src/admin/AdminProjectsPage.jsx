import { useEffect, useState } from 'react'

const API_URL = import.meta.env.VITE_API_URL

const currentMonth = new Date().toISOString().slice(0, 7)

const emptyForm = {
  title: '',
  description: '',
  category: 'RENOVATION',
  status: 'EN_OBRA',
  tea: '',
  teaProjected: true,
  projectDate: currentMonth,
}

export default function AdminProjectsPage({ token, onLogout }) {
  const [projects, setProjects] = useState([])
  const [editingId, setEditingId] = useState(null)
  const [form, setForm] = useState(emptyForm)
  const [coverImageUrl, setCoverImageUrl] = useState('')
  const [coverFile, setCoverFile] = useState(null)
  const [beforeImageUrls, setBeforeImageUrls] = useState([])
  const [beforeFiles, setBeforeFiles] = useState([])
  const [afterImageUrls, setAfterImageUrls] = useState([])
  const [afterFiles, setAfterFiles] = useState([])
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const authHeaders = { Authorization: `Bearer ${token}` }

  const loadProjects = () => {
    fetch(`${API_URL}/api/projects`)
      .then((res) => (res.ok ? res.json() : []))
      .then(setProjects)
      .catch(() => setProjects([]))
  }

  useEffect(() => {
    loadProjects()
  }, [])

  const resetForm = () => {
    setEditingId(null)
    setForm(emptyForm)
    setCoverImageUrl('')
    setCoverFile(null)
    setBeforeImageUrls([])
    setBeforeFiles([])
    setAfterImageUrls([])
    setAfterFiles([])
    setError('')
  }

  const startEdit = (p) => {
    setEditingId(p.id)
    setForm({
      title: p.title,
      description: p.description,
      category: p.category,
      status: p.status || 'EN_OBRA',
      tea: p.tea ?? '',
      teaProjected: p.teaProjected ?? true,
      projectDate: p.projectDate ? p.projectDate.slice(0, 7) : currentMonth,
    })
    setCoverImageUrl(p.coverImageUrl)
    setCoverFile(null)
    setBeforeImageUrls(p.beforeImageUrls || [])
    setBeforeFiles([])
    setAfterImageUrls(p.afterImageUrls || [])
    setAfterFiles([])
    setError('')
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const uploadFile = async (file) => {
    const body = new FormData()
    body.append('file', file)
    const res = await fetch(`${API_URL}/api/admin/uploads`, {
      method: 'POST',
      headers: authHeaders,
      body,
    })
    if (res.status === 401) {
      onLogout()
      throw new Error('unauthorized')
    }
    if (!res.ok) throw new Error('upload failed')
    const { url } = await res.json()
    return url
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setSaving(true)
    try {
      let finalCoverUrl = coverImageUrl
      if (coverFile) {
        finalCoverUrl = await uploadFile(coverFile)
      }
      const newBeforeUrls = await Promise.all(beforeFiles.map(uploadFile))
      const newAfterUrls = await Promise.all(afterFiles.map(uploadFile))

      const finalBefore = [...beforeImageUrls, ...newBeforeUrls]
      const finalAfter = [...afterImageUrls, ...newAfterUrls]

      if (!finalCoverUrl) throw new Error('missing cover')
      if (finalBefore.length === 0) throw new Error('missing before')
      if (finalAfter.length === 0) throw new Error('missing after')

      const payload = {
        title: form.title,
        description: form.description,
        category: form.category,
        coverImageUrl: finalCoverUrl,
        beforeImageUrls: finalBefore,
        afterImageUrls: finalAfter,
        status: form.category === 'FLIP' ? form.status : null,
        tea: form.category === 'FLIP' && form.tea !== '' ? Number(form.tea) : null,
        teaProjected: form.category === 'FLIP' ? form.teaProjected : null,
        projectDate: form.projectDate,
      }

      const url = editingId ? `${API_URL}/api/admin/projects/${editingId}` : `${API_URL}/api/admin/projects`
      const res = await fetch(url, {
        method: editingId ? 'PUT' : 'POST',
        headers: { ...authHeaders, 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      if (res.status === 401) {
        onLogout()
        return
      }
      if (!res.ok) throw new Error('save failed')

      resetForm()
      loadProjects()
    } catch (err) {
      setError('No pudimos guardar el proyecto. Revisá que tengas portada, al menos 1 foto de antes y 1 de después.')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id) => {
    if (!confirm('¿Eliminar este proyecto?')) return
    const res = await fetch(`${API_URL}/api/admin/projects/${id}`, {
      method: 'DELETE',
      headers: authHeaders,
    })
    if (res.status === 401) {
      onLogout()
      return
    }
    loadProjects()
    if (editingId === id) resetForm()
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--gray-100)', padding: '40px 24px' }}>
      <div style={{ maxWidth: 900, margin: '0 auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32 }}>
          <h1 style={{ fontFamily: "'Archivo Black', sans-serif", fontSize: '1.5rem' }}>Proyectos</h1>
          <button
            className="btn btn-outline"
            onClick={() => {
              localStorage.removeItem('fiflip_admin_token')
              onLogout()
            }}
          >
            Salir
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ background: 'var(--white)', border: '2px solid var(--black)', padding: 28, marginBottom: 40 }}>
          <h2 style={{ fontSize: '1.1rem', marginBottom: 20 }}>{editingId ? 'Editar proyecto' : 'Nuevo proyecto'}</h2>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16 }}>
            <div className="field">
              <label>Título</label>
              <input value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} required />
            </div>
            <div className="field">
              <label>Categoría</label>
              <select value={form.category} onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}>
                <option value="RENOVATION">Refacción</option>
                <option value="FLIP">Flip</option>
              </select>
            </div>
            <div className="field">
              <label>Fecha (mes/año)</label>
              <input
                type="month"
                value={form.projectDate}
                onChange={(e) => setForm((f) => ({ ...f, projectDate: e.target.value }))}
                required
              />
            </div>
          </div>

          <div className="field" style={{ marginTop: 16 }}>
            <label>Descripción</label>
            <textarea
              rows={3}
              value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              required
            />
          </div>

          {form.category === 'FLIP' && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16, marginTop: 16 }}>
              <div className="field">
                <label>Estado</label>
                <select value={form.status} onChange={(e) => setForm((f) => ({ ...f, status: e.target.value }))}>
                  <option value="EN_OBRA">En obra</option>
                  <option value="TERMINADO">Terminado</option>
                  <option value="BUSCANDO_INVERSORES">Buscando inversores</option>
                </select>
              </div>
              <div className="field">
                <label>TEA (%)</label>
                <input
                  type="number"
                  step="0.1"
                  value={form.tea}
                  onChange={(e) => setForm((f) => ({ ...f, tea: e.target.value }))}
                  placeholder="Ej: 22"
                />
              </div>
              <div className="field">
                <label>Tipo de TEA</label>
                <select
                  value={form.teaProjected ? 'proyectada' : 'real'}
                  onChange={(e) => setForm((f) => ({ ...f, teaProjected: e.target.value === 'proyectada' }))}
                >
                  <option value="proyectada">Proyectada</option>
                  <option value="real">Real</option>
                </select>
              </div>
            </div>
          )}

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16, marginTop: 16 }}>
            <div className="field">
              <label>Portada</label>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => setCoverFile(e.target.files[0] || null)}
              />
              {coverFile && <FileNames files={[coverFile]} />}
              {coverImageUrl && !coverFile && <ImgPreview url={coverImageUrl} />}
            </div>
            <div className="field">
              <label>Fotos "antes"</label>
              <input
                type="file"
                accept="image/*"
                multiple
                onChange={(e) => setBeforeFiles(Array.from(e.target.files))}
              />
              {beforeFiles.length > 0 && <FileNames files={beforeFiles} />}
              <ImgList urls={beforeImageUrls} onRemove={(url) => setBeforeImageUrls((arr) => arr.filter((u) => u !== url))} />
            </div>
            <div className="field">
              <label>Fotos "después"</label>
              <input
                type="file"
                accept="image/*"
                multiple
                onChange={(e) => setAfterFiles(Array.from(e.target.files))}
              />
              {afterFiles.length > 0 && <FileNames files={afterFiles} />}
              <ImgList urls={afterImageUrls} onRemove={(url) => setAfterImageUrls((arr) => arr.filter((u) => u !== url))} />
            </div>
          </div>

          {error && <p style={{ color: '#c0392b', fontSize: '0.85rem', marginTop: 16 }}>{error}</p>}

          <div style={{ display: 'flex', gap: 12, marginTop: 20 }}>
            <button type="submit" className="btn" disabled={saving}>
              {saving ? 'Guardando…' : editingId ? 'Guardar cambios' : 'Crear proyecto'}
            </button>
            {editingId && (
              <button type="button" className="btn btn-outline" onClick={resetForm}>
                Cancelar
              </button>
            )}
          </div>
        </form>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {projects.map((p) => (
            <div
              key={p.id}
              style={{
                display: 'flex',
                gap: 16,
                alignItems: 'center',
                background: 'var(--white)',
                border: '2px solid var(--black)',
                padding: 16,
              }}
            >
              <img src={p.coverImageUrl} alt={p.title} style={{ width: 64, height: 64, objectFit: 'cover' }} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <strong>{p.title}</strong>
                <div style={{ fontSize: '0.8rem', color: 'var(--gray-700)' }}>
                  {p.category === 'FLIP' ? 'Flip' : 'Refacción'}
                </div>
              </div>
              <button className="btn-outline btn" onClick={() => startEdit(p)}>
                Editar
              </button>
              <button className="btn-outline btn" onClick={() => handleDelete(p.id)}>
                Borrar
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function FileNames({ files }) {
  return (
    <p style={{ marginTop: 8, fontSize: '0.8rem', color: 'var(--gray-700)' }}>
      {files.map((f) => f.name).join(', ')}
    </p>
  )
}

function ImgPreview({ url }) {
  return <img src={url} alt="" style={{ marginTop: 8, height: 60, border: '2px solid var(--black)' }} />
}

function ImgList({ urls, onRemove }) {
  if (!urls?.length) return null
  return (
    <div style={{ display: 'flex', gap: 6, marginTop: 8, flexWrap: 'wrap' }}>
      {urls.map((url) => (
        <div key={url} style={{ position: 'relative' }}>
          <img src={url} alt="" style={{ height: 50, border: '2px solid var(--black)' }} />
          <button
            type="button"
            onClick={() => onRemove(url)}
            style={{
              position: 'absolute',
              top: -8,
              right: -8,
              width: 20,
              height: 20,
              background: 'var(--black)',
              color: 'var(--white)',
              border: 'none',
              fontSize: '0.7rem',
              cursor: 'pointer',
            }}
          >
            ✕
          </button>
        </div>
      ))}
    </div>
  )
}
