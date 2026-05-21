// Copy toàn bộ code dưới đây dán vào file: src/pages/OrdersPage.jsx (admin)
import { useEffect, useState } from 'react'
import { supabase } from '../supabaseClient'
import toast from 'react-hot-toast'
import { Search, ChevronDown, Mail, Eye, X } from 'lucide-react'
import emailjs from '@emailjs/browser'

// ── Chuyển số thành chữ tiếng Việt ──
function numberToWords(num) {
  if (!num || num === 0) return 'Không'
  const n = Math.round(num)
  const u = ['', 'Một', 'Hai', 'Ba', 'Bốn', 'Năm', 'Sáu', 'Bảy', 'Tám', 'Chín']

  function readHundreds(n) {
    const h = Math.floor(n / 100)
    const t = Math.floor((n % 100) / 10)
    const r = n % 10
    let s = ''
    if (h) s += u[h] + ' Trăm'
    if (t === 0 && r > 0 && h > 0) s += ' Linh ' + (r === 5 && h ? 'Lăm' : u[r])
    else if (t === 1) { s += ' Mười'; if (r === 5) s += ' Lăm'; else if (r) s += ' ' + u[r] }
    else if (t > 1) {
      s += ' ' + u[t] + ' Mươi'
      if (r === 5) s += ' Lăm'; else if (r) s += ' ' + u[r]
    }
    return s.trim()
  }

  const parts = []
  if (Math.floor(n / 1e9)) parts.push(readHundreds(Math.floor(n / 1e9)) + ' Tỷ')
  if (Math.floor((n % 1e9) / 1e6)) parts.push(readHundreds(Math.floor((n % 1e6) / 1e6)) + ' Triệu')
  const mil = Math.floor((n % 1e9) / 1e6)
  if (mil) parts[parts.length > 0 ? parts.length - 1 : 0] = readHundreds(mil) + ' Triệu'

  const b = Math.floor(n / 1e9)
  const m = Math.floor((n % 1e9) / 1e6)
  const k = Math.floor((n % 1e6) / 1e3)
  const r2 = n % 1e3
  const result = []
  if (b) result.push(readHundreds(b) + ' Tỷ')
  if (m) result.push(readHundreds(m) + ' Triệu')
  if (k) result.push(readHundreds(k) + ' Nghìn')
  if (r2) result.push(readHundreds(r2))
  return result.join(' ')
}

