// Copy toàn bộ code dưới đây dán vào file: src/pages/SettingsPage.jsx (admin)
import { useEffect, useState, useRef } from 'react'
import { supabase } from '../supabaseClient'
import toast from 'react-hot-toast'
import { Upload, Save, Plus, Trash2, GripVertical, Info } from 'lucide-react'

const CATEGORY_MAP = {
  'Giày Nữ':  ['Sandal','Giày Thể Thao','Giày Cao Gót','Giày Búp Bê','Dép'],
  'Giày Nam':  ['Sandal','Giày Thể Thao','Giày Tây','Dép'],
  'Bé Trai':   ['Giày Thể Thao','Sandal','Dép'],
  'Bé Gái':    ['Giày Thể Thao','Sandal','Dép'],
  'Phụ Kiện':  ['Nón','Balo','Vớ'],
}
const FONTS = [
  { l: 'Arial',         v: 'Arial, sans-serif' },
  { l: 'Times New Roman', v: 'Times New Roman, serif' },
  { l: 'Georgia',       v: 'Georgia, serif' },
  { l: 'Verdana',       v: 'Verdana, sans-serif' },
  { l: 'Tahoma',        v: 'Tahoma, sans-serif' },
]

export default function SettingsPage() {
  const [settings, setSettings] = useState({})
  const [logoFile, setLogoFile] = useState(null)
  const [logoPreview, setLogoPreview] = useState('')
  const [adminLogoFile, setAdminLogoFile] = useState(null)
  const [adminLogoPreview, setAdminLogoPreview] = useState('')
  const [invLogoFile, setInvLogoFile] = useState(null)
  const [invLogoPreview, setInvLogoPreview] = useState('')
  const [saving, setSaving] = useState(false)
  const [tab, setTab] = useState('logo')
  const logoRef = useRef()
  const adminLogoRef = useRef()
  const invLogoRef = useRef()

  // Marquee
  const [marqueeItems, setMarqueeItems] = useState([])
  const [newMarquee, setNewMarquee] = useState('')
  // Keywords
  const [keywords, setKeywords] = useState([])
  const [newKw, setNewKw] = useState({ keyword: '', category: 'Giày Nữ', subcategory: '' })

  useEffect(() => {
    supabase.from('settings').select('key, value').then(({ data }) => {
      if (data) {
        const obj = {}
        data.forEach(r => { obj[r.key] = r.value })
        setSettings(obj)
        if (obj.logo_url) setLogoPreview(obj.logo_url)
        if (obj.admin_logo_url) setAdminLogoPreview(obj.admin_logo_url)
        if (obj.invoice_logo_url) setInvLogoPreview(obj.invoice_logo_url)
      }
    })
    supabase.from('marquee_items').select('*').order('sort_order')
      .then(({ data }) => setMarqueeItems(data || []))
    supabase.from('search_keywords').select('*').order('created_at', { ascending: false })
      .then(({ data }) => setKeywords(data || []))
  }, [])

  const setS = (k, v) => setSettings(prev => ({ ...prev, [k]: v }))

  // ── Upload ──
  const uploadFile = async (file, oldPath, prefix) => {
    if (!file) return null
    const ext = file.name.split('.').pop()
    const path = `${prefix}_${Date.now()}.${ext}`
    if (oldPath) await supabase.storage.from('banners').remove([oldPath]).catch(() => {})
    const { error } = await supabase.storage.from('banners').upload(path, file, { upsert: true })
    if (error) throw error
    const { data: { publicUrl } } = supabase.storage.from('banners').getPublicUrl(path)
    return { url: publicUrl, path }
  }

  // ── Lưu tất cả ──
  const saveAll = async () => {
    setSaving(true)
    try {
      let s = { ...settings }
      if (logoFile) {
        const r = await uploadFile(logoFile, settings.logo_path, 'logos/header')
        if (r) { s.logo_url = r.url; s.logo_path = r.path }
      }
      if (adminLogoFile) {
        const r = await uploadFile(adminLogoFile, settings.admin_logo_path, 'logos/admin')
        if (r) { s.admin_logo_url = r.url; s.admin_logo_path = r.path }
      }
      if (invLogoFile) {
        const r = await uploadFile(invLogoFile, settings.invoice_logo_path, 'logos/invoice')
        if (r) { s.invoice_logo_url = r.url; s.invoice_logo_path = r.path }
      }
      await Promise.all(Object.entries(s).map(([key, value]) =>
        supabase.from('settings').upsert({ key, value: value || '', updated_at: new Date().toISOString() })
      ))
      toast.success('Đã lưu!')
    } catch (err) { toast.error('Lỗi: ' + err.message) }
    finally { setSaving(false) }
  }

  const LogoBox = ({ refObj, preview, label, note, onChange }) => (
    <div>
      <label className="block text-sm font-medium text-gray-600 mb-1">{label}</label>
      {note && <p className="text-xs text-gray-400 mb-2">{note}</p>}
      <div onClick={() => refObj.current?.click()}
        className="border-2 border-dashed border-gray-300 rounded-xl h-24 flex items-center justify-center cursor-pointer hover:border-red-400 transition-all">
        {preview ? <img src={preview} className="max-h-16 object-contain" alt="" />
          : <div className="text-gray-400 text-center"><Upload size={22} className="mx-auto mb-1 text-gray-300" /><p className="text-xs">Click để upload</p></div>}
        <input ref={refObj} type="file" accept="image/*" className="hidden" onChange={onChange} />
      </div>
    </div>
  )

  // Marquee helpers
  const addMarquee = async () => {
    if (!newMarquee.trim()) return
    const { data } = await supabase.from('marquee_items').insert({ content: newMarquee.trim(), sort_order: marqueeItems.length }).select().single()
    setMarqueeItems(prev => [...prev, data])
    setNewMarquee('')
    toast.success('Đã thêm!')
  }
  const toggleMarquee = async (item) => {
    await supabase.from('marquee_items').update({ is_active: !item.is_active }).eq('id', item.id)
    setMarqueeItems(prev => prev.map(i => i.id === item.id ? { ...i, is_active: !i.is_active } : i))
  }
  const deleteMarquee = async (id) => {
    await supabase.from('marquee_items').delete().eq('id', id)
    setMarqueeItems(prev => prev.filter(i => i.id !== id))
    toast.success('Đã xoá')
  }

  // Keyword helpers
  const addKeyword = async () => {
    if (!newKw.keyword.trim()) return
    const { data } = await supabase.from('search_keywords').insert(newKw).select().single()
    setKeywords(prev => [data, ...prev])
    setNewKw({ keyword: '', category: 'Giày Nữ', subcategory: '' })
    toast.success('Đã thêm!')
  }
  const toggleKw = async (kw) => {
    await supabase.from('search_keywords').update({ is_active: !kw.is_active }).eq('id', kw.id)
    setKeywords(prev => prev.map(k => k.id === kw.id ? { ...k, is_active: !k.is_active } : k))
  }
  const deleteKw = async (id) => {
    await supabase.from('search_keywords').delete().eq('id', id)
    setKeywords(prev => prev.filter(k => k.id !== id))
    toast.success('Đã xoá')
  }

  const TABS = [
    { key: 'logo',    label: '🖼️ Logo' },
    { key: 'bank',    label: '🏦 Ngân hàng' },
    { key: 'invoice', label: '📄 Hoá đơn & Email' },
    { key: 'marquee', label: '📢 Ticker' },
    { key: 'keywords',label: '🔍 Từ khoá' },
  ]

  return (
    <div className="max-w-3xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Cài đặt hệ thống</h1>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 bg-gray-100 p-1 rounded-2xl flex-wrap">
        {TABS.map(t => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
              tab === t.key ? 'bg-white text-gray-800 shadow' : 'text-gray-500'
            }`}>{t.label}</button>
        ))}
      </div>

      {/* ── Tab Logo ── */}
      {tab === 'logo' && (
        <div className="bg-white rounded-2xl p-6 shadow-sm space-y-4">
          <h2 className="font-bold text-lg text-gray-800">Logo</h2>
          <div className="grid grid-cols-2 gap-4">
            <LogoBox refObj={logoRef} preview={logoPreview} label="Logo Header (trang khách)" note="Navbar + Footer"
              onChange={e => { const f = e.target.files[0]; if (f) { setLogoFile(f); setLogoPreview(URL.createObjectURL(f)) } }} />
            <LogoBox refObj={adminLogoRef} preview={adminLogoPreview} label="Logo Admin (sidebar)" note="Trang quản trị"
              onChange={e => { const f = e.target.files[0]; if (f) { setAdminLogoFile(f); setAdminLogoPreview(URL.createObjectURL(f)) } }} />
          </div>
          <button onClick={saveAll} disabled={saving}
            className="flex items-center gap-2 text-white px-8 py-3 rounded-xl font-bold w-full justify-center"
            style={{ backgroundColor: saving ? '#9ca3af' : '#B71C1C' }}>
            {saving ? 'Đang lưu...' : <><Save size={18} /> Lưu Logo</>}
          </button>
        </div>
      )}

      {/* ── Tab Ngân hàng ── */}
      {tab === 'bank' && (
        <div className="bg-white rounded-2xl p-6 shadow-sm space-y-4">
          <h2 className="font-bold text-lg text-gray-800">Thông tin chuyển khoản</h2>
          {[
            { key: 'bank_name',    label: 'Tên ngân hàng',    placeholder: 'Vietin Bank...' },
            { key: 'bank_account', label: 'Số tài khoản',     placeholder: '1234567890' },
            { key: 'bank_holder',  label: 'Chủ tài khoản',    placeholder: 'NGUYEN VAN A' },
            { key: 'bank_content', label: 'Nội dung CK mẫu',  placeholder: 'Tên + SĐT' },
          ].map(({ key, label, placeholder }) => (
            <div key={key}>
              <label className="block text-sm font-medium text-gray-600 mb-1">{label}</label>
              <input value={settings[key] || ''} onChange={e => setS(key, e.target.value)}
                placeholder={placeholder}
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-red-800" />
            </div>
          ))}
          <button onClick={saveAll} disabled={saving}
            className="flex items-center gap-2 text-white px-8 py-3 rounded-xl font-bold w-full justify-center"
            style={{ backgroundColor: saving ? '#9ca3af' : '#B71C1C' }}>
            {saving ? 'Đang lưu...' : <><Save size={18} /> Lưu</>}
          </button>
        </div>
      )}

      {/* ── Tab Hoá đơn & Email ── */}
      {tab === 'invoice' && (
        <div className="space-y-5">
          {/* Hướng dẫn EmailJS */}
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-sm text-blue-700">
            <p className="font-bold mb-2 flex items-center gap-2"><Info size={16} /> Hướng dẫn cấu hình gửi email hoá đơn</p>
            <ol className="list-decimal pl-5 space-y-1 text-xs">
              <li>Chạy: <code className="bg-blue-100 px-1 rounded">npm install @emailjs/browser</code> trong folder admin</li>
              <li>Vào <strong>emailjs.com</strong> → Đăng ký → Add Email Service → Gmail → kết nối linhphm2701@gmail.com → Copy Service ID</li>
              <li>Email Templates → Create New → Subject: <code className="bg-blue-100 px-1 rounded">{"Hóa đơn {{invoice_code}}"}</code> → Body tab HTML: <code className="bg-blue-100 px-1 rounded">{"{{{invoice_html}}}"}</code> → Copy Template ID</li>
              <li>Account Settings → Copy Public Key</li>
              <li>Điền 3 giá trị vào bên dưới → Lưu</li>
            </ol>
          </div>

          {/* Thông tin công ty trên hoá đơn */}
          <div className="bg-white rounded-2xl p-6 shadow-sm space-y-4">
            <h2 className="font-bold text-lg text-gray-800">🏢 Thông tin công ty trên hoá đơn</h2>
            <LogoBox refObj={invLogoRef} preview={invLogoPreview}
              label="Logo trên hoá đơn" note="Hiện góc trái trên hoá đơn gửi cho khách"
              onChange={e => { const f = e.target.files[0]; if (f) { setInvLogoFile(f); setInvLogoPreview(URL.createObjectURL(f)) } }} />
            {[
              { key: 'invoice_company_name', label: 'Tên công ty', placeholder: 'CÔNG TY TNHH...' },
              { key: 'invoice_address',      label: 'Địa chỉ',     placeholder: '123 Đường ABC, Q.1, TP.HCM' },
              { key: 'invoice_tax_id',       label: 'Mã số thuế',  placeholder: '0123456789' },
            ].map(({ key, label, placeholder }) => (
              <div key={key}>
                <label className="block text-sm font-medium text-gray-600 mb-1">{label}</label>
                <input value={settings[key] || ''} onChange={e => setS(key, e.target.value)}
                  placeholder={placeholder}
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-red-800" />
              </div>
            ))}
          </div>

          {/* Style hoá đơn */}
          <div className="bg-white rounded-2xl p-6 shadow-sm space-y-4">
            <h2 className="font-bold text-lg text-gray-800">🎨 Style hoá đơn</h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">Màu thương hiệu</label>
                <div className="flex items-center gap-3">
                  <input type="color" value={settings.invoice_brand_color || '#B71C1C'}
                    onChange={e => setS('invoice_brand_color', e.target.value)}
                    className="w-10 h-10 rounded-lg cursor-pointer border" />
                  <span className="text-sm text-gray-500">{settings.invoice_brand_color || '#B71C1C'}</span>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">Font chữ</label>
                <select value={settings.invoice_font || 'Arial, sans-serif'}
                  onChange={e => setS('invoice_font', e.target.value)}
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm bg-white outline-none">
                  {FONTS.map(f => <option key={f.v} value={f.v}>{f.l}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">Cỡ chữ tiêu đề (px)</label>
                <input type="number" value={settings.invoice_title_size || '24'}
                  onChange={e => setS('invoice_title_size', e.target.value)}
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-red-800" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">Cỡ chữ nội dung (px)</label>
                <input type="number" value={settings.invoice_body_size || '13'}
                  onChange={e => setS('invoice_body_size', e.target.value)}
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-red-800" />
              </div>
            </div>
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox"
                checked={settings.invoice_title_bold !== 'false'}
                onChange={e => setS('invoice_title_bold', e.target.checked ? 'true' : 'false')}
                className="w-4 h-4 accent-red-800" />
              <span className="text-sm text-gray-700 font-medium">Tiêu đề in đậm</span>
            </label>
          </div>

          {/* EmailJS config */}
          <div className="bg-white rounded-2xl p-6 shadow-sm space-y-4">
            <h2 className="font-bold text-lg text-gray-800">📧 Cấu hình EmailJS</h2>
            {[
              { key: 'emailjs_service_id',  label: 'Service ID',  placeholder: 'service_xxxxxxx' },
              { key: 'emailjs_template_id', label: 'Template ID', placeholder: 'template_xxxxxxx' },
              { key: 'emailjs_public_key',  label: 'Public Key',  placeholder: 'xxxxxxxxxxxxxxxxxxxx' },
            ].map(({ key, label, placeholder }) => (
              <div key={key}>
                <label className="block text-sm font-medium text-gray-600 mb-1">{label}</label>
                <input value={settings[key] || ''} onChange={e => setS(key, e.target.value)}
                  placeholder={placeholder} type="password"
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-red-800" />
              </div>
            ))}
          </div>

          <button onClick={saveAll} disabled={saving}
            className="flex items-center gap-2 text-white px-8 py-3 rounded-xl font-bold w-full justify-center"
            style={{ backgroundColor: saving ? '#9ca3af' : '#B71C1C' }}>
            {saving ? 'Đang lưu...' : <><Save size={18} /> Lưu tất cả cài đặt hoá đơn</>}
          </button>
        </div>
      )}

      {/* ── Tab Marquee ── */}
      {tab === 'marquee' && (
        <div className="bg-white rounded-2xl p-6 shadow-sm">
          <h2 className="font-bold text-lg text-gray-800 mb-4">📢 Ticker thông báo (tĩnh)</h2>
          <div className="flex gap-2 mb-4">
            <input value={newMarquee} onChange={e => setNewMarquee(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && addMarquee()}
              placeholder="🚚 Miễn phí ship từ 500k..."
              className="flex-1 border border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-red-800" />
            <button onClick={addMarquee}
              className="flex items-center gap-1 text-white px-4 rounded-xl text-sm font-medium"
              style={{ backgroundColor: '#B71C1C' }}>
              <Plus size={16} /> Thêm
            </button>
          </div>
          <div className="space-y-2">
            {marqueeItems.map(item => (
              <div key={item.id} className={`flex items-center gap-3 p-3 rounded-xl border ${item.is_active ? 'bg-white border-gray-200' : 'bg-gray-50 opacity-60'}`}>
                <GripVertical size={16} className="text-gray-300" />
                <span className="flex-1 text-sm text-gray-700 truncate">{item.content}</span>
                <button onClick={() => toggleMarquee(item)}
                  className="text-xs px-2 py-1 border border-gray-200 rounded-lg hover:bg-gray-100">
                  {item.is_active ? 'Ẩn' : 'Hiện'}
                </button>
                <button onClick={() => deleteMarquee(item.id)}
                  className="p-1 text-red-400 hover:bg-red-50 rounded-lg">
                  <Trash2 size={15} />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Tab Keywords ── */}
      {tab === 'keywords' && (
        <div className="bg-white rounded-2xl p-6 shadow-sm">
          <h2 className="font-bold text-lg text-gray-800 mb-4">🔍 Từ khoá tìm kiếm</h2>
          <div className="bg-gray-50 rounded-xl p-4 mb-4 space-y-3">
            <input value={newKw.keyword} onChange={e => setNewKw(p => ({ ...p, keyword: e.target.value }))}
              placeholder="giày thể thao nữ..."
              className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-red-800" />
            <div className="grid grid-cols-2 gap-3">
              <select value={newKw.category}
                onChange={e => setNewKw(p => ({ ...p, category: e.target.value, subcategory: '' }))}
                className="border border-gray-200 rounded-xl px-3 py-2.5 text-sm bg-white outline-none">
                <option value="">-- Tất cả --</option>
                {Object.keys(CATEGORY_MAP).map(c => <option key={c}>{c}</option>)}
              </select>
              <select value={newKw.subcategory}
                onChange={e => setNewKw(p => ({ ...p, subcategory: e.target.value }))}
                className="border border-gray-200 rounded-xl px-3 py-2.5 text-sm bg-white outline-none"
                disabled={!newKw.category}>
                <option value="">-- Tất cả loại --</option>
                {(CATEGORY_MAP[newKw.category] || []).map(s => <option key={s}>{s}</option>)}
              </select>
            </div>
            <button onClick={addKeyword}
              className="w-full flex items-center justify-center gap-2 text-white py-2.5 rounded-xl text-sm font-bold"
              style={{ backgroundColor: '#B71C1C' }}>
              <Plus size={16} /> Thêm từ khoá
            </button>
          </div>
          <div className="space-y-2 max-h-72 overflow-y-auto">
            {keywords.map(kw => (
              <div key={kw.id} className={`flex items-center gap-3 p-3 rounded-xl border ${kw.is_active ? 'bg-white border-gray-200' : 'opacity-60 bg-gray-50'}`}>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-800 truncate">"{kw.keyword}"</p>
                  <p className="text-xs text-gray-400">→ {kw.subcategory ? `${kw.category} › ${kw.subcategory}` : kw.category || 'Tìm kiếm'}</p>
                </div>
                <button onClick={() => toggleKw(kw)}
                  className="text-xs px-2 py-1 border border-gray-200 rounded-lg hover:bg-gray-100">
                  {kw.is_active ? 'Tắt' : 'Bật'}
                </button>
                <button onClick={() => deleteKw(kw.id)}
                  className="p-1 text-red-400 hover:bg-red-50 rounded-lg">
                  <Trash2 size={15} />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}