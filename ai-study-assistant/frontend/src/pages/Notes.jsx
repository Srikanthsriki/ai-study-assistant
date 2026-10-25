import { useEffect, useState } from 'react'
import { Plus, Pin, Search, Trash2, Pencil, X } from 'lucide-react'
import toast from 'react-hot-toast'
import api, { getErrorMessage } from '../services/api'

export default function Notes() {
  const [notes, setNotes] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [sort, setSort] = useState('newest')
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState({ title: '', subject: 'General', content: '' })

  const load = async () => {
    setLoading(true)
    try {
      const res = await api.get('/notes', { params: { search: search || undefined, sort } })
      setNotes(res.data)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [sort])
  useEffect(() => {
    const t = setTimeout(load, 300)
    return () => clearTimeout(t)
  }, [search])

  const openNew = () => {
    setEditing(null)
    setForm({ title: '', subject: 'General', content: '' })
    setModalOpen(true)
  }

  const openEdit = (note) => {
    setEditing(note)
    setForm({ title: note.title, subject: note.subject, content: note.content })
    setModalOpen(true)
  }

  const saveNote = async () => {
    if (!form.title.trim() || !form.content.trim()) {
      toast.error('Please enter a title and content for the note.')
      return
    }
    try {
      if (editing) {
        await api.put(`/notes/${editing.id}`, form)
        toast.success('Note updated.')
      } else {
        await api.post('/notes', form)
        toast.success('Note created.')
      }
      setModalOpen(false)
      await load()
    } catch (err) {
      toast.error(getErrorMessage(err))
    }
  }

  const deleteNote = async (id) => {
    if (!window.confirm('Delete this note?')) return
    await api.delete(`/notes/${id}`)
    toast.success('Note deleted.')
    await load()
  }

  const togglePin = async (note) => {
    await api.put(`/notes/${note.id}`, { is_pinned: !note.is_pinned })
    await load()
  }

  const subjects = [...new Set(notes.map((n) => n.subject))]

  return (
    <div className="animate-fadeIn space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">My Study Notes</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">Organize, pin, and search your notes.</p>
        </div>
        <button onClick={openNew} className="btn-primary"><Plus size={16} /> New Note</button>
      </div>

      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search notes..." className="input-field pl-9" />
        </div>
        <select value={sort} onChange={(e) => setSort(e.target.value)} className="input-field w-auto">
          <option value="newest">Newest first</option>
          <option value="oldest">Oldest first</option>
        </select>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[...Array(3)].map((_, i) => <div key={i} className="card h-40 animate-pulse bg-slate-100 dark:bg-slate-800" />)}
        </div>
      ) : notes.length === 0 ? (
        <div className="card p-10 text-center text-slate-400">No notes yet. Create your first note or save an AI summary here.</div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {notes.map((n) => (
            <div key={n.id} className="card flex flex-col p-5">
              <div className="mb-2 flex items-start justify-between">
                <span className="rounded-full bg-brand-50 px-2.5 py-0.5 text-xs font-medium text-brand-700 dark:bg-brand-900/30 dark:text-brand-300">{n.subject}</span>
                <button onClick={() => togglePin(n)} className={n.is_pinned ? 'text-amber-500' : 'text-slate-300 hover:text-amber-500'}>
                  <Pin size={16} fill={n.is_pinned ? 'currentColor' : 'none'} />
                </button>
              </div>
              <h3 className="font-semibold text-slate-900 dark:text-white line-clamp-1">{n.title}</h3>
              <p className="mt-1.5 line-clamp-4 flex-1 text-sm text-slate-500 dark:text-slate-400">{n.content}</p>
              <div className="mt-3 flex items-center justify-between">
                <span className="text-xs text-slate-400">{new Date(n.updated_at).toLocaleDateString()}</span>
                <div className="flex gap-2">
                  <button onClick={() => openEdit(n)} className="text-slate-400 hover:text-brand-600"><Pencil size={15} /></button>
                  <button onClick={() => deleteNote(n.id)} className="text-slate-400 hover:text-red-500"><Trash2 size={15} /></button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="card w-full max-w-lg p-0">
            <div className="flex items-center justify-between border-b border-slate-100 p-4 dark:border-slate-800">
              <h3 className="font-semibold text-slate-900 dark:text-white">{editing ? 'Edit Note' : 'New Note'}</h3>
              <button onClick={() => setModalOpen(false)} className="text-slate-400 hover:text-slate-600"><X size={20} /></button>
            </div>
            <div className="space-y-3 p-5">
              <input value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} placeholder="Title" className="input-field" />
              <input value={form.subject} onChange={(e) => setForm((f) => ({ ...f, subject: e.target.value }))} placeholder="Subject" className="input-field" />
              <textarea value={form.content} onChange={(e) => setForm((f) => ({ ...f, content: e.target.value }))} placeholder="Write your note..." rows={8} className="input-field resize-none" />
            </div>
            <div className="flex justify-end gap-2 border-t border-slate-100 p-4 dark:border-slate-800">
              <button onClick={() => setModalOpen(false)} className="btn-secondary">Cancel</button>
              <button onClick={saveNote} className="btn-primary">Save Note</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
