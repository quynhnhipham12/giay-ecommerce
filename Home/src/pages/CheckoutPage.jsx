// Copy toàn bộ code dưới đây dán vào file: src/pages/CheckoutPage.jsx (frontend)
import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { supabase } from '../supabaseClient'
import { useCart } from '../context/CartContext'
import toast from 'react-hot-toast'

const fmt = n => new Intl.NumberFormat('vi-VN').format(Number(n)||0)
const BRAND = '#B71C1C'

export default function CheckoutPage() {
  const { cartItems, clearCart, user } = useCart()
  const navigate = useNavigate()
  const [bankInfo, setBankInfo]         = useState({})
  const [payMethod, setPayMethod]       = useState('cod')
  const [loading, setLoading]           = useState(false)
  const [form, setForm] = useState({ name:'', phone:'', address:'', city:'', note:'' })

  useEffect(() => {
    if (!user) { navigate('/login'); return }
    if (cartItems.length === 0) { navigate('/'); return }
    supabase.from('settings').select('key, value')
      .in('key', ['bank_name','bank_account','bank_holder','bank_content','bank_qr_url'])
      .then(({ data }) => {
        const map = {}
        ;(data||[]).forEach(r => { map[r.key] = r.value })
        setBankInfo(map)
      })
  }, [user, cartItems])

  const subtotal = cartItems.reduce((s, i) => s + i.price * (i.quantity||1), 0)
  const shipping  = subtotal >= 500000 ? 0 : 30000
  const total     = subtotal + shipping

  const submit = async () => {
    if (!form.name.trim()||!form.phone.trim()||!form.address.trim()) {
      toast.error('Vui lòng điền đầy đủ họ tên, SĐT và địa chỉ'); return
    }
    setLoading(true)
    try {
      const { error } = await supabase.from('orders').insert({
        user_id:          user.id,
        customer_name:    form.name,
        customer_phone:   form.phone,
        customer_address: [form.address, form.city].filter(Boolean).join(', '),
        customer_note:    form.note,
        customer_email:   user.email,
        payment_method:   payMethod,
        items:            cartItems,
        subtotal, shipping_fee: shipping, total,
        status: 'pending',
      })
      if (error) throw error
      clearCart()
      toast.success('Đặt hàng thành công! 🎉')
      navigate('/')
    } catch (err) { toast.error('Lỗi: ' + err.message) }
    finally { setLoading(false) }
  }

  if (!user||cartItems.length===0) return null

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4 max-w-5xl">
        <div className="flex items-center gap-3 mb-6">
          <Link to="/" className="text-gray-400 hover:text-gray-600 text-sm">← Tiếp tục mua sắm</Link>
          <span className="text-gray-300">/</span>
          <h1 className="text-xl font-semibold text-gray-800">Thanh toán</h1>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

          {/* ── LEFT ── */}
          <div className="space-y-5">
            {/* Thông tin nhận hàng */}
            <div className="bg-white rounded-2xl p-5 shadow-sm">
              <h2 className="font-semibold text-base mb-4 text-gray-800">📦 Thông tin nhận hàng</h2>
              <div className="space-y-3">
                {[
                  { key:'name',    ph:'Họ và tên *' },
                  { key:'phone',   ph:'Số điện thoại *' },
                  { key:'address', ph:'Địa chỉ (số nhà, đường, phường/xã) *' },
                  { key:'city',    ph:'Tỉnh / Thành phố' },
                  { key:'note',    ph:'Ghi chú đơn hàng (nếu có)' },
                ].map(({ key, ph }) => (
                  <input key={key} value={form[key]}
                    onChange={e=>setForm(p=>({...p,[key]:e.target.value}))}
                    placeholder={ph}
                    className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-red-700 font-light"/>
                ))}
              </div>
            </div>

            {/* Phương thức thanh toán */}
            <div className="bg-white rounded-2xl p-5 shadow-sm">
              <h2 className="font-semibold text-base mb-4 text-gray-800">💳 Phương thức thanh toán</h2>
              <div className="space-y-3">
                {[
                  { id:'cod',  icon:'🚚', label:'COD — Thanh toán khi nhận hàng', desc:'Trả tiền mặt khi nhận, an toàn tiện lợi' },
                  { id:'bank', icon:'🏦', label:'Chuyển khoản ngân hàng',          desc:'Chuyển trước, giao hàng nhanh hơn' },
                ].map(m => (
                  <label key={m.id} className={`flex items-start gap-3 p-3.5 border-2 rounded-xl cursor-pointer transition-all select-none ${payMethod===m.id?'border-red-700 bg-red-50':'border-gray-200 hover:border-gray-300'}`}>
                    <input type="radio" name="pay" value={m.id} checked={payMethod===m.id}
                      onChange={()=>setPayMethod(m.id)} className="mt-0.5 accent-red-700"/>
                    <div>
                      <p className="font-medium text-sm">{m.icon} {m.label}</p>
                      <p className="text-xs text-gray-400 font-light">{m.desc}</p>
                    </div>
                  </label>
                ))}
              </div>

              {/* ✅ QR + thông tin ngân hàng */}
              {payMethod === 'bank' && (
                <div className="mt-4 p-4 bg-blue-50 border border-blue-100 rounded-xl">
                  {bankInfo.bank_qr_url && (
                    <div className="text-center mb-4">
                      <img src={bankInfo.bank_qr_url} alt="QR chuyển khoản"
                        className="w-44 h-44 object-contain mx-auto rounded-xl border border-blue-200 bg-white p-2 shadow-sm"/>
                      <p className="text-xs text-blue-500 mt-2 font-light">📱 Quét QR để chuyển khoản nhanh</p>
                    </div>
                  )}
                  <div className="space-y-2 text-sm">
                    {[
                      { label:'Ngân hàng', val:bankInfo.bank_name    },
                      { label:'Số TK',     val:bankInfo.bank_account },
                      { label:'Chủ TK',    val:bankInfo.bank_holder  },
                      { label:'Nội dung',  val:bankInfo.bank_content },
                    ].filter(r=>r.val).map(r=>(
                      <div key={r.label} className="flex gap-2">
                        <span className="text-gray-500 w-24 flex-shrink-0 font-light">{r.label}:</span>
                        <span className="font-semibold text-gray-800">{r.val}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* ── RIGHT: Đơn hàng ── */}
          <div>
            <div className="bg-white rounded-2xl p-5 shadow-sm lg:sticky lg:top-4">
              <h2 className="font-semibold text-base mb-4 text-gray-800">🛍️ Đơn hàng ({cartItems.length} sản phẩm)</h2>
              <div className="space-y-3 max-h-64 overflow-y-auto mb-4 pr-1">
                {cartItems.map((item, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <div className="w-14 h-14 rounded-xl overflow-hidden bg-gray-100 flex-shrink-0">
                      {item.image
                        ? <img src={item.image} alt="" className="w-full h-full object-cover"/>
                        : <div className="w-full h-full flex items-center justify-center text-2xl">👟</div>}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-800 truncate">{item.name}</p>
                      <p className="text-xs text-gray-400 font-light">{item.color} · Size {item.size} · x{item.quantity||1}</p>
                    </div>
                    <p className="font-semibold text-sm flex-shrink-0" style={{color:BRAND}}>
                      {fmt(item.price*(item.quantity||1))}đ
                    </p>
                  </div>
                ))}
              </div>

              <div className="border-t pt-3 space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500 font-light">Tạm tính</span>
                  <span className="font-medium">{fmt(subtotal)}đ</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500 font-light">Phí vận chuyển</span>
                  <span className={shipping===0?'text-green-600 font-medium':'font-medium'}>
                    {shipping===0?'Miễn phí':fmt(shipping)+'đ'}
                  </span>
                </div>
                {shipping>0 && (
                  <p className="text-xs text-gray-400 font-light">Miễn phí ship đơn từ 500.000đ</p>
                )}
                <div className="flex justify-between border-t pt-2">
                  <span className="font-semibold text-gray-800">Tổng cộng</span>
                  <span className="font-bold text-lg" style={{color:BRAND}}>{fmt(total)}đ</span>
                </div>
              </div>

              <button onClick={submit} disabled={loading}
                className="w-full mt-5 py-3.5 text-white font-semibold text-sm rounded-2xl flex items-center justify-center gap-2 disabled:opacity-50 transition-all active:scale-98"
                style={{backgroundColor: loading?'#9ca3af':BRAND}}>
                {loading ? 'Đang đặt hàng...' : `Đặt hàng — ${fmt(total)}đ`}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}