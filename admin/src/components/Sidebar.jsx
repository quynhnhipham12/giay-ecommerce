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

  // Khi bấm vào menu item trên mobile → tự đóng sidebar
  const handleNavClick = () => { if (onClose) onClose() }

  return (
    <aside
      className="w-64 text-white flex flex-col h-full flex-shrink-0 select-none"
      style={{ backgroundColor: BG }}
    >
      {/* Logo + nút đóng (chỉ hiện trên mobile) */}
      <div className="p-4 border-b border-white/10 flex-shrink-0 flex items-center justify-between"
        style={{ minHeight: 68 }}>
        <div className="flex items-center gap-2 cursor-pointer" onClick={() => { navigate('/'); handleNavClick() }}>
          {logoUrl ? (
            <img src={logoUrl} alt="Logo" className="h-10 w-auto object-contain max-w-[140px]" />
          ) : (
            <>
              <div className="w-8 h-8 rounded-lg flex items-center justify-center font-black"
                style={{ backgroundColor: ACTIVE_BG, fontSize: 15 }}>G</div>
              <div>
                <div className="font-black text-sm">
                  GIÀY<span style={{ color: '#f87171' }}>GIÁRẺ</span>
                </div>
                <p className="text-[10px] text-white/40">Admin Panel</p>
              </div>
            </>
          )}
        </div>

        {/* ✅ Nút X đóng sidebar — chỉ hiện trên mobile */}
        {onClose && (
          <button
            onClick={onClose}
            className="lg:hidden p-1.5 rounded-lg hover:bg-white/10 transition-colors flex-shrink-0"
          >
            <X size={18} />
          </button>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 p-2 overflow-y-auto space-y-0.5">
        {NAV_ITEMS.map(({ to, icon: Icon, label, exact }) => (
          <NavLink
            key={to} to={to} end={exact}
            onClick={handleNavClick}
            className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors"
            style={({ isActive }) => ({
              backgroundColor: isActive ? ACTIVE_BG : 'transparent',
              color: isActive ? '#ffffff' : 'rgba(255,255,255,0.65)',
            })}
            onMouseEnter={e => { if (!e.currentTarget.getAttribute('aria-current')) e.currentTarget.style.backgroundColor = HOVER_BG }}
            onMouseLeave={e => { if (!e.currentTarget.getAttribute('aria-current')) e.currentTarget.style.backgroundColor = 'transparent' }}
          >
            <Icon size={17} />
            {label}
          </NavLink>
        ))}
      </nav>

      {/* Footer */}
      <div className="p-2 border-t border-white/10 space-y-0.5 flex-shrink-0">
        <button
          type="button"
          onClick={() => window.open('http://localhost:5176', '_blank')}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-left"
          style={{ color: 'rgba(255,255,255,0.65)' }}
          onMouseEnter={hoverIn} onMouseLeave={hoverOut}
        >
          <ExternalLink size={17} />
          Trang bán hàng ↗
        </button>

        <button
          type="button"
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm"
          style={{ color: 'rgba(255,255,255,0.65)' }}
          onMouseEnter={e => { e.currentTarget.style.backgroundColor = 'rgba(255,100,100,0.2)'; e.currentTarget.style.color = '#fca5a5' }}
          onMouseLeave={hoverOut}
        >
          <LogOut size={17} />
          Đăng xuất
        </button>
      </div>
    </aside>
  )
}