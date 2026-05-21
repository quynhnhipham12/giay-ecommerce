// Copy toàn bộ code dưới đây dán vào file: src/pages/ProductsPage.jsx (admin)
import { useEffect, useState, useRef } from 'react'
import { supabase } from '../supabaseClient'
import toast from 'react-hot-toast'
import { Plus, Pencil, Trash2, X, Upload, Loader2, Search, Filter } from 'lucide-react'

// ── Categories với subcategory ──
const CATEGORY_MAP = {
  'Giày Nữ': ['Sandal', 'Giày Thể Thao', 'Giày Cao Gót', 'Giày Búp Bê', 'Dép'],
  'Giày Nam': ['Sandal', 'Giày Thể Thao', 'Giày Tây', 'Dép'],
  'Bé Trai': ['Giày Thể Thao', 'Sandal', 'Dép'],
  'Bé Gái': ['Giày Thể Thao', 'Sandal', 'Dép'],
  'Phụ Kiện': ['Nón', 'Balo', 'Vớ'],
}
const CATEGORIES = Object.keys(CATEGORY_MAP)
const ALL_SIZES = ['35','36','37','38','39','40','41','42','43','44','45','freesize']

const FONT_SIZES = ['12px','14px','16px','18px','20px','24px','28px','32px']
const FONT_FAMILIES = ['Inter, sans-serif','Georgia, serif','Courier New, monospace','Arial, sans-serif','Verdana, sans-serif']
const COLORS = ['#000000','#e53e3e','#dd6b20','#d69e2e','#38a169','#3182ce','#805ad5','#ffffff','#718096']

const emptyForm = {
  name: '', brand: '', sku: '', price: '', original_price: '',
  category: 'Giày Nam', subcategory: '',
  sizes: [], colors: [],
  description: '', warranty_info: '', return_info: '', delivery_info: '',
  is_active: true, is_flash_sale: false, is_new: true,
  stock: 100,
}

