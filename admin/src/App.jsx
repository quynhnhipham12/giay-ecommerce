// Copy toàn bộ code dưới đây dán vào file: src/App.jsx (admin)
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { useEffect, useState } from 'react'
import { supabase } from './supabaseClient'
import { Menu } from 'lucide-react'

import LoginPage          from './pages/LoginPage'
import Dashboard          from './pages/Dashboard'
import ProductsPage       from './pages/ProductsPage'
import OrdersPage         from './pages/OrdersPage'
import BannersPage        from './pages/BannersPage'
import StoresPage         from './pages/StoresPage'
import SettingsPage       from './pages/SettingsPage'
import HomepagePage       from './pages/HomepagePage'
import CollectionsPage    from './pages/CollectionsPage'
import FilterSettingsPage from './pages/FilterSettingsPage'
import StatsPage          from './pages/StatsPage'
import FooterSettingsPage from './pages/FooterSettingsPage'
import MembersPage        from './pages/MembersPage'
import Sidebar            from './components/Sidebar'

// ─────────────────────────────────────────────────────────────
// Hook phát hiện mobile (dưới 1024px)
// ─────────────────────────────────────────────────────────────
function useIsMobile() {
  const [mobile, setMobile] = useState(() => window.innerWidth < 1024)
  useEffect(() => {
    const handler = () => setMobile(window.innerWidth < 1024)
    window.addEventListener('resize', handler)
    return () => window.removeEventListener('resize', handler)
  }, [])
  return mobile
}

// ─────────────────────────────────────────────────────────────
// AdminLayout — sidebar HOÀN TOÀN ẩn trên mobile (không chiếm layout)
// ─────────────────────────────────────────────────────────────
function AdminLayout({ children }) {
  const isMobile = useIsMobile()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  // Đóng sidebar khi chuyển sang desktop
  useEffect(() => { if (!isMobile) setSidebarOpen(false) }, [isMobile])

  return (
    <div style={{
      display: 'flex',
      height: '100vh',
      overflow: 'hidden',
      background: '#f3f4f6',
      maxWidth: '100vw',
    }}>

      {/* ── DESKTOP: sidebar luôn hiện, MOBILE: ẩn hoàn toàn ── */}
      {!isMobile && (
        <div style={{ flexShrink: 0 }}>
          <Sidebar />
        </div>
      )}

      {/* ── MOBILE OVERLAY: chỉ xuất hiện khi bấm hamburger ── */}
      {isMobile && sidebarOpen && (
        <>
          {/* Nền tối */}
          <div
            onClick={() => setSidebarOpen(false)}
            style={{
              position: 'fixed', inset: 0,
              background: 'rgba(0,0,0,0.65)',
              zIndex: 40,
            }}
          />
          {/* Sidebar trượt ra */}
          <div style={{
            position: 'fixed',
            top: 0, left: 0, bottom: 0,
            zIndex: 50,
          }}>
            <Sidebar onClose={() => setSidebarOpen(false)} />
          </div>
        </>
      )}

      {/* ── Nội dung chính — chiếm toàn bộ chiều rộng trên mobile ── */}
      <div style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        minWidth: 0,
      }}>

        {/* Thanh top mobile */}
        {isMobile && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            padding: '12px 16px',
            background: 'white',
            borderBottom: '1px solid #e5e7eb',
            flexShrink: 0,
            boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
          }}>
            <button
              onClick={() => setSidebarOpen(true)}
              style={{
                padding: 8,
                borderRadius: 10,
                border: 'none',
                background: 'none',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
              }}
            >
              <Menu size={22} color="#374151" />
            </button>
            <span style={{ fontWeight: 900, fontSize: 16, color: '#1f2937' }}>
              GIÀY<span style={{ color: '#B71C1C' }}>GIÁRẺ</span>
              <span style={{ fontSize: 11, fontWeight: 400, color: '#9ca3af', marginLeft: 4 }}>
                Admin
              </span>
            </span>
          </div>
        )}

        <main style={{
          flex: 1,
          overflowY: 'auto',
          padding: isMobile ? 16 : 24,
        }}>
          {children}
        </main>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────
// Protected Route
// ─────────────────────────────────────────────────────────────
function ProtectedRoute({ user, isAdmin, checking, children }) {
  if (checking) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh' }}>
      <div className="animate-spin w-10 h-10 border-4 border-t-transparent rounded-full"
        style={{ borderColor: '#B71C1C', borderTopColor: 'transparent' }} />
    </div>
  )
  if (!user) return <Navigate to="/login" replace />
  if (!isAdmin) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', flexDirection: 'column', gap: 16, padding: 24, textAlign: 'center' }}>
      <p style={{ fontSize: 20, fontWeight: 700, color: '#B71C1C' }}>⛔ Không có quyền Admin</p>
      <button onClick={() => supabase.auth.signOut()}
        style={{ background: '#B71C1C', color: 'white', border: 'none', padding: '10px 24px', borderRadius: 12, cursor: 'pointer', fontWeight: 600 }}>
        Đăng xuất
      </button>
    </div>
  )
  return <AdminLayout>{children}</AdminLayout>
}

// ─────────────────────────────────────────────────────────────
// App
// ─────────────────────────────────────────────────────────────
export default function App() {
  const [user, setUser]         = useState(null)
  const [isAdmin, setIsAdmin]   = useState(false)
  const [checking, setChecking] = useState(true)

  const checkRole = async (u) => {
    if (!u) { setUser(null); setIsAdmin(false); setChecking(false); return }
    setUser(u)
    try {
      const { data, error } = await supabase.rpc('get_my_role')
      if (error) {
        const { data: ud } = await supabase.from('users').select('role').eq('id', u.id).maybeSingle()
        setIsAdmin(ud?.role === 'admin')
      } else {
        setIsAdmin(data === 'admin')
      }
    } catch { setIsAdmin(false) }
    setChecking(false)
  }

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => checkRole(session?.user || null))
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_OUT') { setUser(null); setIsAdmin(false); setChecking(false) }
      else if (['SIGNED_IN', 'TOKEN_REFRESHED'].includes(event)) checkRole(session?.user || null)
    })
    return () => subscription.unsubscribe()
  }, [])

  const wrap = (C) => (
    <ProtectedRoute user={user} isAdmin={isAdmin} checking={checking}><C /></ProtectedRoute>
  )

  return (
    <BrowserRouter>
      <Toaster position="top-right" toastOptions={{ style: { fontSize: 14 } }} />
      <Routes>
        <Route path="/login"       element={<LoginPage />} />
        <Route path="/"            element={wrap(Dashboard)} />
        <Route path="/products"    element={wrap(ProductsPage)} />
        <Route path="/orders"      element={wrap(OrdersPage)} />
        <Route path="/homepage"    element={wrap(HomepagePage)} />
        <Route path="/collections" element={wrap(CollectionsPage)} />
        <Route path="/banners"     element={wrap(BannersPage)} />
        <Route path="/filters"     element={wrap(FilterSettingsPage)} />
        <Route path="/stores"      element={wrap(StoresPage)} />
        <Route path="/stats"       element={wrap(StatsPage)} />
        <Route path="/members"     element={wrap(MembersPage)} />
        <Route path="/footer"      element={wrap(FooterSettingsPage)} />
        <Route path="/settings"    element={wrap(SettingsPage)} />
      </Routes>
    </BrowserRouter>
  )
}