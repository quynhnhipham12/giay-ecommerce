// Copy toàn bộ code dưới đây dán vào file: src/pages/HomepagePage.jsx (admin)
import { useEffect, useState, useRef } from 'react'
import { supabase } from '../supabaseClient'
import toast from 'react-hot-toast'
import { Plus, Trash2, X, Loader2, Upload, GripVertical, Eye, EyeOff, Pencil } from 'lucide-react'

const CATEGORIES = ['Giày Nữ','Giày Nam','Bé Trai','Bé Gái','Phụ Kiện']
const CATEGORY_MAP = {
  'Giày Nữ':['Sandal','Giày Thể Thao','Giày Cao Gót','Giày Búp Bê','Dép'],
  'Giày Nam':['Sandal','Giày Thể Thao','Giày Tây','Dép'],
  'Bé Trai':['Giày Thể Thao','Sandal','Dép'],
  'Bé Gái':['Giày Thể Thao','Sandal','Dép'],
  'Phụ Kiện':['Nón','Balo','Vớ'],
}
const FONTS = [
  'Inter, sans-serif','Arial, sans-serif','Georgia, serif',
  "'Montserrat', sans-serif","'Playfair Display', serif","'Roboto', sans-serif"
]
const FONT_LABELS = ['Inter','Arial','Georgia','Montserrat','Playfair Display','Roboto']
const FONT_SIZES = ['14px','16px','18px','20px','24px','28px','32px','36px','48px','64px']
const SECTION_TYPES = [
  { value: 'banner',   label: '🖼️ Banner nhỏ (ngang trang)' },
  { value: 'products', label: '👟 Khối sản phẩm theo danh mục' },
]

const emptyForm = {
  section_type: 'products', title: '', subtitle: '',
  title_color: '#ffffff', title_size: '24px', title_font: 'Inter, sans-serif',
  title_bold: false, title_italic: false, title_underline: false,
  show_button: false, button_text: 'Xem ngay', button_color: '#B71C1C',
  banner_url: '', banner_path: '', banner_link: '/',
  category: 'Giày Nữ', subcategory: '', product_ids: [],
  is_active: true, sort_order: 0,
}

