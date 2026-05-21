// Copy toàn bộ code dưới đây dán vào file: src/pages/FilterSettingsPage.jsx (admin)
import { useEffect, useState } from 'react'
import { supabase } from '../supabaseClient'
import toast from 'react-hot-toast'
import { Save, ChevronDown, ChevronRight } from 'lucide-react'

const CATEGORY_MAP = {
  'Giày Nữ':  ['Sandal','Giày Thể Thao','Giày Cao Gót','Giày Búp Bê','Dép'],
  'Giày Nam':  ['Sandal','Giày Thể Thao','Giày Tây','Dép'],
  'Bé Trai':   ['Giày Thể Thao','Sandal','Dép'],
  'Bé Gái':    ['Giày Thể Thao','Sandal','Dép'],
  'Phụ Kiện':  ['Nón','Balo','Vớ'],
}

function FilterToggles({ settings, onChange, brands }) {
  return (
    <div className="space-y-3">
      <div className="flex gap-3 flex-wrap">
        {[
          { key: 'show_price', label: '💰 Lọc giá' },
          { key: 'show_color', label: '🎨 Màu sắc' },
          { key: 'show_size',  label: '📏 Size' },
          { key: 'show_brand', label: '🏷️ Thương hiệu' },
        ].map(({ key, label }) => (
          <label key={key}
            className={`flex items-center gap-2 px-3 py-2 rounded-xl border-2 cursor-pointer text-sm transition-all ${
              settings[key] ? 'border-red-800 bg-red-50 text-red-800 font-semibold' : 'border-gray-200 text-gray-500'
            }`}>
            <input type="checkbox" checked={!!settings[key]}
              onChange={e => onChange({ ...settings, [key]: e.target.checked })}
              className="w-3.5 h-3.5 accent-red-800" />
            {label}
          </label>
        ))}
      </div>
      {settings.show_brand && brands.length > 0 && (
        <div>
          <p className="text-xs text-gray-500 mb-2">Thương hiệu trong bộ lọc <span className="text-gray-400">(bỏ trống = hiện tất cả)</span>:</p>
          <div className="flex flex-wrap gap-2">
            {brands.map(b => (
              <label key={b}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-full border text-xs cursor-pointer transition-all ${
                  (settings.available_brands || []).includes(b) ? 'border-red-800 text-red-800 font-semibold' : 'border-gray-200 text-gray-500'
                }`}>
                <input type="checkbox"
                  checked={(settings.available_brands || []).includes(b)}
                  onChange={() => {
                    const curr = settings.available_brands || []
                    onChange({ ...settings, available_brands: curr.includes(b) ? curr.filter(x => x !== b) : [...curr, b] })
                  }}
                  className="w-3 h-3 accent-red-800" />
                {b}
              </label>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

export default function FilterSettingsPage() {
  const [settings, setSettings] = useState({})
  const [brands, setBrands] = useState([])
  const [saving, setSaving] = useState(null)
  const [loading, setLoading] = useState(true)
  const [expandedSub, setExpandedSub] = useState({}) // { 'Giày Nữ': true/false }

  useEffect(() => {
    Promise.all([
      supabase.from('category_filter_settings').select('*'),
      supabase.from('products').select('brand').eq('is_active', true),
    ]).then(([{ data: s }, { data: p }]) => {
      const map = {}
      ;(s || []).forEach(item => { map[item.category] = item })
      Object.keys(CATEGORY_MAP).forEach(cat => {
        if (!map[cat]) map[cat] = {
          category: cat, show_price: true, show_color: true,
          show_size: true, show_brand: true, available_brands: [],
          subcategory_settings: {},
        }
        if (!map[cat].subcategory_settings) map[cat].subcategory_settings = {}
      })
      setSettings(map)
      setBrands([...new Set((p || []).map(x => x.brand).filter(Boolean))].sort())
      setLoading(false)
    })
  }, [])

  const updateCat = (cat, key, val) => setSettings(prev => ({
    ...prev, [cat]: { ...prev[cat], [key]: val }
  }))

  const updateSubcat = (cat, sub, newSettings) => setSettings(prev => ({
    ...prev,
    [cat]: {
      ...prev[cat],
      subcategory_settings: { ...prev[cat].subcategory_settings, [sub]: newSettings }
    }
  }))

  const save = async (cat) => {
    setSaving(cat)
    const item = settings[cat]
    try {
      const { error } = await supabase.from('category_filter_settings').upsert({
        category: cat,
        show_price: item.show_price, show_color: item.show_color,
        show_size: item.show_size, show_brand: item.show_brand,
        available_brands: item.available_brands || [],
        subcategory_settings: item.subcategory_settings || {},
        updated_at: new Date().toISOString(),
      }, { onConflict: 'category' })
      if (error) throw error
      toast.success(`Đã lưu bộ lọc ${cat}!`)
    } catch (err) {
      toast.error('Lỗi: ' + err.message)
    } finally { setSaving(null) }
  }

  const getSubSettings = (cat, sub) => {
    const sub_settings = settings[cat]?.subcategory_settings?.[sub]
    // Mặc định inherit từ category
    return sub_settings || {
      show_price: settings[cat]?.show_price ?? true,
      show_color: settings[cat]?.show_color ?? true,
      show_size: settings[cat]?.show_size ?? true,
      show_brand: settings[cat]?.show_brand ?? true,
      available_brands: settings[cat]?.available_brands || [],
    }
  }

  if (loading) return <div className="text-center py-20 text-gray-400">Đang tải...</div>

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Cài đặt bộ lọc sản phẩm</h1>
        <p className="text-sm text-gray-400 mt-1">
          Mỗi danh mục và danh mục con có thể có bộ lọc riêng
        </p>
      </div>

      <div className="space-y-4">
        {Object.keys(CATEGORY_MAP).map(cat => {
          const s = settings[cat] || {}
          const subs = CATEGORY_MAP[cat] || []
          const isSubExpanded = expandedSub[cat]

          return (
            <div key={cat} className="bg-white rounded-2xl shadow-sm overflow-hidden">
              {/* Category header */}
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="font-bold text-lg text-gray-800">{cat}</h2>
                  <button onClick={() => save(cat)} disabled={saving === cat}
                    className="flex items-center gap-2 text-white px-5 py-2 rounded-xl text-sm font-semibold"
                    style={{ backgroundColor: saving === cat ? '#9ca3af' : '#B71C1C' }}>
                    {saving === cat ? 'Lưu...' : <><Save size={15} /> Lưu {cat}</>}
                  </button>
                </div>
                <FilterToggles
                  settings={s}
                  onChange={newS => setSettings(prev => ({ ...prev, [cat]: { ...prev[cat], ...newS } }))}
                  brands={brands}
                />
              </div>

              {/* Subcategory settings */}
              {subs.length > 0 && (
                <div className="border-t border-gray-50">
                  <button
                    onClick={() => setExpandedSub(prev => ({ ...prev, [cat]: !prev[cat] }))}
                    className="w-full flex items-center justify-between px-6 py-3 text-sm text-gray-500 hover:bg-gray-50 transition-colors">
                    <span className="font-medium">⚙️ Cài đặt riêng cho từng loại con</span>
                    {isSubExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                  </button>

                  {isSubExpanded && (
                    <div className="px-6 pb-4 space-y-4 bg-gray-50/50">
                      {subs.map(sub => (
                        <div key={sub} className="bg-white rounded-xl p-4 border border-gray-100">
                          <p className="text-sm font-bold text-gray-700 mb-3">
                            📂 {sub}
                            <span className="text-xs text-gray-400 font-normal ml-2">
                              (khi bấm vào "{sub}" trong menu)
                            </span>
                          </p>
                          <FilterToggles
                            settings={getSubSettings(cat, sub)}
                            onChange={newS => updateSubcat(cat, sub, newS)}
                            brands={brands}
                          />
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}