// ── Rich Text Editor tự xây ──
function RichEditor({ value, onChange, placeholder }) {
  const editorRef = useRef(null)

  useEffect(() => {
    if (editorRef.current) editorRef.current.innerHTML = value || ''
  }, [])

  const exec = (cmd, val = null) => {
    editorRef.current?.focus()
    document.execCommand(cmd, false, val)
    onChange(editorRef.current.innerHTML)
  }

  return (
    <div className="border border-gray-200 rounded-xl overflow-hidden">
      {/* Toolbar */}
      <div className="bg-gray-50 border-b border-gray-200 p-2 flex flex-wrap gap-1 items-center">
        <button type="button" onClick={() => exec('bold')}
          className="px-2 py-1 rounded hover:bg-gray-200 font-bold text-sm" title="In đậm">B</button>
        <button type="button" onClick={() => exec('italic')}
          className="px-2 py-1 rounded hover:bg-gray-200 italic text-sm" title="In nghiêng">I</button>
        <button type="button" onClick={() => exec('underline')}
          className="px-2 py-1 rounded hover:bg-gray-200 underline text-sm" title="Gạch chân">U</button>
        <button type="button" onClick={() => exec('strikeThrough')}
          className="px-2 py-1 rounded hover:bg-gray-200 line-through text-sm" title="Gạch ngang">S</button>

        <div className="w-px h-5 bg-gray-300 mx-1" />

        {/* Font size */}
        <select onChange={e => exec('fontSize', e.target.value)} defaultValue=""
          className="text-xs border border-gray-200 rounded px-1 py-1 bg-white outline-none h-7">
          <option value="" disabled>Cỡ chữ</option>
          {['1','2','3','4','5','6','7'].map((v,i) => (
            <option key={v} value={v}>{FONT_SIZES[i] || v}</option>
          ))}
        </select>

        {/* Font family */}
        <select onChange={e => exec('fontName', e.target.value)} defaultValue=""
          className="text-xs border border-gray-200 rounded px-1 py-1 bg-white outline-none h-7 max-w-[110px]">
          <option value="" disabled>Font chữ</option>
          {FONT_FAMILIES.map(f => (
            <option key={f} value={f} style={{ fontFamily: f }}>{f.split(',')[0]}</option>
          ))}
        </select>

        <div className="w-px h-5 bg-gray-300 mx-1" />

        <button type="button" onClick={() => exec('formatBlock', 'h2')}
          className="px-2 py-1 rounded hover:bg-gray-200 text-xs font-bold">H2</button>
        <button type="button" onClick={() => exec('formatBlock', 'h3')}
          className="px-2 py-1 rounded hover:bg-gray-200 text-xs font-semibold">H3</button>
        <button type="button" onClick={() => exec('formatBlock', 'p')}
          className="px-2 py-1 rounded hover:bg-gray-200 text-xs">P</button>

        <div className="w-px h-5 bg-gray-300 mx-1" />

        <button type="button" onClick={() => exec('insertUnorderedList')}
          className="px-2 py-1 rounded hover:bg-gray-200 text-xs">• List</button>
        <button type="button" onClick={() => exec('insertOrderedList')}
          className="px-2 py-1 rounded hover:bg-gray-200 text-xs">1. List</button>

        <div className="w-px h-5 bg-gray-300 mx-1" />

        <button type="button" onClick={() => exec('justifyLeft')}
          className="px-2 py-1 rounded hover:bg-gray-200 text-xs">⬛←</button>
        <button type="button" onClick={() => exec('justifyCenter')}
          className="px-2 py-1 rounded hover:bg-gray-200 text-xs">⬛↔</button>
        <button type="button" onClick={() => exec('justifyRight')}
          className="px-2 py-1 rounded hover:bg-gray-200 text-xs">⬛→</button>

        <div className="w-px h-5 bg-gray-300 mx-1" />

        {/* Màu chữ */}
        <div className="flex items-center gap-0.5">
          <span className="text-[10px] text-gray-400 mr-0.5">A</span>
          {COLORS.map(c => (
            <button key={c} type="button" onClick={() => exec('foreColor', c)}
              className="w-4 h-4 rounded-full border border-gray-300 hover:scale-125 transition-transform"
              style={{ backgroundColor: c }} title={c} />
          ))}
        </div>

        <div className="w-px h-5 bg-gray-300 mx-1" />

        {/* Màu nền */}
        <div className="flex items-center gap-0.5">
          <span className="text-[10px] text-gray-400 mr-0.5">BG</span>
          {COLORS.map(c => (
            <button key={c} type="button" onClick={() => exec('hiliteColor', c)}
              className="w-4 h-4 rounded-full border border-gray-300 hover:scale-125 transition-transform"
              style={{ backgroundColor: c }} title={c} />
          ))}
        </div>

        <div className="w-px h-5 bg-gray-300 mx-1" />

        <button type="button" onClick={() => exec('removeFormat')}
          className="px-2 py-1 rounded hover:bg-red-100 text-red-500 text-xs">Xoá định dạng</button>
      </div>

      {/* Vùng nhập */}
      <div
        ref={editorRef}
        contentEditable
        suppressContentEditableWarning
        onInput={() => onChange(editorRef.current.innerHTML)}
        className="min-h-[150px] p-4 text-sm text-gray-700 outline-none focus:bg-blue-50/20"
        style={{ lineHeight: '1.6' }}
        data-placeholder={placeholder || 'Nhập nội dung...'}
      />
      <style>{`[contenteditable]:empty:before{content:attr(data-placeholder);color:#9ca3af;pointer-events:none}`}</style>
    </div>
  )
}

