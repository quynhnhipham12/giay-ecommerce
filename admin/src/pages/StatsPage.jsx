// Copy toàn bộ code dưới đây dán vào file: src/pages/StatsPage.jsx (admin)
import { useEffect, useState } from 'react'
import { supabase } from '../supabaseClient'
import { X } from 'lucide-react'

export default function StatsPage() {
  const [logs, setLogs] = useState([])
  const [loading, setLoading] = useState(true)
  const [filterYear, setFilterYear]   = useState('')
  const [filterMonth, setFilterMonth] = useState('')
  const [filterDay, setFilterDay]     = useState('')

  const YEARS  = ['2024','2025','2026','2027']
  const MONTHS = ['01','02','03','04','05','06','07','08','09','10','11','12']
  const DAYS   = Array.from({ length: 31 }, (_, i) => String(i + 1).padStart(2, '0'))

  useEffect(() => { fetchLogs() }, [filterYear, filterMonth, filterDay])

  const fetchLogs = async () => {
    setLoading(true)
    let q = supabase.from('logs').select('*')
      .in('action', ['CREATE_PRODUCT', 'UPDATE_PRODUCT'])
      .order('created_at', { ascending: false })

    const now = new Date()
    const year  = filterYear  || String(now.getFullYear())
    const month = filterMonth || null
    const day   = filterDay   || null

    // Xây dựng khoảng thời gian
    let from, to
    if (day && month) {
      from = new Date(`${year}-${month}-${day}T00:00:00`)
      // Từ ngày đó về trước không giới hạn
      to = new Date(`${year}-${month}-${day}T23:59:59`)
      q = q.lte('created_at', to.toISOString())
    } else if (month) {
      // Từ cuối tháng về trước
      const lastDay = new Date(Number(year), Number(month), 0)
      lastDay.setHours(23, 59, 59)
      to = lastDay
      q = q.lte('created_at', to.toISOString())
        .gte('created_at', `${year}-${month}-01T00:00:00`)
    } else {
      // Cả năm: từ ngày hiện tại về đầu năm
      q = q.gte('created_at', `${year}-01-01T00:00:00`)
        .lte('created_at', now.toISOString())
    }

    const { data } = await q.limit(200)
    setLogs(data || [])
    setLoading(false)
  }

  const clearFilters = () => {
    setFilterYear('')
    setFilterMonth('')
    setFilterDay('')
  }

  const fmtTime = ts => ts ? new Date(ts).toLocaleString('vi-VN') : '—'

  const ACTION_STYLE = {
    CREATE_PRODUCT: { label: '➕ Thêm SP', bg: 'bg-green-100 text-green-700' },
    UPDATE_PRODUCT: { label: '✏️ Sửa SP', bg: 'bg-blue-100 text-blue-700' },
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Thống kê Upload sản phẩm</h1>
        <p className="text-sm text-gray-400 mt-1">
          Xem lịch sử thêm/sửa sản phẩm — lọc theo năm, tháng, ngày
        </p>
      </div>

      {/* Bộ lọc thời gian */}
      <div className="bg-white rounded-2xl shadow-sm p-5 mb-5">
        <p className="text-sm font-semibold text-gray-600 mb-3">Lọc theo thời gian</p>
        <div className="flex items-end gap-3 flex-wrap">
          <div>
            <label className="block text-xs text-gray-400 mb-1">Năm</label>
            <select value={filterYear} onChange={e => { setFilterYear(e.target.value); setFilterMonth(''); setFilterDay('') }}
              className="border border-gray-200 rounded-xl px-3 py-2 text-sm bg-white outline-none">
              <option value="">-- Chọn năm --</option>
              {YEARS.map(y => <option key={y}>{y}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs text-gray-400 mb-1">Tháng</label>
            <select value={filterMonth} onChange={e => { setFilterMonth(e.target.value); setFilterDay('') }}
              disabled={!filterYear}
              className="border border-gray-200 rounded-xl px-3 py-2 text-sm bg-white outline-none disabled:opacity-40">
              <option value="">-- Chọn tháng --</option>
              {MONTHS.map(m => <option key={m} value={m}>Tháng {Number(m)}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs text-gray-400 mb-1">Ngày</label>
            <select value={filterDay} onChange={e => setFilterDay(e.target.value)}
              disabled={!filterMonth}
              className="border border-gray-200 rounded-xl px-3 py-2 text-sm bg-white outline-none disabled:opacity-40">
              <option value="">-- Chọn ngày --</option>
              {DAYS.map(d => <option key={d} value={d}>Ngày {Number(d)}</option>)}
            </select>
          </div>

          {(filterYear || filterMonth || filterDay) && (
            <button onClick={clearFilters}
              className="flex items-center gap-1 px-4 py-2 border border-gray-200 rounded-xl text-sm text-gray-500 hover:bg-gray-100">
              <X size={14} /> Bỏ lọc
            </button>
          )}
        </div>

        {/* Filter summary */}
        <p className="text-xs text-gray-400 mt-3">
          {filterDay && filterMonth
            ? `Hiển thị từ ngày ${filterDay}/${filterMonth}/${filterYear || '?'} về trước`
            : filterMonth
              ? `Hiển thị tháng ${Number(filterMonth)}/${filterYear || '?'} (từ cuối tháng về trước)`
              : filterYear
                ? `Hiển thị cả năm ${filterYear}`
                : 'Hiển thị tất cả (mới nhất trước)'
          }
        </p>
      </div>

      {/* Kết quả */}
      {loading ? (
        <div className="text-center py-20 text-gray-400">Đang tải...</div>
      ) : logs.length === 0 ? (
        <div className="bg-white rounded-2xl p-16 text-center text-gray-400 shadow-sm">
          <div className="text-5xl mb-4">📭</div>
          <p>Không có dữ liệu trong khoảng thời gian này</p>
        </div>
      ) : (
        <>
          <p className="text-sm text-gray-500 mb-3 font-medium">
            Tìm thấy <strong>{logs.length}</strong> bản ghi
          </p>
          <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50 text-xs text-gray-500 uppercase tracking-wide">
                <tr>
                  <th className="px-5 py-3 text-left">Thời gian</th>
                  <th className="px-5 py-3 text-left">Hành động</th>
                  <th className="px-5 py-3 text-left">Sản phẩm</th>
                  <th className="px-5 py-3 text-left">Tài khoản thực hiện</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {logs.map(log => {
                  const style = ACTION_STYLE[log.action] || { label: log.action, bg: 'bg-gray-100 text-gray-600' }
                  return (
                    <tr key={log.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-5 py-3 text-sm text-gray-600 whitespace-nowrap">
                        {fmtTime(log.created_at)}
                      </td>
                      <td className="px-5 py-3">
                        <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${style.bg}`}>
                          {style.label}
                        </span>
                      </td>
                      <td className="px-5 py-3 text-sm text-gray-800 font-medium max-w-[250px] truncate">
                        {log.entity_name || '—'}
                      </td>
                      <td className="px-5 py-3 text-sm text-gray-500">
                        {log.admin_email || '—'}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  )
}