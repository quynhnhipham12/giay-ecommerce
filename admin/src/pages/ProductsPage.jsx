// Copy toàn bộ code dưới đây dán vào file: src/pages/ProductsPage.jsx (admin)
import { useEffect, useState, useRef, useCallback } from 'react'
import { supabase } from '../supabaseClient'
import toast from 'react-hot-toast'
import { Plus, Pencil, Trash2, X, Upload, Search, Flame } from 'lucide-react'

// ─────────────────────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────────────────────
const CATEGORIES = {
  'Giày Nữ': ['Sandal','Giày Thể Thao','Giày Cao Gót','Giày Búp Bê','Dép'],
  'Giày Nam': ['Sandal','Giày Thể Thao','Giày Tây','Dép'],
  'Bé Trai':  ['Giày Thể Thao','Sandal','Dép'],
  'Bé Gái':   ['Giày Thể Thao','Sandal','Dép'],
  'Phụ Kiện': ['Nón','Balo','Vớ'],
}

const ADULT_SIZES = ['35','36','37','38','39','40','41','42','43','44','45']
const CHILD_SIZES = ['30','31','32','33','34','35']

// ✅ Size theo danh mục:
//   Bé Trai/Bé Gái → 30-35
//   Phụ Kiện       → không có size (trả về [])
//   Còn lại        → 35-45
const getSizes = (cat) => {
  if (['Bé Trai','Bé Gái'].includes(cat)) return CHILD_SIZES
  if (cat === 'Phụ Kiện') return []
  return ADULT_SIZES
}

const fmt = n => new Intl.NumberFormat('vi-VN').format(Number(n) || 0)

const EMPTY_FORM = {
  name: '', brand: '', sku: '', price: '', compare_price: '',
  category: 'Giày Nữ', subcategory: '', description: '',
  material: '', warranty: '', delivery_info: '',
  sizes: [], colors: [], is_active: true, is_flash_sale: false,
  is_new: true, is_best_seller: false, stock_quantity: 0,
  flash_sale_start: '', flash_sale_end: '',
}