// ── Color Manager ──
function ColorManager({ colors, onChange }) {
  const [showAdd, setShowAdd] = useState(false)
  const [newColor, setNewColor] = useState({ name: '', hex: '#000000', images: [] })
  const [uploadingIdx, setUploadingIdx] = useState(null)
  const fileRef = useRef()
  const [uploadTarget, setUploadTarget] = useState(null)

  const addColor = () => {
    if (!newColor.name) return toast.error('Nhập tên màu!')
    onChange([...colors, { ...newColor, images: [] }])
    setNewColor({ name: '', hex: '#000000', images: [] })
    setShowAdd(false)
  }

  const removeColor = (idx) => {
    onChange(colors.filter((_, i) => i !== idx))
  }

  const handleImageUpload = async (file, colorIdx) => {
    if (!file) return
    if (file.size > 5 * 1024 * 1024) return toast.error('Ảnh phải nhỏ hơn 5MB')
    setUploadingIdx(colorIdx)
    try {
      const ext = file.name.split('.').pop()
      const path = `products/color_${Date.now()}.${ext}`
      const { error } = await supabase.storage
        .from('product-images').upload(path, file, { upsert: true })
      if (error) throw error
      const { data: { publicUrl } } = supabase.storage
        .from('product-images').getPublicUrl(path)
      const updated = colors.map((c, i) =>
        i === colorIdx ? { ...c, images: [...(c.images || []), publicUrl] } : c
      )
      onChange(updated)
      toast.success('Đã upload ảnh!')
    } catch (err) {
      toast.error('Lỗi upload: ' + err.message)
    } finally {
      setUploadingIdx(null)
    }
  }

  const removeImage = (colorIdx, imgIdx) => {
    const updated = colors.map((c, i) =>
      i === colorIdx ? { ...c, images: c.images.filter((_, j) => j !== imgIdx) } : c
    )
    onChange(updated)
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <label className="text-sm font-semibold text-gray-700">
          🎨 Màu sản phẩm & Hình ảnh
        </label>
        <button type="button" onClick={() => setShowAdd(!showAdd)}
          className="text-xs text-red-600 hover:underline font-medium">
          + Thêm màu
        </button>
      </div>

      {/* Form thêm màu */}
      {showAdd && (
        <div className="bg-gray-50 rounded-xl p-3 mb-3 flex items-end gap-3">
          <div className="flex-1">
            <label className="text-xs text-gray-500 mb-1 block">Tên màu</label>
            <input value={newColor.name}
              onChange={e => setNewColor(p => ({ ...p, name: e.target.value }))}
              placeholder="Đen, Trắng, Đỏ..."
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-red-500" />
          </div>
          <div>
            <label className="text-xs text-gray-500 mb-1 block">Mã màu</label>
            <input type="color" value={newColor.hex}
              onChange={e => setNewColor(p => ({ ...p, hex: e.target.value }))}
              className="w-10 h-9 rounded-lg border border-gray-200 cursor-pointer" />
          </div>
          <button type="button" onClick={addColor}
            className="bg-red-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-red-700">
            Thêm
          </button>
        </div>
      )}

      {/* Danh sách màu */}
      <div className="space-y-3">
        {colors.map((color, colorIdx) => (
          <div key={colorIdx} className="border border-gray-200 rounded-xl p-3">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-full border-2 border-gray-200"
                  style={{ backgroundColor: color.hex }} />
                <span className="text-sm font-semibold text-gray-700">{color.name}</span>
                <span className="text-xs text-gray-400">{color.hex}</span>
              </div>
              <button type="button" onClick={() => removeColor(colorIdx)}
                className="text-red-400 hover:text-red-600 text-xs">Xoá màu</button>
            </div>

            {/* Ảnh của màu này */}
            <div className="flex gap-2 flex-wrap">
              {(color.images || []).map((img, imgIdx) => (
                <div key={imgIdx} className="relative w-16 h-16">
                  <img src={img} alt="" className="w-full h-full object-cover rounded-lg border" />
                  <button type="button" onClick={() => removeImage(colorIdx, imgIdx)}
                    className="absolute -top-1.5 -right-1.5 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs hover:bg-red-600">
                    ✕
                  </button>
                </div>
              ))}

              {/* Thêm ảnh */}
              <button
                type="button"
                onClick={() => {
                  setUploadTarget(colorIdx)
                  fileRef.current?.click()
                }}
                disabled={uploadingIdx === colorIdx}
                className="w-16 h-16 border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center hover:border-red-400 hover:bg-red-50 transition-all text-gray-400 flex-shrink-0"
              >
                {uploadingIdx === colorIdx
                  ? <Loader2 size={16} className="animate-spin" />
                  : <>
                    <Upload size={14} />
                    <span className="text-[10px] mt-0.5">+Ảnh</span>
                  </>
                }
              </button>
            </div>
          </div>
        ))}
      </div>

      <input
        ref={fileRef} type="file" accept="image/*" className="hidden"
        onChange={e => {
          if (uploadTarget !== null) handleImageUpload(e.target.files[0], uploadTarget)
          e.target.value = ''
        }}
      />

      {colors.length === 0 && (
        <p className="text-xs text-gray-400 mt-2 italic">
          Chưa có màu nào — thêm màu để upload ảnh theo từng màu
        </p>
      )}
    </div>
  )
}

async function writeLog(action, entityId, entityName, newData = null, oldData = null) {
  const { data: { user } } = await supabase.auth.getUser()
  await supabase.from('logs').insert({
    action, entity_type: 'product', entity_id: entityId, entity_name: entityName,
    admin_id: user?.id, admin_email: user?.email,
    old_data: oldData, new_data: newData,
  })
}