// ── Tạo HTML hoá đơn ──
function generateInvoiceHTML(order, invoiceCode, settings) {
  const TAX = 0.08
  const fmt = n => new Intl.NumberFormat('vi-VN').format(Math.round(n))
  const color = settings.invoice_brand_color || '#B71C1C'
  const font  = settings.invoice_font || 'Arial, sans-serif'
  const titleSize = settings.invoice_title_size || '24'
  const bodySize  = settings.invoice_body_size  || '13'
  const titleBold = settings.invoice_title_bold !== 'false'

  const items = (order.items || []).map(item => {
    const totalInc = item.price * item.quantity
    const totalExc = totalInc / (1 + TAX)
    return { ...item, totalExc, taxAmt: totalInc - totalExc }
  })
  const subEx  = items.reduce((s, i) => s + i.totalExc, 0)
  const taxTot = items.reduce((s, i) => s + i.taxAmt, 0)
  const grand  = order.total_price || 0
  const date   = new Date(order.created_at).toLocaleDateString('vi-VN')

  return `
<!DOCTYPE html><html><head><meta charset="UTF-8">
<style>
  * { margin:0; padding:0; box-sizing:border-box; }
  body { font-family:${font}; font-size:${bodySize}px; color:#333; background:#fff; }
  .wrap { max-width:740px; margin:0 auto; padding:40px; }
  .hdr { display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:32px; }
  .co-info { font-size:12px; line-height:1.7; }
  .inv-title { font-size:${titleSize}px; font-weight:${titleBold?'bold':'normal'}; color:${color}; margin:24px 0 8px; }
  .dates { display:flex; gap:48px; margin-bottom:24px; }
  .date-lbl { font-size:11px; font-weight:bold; color:${color}; display:block; margin-bottom:2px; }
  table { width:100%; border-collapse:collapse; margin:16px 0; }
  th { border-bottom:1.5px solid #ddd; padding:8px 6px; text-align:left; font-size:12px; color:#666; font-weight:600; }
  td { padding:9px 6px; font-size:${bodySize}px; border-bottom:1px solid #f2f2f2; }
  .totals { width:280px; margin-left:auto; margin-top:8px; }
  .totals td { border:none; padding:5px 6px; font-size:${bodySize}px; }
  .grand { font-weight:bold; color:${color}; font-size:${Number(bodySize)+2}px; border-top:1.5px solid #ddd !important; }
  .note { font-size:11px; color:#777; margin-top:20px; }
  .words { text-align:right; font-size:11px; color:#777; margin-top:8px; }
</style></head><body>
<div class="wrap">
  <div class="hdr">
    <div style="display:flex;align-items:flex-start;gap:16px">
      ${settings.invoice_logo_url ? `<img src="${settings.invoice_logo_url}" style="height:64px;width:auto;object-fit:contain"/>` : ''}
      <div class="co-info">
        <strong>${settings.invoice_company_name || 'GIÀY GIÁ RẺ'}</strong><br>
        ${settings.invoice_address ? settings.invoice_address + '<br>' : ''}
        ${settings.invoice_tax_id ? 'Tax ID: ' + settings.invoice_tax_id : ''}
      </div>
    </div>
    <div style="text-align:right;font-size:13px">
      <strong>${order.customer_name || ''}</strong><br>
      ${(order.customer_address || '').replace(/,/g, '<br>')}
    </div>
  </div>

  <div class="inv-title">Hóa đơn ${invoiceCode}</div>

  <div class="dates">
    <div><span class="date-lbl">Ngày lập hóa đơn</span>${date}</div>
    <div><span class="date-lbl">Ngày đến hạn</span>${date}</div>
  </div>

  <table>
    <thead><tr>
      <th style="width:42%">Diễn giải</th>
      <th style="text-align:center">Số lượng</th>
      <th style="text-align:right">Đơn giá (chưa VAT)</th>
      <th style="text-align:right">Thuế</th>
      <th style="text-align:right">Số tiền</th>
    </tr></thead>
    <tbody>
      ${items.map(i => `
      <tr>
        <td>${i.product_name || i.name || ''}${i.size ? ' (Size ' + i.size + ')' : ''}</td>
        <td style="text-align:center">${i.quantity}</td>
        <td style="text-align:right">${fmt(i.totalExc / i.quantity)},00</td>
        <td style="text-align:right">8%</td>
        <td style="text-align:right">${fmt(i.totalExc)} đ</td>
      </tr>`).join('')}
    </tbody>
  </table>

  <table class="totals">
    <tr><td>Số tiền trước thuế</td><td style="text-align:right">${fmt(subEx)} đ</td></tr>
    <tr><td>Thuế GTGT 8%</td><td style="text-align:right">${fmt(taxTot)} đ</td></tr>
    ${order.shipping_fee > 0 ? `<tr><td>Phí vận chuyển</td><td style="text-align:right">${fmt(order.shipping_fee)} đ</td></tr>` : ''}
    <tr class="grand"><td><strong>Tổng</strong></td><td style="text-align:right"><strong>${fmt(grand)} đ</strong></td></tr>
  </table>

  <p class="note">Nội dung thanh toán: <strong>${invoiceCode}</strong></p>
  <p class="words">Tổng tiền bằng chữ:<br><em>${numberToWords(grand)} Đồng</em></p>
</div>
</body></html>`
}

