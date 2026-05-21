// Copy toàn bộ code dưới đây dán vào file: src/components/Footer.jsx (frontend)
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../supabaseClient'

function SocialIcon({ type, url }) {
  if (!url) return null
  const icons = {
    facebook:  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M18 2h-3a5 5 0 00-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 011-1h3z"/></svg>,
    instagram: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="2" width="20" height="20" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.5" cy="6.5" r="1.5" fill="currentColor" stroke="none"/></svg>,
    tiktok:    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.89-2.89 2.89 2.89 0 012.89-2.89c.28 0 .54.04.79.1V9.01a6.28 6.28 0 00-.79-.05 6.34 6.34 0 00-6.34 6.34 6.34 6.34 0 006.34 6.34 6.34 6.34 0 006.33-6.34V9.15a8.16 8.16 0 004.78 1.52V7.25a4.85 4.85 0 01-1.01-.56z"/></svg>,
    zalo:      <svg width="18" height="18" viewBox="0 0 50 50" fill="currentColor"><path d="M25 3C12.85 3 3 12.85 3 25s9.85 22 22 22 22-9.85 22-22S37.15 3 25 3zm-5.5 31H15V18h4.5v16zm7.5 0h-4v-8.5c0-1.38-1.12-2.5-2.5-2.5s-2.5 1.12-2.5 2.5V34h-4V18h4v1.46A6.46 6.46 0 0123 18c3.59 0 6.5 2.91 6.5 6.5V34z"/></svg>,
    shopee:    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M12 1a5 5 0 015 5H7a5 5 0 015-5zM4 8h16l-1.5 12H5.5L4 8zm8 3a1 1 0 00-1 1v4a1 1 0 002 0v-4a1 1 0 00-1-1z"/></svg>,
  }
  return (
    <a href={url} target="_blank" rel="noreferrer"
      className="w-9 h-9 bg-gray-800 hover:bg-gray-600 rounded-full flex items-center justify-center text-white transition-colors">
      {icons[type]}
    </a>
  )
}

// ── Newsletter subscription form ──
function NewsletterForm({ label }) {
  const [email, setEmail] = useState('')
  const [status, setStatus] = useState(null)

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!email.trim() || !email.includes('@')) return
    try {
      const { error } = await supabase.from('newsletter_subscribers').insert({ email: email.trim() })
      if (error) {
        setStatus(error.code === '23505' ? 'exists' : 'error')
      } else {
        setStatus('success')
        setEmail('')
      }
    } catch { setStatus('error') }
    setTimeout(() => setStatus(null), 4000)
  }

  return (
    <div className="py-5 border-b border-gray-200">
      <div className="container mx-auto px-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <p className="font-semibold text-sm text-gray-700 flex-shrink-0">{label}</p>
          <div className="flex flex-col gap-1 w-full sm:w-auto">
            <form onSubmit={handleSubmit} className="flex">
              <input type="email" value={email} onChange={e => setEmail(e.target.value)}
                placeholder="Nhập địa chỉ email"
                className="border border-gray-300 border-r-0 rounded-l-xl px-4 py-2.5 text-sm outline-none focus:border-red-800 flex-1 sm:w-64 min-w-0" />
              <button type="submit"
                className="px-5 py-2.5 text-sm font-bold text-white rounded-r-xl flex-shrink-0"
                style={{ backgroundColor: '#B71C1C' }}>
                Đăng ký
              </button>
            </form>
            {status === 'success' && <p className="text-xs text-green-600 pl-1">✅ Đăng ký thành công!</p>}
            {status === 'exists'  && <p className="text-xs text-orange-500 pl-1">Email này đã đăng ký trước rồi!</p>}
            {status === 'error'   && <p className="text-xs text-red-500 pl-1">Có lỗi xảy ra, vui lòng thử lại.</p>}
          </div>
        </div>
      </div>
    </div>
  )
}

