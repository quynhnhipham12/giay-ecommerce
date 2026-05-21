// Copy toàn bộ code dưới đây dán vào file: src/pages/FooterSettingsPage.jsx (admin)
import { useEffect, useState, useRef } from 'react'
import { supabase } from '../supabaseClient'
import toast from 'react-hot-toast'
import { Save, Upload, Plus, Trash2, Pencil, X, Loader2, Eye, EyeOff } from 'lucide-react'

// ── Rich Editor ──
function RichEditor({ value, onChange, placeholder, minH = 150 }) {
  const ref = useRef()
  useEffect(() => { if (ref.current) ref.current.innerHTML = value || '' }, [])
  const e = (cmd, val = null) => { ref.current?.focus(); document.execCommand(cmd, false, val); onChange(ref.current.innerHTML) }

  const COLORS = ['#000','#B71C1C','#e65100','#f9a825','#2e7d32','#1565c0','#6a1b9a','#fff','#9e9e9e']
  const FONTS = [
    { l: 'Inter', v: 'Inter, sans-serif' },
    { l: 'Arial', v: 'Arial' },
    { l: 'Georgia', v: 'Georgia, serif' },
    { l: 'Montserrat', v: "'Montserrat'" },
  ]
  const SIZES = [
    { l: '10px', v: '1' }, { l: '12px', v: '2' }, { l: '14px', v: '3' },
    { l: '16px', v: '4' }, { l: '18px', v: '5' }, { l: '24px', v: '6' }, { l: '36px', v: '7' },
  ]

  const insertTable = () => {
    const rows = parseInt(prompt('Số hàng:', '3') || '3')
    const cols = parseInt(prompt('Số cột:', '3') || '3')
    const tbl = `<table border="1" style="border-collapse:collapse;width:100%">
      ${Array.from({ length: rows }, () =>
        `<tr>${Array.from({ length: cols }, () =>
          `<td style="border:1px solid #ddd;padding:8px;min-width:80px">&nbsp;</td>`
        ).join('')}</tr>`
      ).join('')}
    </table><br/>`
    ref.current?.focus()
    document.execCommand('insertHTML', false, tbl)
    onChange(ref.current.innerHTML)
  }

  return (
    <div className="border border-gray-200 rounded-xl overflow-hidden">
      <div className="bg-gray-50 border-b p-2 flex flex-wrap gap-1 items-center">
        {[
          { cmd: 'bold',      label: 'B', style: { fontWeight: 'bold' } },
          { cmd: 'italic',    label: 'I', style: { fontStyle: 'italic' } },
          { cmd: 'underline', label: 'U', style: { textDecoration: 'underline' } },
        ].map(b => (
          <button key={b.cmd} type="button" onClick={() => e(b.cmd)}
            className="px-2 py-1 rounded hover:bg-gray-200 text-sm" style={b.style}>{b.label}</button>
        ))}
        <div className="w-px h-5 bg-gray-300 mx-0.5" />
        <select onChange={ev => e('fontSize', SIZES.find(s => s.l === ev.target.value)?.v || '3')} defaultValue=""
          className="text-xs border rounded px-1 py-1 bg-white outline-none h-7">
          <option value="" disabled>Cỡ</option>
          {SIZES.map(s => <option key={s.v} value={s.l}>{s.l}</option>)}
        </select>
        <select onChange={ev => e('fontName', ev.target.value)} defaultValue=""
          className="text-xs border rounded px-1 py-1 bg-white outline-none h-7">
          <option value="" disabled>Font</option>
          {FONTS.map(f => <option key={f.v} value={f.v}>{f.l}</option>)}
        </select>
        <div className="w-px h-5 bg-gray-300 mx-0.5" />
        <button type="button" onClick={() => e('insertUnorderedList')}
          className="px-2 py-1 rounded hover:bg-gray-200 text-xs">• List</button>
        <button type="button" onClick={() => e('insertOrderedList')}
          className="px-2 py-1 rounded hover:bg-gray-200 text-xs">1. List</button>
        <button type="button" onClick={insertTable}
          className="px-2 py-1 rounded hover:bg-gray-200 text-xs">⊞ Table</button>
        <div className="w-px h-5 bg-gray-300 mx-0.5" />
        <div className="flex gap-0.5">
          {COLORS.map(c => (
            <button key={c} type="button" onClick={() => e('foreColor', c)}
              className="w-4 h-4 rounded-full border border-gray-300 hover:scale-125 transition-transform"
              style={{ backgroundColor: c }} title={`Màu chữ: ${c}`} />
          ))}
        </div>
        <div className="w-px h-5 bg-gray-300 mx-0.5" />
        <button type="button" onClick={() => {
          const url = prompt('URL ảnh:')
          if (url) e('insertImage', url)
        }} className="px-2 py-1 rounded hover:bg-gray-200 text-xs">🖼 Ảnh</button>
        <button type="button" onClick={() => {
          const url = prompt('URL YouTube embed (dạng https://www.youtube.com/embed/xxxx):')
          if (url) { ref.current?.focus(); document.execCommand('insertHTML', false, `<br/><iframe width="100%" height="315" src="${url}" frameborder="0" allowfullscreen></iframe><br/>`); onChange(ref.current.innerHTML) }
        }} className="px-2 py-1 rounded hover:bg-gray-200 text-xs">🎬 Video</button>
        <button type="button" onClick={() => e('removeFormat')}
          className="px-2 py-1 rounded hover:bg-red-100 text-red-500 text-xs">✕ Xoá định dạng</button>
      </div>
      <div ref={ref} contentEditable suppressContentEditableWarning
        onInput={() => onChange(ref.current.innerHTML)}
        className="p-4 text-sm outline-none"
        style={{ minHeight: minH }}
        data-placeholder={placeholder || 'Nhập nội dung...'} />
      <style>{`[contenteditable]:empty:before{content:attr(data-placeholder);color:#9ca3af;pointer-events:none}`}</style>
    </div>
  )
}

