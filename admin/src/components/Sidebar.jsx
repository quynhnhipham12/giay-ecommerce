// Copy toàn bộ code dưới đây dán vào file: src/components/Sidebar.jsx (admin)
import { NavLink, useNavigate } from 'react-router-dom'
import { supabase } from '../supabaseClient'
import toast from 'react-hot-toast'
import { useEffect, useState } from 'react'
import {
  LayoutDashboard, Package, ShoppingBag, Image,
  MapPin, Settings, LogOut, Home, Grid3x3,
  BarChart3, Filter, ExternalLink, FileText, Users, X
} from 'lucide-react'

const BG        = '#440000'
const HOVER_BG  = 'rgba(255,255,255,0.13)'
const ACTIVE_BG = '#B71C1C'

const NAV_ITEMS = [
  { to: '/',            icon: LayoutDashboard, label: 'Dashboard',   exact: true },
  { to: '/products',    icon: Package,         label: 'Sản phẩm' },
  { to: '/orders',      icon: ShoppingBag,     label: 'Đơn hàng' },
  { to: '/homepage',    icon: Home,            label: 'Trang chủ' },
  { to: '/collections', icon: Grid3x3,         label: 'Bộ sưu tập' },
  { to: '/banners',     icon: Image,           label: 'Banner Slider' },
  { to: '/filters',     icon: Filter,          label: 'Bộ lọc SP' },
  { to: '/stores',      icon: MapPin,          label: 'Cửa hàng' },
  { to: '/stats',       icon: BarChart3,       label: 'Thống kê Upload' },
  { to: '/members',     icon: Users,           label: 'Thành viên' },
  { to: '/footer',      icon: FileText,        label: 'Footer & FAQ' },
  { to: '/settings',    icon: Settings,        label: 'Cài đặt' },
]

export default function Sidebar({ onClose }) {
  const navigate = useNavigate()
  const [logoUrl, setLogoUrl] = useState('')

  useEffect(() => {
    supabase.from('settings').select('key, value')
      .in('key', ['admin_logo_url', 'logo_url'])
      .then(({ data }) => {
        const map = {}
        ;(data || []).forEach(r => { map[r.key] = r.value })
        setLogoUrl(map.admin_logo_url || map.logo_url || '')
      })
  }, [])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    toast.success('Đã đăng xuất')
    navigate('/login')
  }

  const hoverIn  = e => { e.currentTarget.style.backgroundColor = HOVER_BG; e.currentTarget.style.color = '#fff' }
  const hoverOut = e => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = 'rgba(255,255,255,0.65)' }

  // Khi bấm nav item → đóng sidebar trên mobile
  const go = () => { if (onClose) onClose() }

  return (
    <aside
      style={{ backgroundColor: BG, width: 240, height: '100%' }}
      className="text-white flex flex-col flex-shrink-0 select-none"
    >
      {/* Logo + nút đóng */}
      <div style={{
        padding: '16px',
        borderBottom: '1px solid rgba(255,255,255,0.1)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        minHeight: 68,
        flexShrink: 0,
      }}>
        <div
          style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}
          onClick={() => { navigate('/'); go() }}
        >
          {logoUrl ? (
            <img src={logoUrl} alt="Logo" style={{ height: 40, width: 'auto', objectFit: 'contain', maxWidth: 140 }} />
          ) : (
            <>
              <div style={{
                width: 32, height: 32, borderRadius: 8,
                backgroundColor: ACTIVE_BG,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontWeight: 900, fontSize: 15,
              }}>G</div>
              <div>
                <div style={{ fontWeight: 900, fontSize: 14 }}>
                  GIÀY<span style={{ color: '#f87171' }}>GIÁRẺ</span>
                </div>
                <p style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)', margin: 0 }}>Admin Panel</p>
              </div>
            </>
          )}
        </div>

        {/* Nút X chỉ hiện khi onClose được truyền vào (mobile) */}
        {onClose && (
          <button
            onClick={onClose}
            style={{
              padding: 6, borderRadius: 8, border: 'none',
              background: 'rgba(255,255,255,0.1)',
              cursor: 'pointer', color: 'white',
              display: 'flex', alignItems: 'center',
            }}
          >
            <X size={18} />
          </button>
        )}
      </div>

      {/* Nav */}
      <nav style={{ flex: 1, padding: 8, overflowY: 'auto' }}>
        {NAV_ITEMS.map(({ to, icon: Icon, label, exact }) => (
          <NavLink
            key={to} to={to} end={exact}
            onClick={go}
            className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors"
            style={({ isActive }) => ({
              backgroundColor: isActive ? ACTIVE_BG : 'transparent',
              color: isActive ? '#ffffff' : 'rgba(255,255,255,0.65)',
              marginBottom: 2,
            })}
            onMouseEnter={e => { if (!e.currentTarget.getAttribute('aria-current')) e.currentTarget.style.backgroundColor = HOVER_BG }}
            onMouseLeave={e => { if (!e.currentTarget.getAttribute('aria-current')) e.currentTarget.style.backgroundColor = 'transparent' }}
          >
            <Icon size={17} />{label}
          </NavLink>
        ))}
      </nav>

      {/* Footer */}
      <div style={{ padding: 8, borderTop: '1px solid rgba(255,255,255,0.1)', flexShrink: 0 }}>
        <button
          type="button"
          onClick={() => window.open('http://localhost:5176', '_blank')}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-left"
          style={{ color: 'rgba(255,255,255,0.65)', background: 'none', border: 'none', cursor: 'pointer' }}
          onMouseEnter={hoverIn} onMouseLeave={hoverOut}
        >
          <ExternalLink size={17} />Trang bán hàng ↗
        </button>
        <button
          type="button"
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm"
          style={{ color: 'rgba(255,255,255,0.65)', background: 'none', border: 'none', cursor: 'pointer' }}
          onMouseEnter={e => { e.currentTarget.style.backgroundColor = 'rgba(255,100,100,0.2)'; e.currentTarget.style.color = '#fca5a5' }}
          onMouseLeave={hoverOut}
        >
          <LogOut size={17} />Đăng xuất
        </button>
      </div>
    </aside>
  )
}