// ── Trạng thái đơn hàng ──
const STATUSES = [
  { value: 'all',        label: 'Tất cả' },
  { value: 'pending',    label: 'Chờ xử lý' },
  { value: 'processing', label: 'Đang xử lý' },
  { value: 'shipped',    label: 'Đang giao' },
  { value: 'delivered',  label: 'Đã giao' },
  { value: 'cancelled',  label: 'Đã huỷ' },
]
const STATUS_STYLE = {
  pending:    'bg-yellow-100 text-yellow-700',
  processing: 'bg-blue-100 text-blue-700',
  shipped:    'bg-purple-100 text-purple-700',
  delivered:  'bg-green-100 text-green-700',
  cancelled:  'bg-red-100 text-red-600',
}
// Sau khi confirmed (processing+): chỉ được đi tiếp hoặc huỷ
const ALLOWED_NEXT = {
  pending:    ['pending','processing','cancelled'],
  processing: ['processing','shipped','cancelled'],
  shipped:    ['shipped','delivered','cancelled'],
  delivered:  ['delivered'],
  cancelled:  ['cancelled'],
}

export default function OrdersPage() {
  const [orders, setOrders]         = useState([])
  const [loading, setLoading]       = useState(true)
  const [filterStatus, setFilter]   = useState('all')
  const [searchText, setSearch]     = useState('')
  const [expandedId, setExpanded]   = useState(null)
  const [invoiceSettings, setInvoiceSettings] = useState({})
  const [previewOrder, setPreviewOrder] = useState(null)
  const [sendingEmail, setSendingEmail] = useState(null)

  useEffect(() => {
    supabase.from('settings').select('key,value')
      .in('key', [
        'invoice_logo_url','invoice_company_name','invoice_address','invoice_tax_id',
        'invoice_brand_color','invoice_font','invoice_title_size','invoice_body_size',
        'invoice_title_bold','emailjs_service_id','emailjs_template_id','emailjs_public_key'
      ])
      .then(({ data }) => {
        const map = {}
        ;(data || []).forEach(r => { map[r.key] = r.value })
        setInvoiceSettings(map)
      })
    fetchOrders()
  }, [])

  const fetchOrders = async () => {
    const { data } = await supabase.from('orders').select('*')
      .order('created_at', { ascending: false })
    setOrders(data || [])
    setLoading(false)
  }

  // Lấy số hoá đơn kế tiếp trong ngày
  const getInvoiceCode = async (orderDate) => {
    const d = new Date(orderDate)
    const year    = d.getFullYear()
    const dateKey = d.toISOString().slice(0,10)
    const { data, error } = await supabase.rpc('get_next_invoice_number', { p_date: dateKey })
    if (error) throw error
    const num = String(data).padStart(5, '0')
    return `GIE/${year}/${num}`
  }

  // Cập nhật trạng thái + gửi hoá đơn nếu sang processing
  const updateStatus = async (orderId, newStatus) => {
    const { data: { user } } = await supabase.auth.getUser()
    const adminEmail = user?.email || 'unknown'
    const now = new Date().toISOString()

    await supabase.from('orders').update({
      status: newStatus, updated_at: now,
      confirmed_by: adminEmail, confirmed_at: now,
    }).eq('id', orderId)

    await supabase.from('order_tracking').insert({
      order_id: orderId, status: newStatus,
      confirmed_by: adminEmail, confirmed_at: now,
    })

    setOrders(prev => prev.map(o =>
      o.id === orderId ? { ...o, status: newStatus, confirmed_by: adminEmail } : o
    ))

    // Nếu chuyển sang "Đang xử lý" (processing) → tự động gửi hoá đơn
    if (newStatus === 'processing') {
      const order = orders.find(o => o.id === orderId)
      if (order) await handleSendInvoice(order, true)
    }

    toast.success(`✅ → ${STATUSES.find(s => s.value === newStatus)?.label}`)
  }

  // Hàm này thay thế hoàn toàn handleSendInvoice cũ trong OrdersPage.jsx
const handleSendInvoice = async (order, silent = false) => {
  const customerEmail = order.customer_email
  if (!customerEmail) {
    if (!silent) toast.error('Đơn hàng này không có email khách hàng!')
    return
  }

  const svcId  = invoiceSettings.emailjs_service_id
  const tplId  = invoiceSettings.emailjs_template_id
  const pubKey = invoiceSettings.emailjs_public_key

  if (!svcId || !tplId || !pubKey) {
    if (!silent) toast.error('Chưa điền EmailJS credentials — vào Cài đặt → Hoá đơn & Email')
    return
  }

  setSendingEmail(order.id)
  try {
    let invoiceCode = order.invoice_code
    if (!invoiceCode) {
      const d      = new Date(order.created_at)
      const year   = d.getFullYear()
      const dateKey = d.toISOString().slice(0, 10)
      const { data: counterData, error: counterErr } = await supabase.rpc('get_next_invoice_number', { p_date: dateKey })
      if (counterErr) throw new Error('Không lấy được số hoá đơn: ' + counterErr.message)
      invoiceCode = `GIE/${year}/${String(counterData).padStart(5, '0')}`
      await supabase.from('orders').update({ invoice_code: invoiceCode }).eq('id', order.id)
      setOrders(prev => prev.map(o => o.id === order.id ? { ...o, invoice_code: invoiceCode } : o))
    }

    const invoiceHtml = generateInvoiceHTML(order, invoiceCode, invoiceSettings)

    // ✅ FIX: EmailJS v4 cần { publicKey: key } không phải chuỗi thẳng
    const result = await emailjs.send(
      svcId,
      tplId,
      {
        to_email:     customerEmail,
        to_name:      order.customer_name || 'Khách hàng',
        invoice_code: invoiceCode,
        company_name: invoiceSettings.invoice_company_name || 'Giày Giá Rẻ',
        invoice_html: invoiceHtml,
      },
      { publicKey: pubKey }  // ← đây là điểm khác biệt quan trọng
    )

    console.log('EmailJS result:', result)

    await supabase.from('invoices').upsert({
      order_id: order.id,
      invoice_code: invoiceCode,
      sent_to_email: customerEmail,
      sent_at: new Date().toISOString(),
    }, { onConflict: 'order_id' })

    await supabase.from('orders').update({ invoice_sent: true }).eq('id', order.id)
    setOrders(prev => prev.map(o => o.id === order.id ? { ...o, invoice_sent: true } : o))

    if (!silent) toast.success(`📧 Đã gửi hoá đơn ${invoiceCode} tới ${customerEmail}!`)
  } catch (err) {
    // ✅ FIX: EmailJS throw { status, text } không phải Error object
    const msg = err?.text || err?.message || (typeof err === 'object' ? JSON.stringify(err) : String(err))
    console.error('EmailJS error:', err)
    if (!silent) toast.error('Lỗi gửi email: ' + msg)
  } finally {
    setSendingEmail(null)
  }
}

  const fmt  = p => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(p || 0)
  const fmtT = ts => ts ? new Date(ts).toLocaleString('vi-VN') : '—'

  const filtered = orders.filter(o => {
    const matchStatus = filterStatus === 'all' || o.status === filterStatus
    const s = searchText.toLowerCase()
    return matchStatus && (!s ||
      o.customer_name?.toLowerCase().includes(s) ||
      o.customer_phone?.includes(s) ||
      o.id.toLowerCase().includes(s) ||
      (o.order_code || '').toLowerCase().includes(s)
    )
  })

  const totalRevenue = orders.filter(o => o.status === 'delivered')
    .reduce((sum, o) => sum + (o.total_price || 0), 0)

  return (
    <div>
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Quản lý đơn hàng</h1>
          <p className="text-sm text-gray-400 mt-1">
            {orders.length} đơn · Doanh thu đã giao:{' '}
            <strong className="text-green-600">{fmt(totalRevenue)}</strong>
          </p>
        </div>
      </div>

      {/* Filter */}
      <div className="flex flex-wrap items-center gap-3 mb-5">
        <div className="flex gap-1 flex-wrap">
          {STATUSES.map(s => (
            <button key={s.value} onClick={() => setFilter(s.value)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${
                filterStatus === s.value ? 'text-white border-red-800' : 'bg-white text-gray-500 border-gray-200'
              }`}
              style={filterStatus === s.value ? { backgroundColor: '#B71C1C', borderColor: '#B71C1C' } : {}}>
              {s.label} ({s.value === 'all' ? orders.length : orders.filter(o => o.status === s.value).length})
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-xl px-3 py-2 ml-auto">
          <Search size={14} className="text-gray-400" />
          <input type="text" placeholder="Tên, SĐT, mã đơn..."
            value={searchText} onChange={e => setSearch(e.target.value)}
            className="text-sm outline-none w-52" />
        </div>
      </div>

      {loading ? (
        <div className="text-center py-20 text-gray-400">Đang tải...</div>
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-2xl p-16 text-center shadow-sm text-gray-400">
          Không có đơn hàng nào
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(order => {
            const allowed = ALLOWED_NEXT[order.status] || [order.status]
            return (
              <div key={order.id} className="bg-white rounded-2xl shadow-sm overflow-hidden">
                {/* Header */}
                <div className="flex items-center gap-4 p-5 cursor-pointer hover:bg-gray-50"
                  onClick={() => setExpanded(expandedId === order.id ? null : order.id)}>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <span className="font-mono text-xs font-bold px-2 py-0.5 rounded-lg"
                        style={{ backgroundColor: '#FFF5F5', color: '#B71C1C' }}>
                        {order.order_code || `#${order.id.slice(-8)}`}
                      </span>
                      <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${STATUS_STYLE[order.status] || STATUS_STYLE.pending}`}>
                        {STATUSES.find(s => s.value === order.status)?.label || 'Chờ xử lý'}
                      </span>
                      {order.invoice_sent && (
                        <span className="text-xs bg-green-50 text-green-600 px-2 py-0.5 rounded-full border border-green-200 flex items-center gap-1">
                          <Mail size={10} /> Đã gửi HĐ
                        </span>
                      )}
                      {order.payment_method === 'bank' && (
                        <span className="text-xs bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full border border-blue-200">
                          🏦 Chuyển khoản
                        </span>
                      )}
                    </div>
                    <p className="font-semibold text-gray-800">
                      {order.customer_name}
                      <span className="font-normal text-gray-400 text-sm ml-2">· {order.customer_phone}</span>
                    </p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {fmtT(order.created_at)}
                      {order.confirmed_by && (
                        <span className="ml-2 text-green-600 font-medium">
                          · ✅ {order.confirmed_by}
                        </span>
                      )}
                    </p>
                  </div>

                  <div className="text-right flex-shrink-0">
                    <p className="font-black text-lg" style={{ color: '#B71C1C' }}>{fmt(order.total_price)}</p>
                    <p className="text-xs text-gray-400">{(order.items || []).length} SP</p>
                  </div>

                  {/* Status changer — chỉ cho phép trạng thái hợp lệ */}
                  <div onClick={e => e.stopPropagation()}>
                    <select value={order.status}
                      onChange={e => updateStatus(order.id, e.target.value)}
                      className={`text-xs font-medium px-3 py-2 rounded-xl border cursor-pointer outline-none ${STATUS_STYLE[order.status] || STATUS_STYLE.pending}`}>
                      {STATUSES.filter(s => s.value !== 'all' && allowed.includes(s.value)).map(s => (
                        <option key={s.value} value={s.value}>{s.label}</option>
                      ))}
                    </select>
                  </div>

                  {/* Nút xem + gửi hoá đơn */}
                  <div className="flex gap-1.5 flex-shrink-0" onClick={e => e.stopPropagation()}>
                    <button onClick={() => setPreviewOrder(order)}
                      className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg"
                      title="Xem hoá đơn">
                      <Eye size={17} />
                    </button>
                    <button
                      onClick={() => handleSendInvoice(order)}
                      disabled={sendingEmail === order.id}
                      className="p-2 hover:bg-green-50 rounded-lg"
                      style={{ color: order.invoice_sent ? '#16a34a' : '#6b7280' }}
                      title={order.invoice_sent ? 'Gửi lại hoá đơn' : 'Gửi hoá đơn qua email'}>
                      {sendingEmail === order.id
                        ? <div className="w-4 h-4 border-2 border-t-transparent rounded-full animate-spin" />
                        : <Mail size={17} />
                      }
                    </button>
                  </div>

                  <ChevronDown size={18} className={`text-gray-400 flex-shrink-0 transition-transform ${expandedId === order.id ? 'rotate-180' : ''}`} />
                </div>

                {/* Expanded detail */}
                {expandedId === order.id && (
                  <div className="border-t bg-gray-50 p-5 grid md:grid-cols-2 gap-5">
                    <div>
                      <h4 className="text-sm font-semibold text-gray-600 mb-3">Sản phẩm đã đặt</h4>
                      <div className="space-y-2">
                        {(order.items || []).map((item, i) => (
                          <div key={i} className="flex gap-3 items-center bg-white rounded-xl p-3">
                            <img src={item.image_url || '/placeholder.jpg'} alt={item.product_name}
                              className="w-12 h-12 object-cover rounded-lg border" />
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-gray-800 truncate">{item.product_name}</p>
                              <p className="text-xs text-gray-400">Size {item.size} · SL: {item.quantity}</p>
                            </div>
                            <span className="text-sm font-bold flex-shrink-0" style={{ color: '#B71C1C' }}>
                              {fmt(item.subtotal)}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-3">
                      <div>
                        <h4 className="text-sm font-semibold text-gray-600 mb-2">Thông tin giao hàng</h4>
                        <div className="bg-white rounded-xl p-4 space-y-1.5 text-sm text-gray-600">
                          <p>👤 {order.customer_name}</p>
                          <p>📞 {order.customer_phone}</p>
                          {order.customer_email && <p>📧 {order.customer_email}</p>}
                          <p>📍 {order.customer_address}</p>
                          {order.note && <p>📝 {order.note}</p>}
                          <p>💳 {order.payment_method === 'cod' ? 'COD' : 'Chuyển khoản'}</p>
                        </div>
                      </div>
                      <div className="bg-white rounded-xl p-4 text-sm space-y-1.5">
                        <div className="flex justify-between text-gray-500">
                          <span>Tạm tính</span><span>{fmt(order.subtotal)}</span>
                        </div>
                        <div className="flex justify-between text-gray-500">
                          <span>Phí ship</span>
                          <span className={order.shipping_fee === 0 ? 'text-green-500' : ''}>
                            {order.shipping_fee === 0 ? 'Miễn phí' : fmt(order.shipping_fee)}
                          </span>
                        </div>
                        <div className="flex justify-between font-bold border-t pt-1.5" style={{ color: '#B71C1C' }}>
                          <span>Tổng cộng</span><span>{fmt(order.total_price)}</span>
                        </div>
                      </div>
                      {order.invoice_code && (
                        <div className="bg-green-50 border border-green-200 rounded-xl p-3 text-sm">
                          <p className="font-semibold text-green-700 mb-1">📄 Hoá đơn:</p>
                          <p className="font-mono text-green-800">{order.invoice_code}</p>
                          {order.invoice_sent && <p className="text-xs text-green-600 mt-1">✅ Đã gửi qua email</p>}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* Invoice preview modal */}
      {previewOrder && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl">
            <div className="flex items-center justify-between px-6 py-4 border-b">
              <h3 className="font-bold text-lg">Xem trước hoá đơn</h3>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => handleSendInvoice(previewOrder)}
                  disabled={sendingEmail === previewOrder.id}
                  className="flex items-center gap-2 text-white px-4 py-2 rounded-xl text-sm font-medium"
                  style={{ backgroundColor: '#B71C1C' }}>
                  {sendingEmail === previewOrder.id
                    ? 'Đang gửi...'
                    : <><Mail size={15} /> Gửi qua email</>
                  }
                </button>
                <button onClick={() => setPreviewOrder(null)}
                  className="p-2 hover:bg-gray-100 rounded-full">
                  <X size={20} />
                </button>
              </div>
            </div>
            <div className="flex-1 overflow-y-auto p-4">
              {/* Render invoice inline */}
              <div
                className="border border-gray-200 rounded-xl overflow-hidden"
                dangerouslySetInnerHTML={{
                  __html: generateInvoiceHTML(
                    previewOrder,
                    previewOrder.invoice_code || `GIE/${new Date(previewOrder.created_at).getFullYear()}/XXXXX`,
                    invoiceSettings
                  )
                }}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}