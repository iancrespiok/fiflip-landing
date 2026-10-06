// Las fotos de cámara miden 4000+ px y pesan 2-6 MB, pero el sitio las muestra a menos de
// 600 px. Se achican en el navegador antes de subirlas: el sitio carga mucho más rápido y
// la subida desde el celular también.
const MAX_SIDE = 1800
export const COVER_MAX_SIDE = 960 // las portadas solo se ven en tarjetas de ~360 px
const JPEG_QUALITY = 0.8
const LEAVE_ALONE_BELOW_BYTES = 400 * 1024

// Devuelve la foto achicada (JPEG) o, si no hace falta o no se puede, la misma que entró.
export async function resizeImageForUpload(file, { maxSide = MAX_SIDE } = {}) {
  if (!file.type.startsWith('image/') || file.type === 'image/gif' || file.type === 'image/svg+xml') return file
  try {
    // 'from-image' aplica la rotación EXIF: el JPEG nuevo ya sale derecho, sin depender de la etiqueta.
    const bitmap = await createImageBitmap(file, { imageOrientation: 'from-image' })
    const scale = Math.min(1, maxSide / Math.max(bitmap.width, bitmap.height))
    if (scale === 1 && file.size <= LEAVE_ALONE_BELOW_BYTES) {
      bitmap.close()
      return file
    }
    const canvas = document.createElement('canvas')
    canvas.width = Math.round(bitmap.width * scale)
    canvas.height = Math.round(bitmap.height * scale)
    const ctx = canvas.getContext('2d')
    ctx.imageSmoothingQuality = 'high' // el filtro por defecto deja escalones en bordes finos (azulejos, parquet)
    ctx.fillStyle = '#fff' // un PNG con transparencia saldría negro en JPEG
    ctx.fillRect(0, 0, canvas.width, canvas.height)
    ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height)
    bitmap.close()
    const blob = await new Promise((resolve) => canvas.toBlob(resolve, 'image/jpeg', JPEG_QUALITY))
    if (!blob || blob.size >= file.size) return file
    return new File([blob], file.name.replace(/\.[^.]+$/, '') + '.jpg', { type: 'image/jpeg' })
  } catch {
    return file // formato que el navegador no decodifica (p. ej. HEIC en Chrome): se sube tal cual
  }
}
