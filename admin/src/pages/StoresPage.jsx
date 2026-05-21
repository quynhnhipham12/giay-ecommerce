// Copy toàn bộ code dưới đây dán vào file: src/pages/StoresPage.jsx (admin)
import { useEffect, useState } from 'react'
import { supabase } from '../supabaseClient'
import toast from 'react-hot-toast'
import { Plus, Pencil, Trash2, X, Loader2, ChevronDown } from 'lucide-react'

const DISTRICTS = ['Quận 1','Quận 2','Quận 3','Quận 4','Quận 5','Quận 6',
  'Quận 7','Quận 8','Quận 9','Quận 10','Quận 11','Quận 12',
  'Bình Thạnh','Phú Nhuận','Tân Bình','Gò Vấp','Thủ Đức',
  'Nhà Bè','Củ Chi','Hóc Môn','Bình Chánh']

const emptyStore = {
  name: '', district: 'Quận 1', address: '',
  phone: '', open_hours: '9:00 - 22:00',
  is_active: true, sort_order: 0,
}

export default function StoresPage() {
  const [stores, setStores] = useState([])
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [showStoreModal, setShowStoreModal] = useState(false)
  const [showInvModal, setShowInvModal] = useState(false)
  const [editStore, setEditStore] = useState(null)
  const [form, setForm] = useState(emptyStore)
  const [saving, setSaving] = useState(false)
  const [selectedStore, setSelectedStore] = useState(null)
  const [inventory, setInventory] = useState([])
  const [invForm, setInvForm] = useState({
    product_id: '', color_name: '', size: '', quantity: 0
  })
  const [allSizes] = useState(['35','36','37','38','39','40','41','42','43','44','45','freesize'])

  useEffect(() => {
    Promise.all([
      supabase.from('stores').select('*').order('sort_order'),
      supabase.from('products').select('id, name, category, sizes, colors').eq('is_active', true).order('name'),
    ]).then(([{ data: s }, { data: p }]) => {
      setStores(s || [])
      setProducts(p || [])
      setLoading(false)
    })
  }, [])

  const openAdd = () => {
    setEditStore(null)
    setForm(emptyStore)
    setShowStoreModal(true)
  }

  const openEdit = (store) => {
    setEditStore(store)
    setForm({ ...store })
    setShowStoreModal(true)
  }

  const handleSaveStore = async () => {
    if (!form.name || !form.address) return toast.error('Vui lòng điền tên và địa chỉ')
    setSaving(true)
    try {
      const payload = { ...form, sort_order: Number(form.sort_order) || 0 }
      if (editStore) {
        const { error } = await supabase.from('stores').update(payload).eq('id', editStore.id)
        if (error) throw error
        setStores(prev => prev.map(s => s.id === editStore.id ? { ...s, ...payload } : s))
        toast.success('Đã cập nhật cửa hàng!')
      } else {
        const { data, error } = await supabase.from('stores').insert(payload).select().single()
        if (error) throw error
        setStores(prev => [...prev, data])
        toast.success('Đã thêm cửa hàng!')
      }
      setShowStoreModal(false)
    } catch (err) {
      toast.error('Lỗi: ' + err.message)
    } finally {
      setSaving(false)
    }
  }

  const handleDeleteStore = async (store) => {
    if (!window.confirm(`Xoá cửa hàng "${store.name}"?`)) return
    await supabase.from('stores').delete().eq('id', store.id)
    setStores(prev => prev.filter(s => s.id !== store.id))
    toast.success('Đã xoá cửa hàng')
  }

  const openInventory = async (store) => {
    setSelectedStore(store)
    const { data } = await supabase.from('store_inventory').select(`
      *, products(name)
    `).eq('store_id', store.id).order('quantity', { ascending: false })
    setInventory(data || [])
    setInvForm({ product_id: '', color_name: '', size: '', quantity: 0 })
    setShowInvModal(true)
  }

  const handleAddInventory = async () => {
    if (!invForm.product_id || !invForm.size) return toast.error('Chọn sản phẩm và size')
    setSaving(true)
    try {
      const { data, error } = await supabase.from('store_inventory').upsert({
        store_id: selectedStore.id,
        product_id: invForm.product_id,
        color_name: invForm.color_name || '',
        size: invForm.size,
        quantity: Number(invForm.quantity) || 0,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'store_id,product_id,color_name,size' }).select(`*, products(name)`).single()
      if (error) throw error
      setInventory(prev => {
        const exists = prev.find(i => i.id === data.id)
        return exists ? prev.map(i => i.id === data.id ? data : i) : [data, ...prev]
      })
      toast.success('Đã cập nhật tồn kho!')
      setInvForm({ product_id: '', color_name: '', size: '', quantity: 0 })
    } catch (err) {
      toast.error('Lỗi: ' + err.message)
    } finally {
      setSaving(false)
    }
  }

  const handleDeleteInv = async (invId) => {
    await supabase.from('store_inventory').delete().eq('id', invId)
    setInventory(prev => prev.filter(i => i.id !== invId))
    toast.success('Đã xoá')
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Quản lý cửa hàng</h1>
          <p className="text-sm text-gray-400 mt-1">{stores.length} cửa hàng</p>
        </div>
        <button onClick={openAdd}
          className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white px-5 py-2.5 rounded-xl font-medium transition-colors">
          <Plus size={18} /> Thêm cửa hàng
        </button>
      </div>

      {/* Danh sách cửa hàng */}
      {loading ? (
        <div className="text-center py-20 text-gray-400">Đang tải...</div>
      ) : (
        <div className="space-y-3">
          {stores.map(store => (
            <div key={store.id} className="bg-white rounded-2xl shadow-sm p-5">
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-bold text-gray-800">{store.name}</h3>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                      store.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
                    }`}>
                      {store.is_active ? 'Đang hoạt động' : 'Tạm đóng'}
                    </span>
                  </div>
                  <p className="text-sm text-gray-500">{store.address}</p>
                  <div className="flex gap-4 mt-1 text-xs text-gray-400">
                    <span>🕐 {store.open_hours}</span>
                    {store.phone && <span>📞 {store.phone}</span>}
                    <span>📍 {store.district}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={() => openInventory(store)}
                    className="px-3 py-1.5 bg-blue-50 text-blue-600 rounded-lg text-xs font-medium hover:bg-blue-100">
                    📦 Tồn kho
                  </button>
                  <button onClick={() => openEdit(store)}
                    className="p-2 text-blue-500 hover:bg-blue-50 rounded-lg">
                    <Pencil size={16} />
                  </button>
                  <button onClick={() => handleDeleteStore(store)}
                    className="p-2 text-red-500 hover:bg-red-50 rounded-lg">
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal cửa hàng */}
      {showStoreModal && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl">
            <div className="flex items-center justify-between px-6 py-4 border-b">
              <h2 className="font-bold text-lg">
                {editStore ? 'Sửa cửa hàng' : 'Thêm cửa hàng'}
              </h2>
              <button onClick={() => setShowStoreModal(false)}
                className="p-2 hover:bg-gray-100 rounded-full"><X size={20} /></button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tên cửa hàng *</label>
                <input value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
                  placeholder="TP.HCM - AEON Mall Tân Phú"
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-red-500" />
              </div>
              <div className="col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                Toạ độ bản đồ
                  <span className="text-gray-400 font-normal ml-1">
                    — Vào Google Maps, click chuột phải vào địa chỉ → copy toạ độ
                  </span>
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <input type="number" step="any" value={form.latitude || ''}
                    onChange={e => setForm(p => ({ ...p, latitude: e.target.value }))}
                    placeholder="10.7769 (Vĩ độ)"
                    className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-red-500" />
                  <input type="number" step="any" value={form.longitude || ''}
                    onChange={e => setForm(p => ({ ...p, longitude: e.target.value }))}
                    placeholder="106.7009 (Kinh độ)"
                    className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-red-500" />
                </div>
                <p className="text-xs text-gray-400 mt-1">
                  Mặc định: 10.7769, 106.7009 (trung tâm TP.HCM)
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Địa chỉ đầy đủ *</label>
                <input value={form.address} onChange={e => setForm(p => ({ ...p, address: e.target.value }))}
                  placeholder="Tầng 1, AEON Mall Tân Phú, 30 Tân Thắng..."
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-red-500" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Giờ mở cửa</label>
                  <input value={form.open_hours} onChange={e => setForm(p => ({ ...p, open_hours: e.target.value }))}
                    placeholder="9:00 - 22:00"
                    className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-red-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Thứ tự</label>
                  <input type="number" value={form.sort_order}
                    onChange={e => setForm(p => ({ ...p, sort_order: e.target.value }))}
                    className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-red-500" />
                </div>
              </div>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={form.is_active}
                  onChange={e => setForm(p => ({ ...p, is_active: e.target.checked }))}
                  className="w-4 h-4 accent-red-600" />
                <span className="text-sm text-gray-700">Đang hoạt động</span>
              </label>
            </div>
            <div className="flex justify-end gap-3 px-6 py-4 border-t bg-gray-50 rounded-b-2xl">
              <button onClick={() => setShowStoreModal(false)}
                className="px-6 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-600">Huỷ</button>
              <button onClick={handleSaveStore} disabled={saving}
                className="flex items-center gap-2 bg-red-600 hover:bg-red-700 disabled:bg-gray-300 text-white px-8 py-2.5 rounded-xl text-sm font-bold">
                {saving ? <><Loader2 size={16} className="animate-spin" /> Lưu...</> : '💾 Lưu'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal tồn kho */}
      {showInvModal && selectedStore && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-start justify-center overflow-y-auto py-6 p-4">
          <div className="bg-white rounded-2xl w-full max-w-2xl shadow-2xl">
            <div className="flex items-center justify-between px-6 py-4 border-b">
              <h2 className="font-bold text-lg">
                📦 Tồn kho — {selectedStore.name}
              </h2>
              <button onClick={() => setShowInvModal(false)}
                className="p-2 hover:bg-gray-100 rounded-full"><X size={20} /></button>
            </div>

            {/* Form thêm tồn kho */}
            <div className="p-5 bg-gray-50 border-b">
              <p className="text-sm font-bold text-gray-700 mb-3">Thêm / Cập nhật tồn kho</p>
              <div className="grid grid-cols-2 gap-3 mb-3">
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Sản phẩm *</label>
                  <select value={invForm.product_id}
                    onChange={e => setInvForm(p => ({ ...p, product_id: e.target.value }))}
                    className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm bg-white outline-none focus:border-red-500">
                    <option value="">-- Chọn sản phẩm --</option>
                    {products.map(p => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Màu</label>
                  <input value={invForm.color_name}
                    onChange={e => setInvForm(p => ({ ...p, color_name: e.target.value }))}
                    placeholder="Đen, Trắng, Kem..."
                    className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-red-500" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Size *</label>
                  <select value={invForm.size}
                    onChange={e => setInvForm(p => ({ ...p, size: e.target.value }))}
                    className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm bg-white outline-none focus:border-red-500">
                    <option value="">-- Chọn size --</option>
                    {allSizes.map(s => (
                      <option key={s} value={s}>{s === 'freesize' ? 'Freesize' : s}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Số lượng *</label>
                  <input type="number" value={invForm.quantity}
                    onChange={e => setInvForm(p => ({ ...p, quantity: e.target.value }))}
                    min="0" placeholder="0"
                    className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-red-500" />
                </div>
              </div>
              <button onClick={handleAddInventory} disabled={saving}
                className="w-full bg-red-600 hover:bg-red-700 disabled:bg-gray-300 text-white py-2.5 rounded-xl text-sm font-bold transition-colors">
                {saving ? 'Đang lưu...' : '+ Thêm / Cập nhật'}
              </button>
            </div>

            {/* Danh sách tồn kho */}
            <div className="max-h-80 overflow-y-auto">
              {inventory.length === 0 ? (
                <p className="text-center py-8 text-gray-400 text-sm">Chưa có tồn kho nào</p>
              ) : inventory.map(inv => (
                <div key={inv.id} className="flex items-center justify-between px-5 py-3 border-b border-gray-50 hover:bg-gray-50">
                  <div>
                    <p className="text-sm font-medium text-gray-800">
                      {inv.products?.name || inv.product_id}
                    </p>
                    <p className="text-xs text-gray-400">
                      {inv.color_name && `Màu: ${inv.color_name} · `}
                      Size: {inv.size === 'freesize' ? 'Freesize' : inv.size}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`font-bold text-sm ${inv.quantity > 0 ? 'text-green-600' : 'text-red-500'}`}>
                      {inv.quantity} cái
                    </span>
                    <button onClick={() => handleDeleteInv(inv.id)}
                      className="p-1.5 text-red-400 hover:bg-red-50 rounded-lg">
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}