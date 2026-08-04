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

function swap(arr, i, j) {
  const copy = [...arr]
  ;[copy[i], copy[j]] = [copy[j], copy[i]]
  return copy
}

export default function AdminProjectsPage({ token, onLogout }) {
  const [projects, setProjects] = useState([])
  const [editingId, setEditingId] = useState(null)
  const [form, setForm] = useState(emptyForm)
  const [coverImageUrl, setCoverImageUrl] = useState('')
  const [beforeImageUrls, setBeforeImageUrls] = useState([])
  const [afterImageUrls, setAfterImageUrls] = useState([])
  const [uploadingCover, setUploadingCover] = useState(false)
  const [uploadingBefore, setUploadingBefore] = useState(false)
  const [uploadingAfter, setUploadingAfter] = useState(false)
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
    setBeforeImageUrls([])
    setAfterImageUrls([])
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
    setBeforeImageUrls(p.beforeImageUrls || [])
    setAfterImageUrls(p.afterImageUrls || [])
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

  const handleCoverSelect = async (e) => {
    const file = e.target.files[0]
    e.target.value = ''
    if (!file) return
    setError('')
    setUploadingCover(true)
    try {
      setCoverImageUrl(await uploadFile(file))
    } catch {
      setError('No pudimos subir la portada. Probá de nuevo.')
    } finally {
      setUploadingCover(false)
    }
  }

  const handleMultiSelect = async (e, setUrls, setUploading) => {
    const files = Array.from(e.target.files || [])
    e.target.value = ''
    if (files.length === 0) return
    setError('')
    setUploading(true)
    try {
      const urls = await Promise.all(files.map(uploadFile))
      setUrls((arr) => [...arr, ...urls])
    } catch {
      setError('No pudimos subir alguna de las fotos. Probá de nuevo.')
    } finally {
      setUploading(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    if (!coverImageUrl) return setError('Falta la foto de portada.')
    if (beforeImageUrls.length === 0) return setError('Falta al menos una foto de "antes".')
    if (afterImageUrls.length === 0) return setError('Falta al menos una foto de "después".')

    setSaving(true)
    try {
      const payload = {
        title: form.title,
        description: form.description,
        category: form.category,
        coverImageUrl,
        beforeImageUrls,
        afterImageUrls,
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
    } catch {
      setError('No pudimos guardar el proyecto. Probá de nuevo en un momento.')
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
              <input type="file" accept="image/*" onChange={handleCoverSelect} disabled={uploadingCover} />
              {uploadingCover && <p style={{ marginTop: 8, fontSize: '0.8rem', color: 'var(--gray-400)' }}>Subiendo…</p>}
              {coverImageUrl && !uploadingCover && <ImgPreview url={coverImageUrl} />}
            </div>
            <div className="field">
              <label>Fotos "antes"</label>
              <input
                type="file"
                accept="image/*"
                multiple
                onChange={(e) => handleMultiSelect(e, setBeforeImageUrls, setUploadingBefore)}
                disabled={uploadingBefore}
              />
              {uploadingBefore && <p style={{ marginTop: 8, fontSize: '0.8rem', color: 'var(--gray-400)' }}>Subiendo…</p>}
              <ImgList
                urls={beforeImageUrls}
                onRemove={(url) => setBeforeImageUrls((arr) => arr.filter((u) => u !== url))}
                onMove={(i, j) => setBeforeImageUrls((arr) => swap(arr, i, j))}
              />
            </div>
            <div className="field">
              <label>Fotos "después"</label>
              <input
                type="file"
                accept="image/*"
                multiple
                onChange={(e) => handleMultiSelect(e, setAfterImageUrls, setUploadingAfter)}
                disabled={uploadingAfter}
              />
              {uploadingAfter && <p style={{ marginTop: 8, fontSize: '0.8rem', color: 'var(--gray-400)' }}>Subiendo…</p>}
              <ImgList
                urls={afterImageUrls}
                onRemove={(url) => setAfterImageUrls((arr) => arr.filter((u) => u !== url))}
                onMove={(i, j) => setAfterImageUrls((arr) => swap(arr, i, j))}
              />
            </div>
          </div>

          {error && <p style={{ color: '#c0392b', fontSize: '0.85rem', marginTop: 16 }}>{error}</p>}

          <div style={{ display: 'flex', gap: 12, marginTop: 20 }}>
            <button type="submit" className="btn" disabled={saving || uploadingCover || uploadingBefore || uploadingAfter}>
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

function ImgPreview({ url }) {
  return <img src={url} alt="" style={{ marginTop: 8, height: 60, border: '2px solid var(--black)' }} />
}

function ImgList({ urls, onRemove, onMove }) {
  const [dragIndex, setDragIndex] = useState(null)
  const [overIndex, setOverIndex] = useState(null)

  if (!urls?.length) return null

  return (
    <div style={{ display: 'flex', gap: 8, marginTop: 8, flexWrap: 'wrap' }}>
      {urls.map((url, i) => (
        <div
          key={url}
          draggable
          onDragStart={() => setDragIndex(i)}
          onDragOver={(e) => {
            e.preventDefault()
            if (overIndex !== i) setOverIndex(i)
          }}
          onDragLeave={() => setOverIndex((cur) => (cur === i ? null : cur))}
          onDrop={(e) => {
            e.preventDefault()
            if (dragIndex !== null && dragIndex !== i) onMove(dragIndex, i)
            setDragIndex(null)
            setOverIndex(null)
          }}
          onDragEnd={() => {
            setDragIndex(null)
            setOverIndex(null)
          }}
          style={{
            position: 'relative',
            cursor: 'grab',
            opacity: dragIndex === i ? 0.4 : 1,
            outline: overIndex === i && dragIndex !== i ? '2px dashed var(--black)' : 'none',
            outlineOffset: 2,
          }}
        >
          <img
            src={url}
            alt=""
            draggable={false}
            style={{ height: 50, width: 70, objectFit: 'cover', border: '2px solid var(--black)', pointerEvents: 'none' }}
          />
          <button
            type="button"
            onClick={() => onRemove(url)}
            aria-label="Quitar"
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
          <div style={{ display: 'flex', gap: 2, marginTop: 3 }}>
            <button
              type="button"
              disabled={i === 0}
              onClick={() => onMove(i, i - 1)}
              aria-label="Mover a la izquierda"
              style={{
                flex: 1,
                fontSize: '0.7rem',
                padding: '2px 0',
                border: '1px solid var(--black)',
                background: 'var(--white)',
                opacity: i === 0 ? 0.3 : 1,
                cursor: i === 0 ? 'default' : 'pointer',
              }}
            >
              ←
            </button>
            <button
              type="button"
              disabled={i === urls.length - 1}
              onClick={() => onMove(i, i + 1)}
              aria-label="Mover a la derecha"
              style={{
                flex: 1,
                fontSize: '0.7rem',
                padding: '2px 0',
                border: '1px solid var(--black)',
                background: 'var(--white)',
                opacity: i === urls.length - 1 ? 0.3 : 1,
                cursor: i === urls.length - 1 ? 'default' : 'pointer',
              }}
            >
              →
            </button>
          </div>
        </div>
      ))}
    </div>
  )
}