export default function ProductsPage() {
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editProduct, setEditProduct] = useState(null)
  const [form, setForm] = useState(emptyForm)
  const [mainImageFile, setMainImageFile] = useState(null)
  const [mainImagePreview, setMainImagePreview] = useState('')
  const [saving, setSaving] = useState(false)
  const [activeTab, setActiveTab] = useState('basic')
  const [search, setSearch] = useState('')
  const [stockFilter, setStockFilter] = useState({ min: '', max: '' })
  const [statusFilter, setStatusFilter] = useState('all')
  const mainFileRef = useRef()

  useEffect(() => { fetchProducts() }, [])

  const fetchProducts = async () => {
    setLoading(true)
    const { data } = await supabase.from('products')
      .select('*').order('created_at', { ascending: false })
    setProducts(data || [])
    setLoading(false)
  }

  const setF = (key, val) => setForm(prev => ({ ...prev, [key]: val }))

  const openAdd = () => {
    setEditProduct(null)
    setForm(emptyForm)
    setMainImageFile(null)
    setMainImagePreview('')
    setActiveTab('basic')
    setShowModal(true)
  }

  const openEdit = (p) => {
    setEditProduct(p)
    setForm({
      name: p.name || '', brand: p.brand || '', sku: p.sku || '',
      price: p.price || '', original_price: p.original_price || '',
      category: p.category || 'Giày Nam',
      subcategory: p.subcategory || '',
      sizes: p.sizes || [], colors: p.colors || [],
      description: p.description || '',
      warranty_info: p.warranty_info || '',
      return_info: p.return_info || '',
      delivery_info: p.delivery_info || '',
      is_active: p.is_active ?? true,
      is_flash_sale: p.is_flash_sale ?? false,
      is_new: p.is_new ?? false,
      stock: p.stock ?? 100,
    })
    setMainImagePreview(p.image_url || '')
    setActiveTab('basic')
    setShowModal(true)
  }

  const handleMainImageChange = (e) => {
    const file = e.target.files[0]
    if (!file) return
    if (file.size > 5 * 1024 * 1024) return toast.error('Ảnh phải nhỏ hơn 5MB')
    setMainImageFile(file)
    setMainImagePreview(URL.createObjectURL(file))
  }

  const uploadMainImage = async () => {
    if (!mainImageFile) return {
      url: editProduct?.image_url || null,
      path: editProduct?.image_path || null
    }
    const ext = mainImageFile.name.split('.').pop()
    const path = `products/${Date.now()}.${ext}`
    const { error } = await supabase.storage
      .from('product-images').upload(path, mainImageFile, { upsert: true })
    if (error) throw new Error('Upload ảnh thất bại: ' + error.message)
    const { data: { publicUrl } } = supabase.storage
      .from('product-images').getPublicUrl(path)
    return { url: publicUrl, path }
  }

  const handleSave = async () => {
    if (!form.name || !form.price || !form.category)
      return toast.error('Vui lòng điền đủ tên, giá và danh mục')
    setSaving(true)
    try {
      const { url: imageUrl, path: imagePath } = await uploadMainImage()
      const payload = {
        name: form.name, brand: form.brand, sku: form.sku,
        price: Number(form.price),
        original_price: form.original_price ? Number(form.original_price) : null,
        category: form.category, subcategory: form.subcategory,
        sizes: form.sizes, colors: form.colors,
        description: form.description,
        warranty_info: form.warranty_info,
        return_info: form.return_info,
        delivery_info: form.delivery_info,
        is_active: form.is_active,
        is_flash_sale: form.is_flash_sale,
        is_new: form.is_new,
        stock: Number(form.stock) || 0,
        image_url: imageUrl, image_path: imagePath,
        updated_at: new Date().toISOString(),
      }

      if (editProduct) {
        if (mainImageFile && editProduct.image_path) {
          await supabase.storage.from('product-images').remove([editProduct.image_path])
        }
        const { error } = await supabase.from('products').update(payload).eq('id', editProduct.id)
        if (error) throw error
        await writeLog('UPDATE_PRODUCT', editProduct.id, form.name, payload, editProduct)
        toast.success('Cập nhật thành công!')
      } else {
        payload.created_at = new Date().toISOString()
        const { data, error } = await supabase.from('products').insert(payload).select().single()
        if (error) throw error
        await writeLog('CREATE_PRODUCT', data.id, form.name, payload)
        toast.success('Thêm sản phẩm thành công!')
      }
      setShowModal(false)
      fetchProducts()
    } catch (err) {
      toast.error('Lỗi: ' + err.message)
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (product) => {
    if (!window.confirm(`Xoá sản phẩm "${product.name}"?`)) return
    try {
      if (product.image_path)
        await supabase.storage.from('product-images').remove([product.image_path])
      await supabase.from('products').delete().eq('id', product.id)
      await writeLog('DELETE_PRODUCT', product.id, product.name, null, product)
      setProducts(prev => prev.filter(p => p.id !== product.id))
      toast.success('Đã xoá sản phẩm')
    } catch (err) {
      toast.error('Lỗi: ' + err.message)
    }
  }

  const toggleSize = (size) => {
    setF('sizes', form.sizes.includes(size)
      ? form.sizes.filter(s => s !== size)
      : [...form.sizes, size].sort()
    )
  }

  const fmt = p => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(p)

  // Filtered products
  const filtered = products.filter(p => {
    const matchSearch = !search || p.name.toLowerCase().includes(search.toLowerCase())
    const matchStatus = statusFilter === 'all'
      ? true : statusFilter === 'active'
        ? p.is_active : statusFilter === 'outofstock'
          ? p.stock <= 0 : true
    const min = stockFilter.min !== '' ? Number(stockFilter.min) : null
    const max = stockFilter.max !== '' ? Number(stockFilter.max) : null
    const matchStock = (min === null || p.stock >= min) && (max === null || p.stock <= max)
    return matchSearch && matchStatus && matchStock
  })

  const TABS = [
    { key: 'basic', label: '📋 Thông tin' },
    { key: 'colors', label: '🎨 Màu & Ảnh' },
    { key: 'desc', label: '📝 Chi tiết SP' },
    { key: 'warranty', label: '🛡 Bảo hành' },
    { key: 'delivery', label: '🚚 Giao nhận' },
  ]

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Quản lý sản phẩm</h1>
          <p className="text-sm text-gray-400 mt-1">{products.length} sản phẩm</p>
        </div>
        <button onClick={openAdd}
          className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white px-5 py-2.5 rounded-xl font-medium transition-colors">
          <Plus size={18} /> Thêm sản phẩm
        </button>
      </div>

      {/* Filter bar */}
      <div className="bg-white rounded-2xl shadow-sm p-4 mb-5">
        <div className="flex flex-wrap gap-3 items-end">
          {/* Search */}
          <div className="flex-1 min-w-[200px]">
            <label className="text-xs font-medium text-gray-500 mb-1 block">Tìm kiếm</label>
            <div className="flex items-center gap-2 border border-gray-200 rounded-xl px-3 py-2">
              <Search size={14} className="text-gray-400" />
              <input value={search} onChange={e => setSearch(e.target.value)}
                placeholder="Tên sản phẩm..."
                className="flex-1 text-sm outline-none" />
            </div>
          </div>

          {/* Status filter */}
          <div>
            <label className="text-xs font-medium text-gray-500 mb-1 block">Trạng thái</label>
            <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
              className="border border-gray-200 rounded-xl px-3 py-2 text-sm bg-white outline-none">
              <option value="all">Tất cả</option>
              <option value="active">Đang hiển thị</option>
              <option value="outofstock">Hết hàng</option>
            </select>
          </div>

          {/* Stock range filter */}
          <div>
            <label className="text-xs font-medium text-gray-500 mb-1 block">
              Tồn kho (từ — đến)
            </label>
            <div className="flex items-center gap-2">
              <input type="number" value={stockFilter.min}
                onChange={e => setStockFilter(p => ({ ...p, min: e.target.value }))}
                placeholder="0" className="w-20 border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none" />
              <span className="text-gray-400">—</span>
              <input type="number" value={stockFilter.max}
                onChange={e => setStockFilter(p => ({ ...p, max: e.target.value }))}
                placeholder="999" className="w-20 border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none" />
            </div>
          </div>

          <button onClick={() => { setSearch(''); setStockFilter({ min: '', max: '' }); setStatusFilter('all') }}
            className="px-4 py-2 text-sm text-gray-500 border border-gray-200 rounded-xl hover:bg-gray-100">
            Xoá lọc
          </button>
        </div>
      </div>

      {/* Product table */}
      {loading ? (
        <div className="text-center py-20 text-gray-400">Đang tải...</div>
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-2xl p-16 text-center shadow-sm">
          <div className="text-6xl mb-4">👟</div>
          <p className="text-gray-400 text-lg mb-6">
            {products.length === 0 ? 'Chưa có sản phẩm nào' : 'Không tìm thấy sản phẩm phù hợp'}
          </p>
          {products.length === 0 && (
            <button onClick={openAdd}
              className="bg-red-600 text-white px-6 py-3 rounded-xl font-medium hover:bg-red-700">
              + Thêm sản phẩm đầu tiên
            </button>
          )}
        </div>
      ) : (
        <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 text-xs text-gray-500 uppercase tracking-wide">
              <tr>
                <th className="px-5 py-3 text-left">Sản phẩm</th>
                <th className="px-5 py-3 text-left">Danh mục</th>
                <th className="px-5 py-3 text-right">Giá</th>
                <th className="px-5 py-3 text-center">Tồn kho</th>
                <th className="px-5 py-3 text-center">Flash</th>
                <th className="px-5 py-3 text-center">Trạng thái</th>
                <th className="px-5 py-3 text-center">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filtered.map(p => (
                <tr key={p.id} className={`hover:bg-gray-50 transition-colors ${p.stock <= 0 ? 'opacity-60' : ''}`}>
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <img
                        src={p.image_url || 'https://placehold.co/48x48/f5f5f5/999?text=?'}
                        alt={p.name}
                        className="w-12 h-12 object-cover rounded-lg border flex-shrink-0"
                      />
                      <div className="min-w-0">
                        <p className="font-medium text-sm text-gray-800 truncate max-w-[200px]">{p.name}</p>
                        <p className="text-xs text-gray-400">{p.brand} {p.sku && `· ${p.sku}`}</p>
                        {p.colors?.length > 0 && (
                          <div className="flex gap-1 mt-1">
                            {p.colors.slice(0, 4).map((c, i) => (
                              <div key={i}
                                className="w-3.5 h-3.5 rounded-full border border-gray-200"
                                style={{ backgroundColor: c.hex }}
                                title={c.name} />
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-4 text-sm text-gray-500">
                    <div>{p.category}</div>
                    {p.subcategory && <div className="text-xs text-gray-400">{p.subcategory}</div>}
                  </td>
                  <td className="px-5 py-4 text-right">
                    <span className="font-bold text-red-600 text-sm">{fmt(p.price)}</span>
                    {p.original_price && (
                      <p className="text-xs text-gray-400 line-through">{fmt(p.original_price)}</p>
                    )}
                  </td>
                  <td className="px-5 py-4 text-center">
                    <span className={`font-bold text-sm ${
                      p.stock <= 0 ? 'text-red-500'
                        : p.stock <= 10 ? 'text-orange-500'
                          : 'text-green-600'
                    }`}>
                      {p.stock}
                    </span>
                    {p.stock <= 0 && (
                      <p className="text-xs text-red-400">Hết hàng</p>
                    )}
                    {p.stock > 0 && p.stock <= 10 && (
                      <p className="text-xs text-orange-400">Sắp hết</p>
                    )}
                  </td>
                  <td className="px-5 py-4 text-center">
                    {p.is_flash_sale ? '🔥' : <span className="text-gray-200">—</span>}
                  </td>
                  <td className="px-5 py-4 text-center">
                    <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${
                      p.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
                    }`}>
                      {p.is_active ? 'Hiển thị' : 'Ẩn'}
                    </span>
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex items-center justify-center gap-2">
                      <button onClick={() => openEdit(p)}
                        className="p-2 text-blue-500 hover:bg-blue-50 rounded-lg">
                        <Pencil size={16} />
                      </button>
                      <button onClick={() => handleDelete(p)}
                        className="p-2 text-red-500 hover:bg-red-50 rounded-lg">
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* ── MODAL ── */}
      {showModal && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-start justify-center overflow-y-auto py-6 px-4">
          <div className="bg-white rounded-2xl w-full max-w-3xl shadow-2xl">

            {/* Modal header */}
            <div className="flex items-center justify-between px-6 py-4 border-b sticky top-0 bg-white rounded-t-2xl z-10">
              <h2 className="text-lg font-bold text-gray-800">
                {editProduct ? '✏️ Chỉnh sửa sản phẩm' : '➕ Thêm sản phẩm mới'}
              </h2>
              <button onClick={() => setShowModal(false)}
                className="p-2 hover:bg-gray-100 rounded-full">
                <X size={20} />
              </button>
            </div>

            {/* Tabs */}
            <div className="flex gap-1 px-6 pt-4 pb-0 border-b overflow-x-auto">
              {TABS.map(tab => (
                <button key={tab.key} onClick={() => setActiveTab(tab.key)}
                  className={`px-4 py-2 text-sm font-medium rounded-t-xl whitespace-nowrap transition-all border-b-2 ${
                    activeTab === tab.key
                      ? 'border-red-600 text-red-600 bg-red-50'
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}>
                  {tab.label}
                </button>
              ))}
            </div>

            <div className="p-6">

              {/* Tab: Thông tin cơ bản */}
              {activeTab === 'basic' && (
                <div className="space-y-5">
                  {/* Ảnh chính */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      📸 Ảnh đại diện sản phẩm
                      <span className="text-gray-400 font-normal ml-1">(JPG/PNG, tối đa 5MB)</span>
                    </label>
                    <div onClick={() => mainFileRef.current?.click()}
                      className="border-2 border-dashed border-gray-300 rounded-xl p-4 text-center cursor-pointer hover:border-red-400 hover:bg-red-50/30 transition-all">
                      {mainImagePreview ? (
                        <div className="relative inline-block">
                          <img src={mainImagePreview} alt="preview"
                            className="max-h-40 mx-auto rounded-xl object-contain" />
                          <p className="text-xs text-gray-400 mt-1">Click để đổi ảnh</p>
                        </div>
                      ) : (
                        <div className="py-6 text-gray-400">
                          <Upload size={32} className="mx-auto mb-2 text-gray-300" />
                          <p className="text-sm font-medium">Click để chọn ảnh đại diện</p>
                        </div>
                      )}
                      <input ref={mainFileRef} type="file" accept="image/*"
                        className="hidden" onChange={handleMainImageChange} />
                    </div>
                  </div>

                  {/* Tên & Brand & SKU */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="col-span-2">
                      <label className="block text-sm font-semibold text-gray-700 mb-1">
                        Tên sản phẩm <span className="text-red-500">*</span>
                      </label>
                      <input value={form.name} onChange={e => setF('name', e.target.value)}
                        placeholder="Nike Air Max 2025..."
                        className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-red-500" />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1">Thương hiệu</label>
                      <input value={form.brand} onChange={e => setF('brand', e.target.value)}
                        placeholder="Nike, Adidas..."
                        className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-red-500" />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1">Mã SKU</label>
                      <input value={form.sku} onChange={e => setF('sku', e.target.value)}
                        placeholder="NK-AM-2025-001"
                        className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-red-500" />
                    </div>
                  </div>

                  {/* Giá */}
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1">
                        Giá bán (VNĐ) <span className="text-red-500">*</span>
                      </label>
                      <input type="number" value={form.price} onChange={e => setF('price', e.target.value)}
                        placeholder="350000"
                        className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-red-500" />
                      {form.price && (
                        <p className="text-xs text-gray-400 mt-1">{fmt(form.price)}</p>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1">
                        Giá gốc (để giảm %)
                      </label>
                      <input type="number" value={form.original_price}
                        onChange={e => setF('original_price', e.target.value)}
                        placeholder="500000"
                        className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-red-500" />
                      {form.price && form.original_price && Number(form.original_price) > Number(form.price) && (
                        <p className="text-xs text-green-600 mt-1 font-medium">
                          ✅ Giảm {Math.round((1 - form.price / form.original_price) * 100)}%
                        </p>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1">
                        Tồn kho
                      </label>
                      <input type="number" value={form.stock}
                        onChange={e => setF('stock', e.target.value)}
                        min="0" placeholder="100"
                        className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-red-500" />
                      <p className={`text-xs mt-1 font-medium ${
                        Number(form.stock) <= 0 ? 'text-red-500'
                          : Number(form.stock) <= 10 ? 'text-orange-500'
                            : 'text-green-600'
                      }`}>
                        {Number(form.stock) <= 0 ? '❌ Hết hàng — web sẽ hiện Sold Out'
                          : Number(form.stock) <= 10 ? '⚠️ Sắp hết hàng'
                            : '✅ Còn hàng'}
                      </p>
                    </div>
                  </div>

                  {/* Category + Subcategory */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1">
                        Danh mục <span className="text-red-500">*</span>
                      </label>
                      <select value={form.category}
                        onChange={e => { setF('category', e.target.value); setF('subcategory', '') }}
                        className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm bg-white outline-none focus:border-red-500">
                        {CATEGORIES.map(c => <option key={c}>{c}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1">Loại</label>
                      <select value={form.subcategory} onChange={e => setF('subcategory', e.target.value)}
                        className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm bg-white outline-none focus:border-red-500">
                        <option value="">-- Tất cả --</option>
                        {(CATEGORY_MAP[form.category] || []).map(s => (
                          <option key={s}>{s}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Sizes */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Sizes có sẵn:
                      <span className="ml-2 text-red-600 font-bold">
                        {form.sizes.length > 0
                          ? form.sizes.map(s => s === 'freesize' ? 'Freesize' : s).join(', ')
                          : 'Chưa chọn'
                        }
                      </span>
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {ALL_SIZES.map(size => (
                        <button key={size} type="button" onClick={() => toggleSize(size)}
                          className={`px-3 py-1.5 rounded-xl border-2 text-sm font-bold transition-all ${
                            form.sizes.includes(size)
                              ? 'bg-red-600 text-white border-red-600 scale-105'
                              : 'border-gray-200 text-gray-600 hover:border-red-300'
                          } ${size === 'freesize' ? 'text-xs px-2' : ''}`}>
                          {size === 'freesize' ? 'Freesize' : size}
                        </button>
                      ))}
                    </div>
                    {form.sizes.includes('freesize') && (
                      <p className="text-xs text-blue-500 mt-1.5">
                        ℹ️ Freesize: chỉ Admin thấy — trang khách không hiển thị ô chọn size
                      </p>
                    )}
                  </div>

                  {/* Toggles */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-3">
                      Tuỳ chọn hiển thị
                    </label>
                    <div className="grid grid-cols-3 gap-3">
                      {[
                        { key: 'is_active', label: '👁 Hiển thị', desc: 'Khách thấy được' },
                        { key: 'is_flash_sale', label: '🔥 Flash Sale', desc: 'Xuất hiện trong Flash Sale' },
                        { key: 'is_new', label: '✨ Sản phẩm mới', desc: 'Badge MỚI' },
                      ].map(({ key, label, desc }) => (
                        <label key={key}
                          className={`flex flex-col gap-1 p-3 rounded-xl border-2 cursor-pointer transition-all ${
                            form[key] ? 'border-red-400 bg-red-50' : 'border-gray-200 hover:border-gray-300'
                          }`}>
                          <div className="flex items-center gap-2">
                            <input type="checkbox" checked={form[key]}
                              onChange={e => setF(key, e.target.checked)}
                              className="w-4 h-4 accent-red-600" />
                            <span className="text-sm font-medium">{label}</span>
                          </div>
                          <span className="text-xs text-gray-400 pl-6">{desc}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Tab: Màu & Ảnh */}
              {activeTab === 'colors' && (
                <ColorManager
                  colors={form.colors}
                  onChange={val => setF('colors', val)}
                />
              )}

              {/* Tab: Chi tiết sản phẩm */}
              {activeTab === 'desc' && (
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Chi tiết sản phẩm
                    <span className="text-gray-400 font-normal ml-1">
                      (hiện trong accordion "Chi tiết Sản Phẩm" ở trang khách)
                    </span>
                  </label>
                  <RichEditor
                    value={form.description}
                    onChange={val => setF('description', val)}
                    placeholder="Chất liệu, kích thước, xuất xứ, mã sản phẩm..."
                  />
                </div>
              )}

              {/* Tab: Bảo hành */}
              {activeTab === 'warranty' && (
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Bảo hành & Đổi trả
                    <span className="text-gray-400 font-normal ml-1">
                      (hiện trong accordion "Bảo Hành & Đổi" ở trang khách)
                    </span>
                  </label>
                  <RichEditor
                    value={form.warranty_info}
                    onChange={val => setF('warranty_info', val)}
                    placeholder="Chính sách bảo hành, điều kiện đổi trả..."
                  />
                </div>
              )}

              {/* Tab: Giao nhận */}
              {activeTab === 'delivery' && (
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Thông tin giao nhận
                    <span className="text-gray-400 font-normal ml-1">
                      (hiện trong accordion "Thông Tin Giao Nhận" ở trang khách)
                    </span>
                  </label>
                  <RichEditor
                    value={form.delivery_info}
                    onChange={val => setF('delivery_info', val)}
                    placeholder="Thời gian giao hàng, khu vực, chính sách phí ship..."
                  />
                </div>
              )}
            </div>

            {/* Modal footer */}
            <div className="flex items-center justify-end gap-3 px-6 py-4 border-t bg-gray-50 rounded-b-2xl sticky bottom-0">
              <button onClick={() => setShowModal(false)}
                className="px-6 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-600 hover:bg-gray-100">
                Huỷ
              </button>
              <button onClick={handleSave} disabled={saving}
                className="flex items-center gap-2 bg-red-600 hover:bg-red-700 disabled:bg-gray-300 text-white px-8 py-2.5 rounded-xl text-sm font-bold transition-colors">
                {saving
                  ? <><Loader2 size={16} className="animate-spin" /> Đang lưu...</>
                  : '💾 Lưu sản phẩm'
                }
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}