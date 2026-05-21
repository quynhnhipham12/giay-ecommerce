import { useEffect, useState } from 'react'
import { supabase } from '../supabaseClient'
import { Package, ShoppingBag, Users, TrendingUp, Clock } from 'lucide-react'

function StatCard({ title, value, subtitle, icon: Icon, color }) {
  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm flex items-start justify-between">
      <div>
        <p className="text-sm text-gray-400 mb-1">{title}</p>
        <p className="text-3xl font-black text-gray-800">{value}</p>
        <p className="text-xs text-gray-400 mt-1">{subtitle}</p>
      </div>
      <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${color}`}>
        <Icon size={22} className="text-white" />
      </div>
    </div>
  )
}

const STATUS_CONFIG = {
  pending:    { label: 'Chờ xử lý',  color: 'bg-yellow-100 text-yellow-700' },
  processing: { label: 'Đang xử lý', color: 'bg-blue-100 text-blue-700' },
  shipped:    { label: 'Đang giao',   color: 'bg-purple-100 text-purple-700' },
  delivered:  { label: 'Đã giao',    color: 'bg-green-100 text-green-700' },
  cancelled:  { label: 'Đã huỷ',     color: 'bg-red-100 text-red-600' },
}

export default function Dashboard() {
  const [stats, setStats] = useState({ products: 0, orders: 0, users: 0, revenue: 0 })
  const [recentOrders, setRecentOrders] = useState([])
  const [recentLogs, setRecentLogs] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => { loadAll() }, [])

  const loadAll = async () => {
    const [
      { count: productCount },
      { count: orderCount },
      { count: userCount },
      { data: deliveredOrders },
      { data: orders },
      { data: logs },
    ] = await Promise.all([
      supabase.from('products').select('*', { count: 'exact', head: true }),
      supabase.from('orders').select('*', { count: 'exact', head: true }),
      supabase.from('users').select('*', { count: 'exact', head: true }),
      supabase.from('orders').select('total_price').eq('status', 'delivered'),
      supabase.from('orders').select('*').order('created_at', { ascending: false }).limit(8),
      supabase.from('logs').select('*').order('created_at', { ascending: false }).limit(6),
    ])

    const revenue = (deliveredOrders || []).reduce((s, o) => s + (o.total_price || 0), 0)
    setStats({ products: productCount || 0, orders: orderCount || 0, users: userCount || 0, revenue })
    setRecentOrders(orders || [])
    setRecentLogs(logs || [])
    setLoading(false)
  }

  const fmt = p => new Intl.NumberFormat('vi-VN',{style:'currency',currency:'VND'}).format(p)
  const fmtTime = ts => ts ? new Date(ts).toLocaleString('vi-VN') : '—'

  const LOG_ICONS = {
    CREATE_PRODUCT: '➕', UPDATE_PRODUCT: '✏️', DELETE_PRODUCT: '🗑️', UPDATE_ORDER: '📦'
  }

  if (loading) return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
      {[...Array(4)].map((_,i) => (
        <div key={i} className="bg-white rounded-2xl p-6 h-28 animate-pulse" />
      ))}
    </div>
  )

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-800">Tổng quan</h1>
        <p className="text-gray-400 text-sm mt-1">
          Cập nhật lúc {new Date().toLocaleString('vi-VN')}
        </p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard title="Sản phẩm" value={stats.products} subtitle="Đang bán" icon={Package} color="bg-blue-500" />
        <StatCard title="Đơn hàng" value={stats.orders} subtitle="Tổng tất cả" icon={ShoppingBag} color="bg-orange-500" />
        <StatCard title="Khách hàng" value={stats.users} subtitle="Đã đăng ký" icon={Users} color="bg-purple-500" />
        <StatCard title="Doanh thu" value={stats.revenue > 0 ? fmt(stats.revenue) : '0đ'}
          subtitle="Đơn đã giao" icon={TrendingUp} color="bg-green-500" />
      </div>

      <div className="grid md:grid-cols-[1fr_320px] gap-5">
        {/* Đơn hàng gần đây */}
        <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b flex items-center justify-between">
            <h2 className="font-bold text-gray-800">Đơn hàng gần đây</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-xs text-gray-400 uppercase">
                <tr>
                  <th className="px-5 py-3 text-left">Khách hàng</th>
                  <th className="px-5 py-3 text-right">Giá trị</th>
                  <th className="px-5 py-3 text-center">Trạng thái</th>
                  <th className="px-5 py-3 text-right">Thời gian</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {recentOrders.map(order => {
                  const st = STATUS_CONFIG[order.status] || STATUS_CONFIG.pending
                  return (
                    <tr key={order.id} className="hover:bg-gray-50">
                      <td className="px-5 py-3">
                        <p className="font-medium">{order.customer_name}</p>
                        <p className="text-xs text-gray-400">{order.customer_phone}</p>
                      </td>
                      <td className="px-5 py-3 text-right font-bold text-red-600">
                        {fmt(order.total_price || 0)}
                      </td>
                      <td className="px-5 py-3 text-center">
                        <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${st.color}`}>
                          {st.label}
                        </span>
                      </td>
                      <td className="px-5 py-3 text-right text-xs text-gray-400">
                        {fmtTime(order.created_at)}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Activity logs */}
        <div className="bg-white rounded-2xl shadow-sm">
          <div className="px-5 py-4 border-b flex items-center gap-2">
            <Clock size={16} className="text-gray-400" />
            <h2 className="font-bold text-gray-800">Lịch sử hoạt động</h2>
          </div>
          <div className="p-4 space-y-3">
            {recentLogs.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-6">Chưa có hoạt động</p>
            ) : recentLogs.map(log => (
              <div key={log.id} className="flex gap-3 items-start p-3 bg-gray-50 rounded-xl">
                <span className="text-base flex-shrink-0">{LOG_ICONS[log.action] || '📝'}</span>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-semibold text-gray-700 truncate">
                    {log.action.replace('_', ' ')}: {log.entity_name}
                  </p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {log.admin_email} · {fmtTime(log.created_at)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}