// Copy toàn bộ code dưới đây dán vào file: src/pages/MembersPage.jsx (admin)
import { useEffect, useState } from 'react'
import { supabase } from '../supabaseClient'
import { Search } from 'lucide-react'

export default function MembersPage() {
  const [members, setMembers] = useState([])
  const [subscribers, setSubscribers] = useState([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState('members')
  const [search, setSearch] = useState('')

  useEffect(() => {
    Promise.all([
      supabase.from('users').select('*').eq('role', 'customer')
        .order('created_at', { ascending: false }),
      supabase.from('newsletter_subscribers').select('*')
        .order('subscribed_at', { ascending: false }),
    ]).then(([{ data: m }, { data: s }]) => {
      setMembers(m || [])
      setSubscribers(s || [])
      setLoading(false)
    })
  }, [])

  const fmtTime = ts => ts ? new Date(ts).toLocaleString('vi-VN') : '—'

  const filteredMembers = members.filter(m =>
    !search || m.email?.toLowerCase().includes(search.toLowerCase()) ||
    m.full_name?.toLowerCase().includes(search.toLowerCase())
  )
  const filteredSubs = subscribers.filter(s =>
    !search || s.email?.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Thành viên & Đăng ký</h1>
        <p className="text-sm text-gray-400 mt-1">
          Quản lý thành viên đăng ký tài khoản và danh sách nhận bản tin
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-5 bg-gray-100 p-1 rounded-2xl w-fit">
        {[
          { key: 'members',     label: `👤 Thành viên (${members.length})` },
          { key: 'subscribers', label: `📧 Đăng ký bản tin (${subscribers.length})` },
        ].map(t => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
              tab === t.key ? 'bg-white text-gray-800 shadow' : 'text-gray-500 hover:text-gray-700'
            }`}>{t.label}</button>
        ))}
      </div>

      {/* Search */}
      <div className="bg-white rounded-2xl shadow-sm p-4 mb-5 flex items-center gap-3">
        <Search size={16} className="text-gray-400" />
        <input value={search} onChange={e => setSearch(e.target.value)}
          placeholder={tab === 'members' ? 'Tìm theo email hoặc tên...' : 'Tìm theo email...'}
          className="flex-1 text-sm outline-none" />
        {search && (
          <button onClick={() => setSearch('')} className="text-xs text-gray-400 hover:text-gray-600">Xoá</button>
        )}
      </div>

      {loading ? (
        <div className="text-center py-20 text-gray-400">Đang tải...</div>
      ) : tab === 'members' ? (
        // Bảng thành viên
        <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
          {filteredMembers.length === 0 ? (
            <div className="text-center py-16 text-gray-400">
              <div className="text-5xl mb-3">👤</div>
              <p>Chưa có thành viên nào</p>
            </div>
          ) : (
            <table className="w-full">
              <thead className="bg-gray-50 text-xs text-gray-500 uppercase tracking-wide">
                <tr>
                  <th className="px-5 py-3 text-left">#</th>
                  <th className="px-5 py-3 text-left">Email</th>
                  <th className="px-5 py-3 text-left">Họ tên</th>
                  <th className="px-5 py-3 text-left">Đăng ký lúc</th>
                  <th className="px-5 py-3 text-left">Role</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filteredMembers.map((m, idx) => (
                  <tr key={m.id} className="hover:bg-gray-50">
                    <td className="px-5 py-3 text-sm text-gray-400">{idx + 1}</td>
                    <td className="px-5 py-3 text-sm font-medium text-gray-800">{m.email || '—'}</td>
                    <td className="px-5 py-3 text-sm text-gray-600">{m.full_name || '—'}</td>
                    <td className="px-5 py-3 text-sm text-gray-400">{fmtTime(m.created_at)}</td>
                    <td className="px-5 py-3">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                        m.role === 'admin' ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'
                      }`}>{m.role}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      ) : (
        // Bảng subscribers
        <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
          {filteredSubs.length === 0 ? (
            <div className="text-center py-16 text-gray-400">
              <div className="text-5xl mb-3">📧</div>
              <p>Chưa có ai đăng ký nhận bản tin</p>
            </div>
          ) : (
            <table className="w-full">
              <thead className="bg-gray-50 text-xs text-gray-500 uppercase tracking-wide">
                <tr>
                  <th className="px-5 py-3 text-left">#</th>
                  <th className="px-5 py-3 text-left">Email</th>
                  <th className="px-5 py-3 text-left">Đăng ký lúc</th>
                  <th className="px-5 py-3 text-left">Trạng thái</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filteredSubs.map((s, idx) => (
                  <tr key={s.id} className="hover:bg-gray-50">
                    <td className="px-5 py-3 text-sm text-gray-400">{idx + 1}</td>
                    <td className="px-5 py-3 text-sm font-medium text-gray-800">{s.email}</td>
                    <td className="px-5 py-3 text-sm text-gray-400">{fmtTime(s.subscribed_at)}</td>
                    <td className="px-5 py-3">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                        s.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
                      }`}>
                        {s.is_active ? 'Đang đăng ký' : 'Đã huỷ'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  )
}