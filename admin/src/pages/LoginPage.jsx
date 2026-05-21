import { useState } from 'react'
import { supabase } from '../supabaseClient'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'

export default function AdminLoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  const handleLogin = async (e) => {
    e.preventDefault()
    setLoading(true)

    try {
      // Bước 1: Đăng nhập
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password
      })

      if (authError) throw new Error('Email hoặc mật khẩu không đúng')

      // Bước 2: Kiểm tra role bằng function
      const { data: role, error: roleError } = await supabase.rpc('get_my_role')

      let userRole = role

      // Fallback nếu function lỗi
      if (roleError || !role) {
        const { data: userData } = await supabase
          .from('users')
          .select('role')
          .eq('id', authData.user.id)
          .maybeSingle()
        userRole = userData?.role
      }

      if (userRole !== 'admin') {
        await supabase.auth.signOut()
        throw new Error('Tài khoản không có quyền Admin!')
      }

      toast.success('Chào mừng Admin!')
      navigate('/')
    } catch (err) {
      toast.error(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center">
      <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="text-3xl mb-2">🔒</div>
          <h1 className="text-xl font-bold text-gray-800">Admin Panel</h1>
          <p className="text-gray-400 text-sm">GiàyGiáRẻ Management System</p>
        </div>
        <form onSubmit={handleLogin} className="space-y-4">
          <input
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            placeholder="admin@giaygiare.vn"
            required
            className="w-full px-4 py-3 border rounded-xl text-sm outline-none focus:border-red-500"
          />
          <input
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            placeholder="Mật khẩu"
            required
            className="w-full px-4 py-3 border rounded-xl text-sm outline-none focus:border-red-500"
          />
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-red-600 hover:bg-red-700 disabled:bg-gray-300 text-white py-3 rounded-xl font-semibold"
          >
            {loading ? 'Đang kiểm tra...' : 'Đăng nhập Admin'}
          </button>
        </form>
      </div>
    </div>
  )
}