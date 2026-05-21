// Copy toàn bộ code dưới đây dán vào file: src/components/Navbar.jsx (frontend)
import { useState, useEffect, useRef } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { supabase } from '../supabaseClient'
import { useCart } from '../context/CartContext'
import { ShoppingBag, User, Search, Menu, X, ChevronDown, MapPin, Phone, Clock } from 'lucide-react'
import MarqueeTicker from './Marquee'

const BRAND = '#B71C1C'
const BRAND_DARK = '#7F0000'

const NAV_ITEMS = [
  { label: 'Giày Nữ',      key: 'Giày Nữ',   subs: ['Sandal','Giày Thể Thao','Giày Cao Gót','Giày Búp Bê','Dép'] },
  { label: 'Giày Nam',     key: 'Giày Nam',  subs: ['Sandal','Giày Thể Thao','Giày Tây','Dép'] },
  { label: 'Bé Trai',      key: 'Bé Trai',   subs: ['Giày Thể Thao','Sandal','Dép'] },
  { label: 'Bé Gái',       key: 'Bé Gái',    subs: ['Giày Thể Thao','Sandal','Dép'] },
  { label: 'Phụ Kiện',     key: 'Phụ Kiện',  subs: ['Nón','Balo','Vớ'] },
  { label: '🔥 Flash Sale', key: 'flash-sale', subs: [], isFlashSale: true },
]

const DISTRICTS = [
  'Tất cả','Quận 1','Quận 2','Quận 3','Quận 4','Quận 5','Quận 6',
  'Quận 7','Quận 8','Quận 9','Quận 10','Quận 11','Quận 12',
  'Bình Thạnh','Phú Nhuận','Tân Bình','Tân Phú','Gò Vấp','Thủ Đức',
  'Nhà Bè','Củ Chi','Hóc Môn','Bình Chánh',
]

