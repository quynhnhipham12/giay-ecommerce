// Copy toàn bộ code dưới đây dán vào file: src/App.jsx (admin)
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { useEffect, useState } from 'react'
import { supabase } from './supabaseClient'
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

function AdminLayout({ children }) {
  return (
    <div className="flex h-screen bg-gray-100 overflow-hidden">
      <Sidebar />
      <main className="flex-1 overflow-y-auto p-6">{children}</main>
    </div>
  )
}

function ProtectedRoute({ user, isAdmin, checking, children }) {
  if (checking) return (
    <div className="flex items-center justify-center h-screen">
      <div className="animate-spin w-10 h-10 border-4 border-t-transparent rounded-full"
        style={{ borderColor: '#B71C1C', borderTopColor: 'transparent' }} />
    </div>
  )
  if (!user) return <Navigate to="/login" replace />
  if (!isAdmin) return (
    <div className="flex items-center justify-center h-screen flex-col gap-4">
      <div className="text-xl font-bold" style={{ color: '#B71C1C' }}>⛔ Không có quyền Admin</div>
      <button onClick={() => supabase.auth.signOut()}
        className="text-white px-4 py-2 rounded-lg" style={{ backgroundColor: '#B71C1C' }}>
        Đăng xuất
      </button>
    </div>
  )
  return <AdminLayout>{children}</AdminLayout>
}

export default function App() {
  const [user, setUser] = useState(null)
  const [isAdmin, setIsAdmin] = useState(false)
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
      else if (['SIGNED_IN','TOKEN_REFRESHED'].includes(event)) checkRole(session?.user || null)
    })
    return () => subscription.unsubscribe()
  }, [])

  const wrap = (C) => (
    <ProtectedRoute user={user} isAdmin={isAdmin} checking={checking}>
      <C />
    </ProtectedRoute>
  )

  return (
    <BrowserRouter>
      <Toaster position="top-right" />
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