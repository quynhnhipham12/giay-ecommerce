// Copy toàn bộ code dưới đây dán vào file: src/pages/LoginPage.jsx (frontend)
import { useState, useEffect } from 'react'
import { supabase } from '../supabaseClient'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'

export default function LoginPage() {
  const [isLogin, setIsLogin] = useState(true)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [fullName, setFullName] = useState('')
  const [loading, setLoading] = useState(false)
  const [loginLogoUrl, setLoginLogoUrl] = useState('')
  const navigate = useNavigate()

  useEffect(() => {
    supabase.from('settings').select('value').eq('key', 'login_logo_url').single()
      .then(({ data }) => { if (data?.value) setLoginLogoUrl(data.value) })
  }, [])

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!email || !password) return toast.error('Vui lòng điền đầy đủ thông tin!')
    setLoading(true)
    try {
      if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({ email, password })
        if (error) throw error
        toast.success('Đăng nhập thành công!')
        navigate('/')
      } else {
        if (!fullName) return toast.error('Vui lòng nhập họ tên!')
        const { data, error } = await supabase.auth.signUp({
          email, password,
          options: { data: { full_name: fullName } }
        })
        if (error) throw error
        // Lưu vào bảng users
        if (data.user) {
          await supabase.from('users').upsert({
            id: data.user.id,
            email,
            full_name: fullName,
            role: 'customer',
            created_at: new Date().toISOString(),
          }, { onConflict: 'id' })
        }
        toast.success('Đăng ký thành công! Kiểm tra email để xác nhận.')
        setIsLogin(true)
      }
    } catch (err) {
      toast.error(err.message || 'Có lỗi xảy ra')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-lg p-8 w-full max-w-sm">
        {/* Logo — từ admin hoặc text mặc định */}
        <div className="text-center mb-6">
          {loginLogoUrl ? (
            <img src={loginLogoUrl} alt="Logo" className="h-16 w-auto object-contain mx-auto mb-2" />
          ) : (
            <h1 className="text-3xl font-black mb-1">
              <span className="text-gray-900">GIÀY</span>
              <span className="text-red-600">GIÁRẺ</span>
            </h1>
          )}
          <p className="text-gray-400 text-sm">
            {isLogin ? 'Đăng nhập tài khoản' : 'Tạo tài khoản mới'}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {!isLogin && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Họ và tên</label>
              <input type="text" value={fullName} onChange={e => setFullName(e.target.value)}
                placeholder="Nguyễn Văn A"
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-red-600 bg-gray-50" />
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)}
              placeholder="email@example.com" required
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-red-600 bg-gray-50" />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Mật khẩu</label>
            <input type="password" value={password} onChange={e => setPassword(e.target.value)}
              placeholder="••••••••••" required
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-red-600 bg-gray-50" />
          </div>

          <button type="submit" disabled={loading}
            className="w-full text-white py-3.5 rounded-xl font-bold text-sm transition-colors"
            style={{ backgroundColor: loading ? '#9ca3af' : '#ef4444' }}>
            {loading ? 'Đang xử lý...' : isLogin ? 'Đăng nhập' : 'Đăng ký'}
          </button>
        </form>

        <p className="text-center text-sm text-gray-500 mt-5">
          {isLogin ? 'Chưa có tài khoản? ' : 'Đã có tài khoản? '}
          <button onClick={() => setIsLogin(!isLogin)}
            className="text-red-600 font-semibold hover:underline">
            {isLogin ? 'Đăng ký' : 'Đăng nhập'}
          </button>
        </p>
      </div>
    </div>
  )
}