// ── Slug generator ──
function toSlug(str) {
  return str.toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd').replace(/Đ/g, 'd')
    .replace(/[^a-z0-9\s-]/g, '')
    .trim().replace(/\s+/g, '-')
}

const GROUP_KEYS = ['about', 'policy', 'guide']
const GROUP_DEFAULT_TITLES = {
  about:  'VỀ CHÚNG TÔI',
  policy: 'CHÍNH SÁCH KHÁCH HÀNG',
  guide:  'HƯỚNG DẪN MUA SẮM',
}

export default function FooterSettingsPage() {
  const [settings, setSettings] = useState({})
  const [pages, setPages] = useState([])
  const [faqs, setFaqs] = useState([])
  const [saving, setSaving] = useState(false)
  const [tab, setTab] = useState('info')

  // Modals
  const [editPage, setEditPage] = useState(null)
  const [editFaq, setEditFaq] = useState(null)
  const [showFaqModal, setShowFaqModal] = useState(false)
  const [showAddPage, setShowAddPage] = useState(null) // column_group
  const [newPageTitle, setNewPageTitle] = useState('')
  const [savingFaq, setSavingFaq] = useState(false)
  const [savingPage, setSavingPage] = useState(false)

  const logoRef = useRef()
  const bctRef  = useRef()
  const [logoFile, setLogoFile] = useState(null)
  const [logoPreview, setLogoPreview] = useState('')
  const [bctFile, setBctFile] = useState(null)
  const [bctPreview, setBctPreview] = useState('')

  useEffect(() => {
    Promise.all([
      supabase.from('footer_settings').select('key, value'),
      supabase.from('footer_pages').select('*').order('column_group').order('sort_order'),
      supabase.from('faqs').select('*').order('sort_order'),
    ]).then(([{ data: s }, { data: p }, { data: f }]) => {
      const map = {}
      ;(s || []).forEach(r => { map[r.key] = r.value })
      setSettings(map)
      if (map.footer_logo_url) setLogoPreview(map.footer_logo_url)
      if (map.bct_logo_url)    setBctPreview(map.bct_logo_url)
      setPages(p || [])
      setFaqs(f || [])
    })
  }, [])

  const setS = (k, v) => setSettings(prev => ({ ...prev, [k]: v }))

  const uploadFile = async (file, prefix) => {
    const ext = file.name.split('.').pop()
    const path = `${prefix}_${Date.now()}.${ext}`
    const { error } = await supabase.storage.from('footer').upload(path, file, { upsert: true })
    if (error) throw error
    const { data: { publicUrl } } = supabase.storage.from('footer').getPublicUrl(path)
    return { url: publicUrl, path }
  }

  const saveAll = async () => {
    setSaving(true)
    try {
      let footerLogoUrl = settings.footer_logo_url || ''
      let footerLogoPath = settings.footer_logo_path || ''
      let bctUrl = settings.bct_logo_url || ''
      let bctPath = settings.bct_logo_path || ''

      if (logoFile) {
        if (settings.footer_logo_path) await supabase.storage.from('footer').remove([settings.footer_logo_path])
        const r = await uploadFile(logoFile, 'footer_logo')
        footerLogoUrl = r.url; footerLogoPath = r.path
      }
      if (bctFile) {
        if (settings.bct_logo_path) await supabase.storage.from('footer').remove([settings.bct_logo_path])
        const r = await uploadFile(bctFile, 'bct_logo')
        bctUrl = r.url; bctPath = r.path
      }

      const toSave = {
        ...settings,
        footer_logo_url: footerLogoUrl, footer_logo_path: footerLogoPath,
        bct_logo_url: bctUrl, bct_logo_path: bctPath,
      }
      await Promise.all(Object.entries(toSave).map(([key, value]) =>
        supabase.from('footer_settings').upsert({ key, value: value || '', updated_at: new Date().toISOString() })
      ))
      toast.success('Đã lưu!')
    } catch (err) { toast.error('Lỗi: ' + err.message) }
    finally { setSaving(false) }
  }

  // ── Page management ──
  const savePage = async () => {
    if (!editPage) return
    setSavingPage(true)
    try {
      const { error } = await supabase.from('footer_pages')
        .update({ title: editPage.title, content: editPage.content }).eq('id', editPage.id)
      if (error) throw error
      setPages(prev => prev.map(p => p.id === editPage.id ? { ...p, ...editPage } : p))
      toast.success('Đã lưu trang!')
      setEditPage(null)
    } catch (err) { toast.error('Lỗi: ' + err.message) }
    finally { setSavingPage(false) }
  }

  const togglePage = async (page) => {
    await supabase.from('footer_pages').update({ is_active: !page.is_active }).eq('id', page.id)
    setPages(prev => prev.map(p => p.id === page.id ? { ...p, is_active: !p.is_active } : p))
  }

  const deletePage = async (page) => {
    if (!window.confirm(`Xoá trang "${page.title}"? Hành động này không thể hoàn tác.`)) return
    await supabase.from('footer_pages').delete().eq('id', page.id)
    setPages(prev => prev.filter(p => p.id !== page.id))
    toast.success('Đã xoá trang')
  }

  const addPage = async (group) => {
    if (!newPageTitle.trim()) return toast.error('Nhập tên trang!')
    const slug = toSlug(newPageTitle) + '-' + Date.now().toString(36)
    const { data, error } = await supabase.from('footer_pages').insert({
      slug, title: newPageTitle.trim(),
      column_group: group, sort_order: pages.filter(p => p.column_group === group).length,
      is_active: true, content: '',
    }).select().single()
    if (error) return toast.error('Lỗi: ' + error.message)
    setPages(prev => [...prev, data])
    toast.success(`Đã thêm trang "${newPageTitle.trim()}"!`)
    setShowAddPage(null)
    setNewPageTitle('')
  }

  // ── FAQ management ──
  const saveFaq = async () => {
    setSavingFaq(true)
    try {
      if (editFaq.id) {
        const { error } = await supabase.from('faqs').update(editFaq).eq('id', editFaq.id)
        if (error) throw error
        setFaqs(prev => prev.map(f => f.id === editFaq.id ? editFaq : f))
        toast.success('Đã cập nhật!')
      } else {
        const { data, error } = await supabase.from('faqs').insert({
          question: editFaq.question, answer: editFaq.answer || '',
          sort_order: faqs.length, is_active: true,
        }).select().single()
        if (error) throw error
        setFaqs(prev => [...prev, data])
        toast.success('Đã thêm câu hỏi!')
      }
      setShowFaqModal(false)
      setEditFaq(null)
    } catch (err) { toast.error('Lỗi: ' + err.message) }
    finally { setSavingFaq(false) }
  }

  const deleteFaq = async (id) => {
    if (!window.confirm('Xoá câu hỏi này?')) return
    await supabase.from('faqs').delete().eq('id', id)
    setFaqs(prev => prev.filter(f => f.id !== id))
    toast.success('Đã xoá')
  }

  const TABS = [
    { key: 'info',   label: 'Thông tin & Logo' },
    { key: 'social', label: 'Mạng xã hội' },
    { key: 'cols',   label: 'Quản lý cột' },
    { key: 'faq',    label: 'FAQ' },
  ]

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Footer & FAQ</h1>
        <p className="text-sm text-gray-400 mt-1">Quản lý toàn bộ nội dung footer và câu hỏi thường gặp</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 bg-gray-100 p-1 rounded-2xl w-fit">
        {TABS.map(t => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
              tab === t.key ? 'bg-white text-gray-800 shadow' : 'text-gray-500 hover:text-gray-700'
            }`}>{t.label}</button>
        ))}
      </div>

      {/* ── Tab: Thông tin & Logo ── */}
      {tab === 'info' && (
        <div className="space-y-5 max-w-2xl">
          <div className="bg-white rounded-2xl p-6 shadow-sm space-y-4">
            <h2 className="font-bold text-lg text-gray-800">🏢 Thông tin công ty</h2>
            {[
              { key: 'company_name', label: 'Tên công ty', placeholder: 'CÔNG TY TNHH...' },
              { key: 'company_tax', label: 'Mã số thuế', placeholder: '0123456789' },
              { key: 'company_address', label: 'Địa chỉ văn phòng', placeholder: 'Tầng X, Tòa nhà Y, TP.HCM' },
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
            <h2 className="font-bold text-lg text-gray-800">🔗 Thanh dưới cùng footer</h2>
            <p className="text-xs text-gray-400">Hai link nhỏ hiện ở góc phải phía dưới footer</p>
            <div className="grid grid-cols-2 gap-3">
              {[
                { tk: 'footer_bottom_link1_text', ts: 'footer_bottom_link1_slug', lbl: 'Link 1' },
                { tk: 'footer_bottom_link2_text', ts: 'footer_bottom_link2_slug', lbl: 'Link 2' },
              ].map(({ tk, ts, lbl }) => (
                <div key={tk} className="space-y-2">
                  <input value={settings[tk] || ''} onChange={e => setS(tk, e.target.value)}
                    placeholder={`Tên ${lbl} (vd: Chính sách bảo mật)`}
                    className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-red-800" />
                  <input value={settings[ts] || ''} onChange={e => setS(ts, e.target.value)}
                    placeholder={`Slug (vd: chinh-sach-bao-mat)`}
                    className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-red-800" />
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-sm space-y-4">
            <h2 className="font-bold text-lg text-gray-800">🖼️ Logo Footer</h2>
            {[
              { ref: logoRef, file: logoFile, preview: logoPreview, setFile: setLogoFile, setPreview: setLogoPreview, label: 'Logo footer (riêng với logo header)' },
              { ref: bctRef, file: bctFile, preview: bctPreview, setFile: setBctFile, setPreview: setBctPreview, label: 'Logo Bộ Công Thương' },
            ].map((item, idx) => (
              <div key={idx}>
                <label className="text-sm font-medium text-gray-600 mb-2 block">{item.label}</label>
                <div onClick={() => item.ref.current?.click()}
                  className="border-2 border-dashed border-gray-300 rounded-xl h-24 flex items-center justify-center cursor-pointer hover:border-red-400 transition-all">
                  {item.preview
                    ? <img src={item.preview} className="max-h-16 object-contain" alt="preview" />
                    : <div className="text-gray-400 text-center">
                        <Upload size={22} className="mx-auto mb-1 text-gray-300" />
                        <p className="text-xs">Click để upload</p>
                      </div>
                  }
                  <input ref={item.ref} type="file" accept="image/*" className="hidden"
                    onChange={e => { const f = e.target.files[0]; if (f) { item.setFile(f); item.setPreview(URL.createObjectURL(f)) } }} />
                </div>
              </div>
            ))}
          </div>

          <button onClick={saveAll} disabled={saving}
            className="flex items-center gap-2 text-white px-8 py-3 rounded-xl font-bold w-full justify-center"
            style={{ backgroundColor: saving ? '#9ca3af' : '#B71C1C' }}>
            {saving ? 'Đang lưu...' : <><Save size={18} /> Lưu thông tin & Logo</>}
          </button>
        </div>
      )}

      {/* ── Tab: Mạng xã hội ── */}
      {tab === 'social' && (
        <div className="bg-white rounded-2xl p-6 shadow-sm max-w-xl space-y-4">
          <h2 className="font-bold text-lg text-gray-800 mb-1">🔗 Link mạng xã hội</h2>
          <p className="text-xs text-gray-400 mb-3">Để trống = icon không hiện trên footer</p>
          {[
            { key: 'facebook_url',  label: '📘 Facebook' },
            { key: 'instagram_url', label: '📸 Instagram' },
            { key: 'tiktok_url',    label: '🎵 TikTok' },
            { key: 'zalo_url',      label: '💬 Zalo' },
            { key: 'shopee_url',    label: '🛒 Shopee' },
          ].map(({ key, label }) => (
            <div key={key}>
              <label className="text-sm font-medium text-gray-600 mb-1 block">{label}</label>
              <input value={settings[key] || ''} onChange={e => setS(key, e.target.value)}
                placeholder="https://..."
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-red-800" />
            </div>
          ))}
          <button onClick={saveAll} disabled={saving}
            className="flex items-center gap-2 text-white px-8 py-3 rounded-xl font-bold w-full justify-center mt-2"
            style={{ backgroundColor: saving ? '#9ca3af' : '#B71C1C' }}>
            {saving ? 'Đang lưu...' : <><Save size={18} /> Lưu link mạng xã hội</>}
          </button>
        </div>
      )}

      {/* ── Tab: Quản lý cột ── */}
      {tab === 'cols' && (
        <div className="space-y-5">
          {GROUP_KEYS.map(group => {
            const colPages = pages.filter(p => p.column_group === group)
            const titleKey = `col_${group}_title`
            return (
              <div key={group} className="bg-white rounded-2xl shadow-sm overflow-hidden">
                {/* Column header */}
                <div className="px-6 py-4 border-b bg-gray-50 flex items-center justify-between">
                  <div className="flex items-center gap-3 flex-1">
                    <div className="flex-1 max-w-xs">
                      <label className="text-xs text-gray-500 block mb-1">Tiêu đề cột (hiện trên footer)</label>
                      <input
                        value={settings[titleKey] || GROUP_DEFAULT_TITLES[group]}
                        onChange={e => setS(titleKey, e.target.value)}
                        className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm font-bold outline-none focus:border-red-800 bg-white uppercase"
                        placeholder={GROUP_DEFAULT_TITLES[group]}
                      />
                    </div>
                  </div>
                  <button onClick={saveAll} disabled={saving}
                    className="flex items-center gap-1.5 text-white px-4 py-2 rounded-xl text-xs font-semibold ml-4"
                    style={{ backgroundColor: '#B71C1C' }}>
                    <Save size={13} /> Lưu tiêu đề
                  </button>
                </div>

                {/* Pages list */}
                <div className="divide-y divide-gray-50">
                  {colPages.length === 0 ? (
                    <p className="text-sm text-gray-400 px-6 py-4 text-center">Chưa có trang nào</p>
                  ) : colPages.map(page => (
                    <div key={page.id}
                      className={`flex items-center justify-between px-6 py-3.5 ${!page.is_active ? 'opacity-50' : ''}`}>
                      <div>
                        <p className="text-sm font-medium text-gray-800">{page.title}</p>
                        <p className="text-xs text-gray-400">/page/{page.slug}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <button onClick={() => setEditPage({ ...page })}
                          className="p-2 text-blue-500 hover:bg-blue-50 rounded-lg" title="Chỉnh sửa nội dung">
                          <Pencil size={15} />
                        </button>
                        <button onClick={() => togglePage(page)}
                          className={`p-2 rounded-lg ${page.is_active ? 'text-green-500 hover:bg-green-50' : 'text-gray-400 hover:bg-gray-100'}`}
                          title={page.is_active ? 'Ẩn' : 'Hiện'}>
                          {page.is_active ? <Eye size={15} /> : <EyeOff size={15} />}
                        </button>
                        <button onClick={() => deletePage(page)}
                          className="p-2 text-red-400 hover:bg-red-50 rounded-lg" title="Xoá">
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Add new page */}
                <div className="px-6 py-4 border-t bg-gray-50">
                  {showAddPage === group ? (
                    <div className="flex gap-2">
                      <input value={newPageTitle}
                        onChange={e => setNewPageTitle(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && addPage(group)}
                        placeholder="Tên trang mới (vd: Chính sách vận chuyển)"
                        autoFocus
                        className="flex-1 border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-red-800" />
                      <button onClick={() => addPage(group)}
                        className="text-white px-4 py-2 rounded-xl text-sm font-medium"
                        style={{ backgroundColor: '#B71C1C' }}>Thêm</button>
                      <button onClick={() => { setShowAddPage(null); setNewPageTitle('') }}
                        className="px-3 py-2 text-gray-400 hover:text-gray-600">
                        <X size={16} />
                      </button>
                    </div>
                  ) : (
                    <button onClick={() => setShowAddPage(group)}
                      className="flex items-center gap-2 text-sm font-medium transition-colors"
                      style={{ color: '#B71C1C' }}>
                      <Plus size={15} /> Thêm trang vào cột này
                    </button>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* ── Tab: FAQ ── */}
      {tab === 'faq' && (
        <div>
          <div className="flex justify-between mb-4">
            <p className="text-sm text-gray-500">
              Câu hỏi thường gặp — hiện trên trang /faq khi khách bấm vào
            </p>
            <button
              onClick={() => { setEditFaq({ question: '', answer: '' }); setShowFaqModal(true) }}
              className="flex items-center gap-2 text-white px-4 py-2 rounded-xl text-sm font-medium"
              style={{ backgroundColor: '#B71C1C' }}>
              <Plus size={16} /> Thêm câu hỏi
            </button>
          </div>

          <div className="space-y-2">
            {faqs.map((faq, idx) => (
              <div key={faq.id} className={`bg-white rounded-xl p-4 shadow-sm flex items-start gap-3 ${!faq.is_active ? 'opacity-50' : ''}`}>
                <span className="text-xs text-gray-400 mt-0.5 flex-shrink-0 w-6">#{idx+1}</span>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm text-gray-800">{faq.question}</p>
                  {faq.answer && (
                    <p className="text-xs text-gray-400 mt-1 truncate"
                      dangerouslySetInnerHTML={{ __html: faq.answer.replace(/<[^>]+>/g, '') }} />
                  )}
                </div>
                <div className="flex gap-2 flex-shrink-0">
                  <button onClick={() => { setEditFaq({ ...faq }); setShowFaqModal(true) }}
                    className="p-2 text-blue-500 hover:bg-blue-50 rounded-lg"><Pencil size={15} /></button>
                  <button onClick={() => deleteFaq(faq.id)}
                    className="p-2 text-red-400 hover:bg-red-50 rounded-lg"><Trash2 size={15} /></button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Modal: Chỉnh sửa nội dung trang footer */}
      {editPage && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-start justify-center overflow-y-auto py-8 px-4">
          <div className="bg-white rounded-2xl w-full max-w-3xl shadow-2xl">
            <div className="flex items-center justify-between px-6 py-4 border-b">
              <div className="flex-1">
                <p className="text-xs text-gray-400 mb-1">Tên trang</p>
                <input value={editPage.title}
                  onChange={e => setEditPage(prev => ({ ...prev, title: e.target.value }))}
                  className="text-lg font-bold outline-none border-b-2 border-gray-200 focus:border-red-700 pb-1 w-full" />
              </div>
              <button onClick={() => setEditPage(null)} className="p-2 hover:bg-gray-100 rounded-full ml-4">
                <X size={20} />
              </button>
            </div>
            <div className="p-6">
              <RichEditor
                value={editPage.content}
                onChange={val => setEditPage(prev => ({ ...prev, content: val }))}
                placeholder="Nhập nội dung trang..."
                minH={300}
              />
            </div>
            <div className="flex justify-end gap-3 px-6 py-4 border-t bg-gray-50 rounded-b-2xl">
              <button onClick={() => setEditPage(null)}
                className="px-6 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-600 hover:bg-gray-100">Huỷ</button>
              <button onClick={savePage} disabled={savingPage}
                className="flex items-center gap-2 text-white px-8 py-2.5 rounded-xl text-sm font-bold"
                style={{ backgroundColor: savingPage ? '#9ca3af' : '#B71C1C' }}>
                {savingPage ? <><Loader2 size={16} className="animate-spin" /> Lưu...</> : '💾 Lưu nội dung'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: FAQ */}
      {showFaqModal && editFaq && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-start justify-center overflow-y-auto py-8 px-4">
          <div className="bg-white rounded-2xl w-full max-w-2xl shadow-2xl">
            <div className="flex items-center justify-between px-6 py-4 border-b">
              <h2 className="font-bold text-lg">{editFaq.id ? '✏️ Sửa câu hỏi' : '➕ Thêm câu hỏi'}</h2>
              <button onClick={() => { setShowFaqModal(false); setEditFaq(null) }}
                className="p-2 hover:bg-gray-100 rounded-full"><X size={20} /></button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Câu hỏi *</label>
                <input value={editFaq.question || ''}
                  onChange={e => setEditFaq(prev => ({ ...prev, question: e.target.value }))}
                  placeholder="Chính sách đổi trả ra sao?..."
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-red-800" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Câu trả lời</label>
                <RichEditor
                  value={editFaq.answer || ''}
                  onChange={val => setEditFaq(prev => ({ ...prev, answer: val }))}
                  placeholder="Nhập câu trả lời chi tiết..."
                  minH={150}
                />
              </div>
              {editFaq.id && (
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={editFaq.is_active ?? true}
                    onChange={e => setEditFaq(prev => ({ ...prev, is_active: e.target.checked }))}
                    className="w-4 h-4 accent-red-800" />
                  <span className="text-sm text-gray-700">Hiển thị trên trang FAQ</span>
                </label>
              )}
            </div>
            <div className="flex justify-end gap-3 px-6 py-4 border-t bg-gray-50 rounded-b-2xl">
              <button onClick={() => { setShowFaqModal(false); setEditFaq(null) }}
                className="px-6 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-600 hover:bg-gray-100">Huỷ</button>
              <button onClick={saveFaq} disabled={savingFaq}
                className="flex items-center gap-2 text-white px-8 py-2.5 rounded-xl text-sm font-bold"
                style={{ backgroundColor: savingFaq ? '#9ca3af' : '#B71C1C' }}>
                {savingFaq ? <><Loader2 size={16} className="animate-spin" /> Lưu...</> : '💾 Lưu'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}