// ── Modal tìm cửa hàng ──
function StoreFinderModal({ onClose }) {
  const [stores, setStores] = useState([])
  const [district, setDistrict] = useState('Tất cả')
  const [selectedStore, setSelectedStore] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.from('stores').select('*').eq('is_active', true).order('sort_order')
      .then(({ data }) => { setStores(data || []); setLoading(false) })
  }, [])

  const filtered = stores.filter(s =>
    district === 'Tất cả' || s.district === district
  )

  useEffect(() => {
    if (filtered.length > 0 && !selectedStore) {
      setSelectedStore(filtered[Math.floor(Math.random() * filtered.length)])
    }
  }, [filtered.length])

  const mapUrl = selectedStore
    ? `https://www.openstreetmap.org/export/embed.html?bbox=${
        selectedStore.longitude - 0.005},${selectedStore.latitude - 0.005},${
        selectedStore.longitude + 0.005},${selectedStore.latitude + 0.005
      }&layer=mapnik&marker=${selectedStore.latitude},${selectedStore.longitude}`
    : null

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-5xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b flex-shrink-0">
          <div>
            <h2 className="text-xl font-black text-gray-900 uppercase tracking-wide">
              Hệ thống cửa hàng
            </h2>
            <p className="text-sm text-gray-400 mt-0.5">
              {filtered.length} cửa hàng tại TP. Hồ Chí Minh
            </p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full">
            <X size={22} />
          </button>
        </div>

        <div className="flex flex-1 min-h-0">
          {/* Danh sách bên trái */}
          <div className="w-full md:w-[380px] flex flex-col flex-shrink-0 border-r border-gray-100">
            <div className="px-4 py-3 border-b border-gray-100 flex-shrink-0">
              <div className="grid grid-cols-2 gap-2">
                <div className="relative">
                  <select disabled
                    className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm bg-gray-50 text-gray-500 appearance-none outline-none">
                    <option>TP. Hồ Chí Minh</option>
                  </select>
                  <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                </div>
                <div className="relative">
                  <select value={district}
                    onChange={e => { setDistrict(e.target.value); setSelectedStore(null) }}
                    className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm bg-white appearance-none outline-none">
                    {DISTRICTS.map(d => <option key={d}>{d}</option>)}
                  </select>
                  <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                </div>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto">
              {loading ? (
                <div className="text-center py-10 text-gray-400">Đang tải...</div>
              ) : filtered.length === 0 ? (
                <div className="text-center py-10 text-gray-400">
                  <MapPin size={32} className="mx-auto mb-2 opacity-30" />
                  <p className="text-sm">Không có cửa hàng nào</p>
                </div>
              ) : filtered.map(store => (
                <div key={store.id} onClick={() => setSelectedStore(store)}
                  className={`px-4 py-4 cursor-pointer border-b border-gray-50 transition-all border-l-4 ${
                    selectedStore?.id === store.id ? 'bg-red-50' : 'hover:bg-gray-50 border-l-transparent'
                  }`}
                  style={selectedStore?.id === store.id ? { borderLeftColor: BRAND } : {}}>
                  <div className="flex items-start gap-3">
                    <MapPin size={16} className="flex-shrink-0 mt-0.5" style={{ color: BRAND }} />
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-sm text-gray-800">{store.name}</p>
                      <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">{store.address}</p>
                      <div className="flex gap-3 mt-2 flex-wrap">
                        {store.phone && (
                          <span className="flex items-center gap-1 text-xs text-gray-400">
                            <Phone size={11} /> {store.phone}
                          </span>
                        )}
                        <span className="flex items-center gap-1 text-xs text-gray-400">
                          <Clock size={11} /> {store.open_hours}
                        </span>
                      </div>
                      <button
                        className="text-xs font-semibold mt-2 hover:underline"
                        style={{ color: BRAND }}
                        onClick={e => { e.stopPropagation(); setSelectedStore(store) }}>
                        📍 Xem bản đồ
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Bản đồ bên phải */}
          <div className="hidden md:flex flex-1 bg-gray-100 items-center justify-center relative">
            {mapUrl ? (
              <>
                <iframe key={selectedStore?.id} src={mapUrl}
                  className="w-full h-full" style={{ border: 0 }}
                  loading="lazy" title="Bản đồ cửa hàng" />
                <div className="absolute bottom-4 left-4 bg-white rounded-xl shadow-lg px-4 py-3 max-w-[280px]">
                  <p className="font-bold text-sm text-gray-800">{selectedStore?.name}</p>
                  <p className="text-xs text-gray-500 mt-0.5">{selectedStore?.address}</p>
                  {selectedStore?.phone && (
                    <a href={`tel:${selectedStore.phone}`}
                      className="flex items-center gap-1.5 mt-2 text-xs font-semibold text-white px-3 py-1.5 rounded-full w-fit"
                      style={{ backgroundColor: BRAND }}>
                      <Phone size={11} /> {selectedStore.phone}
                    </a>
                  )}
                </div>
              </>
            ) : (
              <div className="text-gray-400 text-center p-8">
                <MapPin size={48} className="mx-auto mb-3 opacity-20" />
                <p className="text-sm">Chọn cửa hàng để xem bản đồ</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Navbar chính ──
export default function Navbar() {
  const { totalItems, setIsCartOpen } = useCart()
  const [menuOpen, setMenuOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [user, setUser] = useState(null)
  const [logoUrl, setLogoUrl] = useState('')
  const [activeDropdown, setActiveDropdown] = useState(null)
  const [mobileExpanded, setMobileExpanded] = useState(null)
  const [showStoreFinder, setShowStoreFinder] = useState(false)
  const [suggestions, setSuggestions] = useState([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [allKeywords, setAllKeywords] = useState([])
  const dropdownRef = useRef(null)
  const searchRef = useRef(null)
  const navigate = useNavigate()

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => setUser(session?.user || null))
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_, session) => setUser(session?.user || null)
    )
    supabase.from('settings').select('value').eq('key', 'logo_url').single()
      .then(({ data }) => { if (data?.value) setLogoUrl(data.value) })
    supabase.from('search_keywords').select('*').eq('is_active', true)
      .then(({ data }) => setAllKeywords(data || []))
    return () => subscription.unsubscribe()
  }, [])

  useEffect(() => {
    const handleClick = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target))
        setActiveDropdown(null)
      if (searchRef.current && !searchRef.current.contains(e.target))
        setShowSuggestions(false)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  // ✅ ĐÃ SỬA: dùng /products?
  const goToCategory = (catKey, sub = null) => {
    const url = sub
      ? `/products?category=${encodeURIComponent(catKey)}&sub=${encodeURIComponent(sub)}`
      : `/products?category=${encodeURIComponent(catKey)}`
    navigate(url)
    setActiveDropdown(null)
    setMenuOpen(false)
  }

  const handleSearchChange = (e) => {
    const val = e.target.value
    setSearchQuery(val)
    if (val.trim().length >= 1) {
      const matched = allKeywords.filter(k =>
        k.keyword.toLowerCase().includes(val.toLowerCase())
      ).slice(0, 6)
      setSuggestions(matched)
      setShowSuggestions(matched.length > 0)
    } else {
      setShowSuggestions(false)
    }
  }

  // ✅ ĐÃ SỬA: dùng /products?
  const handleSearch = (e) => {
    e.preventDefault()
    if (!searchQuery.trim()) return
    const exact = allKeywords.find(k =>
      k.keyword.toLowerCase() === searchQuery.toLowerCase()
    )
    if (exact && exact.category) {
      const url = exact.subcategory
        ? `/products?category=${encodeURIComponent(exact.category)}&sub=${encodeURIComponent(exact.subcategory)}`
        : `/products?category=${encodeURIComponent(exact.category)}`
      navigate(url)
    } else {
      navigate(`/products?search=${encodeURIComponent(searchQuery.trim())}`)
    }
    setShowSuggestions(false)
    setMenuOpen(false)
  }

  // ✅ ĐÃ SỬA: handleSuggestionClick cũng dùng /products? (lỗi bị bỏ sót lần trước)
  const handleSuggestionClick = (kw) => {
    setSearchQuery(kw.keyword)
    setShowSuggestions(false)
    if (kw.category) {
      const url = kw.subcategory
        ? `/products?category=${encodeURIComponent(kw.category)}&sub=${encodeURIComponent(kw.subcategory)}`
        : `/products?category=${encodeURIComponent(kw.category)}`
      navigate(url)
    } else {
      navigate(`/products?search=${encodeURIComponent(kw.keyword)}`)
    }
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    navigate('/')
  }

  return (
    <>
      <header className="sticky top-0 z-50 bg-white shadow-md font-sans">
        {/* ✅ Dùng component import từ Marquee.jsx — KHÔNG định nghĩa lại bên trong */}
        <MarqueeTicker />

        {/* Main bar */}
        <div className="bg-white">
          <div className="container mx-auto px-4">
            <div className="flex items-center h-16 gap-4">

              {/* Logo */}
              <Link to="/" className="flex-shrink-0">
                {logoUrl ? (
                  <img src={logoUrl} alt="Logo"
                    className="h-10 w-auto object-contain max-w-[160px]" />
                ) : (
                  <div className="h-10 w-32 bg-gray-100 rounded-xl flex items-center justify-center border-2 border-dashed border-gray-300">
                    <span className="text-gray-400 text-xs font-semibold tracking-wide">LOGO</span>
                  </div>
                )}
              </Link>

              {/* Nav desktop */}
              <nav className="hidden lg:flex items-center flex-1" ref={dropdownRef}>
                {NAV_ITEMS.map(item => (
                  <div key={item.key} className="relative">
                    <button
                      onMouseEnter={() => item.subs.length > 0 && setActiveDropdown(item.key)}
                      onClick={() => goToCategory(item.key)}
                      className="flex items-center gap-0.5 px-3 py-5 text-sm font-semibold transition-all whitespace-nowrap"
                      style={{
                        color: item.isFlashSale ? BRAND : activeDropdown === item.key ? BRAND : '#1a1a1a',
                        borderBottom: activeDropdown === item.key ? `2px solid ${BRAND}` : '2px solid transparent',
                      }}>
                      {item.label}
                      {item.subs.length > 0 && (
                        <ChevronDown size={13} className="ml-0.5"
                          style={{
                            transform: activeDropdown === item.key ? 'rotate(180deg)' : 'rotate(0)',
                            transition: 'transform 0.2s',
                            color: activeDropdown === item.key ? BRAND : '#666',
                          }} />
                      )}
                    </button>

                    {/* Dropdown — không có header label, không có "Xem tất cả" */}
                    {item.subs.length > 0 && activeDropdown === item.key && (
                      <div
                        onMouseEnter={() => setActiveDropdown(item.key)}
                        onMouseLeave={() => setActiveDropdown(null)}
                        className="absolute top-full left-0 bg-white rounded-2xl shadow-2xl py-2 min-w-[220px] z-50 border border-gray-100">
                        {item.subs.map(sub => (
                          <button key={sub} onClick={() => goToCategory(item.key, sub)}
                            className="w-full text-left px-5 py-3 text-sm text-gray-700 font-medium transition-all"
                            onMouseEnter={e => {
                              e.currentTarget.style.backgroundColor = '#FFF5F5'
                              e.currentTarget.style.color = BRAND
                            }}
                            onMouseLeave={e => {
                              e.currentTarget.style.backgroundColor = ''
                              e.currentTarget.style.color = '#374151'
                            }}>
                            {sub}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </nav>

              <div className="flex-1 hidden lg:block" />

              {/* Search */}
              <div className="hidden md:block relative" ref={searchRef}>
                <form onSubmit={handleSearch}
                  className="flex border border-gray-200 rounded-full overflow-hidden hover:border-gray-400 transition-colors">
                  <input type="text" value={searchQuery} onChange={handleSearchChange}
                    onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
                    placeholder="Tìm kiếm sản phẩm..."
                    className="w-56 lg:w-64 px-4 py-2 text-sm outline-none bg-transparent" />
                  <button type="submit" className="px-4 text-white transition-colors"
                    style={{ backgroundColor: BRAND }}
                    onMouseEnter={e => e.currentTarget.style.backgroundColor = BRAND_DARK}
                    onMouseLeave={e => e.currentTarget.style.backgroundColor = BRAND}>
                    <Search size={15} />
                  </button>
                </form>

                {showSuggestions && suggestions.length > 0 && (
                  <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-2xl shadow-xl z-50 overflow-hidden">
                    {suggestions.map(kw => (
                      <button key={kw.id} onClick={() => handleSuggestionClick(kw)}
                        className="w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-red-50 transition-colors flex items-center justify-between"
                        onMouseEnter={e => e.currentTarget.style.color = BRAND}
                        onMouseLeave={e => e.currentTarget.style.color = '#374151'}>
                        <div className="flex items-center gap-2">
                          <Search size={12} className="text-gray-400" />
                          <span>{kw.keyword}</span>
                        </div>
                        {kw.category && (
                          <span className="text-xs text-gray-400">
                            {kw.subcategory ? `${kw.category} › ${kw.subcategory}` : kw.category}
                          </span>
                        )}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Icons */}
              <div className="flex items-center gap-1">
                {user ? (
                  <div className="hidden md:flex items-center gap-1.5">
                    <span className="text-xs text-gray-500 max-w-[70px] truncate">
                      {user.user_metadata?.full_name || user.email?.split('@')[0]}
                    </span>
                    <button onClick={handleLogout}
                      className="text-xs text-gray-400 hover:text-red-800 transition-colors">
                      Đăng xuất
                    </button>
                  </div>
                ) : (
                  <Link to="/login"
                    className="hidden md:flex p-2 text-gray-600 hover:text-gray-900 transition-colors"
                    title="Đăng nhập">
                    <User size={22} />
                  </Link>
                )}

                <button onClick={() => setIsCartOpen(true)}
                  className="relative p-2 text-gray-600 hover:text-gray-900 transition-colors"
                  title="Giỏ hàng">
                  <ShoppingBag size={22} />
                  {totalItems > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 text-white text-[10px] rounded-full min-w-[18px] min-h-[18px] flex items-center justify-center font-black"
                      style={{ backgroundColor: BRAND }}>
                      {totalItems > 99 ? '99+' : totalItems}
                    </span>
                  )}
                </button>

                <button onClick={() => setShowStoreFinder(true)}
                  className="p-2 text-gray-600 hover:text-gray-900 transition-colors"
                  title="Tìm cửa hàng">
                  <MapPin size={22} />
                </button>

                <button className="lg:hidden p-2 text-gray-600"
                  onClick={() => setMenuOpen(!menuOpen)}>
                  {menuOpen ? <X size={22} /> : <Menu size={22} />}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Mobile menu */}
        {menuOpen && (
          <div className="lg:hidden bg-white border-t shadow-lg max-h-[80vh] overflow-y-auto">
            <form onSubmit={handleSearch} className="px-4 py-3 border-b">
              <div className="flex border border-gray-200 rounded-full overflow-hidden">
                <input type="text" value={searchQuery} onChange={handleSearchChange}
                  placeholder="Tìm kiếm..." className="flex-1 px-4 py-2 text-sm outline-none" />
                <button type="submit" className="px-4 text-white"
                  style={{ backgroundColor: BRAND }}>
                  <Search size={16} />
                </button>
              </div>
            </form>

            <div className="divide-y divide-gray-50">
              {NAV_ITEMS.map(item => (
                <div key={item.key}>
                  <div className="flex">
                    <button onClick={() => goToCategory(item.key)}
                      className="flex-1 text-left px-4 py-3 text-sm font-semibold text-gray-800"
                      style={{ color: item.isFlashSale ? BRAND : '' }}>
                      {item.label}
                    </button>
                    {item.subs.length > 0 && (
                      <button
                        onClick={() => setMobileExpanded(mobileExpanded === item.key ? null : item.key)}
                        className="px-4 text-gray-400">
                        <ChevronDown size={16}
                          style={{ transform: mobileExpanded === item.key ? 'rotate(180deg)' : 'rotate(0)' }} />
                      </button>
                    )}
                  </div>
                  {item.subs.length > 0 && mobileExpanded === item.key && (
                    <div className="bg-gray-50">
                      {item.subs.map(sub => (
                        <button key={sub} onClick={() => goToCategory(item.key, sub)}
                          className="w-full text-left px-8 py-2.5 text-sm text-gray-600 hover:text-red-800 border-b border-gray-100 last:border-0">
                          → {sub}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>

            <div className="px-4 py-3 border-t bg-gray-50 space-y-2">
              <button onClick={() => { setShowStoreFinder(true); setMenuOpen(false) }}
                className="flex items-center gap-2 text-sm text-gray-600 font-medium w-full">
                <MapPin size={16} style={{ color: BRAND }} /> Tìm cửa hàng
              </button>
              {user ? (
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">👤 {user.email}</span>
                  <button onClick={() => { handleLogout(); setMenuOpen(false) }}
                    className="text-sm" style={{ color: BRAND }}>Đăng xuất</button>
                </div>
              ) : (
                <Link to="/login" onClick={() => setMenuOpen(false)}
                  className="flex items-center gap-2 text-sm font-medium"
                  style={{ color: BRAND }}>
                  <User size={18} /> Đăng nhập / Đăng ký
                </Link>
              )}
            </div>
          </div>
        )}
      </header>

      {showStoreFinder && <StoreFinderModal onClose={() => setShowStoreFinder(false)} />}
    </>
  )
}