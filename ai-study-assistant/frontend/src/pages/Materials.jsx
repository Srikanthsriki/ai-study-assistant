import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { UploadCloud, FileText, Trash2, Eye, Sparkles, MessageSquare, HelpCircle, X } from 'lucide-react'
import toast from 'react-hot-toast'
import api, { getErrorMessage } from '../services/api'

function formatSize(bytes) {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export default function Materials() {
  const navigate = useNavigate()
  const [materials, setMaterials] = useState([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [preview, setPreview] = useState(null)
  const fileInputRef = useRef(null)

  const load = async () => {
    setLoading(true)
    try {
      const res = await api.get('/materials')
      setMaterials(res.data)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  const handleFile = async (file) => {
    if (!file) return
    const allowed = ['pdf', 'txt', 'docx']
    const ext = file.name.split('.').pop().toLowerCase()
    if (!allowed.includes(ext)) {
      toast.error('Unable to upload this file. Please check the file type and size.')
      return
    }
    if (file.size > 10 * 1024 * 1024) {
      toast.error('File too large. Maximum allowed size is 10 MB.')
      return
    }

    const formData = new FormData()
    formData.append('file', file)
    setUploading(true)
    try {
      await api.post('/materials/upload', formData, { headers: { 'Content-Type': 'multipart/form-data' } })
      toast.success('Material uploaded successfully!')
      await load()
    } catch (err) {
      toast.error(getErrorMessage(err, 'Unable to upload this file. Please check the file type and size.'))
    } finally {
      setUploading(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  const handleDrop = (e) => {
    e.preventDefault()
    handleFile(e.dataTransfer.files[0])
  }

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this material? This cannot be undone.')) return
    await api.delete(`/materials/${id}`)
    toast.success('Material deleted.')
    await load()
  }

  const viewMaterial = async (m) => {
    const res = await api.get(`/materials/${m.id}/content`)
    setPreview({ filename: res.data.filename, text: res.data.extracted_text })
  }

  return (
    <div className="animate-fadeIn space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Study Materials</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">Upload PDFs, DOCX, or TXT files for the AI to reference.</p>
      </div>

      {/* Upload dropzone */}
      <div
        onDragOver={(e) => e.preventDefault()}
        onDrop={handleDrop}
        className="card flex flex-col items-center justify-center gap-3 border-2 border-dashed border-slate-200 p-10 text-center dark:border-slate-700"
      >
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-brand-50 text-brand-600 dark:bg-brand-900/30 dark:text-brand-400">
          <UploadCloud size={24} />
        </div>
        <p className="text-sm font-medium text-slate-700 dark:text-slate-200">Drag & drop a file here, or click to browse</p>
        <p className="text-xs text-slate-400">Supports PDF, DOCX, TXT — up to 10 MB</p>
        <input ref={fileInputRef} type="file" accept=".pdf,.txt,.docx" className="hidden" onChange={(e) => handleFile(e.target.files[0])} />
        <button onClick={() => fileInputRef.current?.click()} disabled={uploading} className="btn-primary mt-1">
          {uploading ? 'Uploading...' : 'Choose File'}
        </button>
      </div>

      {/* Materials list */}
      {loading ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[...Array(3)].map((_, i) => <div key={i} className="card h-40 animate-pulse bg-slate-100 dark:bg-slate-800" />)}
        </div>
      ) : materials.length === 0 ? (
        <div className="card p-10 text-center text-slate-400">
          No study materials yet.<br />Upload your first PDF to start learning.
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {materials.map((m) => (
            <div key={m.id} className="card flex flex-col p-5">
              <div className="mb-3 flex items-start justify-between">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-50 text-brand-600 dark:bg-brand-900/30 dark:text-brand-400">
                  <FileText size={20} />
                </div>
                <button onClick={() => handleDelete(m.id)} className="text-slate-400 hover:text-red-500"><Trash2 size={16} /></button>
              </div>
              <p className="truncate font-medium text-slate-800 dark:text-white" title={m.filename}>{m.filename}</p>
              <p className="mt-1 text-xs text-slate-400">
                {m.file_type.toUpperCase()} · {formatSize(m.file_size)} · {new Date(m.created_at).toLocaleDateString()}
              </p>
              <div className="mt-4 grid grid-cols-2 gap-2 text-xs">
                <button onClick={() => viewMaterial(m)} className="btn-secondary py-1.5"><Eye size={13} /> View</button>
                <button onClick={() => navigate('/summarizer', { state: { materialId: m.id } })} className="btn-secondary py-1.5"><Sparkles size={13} /> Summarize</button>
                <button onClick={() => navigate('/assistant')} className="btn-secondary py-1.5"><MessageSquare size={13} /> Ask AI</button>
                <button onClick={() => navigate('/questions', { state: { materialId: m.id } })} className="btn-secondary py-1.5"><HelpCircle size={13} /> Questions</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Preview modal */}
      {preview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="card max-h-[80vh] w-full max-w-2xl overflow-hidden p-0">
            <div className="flex items-center justify-between border-b border-slate-100 p-4 dark:border-slate-800">
              <h3 className="font-semibold text-slate-900 dark:text-white truncate">{preview.filename}</h3>
              <button onClick={() => setPreview(null)} className="text-slate-400 hover:text-slate-600"><X size={20} /></button>
            </div>
            <div className="max-h-[65vh] overflow-y-auto p-5 text-sm whitespace-pre-wrap text-slate-600 dark:text-slate-300">
              {preview.text || 'No readable text could be extracted from this file.'}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
