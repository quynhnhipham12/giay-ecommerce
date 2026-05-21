// Copy toàn bộ code dưới đây dán vào file: src/pages/CheckoutPage.jsx (frontend)
import { useState, useEffect } from 'react'
import { useCart } from '../context/CartContext'
import { supabase } from '../supabaseClient'
import { useNavigate, Link } from 'react-router-dom'
import toast from 'react-hot-toast'
import { CheckCircle, ShoppingBag, Copy } from 'lucide-react'

const CITIES = ['TP. Hồ Chí Minh', 'Hà Nội', 'Đà Nẵng', 'Hải Phòng', 'Cần Thơ', 'Khác']

export default function CheckoutPage() {
  const { cartItems, totalPrice, clearCart } = useCart()
  const navigate = useNavigate()
  const [done, setDone] = useState(false)
  const [orderId, setOrderId] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [bankInfo, setBankInfo] = useState({
    bank_name: '', bank_account: '',
    bank_holder: '', bank_content: 'Tên + SĐT đặt hàng'
  })
  const [form, setForm] = useState({
    customer_name: '', customer_phone: '',
    customer_email: '', customer_address: '',
    customer_city: 'TP. Hồ Chí Minh',
    note: '', payment_method: 'cod',
  })

  const shippingFee = totalPrice >= 500000 ? 0 : 30000
  const grandTotal = totalPrice + shippingFee
  const fmt = p => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(p)

  useEffect(() => {
    // Lấy thông tin ngân hàng từ settings
    supabase.from('settings')
      .select('key, value')
      .in('key', ['bank_name','bank_account','bank_holder','bank_content'])
      .then(({ data }) => {
        if (data) {
          const obj = {}
          data.forEach(r => { obj[r.key] = r.value })
          setBankInfo(prev => ({ ...prev, ...obj }))
        }
      })
  }, [])

  const handleChange = e =>
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!cartItems.length) return toast.error('Giỏ hàng trống!')
    if (!form.customer_name || !form.customer_phone || !form.customer_address)
      return toast.error('Vui lòng điền đầy đủ thông tin!')
    setSubmitting(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      const { data, error } = await supabase.from('orders').insert({
        ...form,
        customer_address: `${form.customer_address}, ${form.customer_city}`,
        user_id: user?.id || null,
        items: cartItems.map(i => ({
          product_id: i.id, product_name: i.name,
          image_url: i.image_url, size: i.size,
          price: i.price, quantity: i.quantity,
          subtotal: i.price * i.quantity,
        })),
        subtotal: totalPrice,
        shipping_fee: shippingFee,
        total_price: grandTotal,
        status: 'pending',
      }).select().single()
      if (error) throw error
      setOrderId(data.id)
      setDone(true)
      clearCart()
    } catch (err) {
      toast.error('Lỗi: ' + err.message)
    } finally {
      setSubmitting(false)
    }
  }

  const copyText = (text) => {
    navigator.clipboard.writeText(text)
    toast.success('Đã copy!')
  }

  // Trang thành công
  if (done) return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-lg p-8 max-w-md w-full text-center">
        <CheckCircle size={64} className="text-green-500 mx-auto mb-4" />
        <h2 className="text-2xl font-bold mb-2">Đặt hàng thành công!</h2>
        <p className="text-gray-400 text-sm mb-2">Mã đơn hàng:</p>
        <div className="bg-gray-100 font-mono text-xs px-4 py-2 rounded-lg mb-4 break-all">
          #{orderId}
        </div>

        {/* Hiển thị thông tin CK nếu chọn chuyển khoản */}
        {form.payment_method === 'bank' && bankInfo.bank_account && (
          <div className="bg-blue-50 border border-blue-200 rounded-2xl p-5 mb-5 text-left">
            <p className="font-bold text-blue-800 mb-3 text-center">
              💳 Thông tin chuyển khoản
            </p>
            <div className="space-y-2 text-sm">
              {[
                { label: 'Ngân hàng', value: bankInfo.bank_name },
                { label: 'Số tài khoản', value: bankInfo.bank_account },
                { label: 'Chủ tài khoản', value: bankInfo.bank_holder },
                { label: 'Số tiền', value: fmt(grandTotal) },
                { label: 'Nội dung CK', value: bankInfo.bank_content },
              ].map(({ label, value }) => value && (
                <div key={label} className="flex justify-between items-center">
                  <span className="text-gray-500">{label}:</span>
                  <div className="flex items-center gap-1">
                    <span className="font-semibold text-gray-800">{value}</span>
                    <button
                      onClick={() => copyText(value)}
                      className="p-1 hover:bg-blue-200 rounded text-blue-500"
                    >
                      <Copy size={12} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-xl text-xs text-yellow-800">
              ⚠️ Đơn hàng sẽ được xác nhận sau khi chúng tôi nhận được chuyển khoản
            </div>
          </div>
        )}

        <p className="text-xs text-gray-400 mb-5">
          Chúng tôi sẽ liên hệ xác nhận trong vòng 24 giờ.
        </p>
        <Link to="/"
          className="block w-full bg-red-600 text-white py-3 rounded-full font-bold hover:bg-red-700 transition-colors">
          Tiếp tục mua sắm
        </Link>
      </div>
    </div>
  )

  if (!cartItems.length) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <ShoppingBag size={64} className="text-gray-200 mx-auto mb-4" />
        <p className="text-xl text-gray-400 mb-4">Giỏ hàng trống</p>
        <Link to="/" className="text-red-600 hover:underline">← Về trang chủ</Link>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8 max-w-5xl">
        <h1 className="text-2xl font-bold text-gray-800 mb-8">Thanh toán</h1>
        <form onSubmit={handleSubmit}>
          <div className="grid md:grid-cols-[1fr_380px] gap-6">
            {/* Form trái */}
            <div className="space-y-5">
              <div className="bg-white rounded-2xl p-6 shadow-sm">
                <h2 className="font-bold text-lg mb-4">Thông tin giao hàng</h2>
                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2">
                    <label className="block text-sm font-medium text-gray-600 mb-1">
                      Họ tên *
                    </label>
                    <input name="customer_name" value={form.customer_name}
                      onChange={handleChange} required placeholder="Nguyễn Văn A"
                      className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-red-500" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-1">
                      Điện thoại *
                    </label>
                    <input name="customer_phone" value={form.customer_phone}
                      onChange={handleChange} required placeholder="0901234567"
                      className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-red-500" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-1">Email</label>
                    <input name="customer_email" type="email" value={form.customer_email}
                      onChange={handleChange} placeholder="email@example.com"
                      className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-red-500" />
                  </div>
                  <div className="col-span-2">
                    <label className="block text-sm font-medium text-gray-600 mb-1">
                      Địa chỉ *
                    </label>
                    <input name="customer_address" value={form.customer_address}
                      onChange={handleChange} required placeholder="Số nhà, tên đường..."
                      className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-red-500" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-1">
                      Thành phố
                    </label>
                    <select name="customer_city" value={form.customer_city}
                      onChange={handleChange}
                      className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm bg-white outline-none focus:border-red-500">
                      {CITIES.map(c => <option key={c}>{c}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-1">
                      Ghi chú
                    </label>
                    <input name="note" value={form.note} onChange={handleChange}
                      placeholder="Giao giờ hành chính..."
                      className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-red-500" />
                  </div>
                </div>
              </div>

              {/* Phương thức TT */}
              <div className="bg-white rounded-2xl p-6 shadow-sm">
                <h2 className="font-bold text-lg mb-4">Phương thức thanh toán</h2>
                <div className="space-y-3">
                  {[
                    { value: 'cod', label: 'Thanh toán khi nhận hàng (COD)', icon: '💵',
                      desc: 'Trả tiền mặt khi nhận hàng' },
                    { value: 'bank', label: 'Chuyển khoản ngân hàng', icon: '🏦',
                      desc: 'Chuyển khoản trước, giao hàng sau khi xác nhận' },
                  ].map(opt => (
                    <label key={opt.value}
                      className={`flex items-start gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all ${
                        form.payment_method === opt.value
                          ? 'border-red-500 bg-red-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}>
                      <input type="radio" name="payment_method" value={opt.value}
                        checked={form.payment_method === opt.value}
                        onChange={handleChange} className="accent-red-600 mt-0.5" />
                      <div>
                        <div className="flex items-center gap-2">
                          <span>{opt.icon}</span>
                          <span className="text-sm font-semibold text-gray-800">{opt.label}</span>
                        </div>
                        <p className="text-xs text-gray-400 mt-0.5">{opt.desc}</p>
                      </div>
                    </label>
                  ))}
                </div>

                {/* Preview thông tin CK */}
                {form.payment_method === 'bank' && bankInfo.bank_account && (
                  <div className="mt-4 bg-blue-50 border border-blue-200 rounded-xl p-4">
                    <p className="text-xs font-bold text-blue-800 mb-2 uppercase tracking-wide">
                      Thông tin tài khoản
                    </p>
                    <div className="space-y-1.5 text-sm">
                      {bankInfo.bank_name && (
                        <p><span className="text-gray-500">Ngân hàng:</span> <strong>{bankInfo.bank_name}</strong></p>
                      )}
                      {bankInfo.bank_account && (
                        <div className="flex items-center gap-2">
                          <span className="text-gray-500">Số TK:</span>
                          <strong>{bankInfo.bank_account}</strong>
                          <button type="button" onClick={() => copyText(bankInfo.bank_account)}
                            className="text-blue-500 hover:text-blue-700">
                            <Copy size={12} />
                          </button>
                        </div>
                      )}
                      {bankInfo.bank_holder && (
                        <p><span className="text-gray-500">Chủ TK:</span> <strong>{bankInfo.bank_holder}</strong></p>
                      )}
                      {bankInfo.bank_content && (
                        <p><span className="text-gray-500">Nội dung:</span> <strong>{bankInfo.bank_content}</strong></p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Tóm tắt đơn */}
            <div className="space-y-4">
              <div className="bg-white rounded-2xl p-6 shadow-sm">
                <h2 className="font-bold text-lg mb-4">
                  Đơn hàng ({cartItems.length})
                </h2>
                <div className="space-y-3 max-h-64 overflow-y-auto">
                  {cartItems.map(item => (
                    <div key={item.key} className="flex gap-3">
                      <div className="relative flex-shrink-0">
                        <img src={item.image_url || '/placeholder.jpg'} alt={item.name}
                          className="w-16 h-16 object-cover rounded-lg border" />
                        <span className="absolute -top-1.5 -right-1.5 bg-gray-600 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                          {item.quantity}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium line-clamp-2">{item.name}</p>
                        <p className="text-xs text-gray-400">
                          Size {item.size}
                        </p>
                        <p className="text-sm text-red-600 font-bold">
                          {fmt(item.price * item.quantity)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="border-t mt-4 pt-4 space-y-2">
                  <div className="flex justify-between text-sm text-gray-500">
                    <span>Tạm tính</span><span>{fmt(totalPrice)}</span>
                  </div>
                  <div className="flex justify-between text-sm text-gray-500">
                    <span>Phí ship</span>
                    <span className={shippingFee === 0 ? 'text-green-500 font-semibold' : ''}>
                      {shippingFee === 0 ? 'MIỄN PHÍ' : fmt(shippingFee)}
                    </span>
                  </div>
                  {totalPrice < 500000 && (
                    <p className="text-xs text-orange-500 bg-orange-50 px-3 py-1.5 rounded-lg">
                      Mua thêm {fmt(500000 - totalPrice)} để miễn phí ship
                    </p>
                  )}
                  <div className="flex justify-between font-bold text-base border-t pt-2">
                    <span>Tổng cộng</span>
                    <span className="text-red-600 text-lg">{fmt(grandTotal)}</span>
                  </div>
                </div>
              </div>

              <button type="submit" disabled={submitting}
                className="w-full bg-red-600 hover:bg-red-700 disabled:bg-gray-300 text-white py-4 rounded-full font-bold text-base transition-colors shadow-lg">
                {submitting ? 'Đang xử lý...'
                  : form.payment_method === 'bank'
                    ? '🏦 Hoàn thành & Chuyển khoản'
                    : '🛍️ Xác nhận đặt hàng'
                }
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}