// ─────────────────────────────────────────────────────────────
// FlashSaleModal — bật/tắt flash sale + chọn ngày giờ
// ─────────────────────────────────────────────────────────────
function FlashSaleModal({ product, onClose, onSaved }) {
  const toLocal = ts => ts ? new Date(ts).toISOString().slice(0,16) : ''
  const [form, setForm] = useState({
    is_flash_sale:    product.is_flash_sale || false,
    flash_sale_start: toLocal(product.flash_sale_start),
    flash_sale_end:   toLocal(product.flash_sale_end),
  })
  const [saving, setSaving] = useState(false)

  const save = async () => {
    setSaving(true)
    const updates = {
      is_flash_sale:    form.is_flash_sale,
      flash_sale_start: form.flash_sale_start ? new Date(form.flash_sale_start).toISOString() : null,
      flash_sale_end:   form.flash_sale_end   ? new Date(form.flash_sale_end).toISOString()   : null,
    }
    const { error } = await supabase.from('products').update(updates).eq('id', product.id)
    setSaving(false)
    if (error) { toast.error('Lỗi: ' + error.message); return }
    onSaved({ ...product, ...updates })
    toast.success(form.is_flash_sale ? '🔥 Flash Sale đã bật!' : '✅ Đã tắt Flash Sale')
    onClose()
  }

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl">
        <div className="flex items-center justify-between px-6 py-4 border-b">
          <h3 className="font-bold text-lg flex items-center gap-2">
            <Flame size={20} className="text-orange-500" /> Flash Sale
          </h3>
          <button onClick={onClose} className="p-1.5 hover:bg-gray-100 rounded-lg"><X size={18} /></button>
        </div>
        <div className="p-6 space-y-4">
          <p className="text-sm font-semibold text-gray-700 line-clamp-2">{product.name}</p>

          {/* Toggle */}
          <label className={`flex items-center gap-3 p-4 border-2 rounded-xl cursor-pointer transition-all select-none ${form.is_flash_sale ? 'border-orange-400 bg-orange-50' : 'border-gray-200 hover:border-orange-200'}`}>
            <input type="checkbox" checked={form.is_flash_sale}
              onChange={e => setForm(p => ({ ...p, is_flash_sale: e.target.checked }))}
              className="w-5 h-5 accent-orange-500" />
            <div>
              <p className="font-bold text-sm">🔥 Kích hoạt Flash Sale</p>
              <p className="text-xs text-gray-500">Hiện trong danh mục Flash Sale</p>
            </div>
          </label>

          {/* DateTime pickers */}
          {form.is_flash_sale && (
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">⏰ Bắt đầu</label>
                <input type="datetime-local" value={form.flash_sale_start}
                  onChange={e => setForm(p => ({ ...p, flash_sale_start: e.target.value }))}
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-orange-400" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">⏰ Kết thúc</label>
                <input type="datetime-local" value={form.flash_sale_end}
                  onChange={e => setForm(p => ({ ...p, flash_sale_end: e.target.value }))}
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-orange-400" />
              </div>
              <p className="text-xs text-gray-400">Để trống nếu không giới hạn thời gian</p>
            </div>
          )}
        </div>
        <div className="flex gap-3 px-6 pb-6">
          <button onClick={onClose} className="flex-1 py-2.5 border border-gray-200 rounded-xl text-sm font-medium hover:bg-gray-50">Huỷ</button>
          <button onClick={save} disabled={saving}
            className="flex-1 py-2.5 rounded-xl text-sm font-bold text-white transition-colors"
            style={{ backgroundColor: saving ? '#9ca3af' : '#f97316' }}>
            {saving ? 'Đang lưu...' : '💾 Lưu'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────
// ColorManager — quản lý màu sắc + hình ảnh
// ─────────────────────────────────────────────────────────────
function ColorManager({ colors, onChange }) {
  const fileRefs = useRef({})
  const [uploading, setUploading] = useState({})

  const addColor = () => onChange([...colors, { id: Date.now(), name: '', colorCode: '#000000', images: [] }])
  const removeColor = (id) => onChange(colors.filter(c => c.id !== id))
  const updateColor = (id, field, val) => onChange(colors.map(c => c.id === id ? { ...c, [field]: val } : c))

  const uploadImages = async (colorId, files) => {
    setUploading(p => ({ ...p, [colorId]: true }))
    const urls = []
    for (const file of Array.from(files)) {
      const path = `products/${colorId}_${Date.now()}_${file.name.replace(/\s/g,'_')}`
      const { error } = await supabase.storage.from('banners').upload(path, file, { upsert: true })
      if (!error) {
        const { data: { publicUrl } } = supabase.storage.from('banners').getPublicUrl(path)
        urls.push(publicUrl)
      }
    }
    const color = colors.find(c => c.id === colorId)
    if (color) updateColor(colorId, 'images', [...(color.images || []), ...urls])
    setUploading(p => ({ ...p, [colorId]: false }))
  }

  const removeImage = (colorId, imgIdx) => {
    const color = colors.find(c => c.id === colorId)
    if (color) updateColor(colorId, 'images', color.images.filter((_, i) => i !== imgIdx))
  }

  return (
    <div className="space-y-4">
      {colors.map(color => (
        <div key={color.id} className="border border-gray-200 rounded-xl p-4">
          <div className="flex items-center gap-3 mb-3">
            <input type="color" value={color.colorCode || '#000000'} onChange={e => updateColor(color.id, 'colorCode', e.target.value)}
              className="w-10 h-10 rounded-lg border border-gray-200 cursor-pointer p-0.5" />
            <input value={color.name} onChange={e => updateColor(color.id, 'name', e.target.value)}
              placeholder="Tên màu (VD: Trắng, Đen...)"
              className="flex-1 border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-red-800" />
            <button onClick={() => removeColor(color.id)} className="p-2 text-red-400 hover:bg-red-50 rounded-lg">
              <Trash2 size={16} />
            </button>
          </div>
          <div className="flex flex-wrap gap-2 mb-2">
            {(color.images || []).map((img, idx) => (
              <div key={idx} className="relative w-20 h-20 rounded-xl overflow-hidden border border-gray-200 group">
                <img src={img} alt="" className="w-full h-full object-cover" />
                <button onClick={() => removeImage(color.id, idx)}
                  className="absolute inset-0 bg-black/50 hidden group-hover:flex items-center justify-center text-white rounded-xl">
                  <X size={16} />
                </button>
                {idx === 0 && <span className="absolute top-1 left-1 bg-red-700 text-white text-[9px] px-1 rounded">Chính</span>}
              </div>
            ))}
            <button onClick={() => fileRefs.current[color.id]?.click()}
              className="w-20 h-20 border-2 border-dashed border-gray-300 rounded-xl flex flex-col items-center justify-center text-gray-400 hover:border-red-400 hover:text-red-400 transition-all cursor-pointer text-xs gap-1">
              {uploading[color.id] ? <div className="w-5 h-5 border-2 border-gray-300 border-t-red-700 rounded-full animate-spin" /> : <><Upload size={18} /><span>Ảnh</span></>}
            </button>
            <input ref={el => fileRefs.current[color.id] = el} type="file" accept="image/*" multiple className="hidden"
              onChange={e => uploadImages(color.id, e.target.files)} />
          </div>
        </div>
      ))}
      <button onClick={addColor} className="w-full py-2.5 border-2 border-dashed border-gray-300 rounded-xl text-sm font-medium text-gray-500 hover:border-red-400 hover:text-red-700 transition-all flex items-center justify-center gap-2">
        <Plus size={16} /> Thêm màu sắc
      </button>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────
// ProductForm — Modal thêm/sửa sản phẩm
// ─────────────────────────────────────────────────────────────
function ProductForm({ product, onClose, onSaved }) {
  const isEdit = !!product?.id
  const [form, setForm] = useState(isEdit ? {
    ...EMPTY_FORM, ...product,
    flash_sale_start: product.flash_sale_start ? new Date(product.flash_sale_start).toISOString().slice(0,16) : '',
    flash_sale_end:   product.flash_sale_end   ? new Date(product.flash_sale_end).toISOString().slice(0,16)   : '',
  } : { ...EMPTY_FORM })
  const [tab, setTab]       = useState(0)
  const [saving, setSaving] = useState(false)

  const setF = (k, v) => setForm(p => ({ ...p, [k]: v }))

  // ✅ Reset sizes khi đổi category
  const handleCategoryChange = (cat) => {
    setF('category', cat)
    setF('subcategory', '')
    setF('sizes', []) // reset sizes khi đổi danh mục
  }

  const toggleSize = (s) => {
    setF('sizes', form.sizes.includes(s) ? form.sizes.filter(x => x !== s) : [...form.sizes, s])
  }

  const save = async () => {
    if (!form.name.trim()) { toast.error('Nhập tên sản phẩm'); return }
    if (!form.category) { toast.error('Chọn danh mục'); return }
    if (!form.price || Number(form.price) <= 0) { toast.error('Nhập giá sản phẩm'); return }
    setSaving(true)
    try {
      const payload = {
        ...form,
        price:         Number(form.price) || 0,
        compare_price: Number(form.compare_price) || 0,
        stock_quantity: Number(form.stock_quantity) || 0,
        flash_sale_start: form.flash_sale_start ? new Date(form.flash_sale_start).toISOString() : null,
        flash_sale_end:   form.flash_sale_end   ? new Date(form.flash_sale_end).toISOString()   : null,
      }
      let data, error
      if (isEdit) {
        ({ data, error } = await supabase.from('products').update(payload).eq('id', product.id).select().single())
      } else {
        ({ data, error } = await supabase.from('products').insert(payload).select().single())
      }
      if (error) throw error
      onSaved(data)
      toast.success(isEdit ? 'Đã cập nhật sản phẩm!' : 'Đã thêm sản phẩm!')
      onClose()
    } catch (err) { toast.error('Lỗi: ' + err.message) }
    finally { setSaving(false) }
  }

  const sizeOptions = getSizes(form.category)
  const TABS = ['Thông tin','Màu & Ảnh','Mô tả','Bảo hành','Giao nhận']

  return (
    <div className="fixed inset-0 bg-black/60 z-40 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-3xl max-h-[90vh] flex flex-col shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b flex-shrink-0">
          <h2 className="font-bold text-xl">{isEdit ? 'Sửa sản phẩm' : 'Thêm sản phẩm mới'}</h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-xl"><X size={20} /></button>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 px-6 pt-4 pb-0 flex-shrink-0">
          {TABS.map((t, i) => (
            <button key={t} onClick={() => setTab(i)}
              className={`px-4 py-2 rounded-t-xl text-sm font-medium border-b-2 transition-all ${tab === i ? 'border-red-800 text-red-800 bg-red-50' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
              {t}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">

          {/* ── Tab 0: Thông tin ── */}
          {tab === 0 && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-600 mb-1">Tên sản phẩm *</label>
                  <input value={form.name} onChange={e => setF('name', e.target.value)} placeholder="Giày Thể Thao Nike..."
                    className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-red-800" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1">Thương hiệu</label>
                  <input value={form.brand} onChange={e => setF('brand', e.target.value)} placeholder="Nike, Adidas..."
                    className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-red-800" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1">SKU / Mã SP</label>
                  <input value={form.sku} onChange={e => setF('sku', e.target.value)} placeholder="NK001"
                    className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-red-800" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1">Giá bán *</label>
                  <input type="number" value={form.price} onChange={e => setF('price', e.target.value)} placeholder="500000"
                    className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-red-800" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1">Giá gốc (so sánh)</label>
                  <input type="number" value={form.compare_price} onChange={e => setF('compare_price', e.target.value)} placeholder="700000"
                    className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-red-800" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1">Tồn kho</label>
                  <input type="number" value={form.stock_quantity} onChange={e => setF('stock_quantity', e.target.value)} placeholder="100"
                    className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-red-800" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1">Danh mục *</label>
                  <select value={form.category} onChange={e => handleCategoryChange(e.target.value)}
                    className="w-full border border-red-300 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-red-800 bg-white">
                    {Object.keys(CATEGORIES).map(c => <option key={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1">Loại</label>
                  <select value={form.subcategory} onChange={e => setF('subcategory', e.target.value)}
                    className={`w-full border rounded-xl px-4 py-2.5 text-sm outline-none bg-white ${form.subcategory ? 'border-red-300' : 'border-gray-200'}`}>
                    <option value="">-- Tất cả --</option>
                    {(CATEGORIES[form.category] || []).map(s => <option key={s}>{s}</option>)}
                  </select>
                </div>
              </div>

              {/* ✅ Sizes — ẩn hoàn toàn khi là Phụ Kiện */}
              {sizeOptions.length > 0 && (
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <label className="text-sm font-medium text-gray-600">Sizes có sẵn:</label>
                    {form.sizes.length === 0
                      ? <span className="text-sm font-semibold text-red-600">Chưa chọn</span>
                      : <span className="text-sm text-green-700 font-semibold">{form.sizes.sort((a,b)=>Number(a)-Number(b)).join(', ')}</span>
                    }
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {sizeOptions.map(s => (
                      <button key={s} type="button" onClick={() => toggleSize(s)}
                        className={`px-4 py-2 rounded-2xl text-sm font-medium border-2 transition-all ${form.sizes.includes(s) ? 'border-red-700 bg-red-700 text-white' : 'border-gray-200 text-gray-600 hover:border-gray-400'}`}>
                        {s}
                      </button>
                    ))}
                    <button type="button" onClick={() => toggleSize('freesize')}
                      className={`px-4 py-2 rounded-2xl text-sm font-medium border-2 transition-all ${form.sizes.includes('freesize') ? 'border-red-700 bg-red-700 text-white' : 'border-gray-200 text-gray-600 hover:border-gray-400'}`}>
                      Freesize
                    </button>
                  </div>
                </div>
              )}

              {/* ✅ Thông báo khi chọn Phụ Kiện */}
              {form.category === 'Phụ Kiện' && (
                <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 text-sm text-blue-600">
                  ℹ️ Phụ kiện (Nón, Balo, Vớ) không cần chọn size giày
                </div>
              )}

              {/* Tuỳ chọn hiển thị */}
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-2">Tuỳ chọn hiển thị</label>
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { key: 'is_active',      emoji: '👁️', label: 'Hiển thị',      note: 'Khách thấy được' },
                    { key: 'is_flash_sale',  emoji: '🔥', label: 'Flash Sale',     note: 'Xuất hiện trong Flash Sale' },
                    { key: 'is_new',         emoji: '✨', label: 'Sản phẩm mới',  note: 'Badge MỚI' },
                  ].map(({ key, emoji, label, note }) => (
                    <label key={key} className={`flex items-center gap-2 p-3 border-2 rounded-xl cursor-pointer transition-all select-none ${form[key] ? 'border-red-400 bg-red-50' : 'border-gray-200 hover:border-gray-300'}`}>
                      <input type="checkbox" checked={!!form[key]} onChange={e => setF(key, e.target.checked)} className="w-4 h-4 accent-red-700" />
                      <div>
                        <p className="text-xs font-bold">{emoji} {label}</p>
                        <p className="text-[10px] text-gray-400">{note}</p>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              {/* Flash sale dates - chỉ hiện khi bật flash sale */}
              {form.is_flash_sale && (
                <div className="bg-orange-50 border border-orange-200 rounded-xl p-4 space-y-3">
                  <p className="text-sm font-bold text-orange-700">🔥 Thời gian Flash Sale</p>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs text-orange-600 mb-1">Bắt đầu</label>
                      <input type="datetime-local" value={form.flash_sale_start}
                        onChange={e => setF('flash_sale_start', e.target.value)}
                        className="w-full border border-orange-300 rounded-xl px-3 py-2 text-sm outline-none focus:border-orange-500" />
                    </div>
                    <div>
                      <label className="block text-xs text-orange-600 mb-1">Kết thúc</label>
                      <input type="datetime-local" value={form.flash_sale_end}
                        onChange={e => setF('flash_sale_end', e.target.value)}
                        className="w-full border border-orange-300 rounded-xl px-3 py-2 text-sm outline-none focus:border-orange-500" />
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ── Tab 1: Màu & Ảnh ── */}
          {tab === 1 && (
            <div>
              <p className="text-sm text-gray-500 mb-4">Thêm màu sắc và upload ảnh cho từng màu. Ảnh đầu tiên làm ảnh đại diện.</p>
              <ColorManager colors={form.colors || []} onChange={val => setF('colors', val)} />
            </div>
          )}

          {/* ── Tab 2: Mô tả ── */}
          {tab === 2 && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">Mô tả sản phẩm</label>
                <textarea rows={5} value={form.description} onChange={e => setF('description', e.target.value)}
                  placeholder="Mô tả chi tiết về sản phẩm..."
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-red-800 resize-none" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">Chất liệu</label>
                <textarea rows={3} value={form.material} onChange={e => setF('material', e.target.value)}
                  placeholder="Da thật, vải mesh, đế cao su..."
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-red-800 resize-none" />
              </div>
            </div>
          )}

          {/* ── Tab 3: Bảo hành ── */}
          {tab === 3 && (
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">Chính sách bảo hành</label>
              <textarea rows={6} value={form.warranty} onChange={e => setF('warranty', e.target.value)}
                placeholder="Bảo hành 6 tháng cho lỗi nhà sản xuất..."
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-red-800 resize-none" />
            </div>
          )}

          {/* ── Tab 4: Giao nhận ── */}
          {tab === 4 && (
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">Thông tin giao nhận</label>
              <textarea rows={6} value={form.delivery_info} onChange={e => setF('delivery_info', e.target.value)}
                placeholder="Giao hàng toàn quốc 2-5 ngày, miễn ship từ 500k..."
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-red-800 resize-none" />
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex gap-3 px-6 py-4 border-t flex-shrink-0">
          <button onClick={onClose} className="flex-1 py-3 border border-gray-200 rounded-xl text-sm font-medium hover:bg-gray-50">Huỷ</button>
          <button onClick={save} disabled={saving}
            className="flex-1 py-3 text-white rounded-xl text-sm font-bold flex items-center justify-center gap-2"
            style={{ backgroundColor: saving ? '#9ca3af' : '#B71C1C' }}>
            {saving ? 'Đang lưu...' : '💾 Lưu sản phẩm'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────
// ProductsPage — Trang chính
// ─────────────────────────────────────────────────────────────
const CAT_TABS = ['Tất cả', ...Object.keys(CATEGORIES)]

export default function ProductsPage() {
  const [products, setProducts]     = useState([])
  const [loading, setLoading]       = useState(true)
  const [search, setSearch]         = useState('')
  const [catFilter, setCatFilter]   = useState('Tất cả')
  const [formOpen, setFormOpen]     = useState(false)
  const [editProduct, setEditProduct] = useState(null)
  const [flashModal, setFlashModal] = useState(null)
  const [page, setPage]             = useState(1)
  const [total, setTotal]           = useState(0)
  const PER_PAGE = 20

  const load = useCallback(async (pg = 1) => {
    setLoading(true)
    let q = supabase.from('products').select('*', { count: 'exact' })
    if (catFilter !== 'Tất cả') q = q.eq('category', catFilter)
    if (search.trim()) q = q.ilike('name', `%${search.trim()}%`)
    q = q.order('created_at', { ascending: false }).range((pg-1)*PER_PAGE, pg*PER_PAGE-1)
    const { data, count } = await q
    setProducts(data || [])
    setTotal(count || 0)
    setLoading(false)
  }, [catFilter, search])

  useEffect(() => { setPage(1); load(1) }, [catFilter, search])
  useEffect(() => { load(page) }, [page])

  const openAdd  = () => { setEditProduct(null); setFormOpen(true) }
  const openEdit = (p) => { setEditProduct(p); setFormOpen(true) }

  const deleteProduct = async (id) => {
    if (!confirm('Xoá sản phẩm này?')) return
    await supabase.from('products').delete().eq('id', id)
    setProducts(p => p.filter(x => x.id !== id))
    toast.success('Đã xoá')
  }

  const onSaved = (saved) => {
    setProducts(prev => {
      const exists = prev.find(p => p.id === saved.id)
      return exists ? prev.map(p => p.id === saved.id ? saved : p) : [saved, ...prev]
    })
    setTotal(p => p + (products.find(x => x.id === saved.id) ? 0 : 1))
  }

  const onFlashSaved = (updated) => {
    setProducts(prev => prev.map(p => p.id === updated.id ? updated : p))
  }

  const totalPages = Math.ceil(total / PER_PAGE)

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <h1 className="text-2xl font-black text-gray-800">Sản phẩm</h1>
        <button onClick={openAdd}
          className="flex items-center gap-2 text-white px-5 py-2.5 rounded-xl font-semibold text-sm"
          style={{ backgroundColor: '#B71C1C' }}>
          <Plus size={16} /> Thêm sản phẩm
        </button>
      </div>

      {/* Search + Filter */}
      <div className="bg-white rounded-2xl shadow-sm p-4 mb-4">
        <div className="flex gap-3 mb-4">
          <div className="flex-1 relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Tìm tên sản phẩm..."
              className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm outline-none focus:border-red-800" />
          </div>
        </div>
        <div className="flex gap-2 flex-wrap">
          {CAT_TABS.map(t => (
            <button key={t} onClick={() => setCatFilter(t)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${catFilter === t ? 'text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
              style={catFilter === t ? { backgroundColor: '#B71C1C' } : {}}>
              {t}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50">
                <th className="text-left px-4 py-3 font-semibold text-gray-500 text-xs uppercase">Sản phẩm</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-500 text-xs uppercase">Danh mục</th>
                <th className="text-right px-4 py-3 font-semibold text-gray-500 text-xs uppercase">Giá</th>
                <th className="text-center px-4 py-3 font-semibold text-gray-500 text-xs uppercase">Tồn kho</th>
                <th className="text-center px-4 py-3 font-semibold text-gray-500 text-xs uppercase">Flash</th>
                <th className="text-center px-4 py-3 font-semibold text-gray-500 text-xs uppercase">Trạng thái</th>
                <th className="text-center px-4 py-3 font-semibold text-gray-500 text-xs uppercase">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                [...Array(5)].map((_, i) => (
                  <tr key={i} className="border-b border-gray-50">
                    <td colSpan={7} className="px-4 py-4">
                      <div className="h-10 bg-gray-100 rounded-xl animate-pulse" />
                    </td>
                  </tr>
                ))
              ) : products.length === 0 ? (
                <tr><td colSpan={7} className="text-center py-16 text-gray-400">Không có sản phẩm nào</td></tr>
              ) : products.map(p => {
                const thumb = p.colors?.[0]?.images?.[0] || ''
                return (
                  <tr key={p.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-xl overflow-hidden bg-gray-100 flex-shrink-0">
                          {thumb ? <img src={thumb} alt="" className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-gray-300 text-xl">📦</div>}
                        </div>
                        <div className="min-w-0">
                          <p className="font-semibold text-gray-800 text-sm truncate max-w-[200px]">{p.name}</p>
                          <p className="text-xs text-gray-400">{p.brand} {p.sku ? `· ${p.sku}` : ''}</p>
                          {/* Color swatches */}
                          <div className="flex gap-1 mt-1">
                            {(p.colors || []).slice(0,4).map((c, i) => (
                              <div key={i} className="w-3 h-3 rounded-full border border-gray-200"
                                style={{ backgroundColor: c.colorCode || '#ccc' }} title={c.name} />
                            ))}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-gray-700">{p.category}</p>
                      {p.subcategory && <p className="text-xs text-gray-400">{p.subcategory}</p>}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <p className="font-bold" style={{ color: '#B71C1C' }}>{fmt(p.price)} đ</p>
                      {p.compare_price > p.price && (
                        <p className="text-xs text-gray-400 line-through">{fmt(p.compare_price)} đ</p>
                      )}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className={`font-semibold ${Number(p.stock_quantity) > 0 ? 'text-green-600' : 'text-red-500'}`}>
                        {p.stock_quantity ?? 0}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      {/* ✅ Flash sale icon - bấm để mở modal */}
                      <button
                        onClick={() => setFlashModal(p)}
                        title={p.is_flash_sale ? 'Flash Sale đang bật — click để chỉnh' : 'Bật Flash Sale'}
                        className={`inline-flex items-center justify-center w-8 h-8 rounded-xl transition-all ${p.is_flash_sale ? 'bg-orange-100 text-orange-500 hover:bg-orange-200' : 'text-gray-300 hover:text-orange-400 hover:bg-orange-50'}`}>
                        🔥
                      </button>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${p.is_active ? 'bg-green-50 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                        {p.is_active ? 'Hiển thị' : 'Ẩn'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-center gap-1">
                        <button onClick={() => openEdit(p)} className="p-2 text-blue-500 hover:bg-blue-50 rounded-xl transition-all" title="Sửa">
                          <Pencil size={15} />
                        </button>
                        <button onClick={() => deleteProduct(p.id)} className="p-2 text-red-400 hover:bg-red-50 rounded-xl transition-all" title="Xoá">
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100">
            <p className="text-xs text-gray-400">{total} sản phẩm · Trang {page}/{totalPages}</p>
            <div className="flex gap-1">
              <button onClick={() => setPage(p => Math.max(1, p-1))} disabled={page === 1}
                className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 disabled:opacity-40 text-sm">‹</button>
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                const pg = page <= 3 ? i+1 : page + i - 2
                if (pg < 1 || pg > totalPages) return null
                return (
                  <button key={pg} onClick={() => setPage(pg)}
                    className={`w-8 h-8 flex items-center justify-center rounded-lg text-sm ${pg === page ? 'text-white' : 'hover:bg-gray-100'}`}
                    style={pg === page ? { backgroundColor: '#B71C1C' } : {}}>
                    {pg}
                  </button>
                )
              })}
              <button onClick={() => setPage(p => Math.min(totalPages, p+1))} disabled={page === totalPages}
                className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 disabled:opacity-40 text-sm">›</button>
            </div>
          </div>
        )}
      </div>

      {/* Modals */}
      {formOpen && (
        <ProductForm
          product={editProduct}
          onClose={() => setFormOpen(false)}
          onSaved={onSaved}
        />
      )}
      {flashModal && (
        <FlashSaleModal
          product={flashModal}
          onClose={() => setFlashModal(null)}
          onSaved={onFlashSaved}
        />
      )}
    </div>
  )
}