export default function Footer() {
  const [data, setData] = useState({})
  const [pages, setPages] = useState({ about: [], policy: [], guide: [] })

  useEffect(() => {
    supabase.from('footer_settings').select('key, value').then(({ data: rows }) => {
      const map = {}
      ;(rows || []).forEach(r => { map[r.key] = r.value })
      setData(map)
    })
    supabase.from('footer_pages').select('slug, title, column_group, sort_order')
      .eq('is_active', true).order('sort_order')
      .then(({ data: rows }) => {
        const grouped = { about: [], policy: [], guide: [] }
        ;(rows || []).forEach(r => { if (grouped[r.column_group]) grouped[r.column_group].push(r) })
        setPages(grouped)
      })
  }, [])

  const colTitles = {
    about:  data.col_about_title  || 'VỀ CHÚNG TÔI',
    policy: data.col_policy_title || 'CHÍNH SÁCH KHÁCH HÀNG',
    guide:  data.col_guide_title  || 'HƯỚNG DẪN MUA SẮM',
  }

  const bottomLink1 = { text: data.footer_bottom_link1_text || 'Chính sách bảo mật',  slug: data.footer_bottom_link1_slug || 'chinh-sach-bao-mat' }
  const bottomLink2 = { text: data.footer_bottom_link2_text || 'Điều khoản đổi trả', slug: data.footer_bottom_link2_slug || 'chinh-sach-doi-tra' }

  const year = new Date().getFullYear()
  const copyrightText = data.copyright_text ||
    `© ${year} ${data.company_name || 'GiàyGiáRẻ'}. Tất cả quyền được bảo lưu.`

  return (
    <footer style={{ backgroundColor: '#f5f5f5' }}>

      {/* Newsletter */}
      {data.newsletter_label && <NewsletterForm label={data.newsletter_label} />}

      {/* Social bar */}
      <div className="container mx-auto px-4 py-5 flex items-center justify-end gap-3 border-b border-gray-200">
        <span className="text-xs font-bold text-gray-500 uppercase tracking-widest mr-2">
          THEO DÕI CHÚNG TÔI TẠI
        </span>
        {['facebook','instagram','tiktok','zalo','shopee'].map(t => (
          <SocialIcon key={t} type={t} url={data[`${t}_url`]} />
        ))}
      </div>

      {/* Main columns */}
      <div className="container mx-auto px-4 py-10">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* ✅ Cột 1: Logo lớn hơn + Link về trang chủ */}
          <div>
            <Link to="/" className="inline-block mb-4">
              {data.footer_logo_url ? (
                <img src={data.footer_logo_url} alt="Logo"
                  className="h-14 md:h-16 w-auto object-contain" />
              ) : (
                <div className="font-black text-2xl">
                  GIÀY<span className="text-red-700">GIÁRẺ</span>
                </div>
              )}
            </Link>
            {data.company_name && (
              <p className="text-xs font-black uppercase text-gray-700 mb-2 tracking-wide">
                {data.company_name}
              </p>
            )}
            {data.company_tax && (
              <p className="text-xs text-gray-500 mb-1">Mã số thuế: {data.company_tax}</p>
            )}
            {data.company_address && (
              <p className="text-xs text-gray-500 leading-relaxed mb-4">{data.company_address}</p>
            )}
            {data.bct_logo_url && (
              <img src={data.bct_logo_url} alt="BCT" className="h-10 w-auto object-contain" />
            )}
          </div>

          {/* 3 cột động */}
          {(['about','policy','guide']).map(group => (
            <div key={group}>
              <h3 className="font-black text-xs uppercase tracking-wider text-gray-800 mb-4">
                {colTitles[group]}
              </h3>
              <ul className="space-y-2.5">
                {pages[group].map(p => (
                  <li key={p.slug}>
                    <Link to={p.slug === 'cau-hoi-thuong-gap' ? '/faq' : `/page/${p.slug}`}
                      className="text-sm text-gray-500 hover:text-red-700 transition-colors">
                      {p.title}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>

      {/* ✅ Bottom — copyright text lấy từ admin */}
      <div style={{ backgroundColor: '#ebebeb' }} className="border-t border-gray-200">
        <div className="container mx-auto px-4 py-4 flex flex-col md:flex-row items-center justify-between gap-2">
          <p className="text-xs text-gray-400">{copyrightText}</p>
          <div className="flex gap-4">
            <Link to={`/page/${bottomLink1.slug}`}
              className="text-xs text-gray-400 hover:text-red-700 transition-colors">
              {bottomLink1.text}
            </Link>
            <Link to={`/page/${bottomLink2.slug}`}
              className="text-xs text-gray-400 hover:text-red-700 transition-colors">
              {bottomLink2.text}
            </Link>
          </div>
        </div>
      </div>
    </footer>
  )
}