export default function HomepagePage() {
  const [sections, setSections] = useState([])
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [form, setForm] = useState(emptyForm)
  const [bannerFile, setBannerFile] = useState(null)
  const [bannerPreview, setBannerPreview] = useState('')
  const [saving, setSaving] = useState(false)
  const fileRef = useRef()
  const setF = (k, v) => setForm(p => ({ ...p, [k]: v }))

  useEffect(() => {
    Promise.all([
      supabase.from('homepage_sections').select('*').order('sort_order'),
      supabase.from('products').select('id,name,image_url,category').eq('is_active', true).order('name'),
    ]).then(([{ data: s }, { data: p }]) => {
      setSections(s || [])
      setProducts(p || [])
      setLoading(false)
    })
  }, [])

  const openAdd = () => {
    setEditingId(null)
    setForm(emptyForm)
    setBannerFile(null)
    setBannerPreview('')
    setShowModal(true)
  }

  const openEdit = (s) => {
    setEditingId(s.id)
    setForm({
      section_type: s.section_type || 'products',
      title: s.title || '', subtitle: s.subtitle || '',
      title_color: s.title_color || '#ffffff',
      title_size: s.title_size || '24px',
      title_font: s.title_font || 'Inter, sans-serif',
      title_bold: s.title_bold || false,
      title_italic: s.title_italic || false,
      title_underline: s.title_underline || false,
      show_button: s.show_button || false,
      button_text: s.button_text || 'Xem ngay',
      button_color: s.button_color || '#B71C1C',
      banner_url: s.banner_url || '', banner_path: s.banner_path || '',
      banner_link: s.banner_link || '/',
      category: s.category || 'Giày Nữ', subcategory: s.subcategory || '',
      product_ids: s.product_ids || [],
      is_active: s.is_active ?? true,
      sort_order: s.sort_order || 0,
    })
    setBannerPreview(s.banner_url || '')
    setShowModal(true)
  }

  const handleBannerChange = (e) => {
    const file = e.target.files[0]
    if (!file) return
    setBannerFile(file)
    setBannerPreview(URL.createObjectURL(file))
  }

  const uploadBanner = async () => {
    if (!bannerFile) return { url: form.banner_url, path: form.banner_path }
    const ext = bannerFile.name.split('.').pop()
    const path = `homepage_${Date.now()}.${ext}`
    const { error } = await supabase.storage.from('banners').upload(path, bannerFile, { upsert: true })
    if (error) throw error
    const { data: { publicUrl } } = supabase.storage.from('banners').getPublicUrl(path)
    return { url: publicUrl, path }
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      const { url, path } = await uploadBanner()
      const payload = {
        section_type: form.section_type, title: form.title, subtitle: form.subtitle,
        title_color: form.title_color, title_size: form.title_size, title_font: form.title_font,
        title_bold: form.title_bold, title_italic: form.title_italic, title_underline: form.title_underline,
        show_button: form.show_button, button_text: form.button_text, button_color: form.button_color,
        banner_url: url || '', banner_path: path || '', banner_link: form.banner_link,
        category: form.category, subcategory: form.subcategory, product_ids: form.product_ids,
        is_active: form.is_active, sort_order: Number(form.sort_order) || 0,
      }
      if (editingId) {
        const { error } = await supabase.from('homepage_sections').update(payload).eq('id', editingId)
        if (error) throw error
        setSections(prev => prev.map(s => s.id === editingId ? { ...s, ...payload } : s))
        toast.success('Đã cập nhật!')
      } else {
        const { data, error } = await supabase.from('homepage_sections').insert(payload).select().single()
        if (error) throw error
        setSections(prev => [...prev, data].sort((a, b) => a.sort_order - b.sort_order))
        toast.success('Đã thêm section!')
      }
      setShowModal(false)
      setBannerFile(null)
      setBannerPreview('')
    } catch (err) {
      toast.error('Lỗi: ' + err.message)
    } finally { setSaving(false) }
  }

  const toggleActive = async (s) => {
    await supabase.from('homepage_sections').update({ is_active: !s.is_active }).eq('id', s.id)
    setSections(prev => prev.map(x => x.id === s.id ? { ...x, is_active: !x.is_active } : x))
  }

  const handleDelete = async (id) => {
    if (!window.confirm('Xoá section này?')) return
    await supabase.from('homepage_sections').delete().eq('id', id)
    setSections(prev => prev.filter(s => s.id !== id))
    toast.success('Đã xoá')
  }

  const updateOrder = async (id, val) => {
    await supabase.from('homepage_sections').update({ sort_order: val }).eq('id', id)
    setSections(prev => prev.map(s => s.id === id ? { ...s, sort_order: val } : s)
      .sort((a, b) => a.sort_order - b.sort_order))
  }

  const toggleProduct = (pid) =>
    setF('product_ids', form.product_ids.includes(pid)
      ? form.product_ids.filter(x => x !== pid)
      : [...form.product_ids, pid])

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Quản lý Trang Chủ</h1>
          <p className="text-sm text-gray-400 mt-1">Sắp xếp các khối nội dung trên trang chủ</p>
        </div>
        <button onClick={openAdd}
          className="flex items-center gap-2 text-white px-5 py-2.5 rounded-xl font-medium"
          style={{ backgroundColor: '#B71C1C' }}>
          <Plus size={18} /> Thêm section
        </button>
      </div>
      {/* ❌ ĐÃ XOÁ: khung info xanh giải thích */}

      {loading ? (
        <div className="text-center py-20 text-gray-400">Đang tải...</div>
      ) : sections.length === 0 ? (
        <div className="bg-white rounded-2xl p-16 text-center shadow-sm">
          <div className="text-6xl mb-4">🏠</div>
          <p className="text-gray-400 text-lg mb-3">Trang chủ chưa có section</p>
          <button onClick={openAdd} className="text-white px-6 py-3 rounded-xl font-medium"
            style={{ backgroundColor: '#B71C1C' }}>+ Thêm section đầu tiên</button>
        </div>
      ) : (
        <div className="space-y-3">
          {sections.map(s => (
            <div key={s.id} className={`bg-white rounded-2xl shadow-sm p-5 flex items-start gap-4 ${!s.is_active ? 'opacity-50' : ''}`}>
              <div className="flex flex-col items-center gap-1 flex-shrink-0">
                <GripVertical size={16} className="text-gray-300" />
                <input type="number" value={s.sort_order}
                  onChange={e => updateOrder(s.id, Number(e.target.value))}
                  className="w-12 text-center border border-gray-200 rounded-lg px-1 py-1 text-sm outline-none" />
              </div>
              <div className="flex-shrink-0 mt-0.5">
                <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                  s.section_type === 'banner' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'
                }`}>
                  {s.section_type === 'banner' ? '🖼️ Banner' : '👟 Sản phẩm'}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-gray-800">{s.title || s.category || '(Không tiêu đề)'}</p>
                <p className="text-xs text-gray-400 mt-0.5">
                  {s.section_type === 'products'
                    ? `${s.category}${s.subcategory ? ` › ${s.subcategory}` : ''} · ${s.product_ids?.length || 0} SP cụ thể`
                    : `Link: ${s.banner_link}`}
                  {s.show_button && ` · Nút: "${s.button_text}"`}
                </p>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                {/* ✅ Nút chỉnh sửa */}
                <button onClick={() => openEdit(s)}
                  className="p-2 text-blue-500 hover:bg-blue-50 rounded-lg transition-colors" title="Chỉnh sửa">
                  <Pencil size={17} />
                </button>
                <button onClick={() => toggleActive(s)}
                  className={`p-2 rounded-lg transition-colors ${s.is_active ? 'text-green-500 hover:bg-green-50' : 'text-gray-400 hover:bg-gray-100'}`}>
                  {s.is_active ? <Eye size={17} /> : <EyeOff size={17} />}
                </button>
                <button onClick={() => handleDelete(s.id)}
                  className="p-2 text-red-400 hover:bg-red-50 rounded-lg">
                  <Trash2 size={17} />
                </button>
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
              <h2 className="font-bold text-lg">
                {editingId ? '✏️ Chỉnh sửa section' : '➕ Thêm section trang chủ'}
              </h2>
              <button onClick={() => setShowModal(false)} className="p-2 hover:bg-gray-100 rounded-full">
                <X size={20} />
              </button>
            </div>

            <div className="p-6 space-y-5">
              {/* Loại section */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Loại section</label>
                <div className="flex gap-3">
                  {SECTION_TYPES.map(t => (
                    <label key={t.value}
                      className={`flex-1 flex items-center gap-2 p-3 rounded-xl border-2 cursor-pointer text-sm ${
                        form.section_type === t.value ? 'border-red-800 bg-red-50' : 'border-gray-200'
                      }`}>
                      <input type="radio" name="section_type" value={t.value}
                        checked={form.section_type === t.value}
                        onChange={e => setF('section_type', e.target.value)}
                        className="accent-red-800" />
                      {t.label}
                    </label>
                  ))}
                </div>
              </div>

              {/* Thứ tự + Active */}
              <div className="flex gap-4 items-center">
                <div className="flex-1">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Thứ tự (sort order)</label>
                  <input type="number" value={form.sort_order}
                    onChange={e => setF('sort_order', e.target.value)}
                    className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-red-800" />
                </div>
                <label className="flex items-center gap-2 mt-5 cursor-pointer">
                  <input type="checkbox" checked={form.is_active}
                    onChange={e => setF('is_active', e.target.checked)}
                    className="w-4 h-4 accent-red-800" />
                  <span className="text-sm font-medium text-gray-700">Hiển thị</span>
                </label>
              </div>

              {/* Tiêu đề + style chữ */}
              <div className="border border-gray-100 rounded-xl p-4 space-y-4">
                <p className="text-xs font-bold text-gray-500 uppercase tracking-wide">Tiêu đề & định dạng chữ</p>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs text-gray-500 mb-1 block">Tiêu đề</label>
                    <input value={form.title} onChange={e => setF('title', e.target.value)}
                      placeholder="NỮ, NAM, BÉ TRAI..."
                      className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-red-800" />
                  </div>
                  <div>
                    <label className="text-xs text-gray-500 mb-1 block">Mô tả nhỏ</label>
                    <input value={form.subtitle} onChange={e => setF('subtitle', e.target.value)}
                      placeholder="Hàng mới về..."
                      className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-red-800" />
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="text-xs text-gray-500 mb-1 block">Màu chữ</label>
                    <div className="flex items-center gap-2">
                      <input type="color" value={form.title_color}
                        onChange={e => setF('title_color', e.target.value)}
                        className="w-8 h-8 rounded cursor-pointer border" />
                      <span className="text-xs text-gray-400">{form.title_color}</span>
                    </div>
                  </div>
                  <div>
                    <label className="text-xs text-gray-500 mb-1 block">Cỡ chữ</label>
                    <select value={form.title_size} onChange={e => setF('title_size', e.target.value)}
                      className="w-full border border-gray-200 rounded-lg px-2 py-1.5 text-xs bg-white outline-none">
                      {FONT_SIZES.map(s => <option key={s}>{s}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="text-xs text-gray-500 mb-1 block">Font chữ</label>
                    <select value={form.title_font} onChange={e => setF('title_font', e.target.value)}
                      className="w-full border border-gray-200 rounded-lg px-2 py-1.5 text-xs bg-white outline-none">
                      {FONTS.map((f, i) => (
                        <option key={f} value={f} style={{ fontFamily: f }}>{FONT_LABELS[i]}</option>
                      ))}
                    </select>
                  </div>
                </div>
                {/* Kiểu chữ */}
                <div className="flex gap-3">
                  {[
                    { key: 'title_bold', label: 'B', style: { fontWeight: 'bold' } },
                    { key: 'title_italic', label: 'I', style: { fontStyle: 'italic' } },
                    { key: 'title_underline', label: 'U', style: { textDecoration: 'underline' } },
                  ].map(({ key, label, style }) => (
                    <button key={key} type="button" onClick={() => setF(key, !form[key])}
                      className={`w-9 h-9 rounded-lg border-2 text-sm transition-all ${form[key] ? 'border-red-800 bg-red-50 text-red-800' : 'border-gray-200 text-gray-500'}`}
                      style={style}>{label}</button>
                  ))}
                  <span className="text-xs text-gray-400 self-center ml-1">B = đậm, I = nghiêng, U = gạch chân</span>
                </div>
              </div>

              {/* Nút (button) */}
              <div className="border border-gray-100 rounded-xl p-4 space-y-3">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={form.show_button}
                    onChange={e => setF('show_button', e.target.checked)}
                    className="w-4 h-4 accent-red-800" />
                  <span className="text-sm font-semibold text-gray-700">Hiển thị nút (button)</span>
                </label>
                {form.show_button && (
                  <div className="grid grid-cols-2 gap-3 mt-2">
                    <div>
                      <label className="text-xs text-gray-500 mb-1 block">Tên nút</label>
                      <input value={form.button_text} onChange={e => setF('button_text', e.target.value)}
                        placeholder="Xem ngay, Khám phá..."
                        className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-red-800" />
                    </div>
                    <div>
                      <label className="text-xs text-gray-500 mb-1 block">Màu nút</label>
                      <div className="flex items-center gap-2">
                        <input type="color" value={form.button_color}
                          onChange={e => setF('button_color', e.target.value)}
                          className="w-8 h-8 rounded cursor-pointer border" />
                        <span className="text-xs text-gray-400">{form.button_color}</span>
                        <div className="h-7 px-3 rounded-full text-xs font-semibold text-white flex items-center"
                          style={{ backgroundColor: form.button_color }}>
                          {form.button_text || 'Preview'}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Banner section */}
              {form.section_type === 'banner' && (
                <>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Ảnh banner <span className="text-gray-400 font-normal">(16:4 — ~1400×350px)</span>
                    </label>
                    <div onClick={() => fileRef.current?.click()}
                      className="border-2 border-dashed border-gray-300 rounded-xl overflow-hidden cursor-pointer hover:border-red-400">
                      {bannerPreview ? (
                        <div className="relative h-32">
                          <img src={bannerPreview} className="w-full h-full object-cover" alt="preview" />
                        </div>
                      ) : (
                        <div className="py-8 text-center text-gray-400">
                          <Upload size={28} className="mx-auto mb-2 text-gray-300" />
                          <p className="text-sm">Click để chọn ảnh</p>
                        </div>
                      )}
                      <input ref={fileRef} type="file" accept="image/*"
                        className="hidden" onChange={handleBannerChange} />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Link khi click banner</label>
                    <input value={form.banner_link} onChange={e => setF('banner_link', e.target.value)}
                      placeholder="/products?category=Giày Nữ"
                      className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-red-800" />
                  </div>
                </>
              )}

              {/* Products section */}
              {form.section_type === 'products' && (
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Danh mục</label>
                      <select value={form.category}
                        onChange={e => { setF('category', e.target.value); setF('subcategory', '') }}
                        className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm bg-white outline-none">
                        {CATEGORIES.map(c => <option key={c}>{c}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Loại cụ thể</label>
                      <select value={form.subcategory} onChange={e => setF('subcategory', e.target.value)}
                        className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm bg-white outline-none">
                        <option value="">-- Tất cả --</option>
                        {(CATEGORY_MAP[form.category] || []).map(s => <option key={s}>{s}</option>)}
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Chọn sản phẩm cụ thể
                      <span className="text-gray-400 font-normal ml-1">(trống = 4 SP mới nhất)</span>
                    </label>
                    <div className="border border-gray-200 rounded-xl overflow-hidden max-h-56 overflow-y-auto">
                      {products.filter(p => !form.category || p.category === form.category).map(p => (
                        <label key={p.id} className="flex items-center gap-3 px-4 py-2.5 hover:bg-gray-50 cursor-pointer border-b border-gray-50 last:border-0">
                          <input type="checkbox" checked={form.product_ids.includes(p.id)}
                            onChange={() => toggleProduct(p.id)}
                            className="w-4 h-4 accent-red-800 flex-shrink-0" />
                          {p.image_url && <img src={p.image_url} className="w-10 h-10 object-cover rounded-lg border flex-shrink-0" alt="" />}
                          <span className="text-sm text-gray-700 truncate">{p.name}</span>
                        </label>
                      ))}
                    </div>
                    {form.product_ids.length > 0 && (
                      <p className="text-xs text-green-600 mt-1 font-medium">✅ Đã chọn {form.product_ids.length} SP</p>
                    )}
                  </div>
                </>
              )}
            </div>

            <div className="flex justify-end gap-3 px-6 py-4 border-t bg-gray-50 rounded-b-2xl">
              <button onClick={() => setShowModal(false)}
                className="px-6 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-600 hover:bg-gray-100">Huỷ</button>
              <button onClick={handleSave} disabled={saving}
                className="flex items-center gap-2 text-white px-8 py-2.5 rounded-xl text-sm font-bold"
                style={{ backgroundColor: saving ? '#9ca3af' : '#B71C1C' }}>
                {saving ? <><Loader2 size={16} className="animate-spin" /> Lưu...</> : '💾 Lưu section'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}