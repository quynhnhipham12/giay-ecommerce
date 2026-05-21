// Copy toàn bộ code dưới đây dán vào file: src/pages/CollectionsPage.jsx (admin)
import { useEffect, useState, useRef } from 'react'
import { supabase } from '../supabaseClient'
import toast from 'react-hot-toast'
import { Plus, Trash2, X, Loader2, Upload, Pencil, Eye, EyeOff } from 'lucide-react'

const FONTS = ['Inter, sans-serif','Arial, sans-serif','Georgia, serif',"'Montserrat', sans-serif","'Playfair Display', serif"]
const FONT_LABELS = ['Inter','Arial','Georgia','Montserrat','Playfair Display']
const TITLE_SIZES = ['14px','16px','18px','20px','24px','28px','32px','36px']
const BRAND_SIZES = ['10px','11px','12px','13px','14px','16px']

const emptyForm = {
  title: '', brand_label: '',
  title_color: '#ffffff', brand_color: '#ffffff',
  title_size: '20px', brand_size: '11px',
  title_font: 'Inter, sans-serif', brand_font: 'Inter, sans-serif',
  title_bold: false, title_italic: false, title_underline: false,
  brand_bold: false, brand_italic: false,
  link_url: '/', is_active: true, sort_order: 0,
}

export default function CollectionsPage() {
  const [cols, setCols] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editItem, setEditItem] = useState(null)
  const [form, setForm] = useState(emptyForm)
  const [imgFile, setImgFile] = useState(null)
  const [imgPreview, setImgPreview] = useState('')
  const [saving, setSaving] = useState(false)
  const fileRef = useRef()
  const setF = (k, v) => setForm(p => ({ ...p, [k]: v }))

  useEffect(() => {
    supabase.from('collections').select('*').order('sort_order')
      .then(({ data }) => { setCols(data || []); setLoading(false) })
  }, [])

  const openAdd = () => {
    setEditItem(null)
    setForm(emptyForm)
    setImgFile(null)
    setImgPreview('')
    setShowModal(true)
  }

  const openEdit = (item) => {
    setEditItem(item)
    setForm({
      title: item.title || '', brand_label: item.brand_label || '',
      title_color: item.title_color || '#ffffff', brand_color: item.brand_color || '#ffffff',
      title_size: item.title_size || '20px', brand_size: item.brand_size || '11px',
      title_font: item.title_font || 'Inter, sans-serif',
      brand_font: item.brand_font || 'Inter, sans-serif',
      title_bold: item.title_bold || false, title_italic: item.title_italic || false,
      title_underline: item.title_underline || false,
      brand_bold: item.brand_bold || false, brand_italic: item.brand_italic || false,
      link_url: item.link_url || '/', is_active: item.is_active ?? true,
      sort_order: item.sort_order || 0,
    })
    setImgPreview(item.image_url || '')
    setShowModal(true)
  }

  const handleImgChange = (e) => {
    const file = e.target.files[0]
    if (!file) return
    setImgFile(file)
    setImgPreview(URL.createObjectURL(file))
  }

  const uploadImg = async () => {
    if (!imgFile) return { url: editItem?.image_url || '', path: editItem?.image_path || '' }
    const ext = imgFile.name.split('.').pop()
    const path = `col_${Date.now()}.${ext}`
    const { error } = await supabase.storage.from('collections').upload(path, imgFile, { upsert: true })
    if (error) throw error
    const { data: { publicUrl } } = supabase.storage.from('collections').getPublicUrl(path)
    return { url: publicUrl, path }
  }

  const handleSave = async () => {
    if (!imgPreview && !imgFile) return toast.error('Vui lòng chọn ảnh!')
    setSaving(true)
    try {
      const { url, path } = await uploadImg()
      const payload = {
        ...form,
        image_url: url, image_path: path,
        sort_order: Number(form.sort_order) || 0
      }
      if (editItem) {
        if (imgFile && editItem.image_path)
          await supabase.storage.from('collections').remove([editItem.image_path])
        const { error } = await supabase.from('collections').update(payload).eq('id', editItem.id)
        if (error) throw error
        setCols(prev => prev.map(c => c.id === editItem.id ? { ...c, ...payload } : c))
        toast.success('Đã cập nhật!')
      } else {
        const { data, error } = await supabase.from('collections').insert(payload).select().single()
        if (error) throw error
        setCols(prev => [...prev, data].sort((a, b) => a.sort_order - b.sort_order))
        toast.success('Đã thêm!')
      }
      setShowModal(false)
    } catch (err) { toast.error('Lỗi: ' + err.message) }
    finally { setSaving(false) }
  }

  const handleDelete = async (item) => {
    if (!window.confirm(`Xoá "${item.title}"?`)) return
    if (item.image_path) await supabase.storage.from('collections').remove([item.image_path])
    await supabase.from('collections').delete().eq('id', item.id)
    setCols(prev => prev.filter(c => c.id !== item.id))
    toast.success('Đã xoá')
  }

  const toggleActive = async (item) => {
    await supabase.from('collections').update({ is_active: !item.is_active }).eq('id', item.id)
    setCols(prev => prev.map(c => c.id === item.id ? { ...c, is_active: !c.is_active } : c))
  }

  const StyleSection = ({ prefix, label }) => (
    <div className="border border-gray-100 rounded-xl p-4 bg-gray-50">
      <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-3">{label}</p>
      <div className="grid grid-cols-3 gap-3 mb-3">
        <div>
          <label className="text-xs text-gray-500 mb-1 block">Màu chữ</label>
          <div className="flex items-center gap-2">
            <input type="color" value={form[`${prefix}_color`]}
              onChange={e => setF(`${prefix}_color`, e.target.value)}
              className="w-8 h-8 rounded border cursor-pointer" />
            <span className="text-xs text-gray-400">{form[`${prefix}_color`]}</span>
          </div>
        </div>
        <div>
          <label className="text-xs text-gray-500 mb-1 block">Cỡ chữ</label>
          <select value={form[`${prefix}_size`]}
            onChange={e => setF(`${prefix}_size`, e.target.value)}
            className="w-full border border-gray-200 rounded-lg px-2 py-1.5 text-xs bg-white outline-none">
            {(prefix === 'title' ? TITLE_SIZES : BRAND_SIZES).map(s => <option key={s}>{s}</option>)}
          </select>
        </div>
        <div>
          <label className="text-xs text-gray-500 mb-1 block">Font</label>
          <select value={form[`${prefix}_font`]}
            onChange={e => setF(`${prefix}_font`, e.target.value)}
            className="w-full border border-gray-200 rounded-lg px-2 py-1.5 text-xs bg-white outline-none">
            {FONTS.map((f, i) => <option key={f} value={f}>{FONT_LABELS[i]}</option>)}
          </select>
        </div>
      </div>
      <div className="flex gap-2">
        {[
          { key: `${prefix}_bold`, label: 'B', style: { fontWeight: 'bold' } },
          { key: `${prefix}_italic`, label: 'I', style: { fontStyle: 'italic' } },
          ...(prefix === 'title' ? [{ key: `${prefix}_underline`, label: 'U', style: { textDecoration: 'underline' } }] : []),
        ].map(({ key, label, style }) => (
          <button key={key} type="button" onClick={() => setF(key, !form[key])}
            className={`w-8 h-8 rounded-lg border text-xs transition-all ${form[key] ? 'border-red-800 bg-red-50 text-red-800' : 'border-gray-200 text-gray-500'}`}
            style={style}>{label}</button>
        ))}
      </div>
    </div>
  )

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Bộ sưu tập (Collection Grid)</h1>
          <p className="text-sm text-gray-400 mt-1">Hiển thị ở cuối trang chủ — hover zoom nhẹ</p>
        </div>
        <button onClick={openAdd}
          className="flex items-center gap-2 text-white px-5 py-2.5 rounded-xl font-medium"
          style={{ backgroundColor: '#B71C1C' }}>
          <Plus size={18} /> Thêm bộ sưu tập
        </button>
      </div>
      {/* ❌ ĐÃ XOÁ: khung info vàng */}

      {loading ? (
        <div className="text-center py-20 text-gray-400">Đang tải...</div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {cols.map(col => (
            <div key={col.id}
              className={`relative group rounded-2xl overflow-hidden shadow-sm ${!col.is_active ? 'opacity-40' : ''}`}
              style={{ aspectRatio: '3/4' }}>
              <img src={col.image_url} alt={col.title}
                className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
              <div className="absolute bottom-0 left-0 p-4">
                {col.brand_label && (
                  <p style={{
                    color: col.brand_color, fontSize: col.brand_size,
                    fontFamily: col.brand_font,
                    fontWeight: col.brand_bold ? 700 : 400,
                    fontStyle: col.brand_italic ? 'italic' : 'normal',
                    textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 3,
                  }}>{col.brand_label}</p>
                )}
                <p style={{
                  color: col.title_color, fontSize: col.title_size,
                  fontFamily: col.title_font,
                  fontWeight: col.title_bold ? 700 : 400,
                  fontStyle: col.title_italic ? 'italic' : 'normal',
                  textDecoration: col.title_underline ? 'underline' : 'none',
                }}>{col.title}</p>
              </div>
              <div className="absolute top-2 right-2 flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                {/* ✅ Nút chỉnh sửa */}
                <button onClick={() => openEdit(col)}
                  className="bg-white/90 p-2 rounded-lg text-blue-600 hover:bg-white shadow">
                  <Pencil size={14} />
                </button>
                {/* ✅ Nút ẩn/hiện */}
                <button onClick={() => toggleActive(col)}
                  className={`bg-white/90 p-2 rounded-lg shadow ${col.is_active ? 'text-green-600' : 'text-gray-500'}`}>
                  {col.is_active ? <Eye size={14} /> : <EyeOff size={14} />}
                </button>
                <button onClick={() => handleDelete(col)}
                  className="bg-white/90 p-2 rounded-lg text-red-500 hover:bg-white shadow">
                  <Trash2 size={14} />
                </button>
              </div>
              <div className="absolute top-2 left-2">
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${col.is_active ? 'bg-green-500 text-white' : 'bg-gray-500 text-white'}`}>
                  {col.is_active ? 'Hiện' : 'Ẩn'} · #{col.sort_order}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-start justify-center overflow-y-auto py-8 px-4">
          <div className="bg-white rounded-2xl w-full max-w-2xl shadow-2xl">
            <div className="flex items-center justify-between px-6 py-4 border-b">
              <h2 className="font-bold text-lg">{editItem ? 'Sửa bộ sưu tập' : 'Thêm bộ sưu tập'}</h2>
              <button onClick={() => setShowModal(false)} className="p-2 hover:bg-gray-100 rounded-full">
                <X size={20} />
              </button>
            </div>
            <div className="p-6 space-y-5">
              {/* Ảnh */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Ảnh bộ sưu tập <span className="text-gray-400 font-normal">(JPG/PNG, tỉ lệ tự do)</span>
                </label>
                <div onClick={() => fileRef.current?.click()}
                  className="border-2 border-dashed border-gray-300 rounded-xl overflow-hidden cursor-pointer hover:border-red-400 h-44">
                  {imgPreview
                    ? <img src={imgPreview} className="w-full h-full object-cover" alt="preview" />
                    : <div className="w-full h-full flex flex-col items-center justify-center text-gray-400">
                        <Upload size={28} className="mb-2 text-gray-300" />
                        <p className="text-sm">Click để chọn ảnh</p>
                      </div>
                  }
                  <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleImgChange} />
                </div>
              </div>

              {/* Tên */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-1 block">Dòng thương hiệu nhỏ</label>
                  <input value={form.brand_label} onChange={e => setF('brand_label', e.target.value)}
                    placeholder="ZUCIANI, ĐÔNG HẢI..."
                    className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-red-800" />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-1 block">Tên bộ sưu tập</label>
                  <input value={form.title} onChange={e => setF('title', e.target.value)}
                    placeholder="TẤT CẢ, NEW ARRIVAL..."
                    className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-red-800" />
                </div>
              </div>

              {/* Style thương hiệu */}
              <StyleSection prefix="brand" label="Style dòng thương hiệu" />
              {/* Style tên */}
              <StyleSection prefix="title" label="Style tên bộ sưu tập" />

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-1 block">Link khi click</label>
                  <input value={form.link_url} onChange={e => setF('link_url', e.target.value)}
                    placeholder="/products?category=..."
                    className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-red-800" />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-1 block">Thứ tự</label>
                  <input type="number" value={form.sort_order} onChange={e => setF('sort_order', e.target.value)}
                    className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-red-800" />
                </div>
              </div>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={form.is_active}
                  onChange={e => setF('is_active', e.target.checked)}
                  className="w-4 h-4 accent-red-800" />
                <span className="text-sm font-medium text-gray-700">Hiển thị trên trang chủ</span>
              </label>
            </div>
            <div className="flex justify-end gap-3 px-6 py-4 border-t bg-gray-50 rounded-b-2xl">
              <button onClick={() => setShowModal(false)}
                className="px-6 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-600 hover:bg-gray-100">Huỷ</button>
              <button onClick={handleSave} disabled={saving}
                className="flex items-center gap-2 text-white px-8 py-2.5 rounded-xl text-sm font-bold"
                style={{ backgroundColor: saving ? '#9ca3af' : '#B71C1C' }}>
                {saving ? <><Loader2 size={16} className="animate-spin" /> Lưu...</> : '💾 Lưu'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}