// Copy toàn bộ code dưới đây dán vào file: src/pages/SettingsPage.jsx (admin)
import { useEffect, useState, useRef } from 'react'
import { supabase } from '../supabaseClient'
import toast from 'react-hot-toast'
import { Upload, Save, Plus, Trash2, GripVertical } from 'lucide-react'

const CATEGORY_MAP = {
  'Giày Nữ': ['Sandal','Giày Thể Thao','Giày Cao Gót','Giày Búp Bê','Dép'],
  'Giày Nam': ['Sandal','Giày Thể Thao','Giày Tây','Dép'],
  'Bé Trai':  ['Giày Thể Thao','Sandal','Dép'],
  'Bé Gái':   ['Giày Thể Thao','Sandal','Dép'],
  'Phụ Kiện': ['Nón','Balo','Vớ'],
}

// Rich editor cho bảng size
function RichEditor({ value, onChange, minH = 200 }) {
  const ref = useRef()
  useEffect(() => { if (ref.current) ref.current.innerHTML = value || '' }, [])
  const e = (cmd, val = null) => { ref.current?.focus(); document.execCommand(cmd, false, val); onChange(ref.current.innerHTML) }
  const COLORS = ['#000','#B71C1C','#e65100','#2e7d32','#1565c0','#fff','#9e9e9e']
  const insertTable = () => {
    const r = parseInt(prompt('Số hàng:', '5') || '5')
    const c = parseInt(prompt('Số cột:', '3') || '3')
    const tbl = `<table border="1" style="border-collapse:collapse;width:100%">${Array.from({length:r},()=>`<tr>${Array.from({length:c},()=>`<td style="border:1px solid #ddd;padding:8px;min-width:60px">&nbsp;</td>`).join('')}</tr>`).join('')}</table><br/>`
    ref.current?.focus(); document.execCommand('insertHTML', false, tbl); onChange(ref.current.innerHTML)
  }
  return (
    <div className="border border-gray-200 rounded-xl overflow-hidden">
      <div className="bg-gray-50 border-b p-2 flex flex-wrap gap-1 items-center">
        {[['bold','B',{fontWeight:'bold'}],['italic','I',{fontStyle:'italic'}],['underline','U',{textDecoration:'underline'}]].map(([cmd,lbl,st])=>(
          <button key={cmd} type="button" onClick={()=>e(cmd)} className="px-2 py-1 rounded hover:bg-gray-200 text-sm" style={st}>{lbl}</button>
        ))}
        <div className="w-px h-5 bg-gray-300 mx-0.5"/>
        <button type="button" onClick={insertTable} className="px-2 py-1 rounded hover:bg-gray-200 text-xs">⊞ Table</button>
        <div className="w-px h-5 bg-gray-300 mx-0.5"/>
        {COLORS.map(c=>(
          <button key={c} type="button" onClick={()=>e('foreColor',c)}
            className="w-4 h-4 rounded-full border border-gray-300 hover:scale-125"
            style={{backgroundColor:c}} />
        ))}
        <button type="button" onClick={()=>e('removeFormat')} className="px-2 py-1 rounded hover:bg-red-100 text-red-500 text-xs">✕ Xoá</button>
      </div>
      <div ref={ref} contentEditable suppressContentEditableWarning
        onInput={()=>onChange(ref.current.innerHTML)}
        className="p-4 text-sm outline-none" style={{minHeight:minH}}
        data-placeholder="Nhập nội dung bảng size..." />
      <style>{`[contenteditable]:empty:before{content:attr(data-placeholder);color:#9ca3af;pointer-events:none}`}</style>
    </div>
  )
}

