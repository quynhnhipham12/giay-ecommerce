// Copy toàn bộ code dưới đây dán vào file: src/pages/BannersPage.jsx (admin)
import { useEffect, useState, useRef } from 'react'
import { supabase } from '../supabaseClient'
import toast from 'react-hot-toast'
import { Plus, Trash2, X, Upload, Loader2, Eye, EyeOff } from 'lucide-react'

const OVERLAYS = [
  { label: 'Tối trái', value: 'from-gray-950/80 via-gray-900/40 to-transparent' },
  { label: 'Đỏ trái', value: 'from-red-950/80 via-red-900/40 to-transparent' },
  { label: 'Không overlay', value: 'from-transparent to-transparent' },
]

const emptyForm = {
  badge_text: '', headline: '', subtitle: '', cta_text: 'Xem ngay',
  link_url: '/', overlay_color: OVERLAYS[0].value,
  is_active: true, sort_order: 0,
  scheduled_start: '', scheduled_end: '',
}

export default function BannersPage() {
  const [banners, setBanners] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [form, setForm] = useState(emptyForm)
  const [imageFile, setImageFile] = useState(null)
  const [imagePreview, setImagePreview] = useState('')
  const [saving, setSaving] = useState(false)
  const fileRef = useRef()

  useEffect(() => { fetchBanners() }, [])

  const fetchBanners = async () => {
    const { data } = await supabase.from('banners').select('*').order('sort_order')
    setBanners(data || [])
    setLoading(false)
  }

  const handleImageChange = (e) => {
    const file = e.target.files[0]
    if (!file) return
    if (file.size > 5 * 1024 * 1024) return toast.error('Ảnh phải nhỏ hơn 5MB')
    setImageFile(file)
    setImagePreview(URL.createObjectURL(file))
  }

  const handleSave = async () => {
    if (!imageFile && !form.image_url) return toast.error('Vui lòng chọn ảnh banner!')
    setSaving(true)
    try {
      let imageUrl = form.image_url || ''
      let imagePath = form.image_path || ''

      if (imageFile) {
        const ext = imageFile.name.split('.').pop()
        imagePath = `banner_${Date.now()}.${ext}`
        const { error: upErr } = await supabase.storage
          .from('banners').upload(imagePath, imageFile, { upsert: true })
        if (upErr) throw upErr
        const { data: { publicUrl } } = supabase.storage.from('banners').getPublicUrl(imagePath)
        imageUrl = publicUrl
      }

      const payload = {
        ...form,
        image_url: imageUrl,
        image_path: imagePath,
        sort_order: Number(form.sort_order) || 0,
        scheduled_start: form.scheduled_start || null,
        scheduled_end: form.scheduled_end || null,
      }
      delete payload.id

      const { error } = await supabase.from('banners').insert(payload)
      if (error) throw error
      toast.success('Đã thêm banner!')
      setShowModal(false)
      setForm(emptyForm)
      setImageFile(null)
      setImagePreview('')
      fetchBanners()
    } catch (err) {
      toast.error('Lỗi: ' + err.message)
    } finally {
      setSaving(false)
    }
  }

  const toggleActive = async (banner) => {
    await supabase.from('banners').update({ is_active: !banner.is_active }).eq('id', banner.id)
    setBanners(prev => prev.map(b => b.id === banner.id ? { ...b, is_active: !b.is_active } : b))
  }

  const handleDelete = async (banner) => {
    if (!window.confirm('Xoá banner này?')) return
    if (banner.image_path) {
      await supabase.storage.from('banners').remove([banner.image_path])
    }
    await supabase.from('banners').delete().eq('id', banner.id)
    toast.success('Đã xoá banner')
    setBanners(prev => prev.filter(b => b.id !== banner.id))
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Quản lý Banner</h1>
          <p className="text-sm text-gray-400 mt-1">
            Kích thước ảnh tốt nhất: 1400 × 520px — tỉ lệ 16:6
          </p>
        </div>
        <button onClick={() => { setShowModal(true); setForm(emptyForm); setImagePreview('') }}
          className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white px-5 py-2.5 rounded-xl font-medium transition-colors">
          <Plus size={18} /> Thêm banner
        </button>
      </div>

      {/* Danh sách banners */}
      {loading ? (
        <div className="text-center py-20 text-gray-400">Đang tải...</div>
      ) : banners.length === 0 ? (
        <div className="bg-white rounded-2xl p-16 text-center shadow-sm">
          <div className="text-6xl mb-4">🖼️</div>
          <p className="text-gray-400 text-lg mb-2">Chưa có banner nào</p>
          <button onClick={() => setShowModal(true)}
            className="bg-red-600 text-white px-6 py-3 rounded-xl font-medium hover:bg-red-700 mt-3">
            + Thêm banner đầu tiên
          </button>
        </div>
      ) : (
        <div className="grid gap-4">
          {banners.map(banner => (
            <div key={banner.id} className="bg-white rounded-2xl shadow-sm overflow-hidden">
              <div className="flex items-center gap-4 p-4">
                {/* Preview ảnh */}
                <div className="w-32 h-20 flex-shrink-0 rounded-xl overflow-hidden bg-gray-100">
                  <img src={banner.image_url} alt="banner"
                    className="w-full h-full object-cover" />
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                      banner.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
                    }`}>
                      {banner.is_active ? 'Đang hiện' : 'Đang ẩn'}
                    </span>
                    <span className="text-xs text-gray-400">Thứ tự: {banner.sort_order}</span>
                  </div>
                  <p className="font-semibold text-gray-800 truncate">
                    {banner.headline || banner.badge_text || 'Banner không có tiêu đề'}
                  </p>
                  <p className="text-xs text-gray-400 truncate">
                    Link: {banner.link_url}
                  </p>
                  {banner.scheduled_start && (
                    <p className="text-xs text-blue-500 mt-0.5">
                      🕐 {new Date(banner.scheduled_start).toLocaleString('vi-VN')}
                      {banner.scheduled_end && ` → ${new Date(banner.scheduled_end).toLocaleString('vi-VN')}`}
                    </p>
                  )}
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 flex-shrink-0">
                  <button onClick={() => toggleActive(banner)}
                    className={`p-2 rounded-lg transition-colors ${
                      banner.is_active
                        ? 'text-green-500 hover:bg-green-50'
                        : 'text-gray-400 hover:bg-gray-100'
                    }`} title={banner.is_active ? 'Ẩn banner' : 'Hiện banner'}>
                    {banner.is_active ? <Eye size={18} /> : <EyeOff size={18} />}
                  </button>
                  <button onClick={() => handleDelete(banner)}
                    className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors">
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal thêm banner */}
      {showModal && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-start justify-center overflow-y-auto py-6 px-4">
          <div className="bg-white rounded-2xl w-full max-w-2xl shadow-2xl">
            <div className="flex items-center justify-between px-6 py-4 border-b">
              <h2 className="text-lg font-bold">Thêm banner mới</h2>
              <button onClick={() => setShowModal(false)}
                className="p-2 hover:bg-gray-100 rounded-full"><X size={20} /></button>
            </div>

            <div className="p-6 space-y-5">
              {/* Upload */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Ảnh banner
                  <span className="font-normal text-gray-400 ml-1">
                    (Tốt nhất: 1400×520px — tỉ lệ 16:6)
                  </span>
                </label>
                <div onClick={() => fileRef.current?.click()}
                  className="border-2 border-dashed border-gray-300 rounded-xl cursor-pointer hover:border-red-400 hover:bg-red-50/30 transition-all overflow-hidden">
                  {imagePreview ? (
                    <div className="relative h-40">
                      <img src={imagePreview} alt="preview"
                        className="w-full h-full object-cover" />
                      <p className="absolute bottom-2 right-2 bg-black/60 text-white text-xs px-2 py-1 rounded-lg">
                        Click để đổi
                      </p>
                    </div>
                  ) : (
                    <div className="py-10 text-center text-gray-400">
                      <Upload size={32} className="mx-auto mb-2 text-gray-300" />
                      <p className="text-sm font-medium">Click để chọn ảnh banner</p>
                      <p className="text-xs mt-1">JPG/PNG — Tối đa 5MB</p>
                    </div>
                  )}
                  <input ref={fileRef} type="file" accept="image/*"
                    className="hidden" onChange={handleImageChange} />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Badge (nhỏ)</label>
                  <input value={form.badge_text}
                    onChange={e => setForm(p => ({ ...p, badge_text: e.target.value }))}
                    placeholder="🔥 Ưu đãi đặc biệt"
                    className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-red-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nút CTA
                  </label>
                  <input value={form.cta_text}
                    onChange={e => setForm(p => ({ ...p, cta_text: e.target.value }))}
                    placeholder="Xem ngay"
                    className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-red-500" />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tiêu đề lớn</label>
                <input value={form.headline}
                  onChange={e => setForm(p => ({ ...p, headline: e.target.value }))}
                  placeholder="GIÀY NAM CHÍNH HÃNG"
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-red-500" />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Mô tả nhỏ</label>
                <input value={form.subtitle}
                  onChange={e => setForm(p => ({ ...p, subtitle: e.target.value }))}
                  placeholder="Giảm đến 50% — Chỉ hôm nay"
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-red-500" />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Link khi click
                  </label>
                  <input value={form.link_url}
                    onChange={e => setForm(p => ({ ...p, link_url: e.target.value }))}
                    placeholder="/?category=Giày Nam"
                    className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-red-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Thứ tự hiển thị</label>
                  <input type="number" value={form.sort_order}
                    onChange={e => setForm(p => ({ ...p, sort_order: e.target.value }))}
                    placeholder="0"
                    className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-red-500" />
                </div>
              </div>

              {/* Overlay */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Kiểu overlay chữ</label>
                <div className="flex gap-2 flex-wrap">
                  {OVERLAYS.map(o => (
                    <button key={o.value} type="button"
                      onClick={() => setForm(p => ({ ...p, overlay_color: o.value }))}
                      className={`px-3 py-1.5 rounded-lg text-sm border transition-all ${
                        form.overlay_color === o.value
                          ? 'bg-red-600 text-white border-red-600'
                          : 'border-gray-200 text-gray-600'
                      }`}>
                      {o.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Hẹn giờ */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Bắt đầu hiển thị
                    <span className="text-gray-400 font-normal ml-1">(để trống = ngay lập tức)</span>
                  </label>
                  <input type="datetime-local" value={form.scheduled_start}
                    onChange={e => setForm(p => ({ ...p, scheduled_start: e.target.value }))}
                    className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-red-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Kết thúc hiển thị
                    <span className="text-gray-400 font-normal ml-1">(để trống = không giới hạn)</span>
                  </label>
                  <input type="datetime-local" value={form.scheduled_end}
                    onChange={e => setForm(p => ({ ...p, scheduled_end: e.target.value }))}
                    className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-red-500" />
                </div>
              </div>

              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={form.is_active}
                  onChange={e => setForm(p => ({ ...p, is_active: e.target.checked }))}
                  className="w-4 h-4 accent-red-600" />
                <span className="text-sm text-gray-700 font-medium">Hiển thị ngay trên frontend</span>
              </label>
            </div>

            <div className="flex justify-end gap-3 px-6 py-4 border-t bg-gray-50 rounded-b-2xl">
              <button onClick={() => setShowModal(false)}
                className="px-6 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-600 hover:bg-gray-100">
                Huỷ
              </button>
              <button onClick={handleSave} disabled={saving}
                className="flex items-center gap-2 bg-red-600 hover:bg-red-700 disabled:bg-gray-300 text-white px-8 py-2.5 rounded-xl text-sm font-bold transition-colors">
                {saving ? <><Loader2 size={16} className="animate-spin" /> Đang lưu...</> : '💾 Lưu banner'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}