export default function SettingsPage() {
  const [settings, setSettings]     = useState({})
  const [logoFile, setLogoFile]     = useState(null)
  const [logoPreview, setLogoPreview]     = useState('')
  const [adminLogoFile, setAdminLogoFile] = useState(null)
  const [adminLogoPreview, setAdminLogoPreview] = useState('')
  const [invLogoFile, setInvLogoFile] = useState(null)
  const [invLogoPreview, setInvLogoPreview] = useState('')
  const [saving, setSaving]         = useState(false)
  const [tab, setTab]               = useState('logo')
  const logoRef    = useRef()
  const adminRef   = useRef()
  const invLogoRef = useRef()

  const [marqueeItems, setMarqueeItems] = useState([])
  const [newMarquee, setNewMarquee]     = useState('')
  const [keywords, setKeywords]         = useState([])
  const [newKw, setNewKw] = useState({ keyword: '', category: 'Giày Nữ', subcategory: '' })

  useEffect(() => {
    supabase.from('settings').select('key, value').then(({ data }) => {
      if (!data) return
      const obj = {}
      data.forEach(r => { obj[r.key] = r.value })
      setSettings(obj)
      if (obj.logo_url) setLogoPreview(obj.logo_url)
      if (obj.admin_logo_url) setAdminLogoPreview(obj.admin_logo_url)
      if (obj.invoice_logo_url) setInvLogoPreview(obj.invoice_logo_url)
    })
    supabase.from('marquee_items').select('*').order('sort_order')
      .then(({ data }) => setMarqueeItems(data || []))
    supabase.from('search_keywords').select('*').order('created_at', { ascending: false })
      .then(({ data }) => setKeywords(data || []))
  }, [])

  const setS = (k, v) => setSettings(p => ({ ...p, [k]: v }))

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

  const saveAll = async () => {
    setSaving(true)
    try {
      let s = { ...settings }
      if (logoFile) { const r = await uploadFile(logoFile, settings.logo_path, 'logos/header'); if (r) { s.logo_url = r.url; s.logo_path = r.path } }
      if (adminLogoFile) { const r = await uploadFile(adminLogoFile, settings.admin_logo_path, 'logos/admin'); if (r) { s.admin_logo_url = r.url; s.admin_logo_path = r.path } }
      if (invLogoFile) { const r = await uploadFile(invLogoFile, settings.invoice_logo_path, 'logos/invoice'); if (r) { s.invoice_logo_url = r.url; s.invoice_logo_path = r.path } }
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

  const addMarquee = async () => {
    if (!newMarquee.trim()) return
    const { data } = await supabase.from('marquee_items').insert({ content: newMarquee.trim(), sort_order: marqueeItems.length }).select().single()
    setMarqueeItems(p => [...p, data]); setNewMarquee(''); toast.success('Đã thêm!')
  }
  const toggleMarquee = async (item) => {
    await supabase.from('marquee_items').update({ is_active: !item.is_active }).eq('id', item.id)
    setMarqueeItems(p => p.map(i => i.id === item.id ? { ...i, is_active: !i.is_active } : i))
  }
  const deleteMarquee = async (id) => {
    await supabase.from('marquee_items').delete().eq('id', id)
    setMarqueeItems(p => p.filter(i => i.id !== id)); toast.success('Đã xoá')
  }

  const addKeyword = async () => {
    if (!newKw.keyword.trim()) return
    const { data } = await supabase.from('search_keywords').insert(newKw).select().single()
    setKeywords(p => [data, ...p]); setNewKw({ keyword: '', category: 'Giày Nữ', subcategory: '' }); toast.success('Đã thêm!')
  }
  const toggleKw = async (kw) => {
    await supabase.from('search_keywords').update({ is_active: !kw.is_active }).eq('id', kw.id)
    setKeywords(p => p.map(k => k.id === kw.id ? { ...k, is_active: !k.is_active } : k))
  }
  const deleteKw = async (id) => {
    await supabase.from('search_keywords').delete().eq('id', id)
    setKeywords(p => p.filter(k => k.id !== id)); toast.success('Đã xoá')
  }

  const TABS = [
    { key: 'logo',     label: '🖼️ Logo' },
    { key: 'bank',     label: '🏦 Ngân hàng' },
    { key: 'invoice',  label: '📄 Hoá đơn & Email' },
    { key: 'sizeguide',label: '📏 Bảng chọn size' },
    { key: 'system',   label: '⚙️ Hệ thống' },
    { key: 'marquee',  label: '📢 Ticker' },
    { key: 'keywords', label: '🔍 Từ khoá' },
  ]

  return (
    <div className="max-w-3xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Cài đặt hệ thống</h1>
      </div>

      <div className="flex gap-1 mb-6 bg-gray-100 p-1 rounded-2xl flex-wrap">
        {TABS.map(t => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className={`px-3 py-2 rounded-xl text-xs font-medium transition-all ${tab === t.key ? 'bg-white text-gray-800 shadow' : 'text-gray-500'}`}>
            {t.label}
          </button>
        ))}
      </div>

      {/* ── Tab: Logo ── */}
      {tab === 'logo' && (
        <div className="bg-white rounded-2xl p-6 shadow-sm space-y-4">
          <h2 className="font-bold text-lg text-gray-800">Logo</h2>
          <div className="grid grid-cols-2 gap-4">
            <LogoBox refObj={logoRef} preview={logoPreview} label="Logo Header (trang khách)" note="Navbar + Footer"
              onChange={e => { const f = e.target.files[0]; if (f) { setLogoFile(f); setLogoPreview(URL.createObjectURL(f)) } }} />
            <LogoBox refObj={adminRef} preview={adminLogoPreview} label="Logo Admin (sidebar)" note="Trang quản trị"
              onChange={e => { const f = e.target.files[0]; if (f) { setAdminLogoFile(f); setAdminLogoPreview(URL.createObjectURL(f)) } }} />
          </div>
          <LogoBox refObj={invLogoRef} preview={invLogoPreview} label="Logo Hoá đơn" note="Hiện trên hoá đơn PDF gửi khách"
            onChange={e => { const f = e.target.files[0]; if (f) { setInvLogoFile(f); setInvLogoPreview(URL.createObjectURL(f)) } }} />
          <button onClick={saveAll} disabled={saving}
            className="flex items-center gap-2 text-white px-8 py-3 rounded-xl font-bold w-full justify-center"
            style={{ backgroundColor: saving ? '#9ca3af' : '#B71C1C' }}>
            {saving ? 'Đang lưu...' : <><Save size={18} /> Lưu Logo</>}
          </button>
        </div>
      )}

      {/* ── Tab: Ngân hàng ── */}
      {tab === 'bank' && (
  <div className="bg-white rounded-2xl p-6 shadow-sm space-y-4">
    <h2 className="font-bold text-lg text-gray-800">🏦 Thông tin chuyển khoản</h2>
    {[
      { key:'bank_name',    label:'Tên ngân hàng',   placeholder:'Vietin Bank...' },
      { key:'bank_account', label:'Số tài khoản',    placeholder:'1234567890' },
      { key:'bank_holder',  label:'Chủ tài khoản',   placeholder:'NGUYEN VAN A' },
      { key:'bank_content', label:'Nội dung CK mẫu', placeholder:'Tên + SĐT' },
    ].map(({ key, label, placeholder }) => (
      <div key={key}>
        <label className="block text-sm font-medium text-gray-600 mb-1">{label}</label>
        <input value={settings[key]||''} onChange={e=>setS(key,e.target.value)}
          placeholder={placeholder}
          className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-red-800"/>
      </div>
    ))}

    {/* ✅ QR chuyển khoản */}
    <div>
      <label className="block text-sm font-medium text-gray-600 mb-1">Ảnh QR chuyển khoản</label>
      <p className="text-xs text-gray-400 mb-3">Hiển thị trên trang thanh toán khi khách chọn chuyển khoản</p>
      <div className="flex items-start gap-4">
        {settings.bank_qr_url ? (
          <div className="relative flex-shrink-0">
            <img src={settings.bank_qr_url} alt="QR" className="w-32 h-32 object-contain border border-gray-200 rounded-xl bg-white p-2"/>
            <button onClick={()=>setS('bank_qr_url','')}
              className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center hover:bg-red-600">
              ✕
            </button>
          </div>
        ) : (
          <div className="w-32 h-32 border-2 border-dashed border-gray-300 rounded-xl flex items-center justify-center text-gray-400 text-xs text-center p-3 flex-shrink-0">
            Chưa có QR
          </div>
        )}
        <div>
          <input type="file" accept="image/*" id="qr-upload" className="hidden"
            onChange={async (e) => {
              const file = e.target.files[0]
              if (!file) return
              const ext = file.name.split('.').pop()
              const path = `qr/bank_qr_${Date.now()}.${ext}`
              const { error } = await supabase.storage.from('banners').upload(path, file, { upsert: true })
              if (!error) {
                const { data: { publicUrl } } = supabase.storage.from('banners').getPublicUrl(path)
                setS('bank_qr_url', publicUrl)
                toast.success('Đã upload QR!')
              }
            }}/>
          <label htmlFor="qr-upload"
            className="inline-flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-xl text-sm cursor-pointer hover:bg-gray-50 transition-colors">
            <Upload size={16}/> Upload ảnh QR
          </label>
          <p className="text-xs text-gray-400 mt-1.5">PNG, JPG, WebP · Nên dùng ảnh vuông</p>
        </div>
      </div>
    </div>

    <button onClick={saveAll} disabled={saving}
      className="flex items-center gap-2 text-white px-8 py-3 rounded-xl font-bold w-full justify-center"
      style={{backgroundColor: saving ? '#9ca3af' : '#B71C1C'}}>
      {saving ? 'Đang lưu...' : <><Save size={18}/> Lưu</>}
    </button>
  </div>
)}

      {/* ── Tab: Hoá đơn & Email ── */}
      {tab === 'invoice' && (
        <div className="space-y-4">
          <div className="bg-white rounded-2xl p-6 shadow-sm space-y-4">
            <h2 className="font-bold text-lg text-gray-800">🏢 Thông tin công ty trên hoá đơn</h2>
            {[
              { key: 'invoice_company_name', label: 'Tên công ty',   placeholder: 'CÔNG TY TNHH...' },
              { key: 'invoice_address',      label: 'Địa chỉ',       placeholder: '123 Đường ABC...' },
              { key: 'invoice_tax_id',       label: 'Mã số thuế',    placeholder: '0123456789' },
            ].map(({ key, label, placeholder }) => (
              <div key={key}>
                <label className="block text-sm font-medium text-gray-600 mb-1">{label}</label>
                <input value={settings[key] || ''} onChange={e => setS(key, e.target.value)}
                  placeholder={placeholder}
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-red-800" />
              </div>
            ))}
          </div>
          <div className="bg-white rounded-2xl p-6 shadow-sm space-y-4">
            <h2 className="font-bold text-lg text-gray-800">📧 Cấu hình EmailJS</h2>
            {[
              { key: 'emailjs_service_id',  label: 'Service ID',  placeholder: 'service_xxx' },
              { key: 'emailjs_template_id', label: 'Template ID', placeholder: 'template_xxx' },
              { key: 'emailjs_public_key',  label: 'Public Key',  placeholder: 'xxxxxx' },
            ].map(({ key, label, placeholder }) => (
              <div key={key}>
                <label className="block text-sm font-medium text-gray-600 mb-1">{label}</label>
                <input type="password" value={settings[key] || ''} onChange={e => setS(key, e.target.value)}
                  placeholder={placeholder}
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-red-800" />
              </div>
            ))}
          </div>
          <button onClick={saveAll} disabled={saving}
            className="flex items-center gap-2 text-white px-8 py-3 rounded-xl font-bold w-full justify-center"
            style={{ backgroundColor: saving ? '#9ca3af' : '#B71C1C' }}>
            {saving ? 'Đang lưu...' : <><Save size={18} /> Lưu</>}
          </button>
        </div>
      )}

      {/* ── Tab: Bảng chọn size ── */}
      {tab === 'sizeguide' && (
        <div className="bg-white rounded-2xl p-6 shadow-sm space-y-4">
          <h2 className="font-bold text-lg text-gray-800">📏 Bảng hướng dẫn chọn size</h2>
          <p className="text-sm text-gray-500">
            Nội dung này sẽ hiện ra khi khách bấm <strong>"Hướng dẫn chọn size"</strong> trên trang chi tiết sản phẩm.
            Có thể thêm bảng size, hình ảnh hướng dẫn, ghi chú...
          </p>
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 text-xs text-blue-700">
            💡 Dùng nút <strong>⊞ Table</strong> để tạo bảng size dạng: Size VN | Size EU | Cm
          </div>
          <RichEditor
            value={settings.size_guide_content || ''}
            onChange={val => setS('size_guide_content', val)}
            minH={300}
          />
          <button onClick={saveAll} disabled={saving}
            className="flex items-center gap-2 text-white px-8 py-3 rounded-xl font-bold w-full justify-center"
            style={{ backgroundColor: saving ? '#9ca3af' : '#B71C1C' }}>
            {saving ? 'Đang lưu...' : <><Save size={18} /> Lưu bảng size</>}
          </button>
        </div>
      )}

      {/* ── Tab: Hệ thống ── */}
      {tab === 'system' && (
        <div className="bg-white rounded-2xl p-6 shadow-sm space-y-4">
          <h2 className="font-bold text-lg text-gray-800">⚙️ URL & Hệ thống</h2>
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">
              URL Trang bán hàng (Frontend)
            </label>
            <p className="text-xs text-gray-400 mb-2">
              URL này dùng cho nút "Trang bán hàng" ở sidebar admin. Điền URL Vercel frontend của bạn.
            </p>
            <input
              value={settings.frontend_url || ''}
              onChange={e => setS('frontend_url', e.target.value)}
              placeholder="https://giay-frontend.vercel.app"
              className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-red-800"
            />
            <p className="text-xs text-green-600 mt-1">
              Hiện tại: <strong>{settings.frontend_url || 'chưa cài đặt'}</strong>
            </p>
          </div>
          <button onClick={saveAll} disabled={saving}
            className="flex items-center gap-2 text-white px-8 py-3 rounded-xl font-bold w-full justify-center"
            style={{ backgroundColor: saving ? '#9ca3af' : '#B71C1C' }}>
            {saving ? 'Đang lưu...' : <><Save size={18} /> Lưu</>}
          </button>
        </div>
      )}

      {/* ── Tab: Marquee ── */}
      {tab === 'marquee' && (
        <div className="bg-white rounded-2xl p-6 shadow-sm">
          <h2 className="font-bold text-lg text-gray-800 mb-4">📢 Ticker thông báo</h2>
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
                <button onClick={() => toggleMarquee(item)} className="text-xs px-2 py-1 border border-gray-200 rounded-lg hover:bg-gray-100">
                  {item.is_active ? 'Ẩn' : 'Hiện'}
                </button>
                <button onClick={() => deleteMarquee(item.id)} className="p-1 text-red-400 hover:bg-red-50 rounded-lg"><Trash2 size={15} /></button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Tab: Từ khoá ── */}
      {tab === 'keywords' && (
        <div className="bg-white rounded-2xl p-6 shadow-sm">
          <h2 className="font-bold text-lg text-gray-800 mb-4">🔍 Từ khoá tìm kiếm</h2>
          <div className="bg-gray-50 rounded-xl p-4 mb-4 space-y-3">
            <input value={newKw.keyword} onChange={e => setNewKw(p => ({ ...p, keyword: e.target.value }))}
              placeholder="giày thể thao nữ..."
              className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-red-800" />
            <div className="grid grid-cols-2 gap-3">
              <select value={newKw.category} onChange={e => setNewKw(p => ({ ...p, category: e.target.value, subcategory: '' }))}
                className="border border-gray-200 rounded-xl px-3 py-2.5 text-sm bg-white outline-none">
                <option value="">-- Tất cả --</option>
                {Object.keys(CATEGORY_MAP).map(c => <option key={c}>{c}</option>)}
              </select>
              <select value={newKw.subcategory} onChange={e => setNewKw(p => ({ ...p, subcategory: e.target.value }))}
                className="border border-gray-200 rounded-xl px-3 py-2.5 text-sm bg-white outline-none" disabled={!newKw.category}>
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
                <button onClick={() => toggleKw(kw)} className="text-xs px-2 py-1 border border-gray-200 rounded-lg hover:bg-gray-100">
                  {kw.is_active ? 'Tắt' : 'Bật'}
                </button>
                <button onClick={() => deleteKw(kw.id)} className="p-1 text-red-400 hover:bg-red-50 rounded-lg"><Trash2 size={15} /></button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}