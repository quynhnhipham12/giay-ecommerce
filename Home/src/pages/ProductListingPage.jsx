// Copy toàn bộ code dưới đây dán vào file: src/pages/ProductListingPage.jsx (frontend)
import { useEffect, useState, useCallback } from 'react'
import { useSearchParams, Link } from 'react-router-dom'
import { supabase } from '../supabaseClient'
import ProductCard from '../components/ProductCard'
import { SlidersHorizontal, ChevronDown, X } from 'lucide-react'

const BRAND = '#B71C1C'
const PER_PAGE = 10  // ✅ 10 sản phẩm mỗi trang

function PriceInputFilter({ min, max, value, onChange }) {
  const fmt = v => new Intl.NumberFormat('vi-VN').format(v)
  const parse = s => { const n = parseInt(String(s).replace(/\D/g,''),10); return isNaN(n)?0:n }
  const [minT, setMinT] = useState(fmt(value[0]))
  const [maxT, setMaxT] = useState(fmt(value[1]))
  useEffect(() => { setMinT(fmt(value[0])) },[value[0]])
  useEffect(() => { setMaxT(fmt(value[1])) },[value[1]])
  const applyMin = () => { const v = Math.max(min,Math.min(parse(minT),value[1])); onChange([v,value[1]]); setMinT(fmt(v)) }
  const applyMax = () => { const v = Math.min(max,Math.max(parse(maxT),value[0])); onChange([value[0],v]); setMaxT(fmt(v)) }
  const cls = "w-full border border-gray-300 rounded-xl px-3 py-2 text-sm outline-none focus:border-red-800 text-center bg-white"
  return (
    <div>
      <div className="flex items-center gap-2">
        <input value={minT} onChange={e=>setMinT(e.target.value)} onBlur={applyMin} onKeyDown={e=>e.key==='Enter'&&applyMin()} placeholder="0" className={cls}/>
        <span className="text-gray-400 font-medium flex-shrink-0">—</span>
        <input value={maxT} onChange={e=>setMaxT(e.target.value)} onBlur={applyMax} onKeyDown={e=>e.key==='Enter'&&applyMax()} placeholder="Max" className={cls}/>
      </div>
      <p className="text-xs text-gray-400 mt-1 text-center">Nhập giá và Enter để lọc</p>
    </div>
  )
}

function Pagination({ current, total, onChange }) {
  if (total <= 1) return null
  const getPages = () => {
    if (total <= 7) return Array.from({length:total},(_,i)=>i+1)
    if (current <= 4) return [1,2,3,4,5,'…',total]
    if (current >= total-3) return [1,'…',total-4,total-3,total-2,total-1,total]
    return [1,'…',current-1,current,current+1,'…',total]
  }
  return (
    <div className="flex items-center justify-center gap-1 mt-10">
      {current>1&&<button onClick={()=>onChange(current-1)} className="w-10 h-10 flex items-center justify-center rounded-xl text-sm text-gray-500 hover:bg-gray-100">‹</button>}
      {getPages().map((page,i) =>
        page==='…'
          ? <span key={`d${i}`} className="w-10 text-center text-gray-400 text-sm">···</span>
          : <button key={page} onClick={()=>onChange(page)}
              className={`w-10 h-10 rounded-xl text-sm font-medium transition-all ${page===current?'border-2 border-gray-300 font-bold text-gray-800 bg-white shadow-sm':'text-gray-500 hover:bg-gray-100'}`}>
              {page}
            </button>
      )}
      {current<total&&<button onClick={()=>onChange(current+1)} className="w-10 h-10 flex items-center justify-center rounded-xl text-sm text-gray-500 hover:bg-gray-100">›</button>}
    </div>
  )
}

const FilterDivider = () => <div className="border-t border-gray-100 my-1" />

export default function ProductListingPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const category  = searchParams.get('category') || ''
  const sub       = searchParams.get('sub') || ''
  const search    = searchParams.get('search') || ''
  const pageParam = parseInt(searchParams.get('page') || '1', 10)

  const [products, setProducts]         = useState([])
  const [total, setTotal]               = useState(0)
  const [loading, setLoading]           = useState(true)
  const [filterSettings, setFilterSettings] = useState(null)
  const [priceRange, setPriceRange]     = useState([0, 10000000])
  const [maxPrice, setMaxPrice]         = useState(10000000)
  const [selectedColors, setSelectedColors] = useState([])
  const [selectedSizes, setSelectedSizes]   = useState([])
  const [selectedBrands, setSelectedBrands] = useState([])
  const [sortBy, setSortBy]             = useState('newest')
  const [showFilterMobile, setShowFilterMobile] = useState(false)
  // ✅ availableColors giờ là [{name, code}] để hiện ô màu
  const [availableColors, setAvailableColors] = useState([])
  const [availableSizes, setAvailableSizes]   = useState([])
  const [availableBrands, setAvailableBrands] = useState([])

  const currentPage = pageParam || 1
  const totalPages  = Math.ceil(total / PER_PAGE)

  useEffect(() => {
    setSelectedColors([]); setSelectedSizes([]); setSelectedBrands([])
    setSortBy('newest'); setPriceRange([0, 10000000])
    if (category) {
      supabase.from('category_filter_settings').select('*').eq('category', category).single()
        .then(({ data }) => {
          if (!data) return setFilterSettings(null)
          if (sub && data.subcategory_settings?.[sub]) setFilterSettings({ ...data, ...data.subcategory_settings[sub] })
          else setFilterSettings(data)
        })
    }
    loadProducts(1, 'newest')
  }, [category, sub, search])

  useEffect(() => { loadProducts(currentPage) }, [currentPage])

  const getNewestDate = useCallback(async () => {
    const now = new Date(), d7 = new Date(now - 7*24*3600*1000)
    let q = supabase.from('products').select('id', { count:'exact', head:true }).eq('is_active', true).gte('created_at', d7.toISOString())
    if (category) q = q.eq('category', category)
    const { count } = await q
    return count > 0 ? d7 : new Date(now - 30*24*3600*1000)
  }, [category])

  const loadProducts = async (page = 1, sortOverride = null) => {
    const currentSort = sortOverride !== null ? sortOverride : sortBy
    setLoading(true)
    try {
      const offset = (page-1)*PER_PAGE
      let q = supabase.from('products').select('*', { count:'exact' }).eq('is_active', true)
      if (search) q = q.ilike('name', `%${search}%`)
      else if (category) { q = q.eq('category', category); if (sub) q = q.eq('subcategory', sub) }

      if (currentSort === 'newest') {
        const nd = await getNewestDate()
        q = q.gte('created_at', nd.toISOString()).order('created_at', { ascending: false })
      } else if (currentSort === 'price_asc') q = q.order('price', { ascending: true })
      else if (currentSort === 'price_desc') q = q.order('price', { ascending: false })
      else if (currentSort === 'bestseller') q = q.eq('is_best_seller', true).order('created_at', { ascending: false })
      else q = q.order('created_at', { ascending: false })

      q = q.range(offset, offset + PER_PAGE - 1)
      const { data, count } = await q
      const items = data || []
      setProducts(items); setTotal(count || 0)

      if (page === 1 && items.length > 0) {
        // ✅ Extract màu với mã màu
        const colorsMap = new Map()
        const sizes = new Set(), brands = new Set()
        let maxP = 0
        items.forEach(p => {
          if (p.price > maxP) maxP = p.price
          if (p.brand) brands.add(p.brand)
          ;(p.colors || []).forEach(c => {
            if (c.name && !colorsMap.has(c.name)) colorsMap.set(c.name, c.colorCode || '#dddddd')
          })
          ;(p.sizes || []).filter(s => s !== 'freesize').forEach(s => sizes.add(s))
        })
        setAvailableColors([...colorsMap.entries()].map(([name, code]) => ({ name, code })))
        setAvailableSizes([...sizes].sort((a,b)=>Number(a)-Number(b)))
        setAvailableBrands([...brands].sort())
        if (maxP > 0) { setMaxPrice(maxP); setPriceRange([0, maxP]) }
      }
    } finally { setLoading(false) }
  }

  const goToPage = (page) => {
    const next = new URLSearchParams(searchParams)
    next.set('page', String(page))
    setSearchParams(next)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleSortChange = (val) => {
    setSortBy(val); loadProducts(1, val)
  }

  const filteredProducts = products.filter(p => {
    const inPrice = p.price >= priceRange[0] && p.price <= priceRange[1]
    const inColor = selectedColors.length === 0 || (p.colors || []).some(c => selectedColors.includes(c.name))
    const inSize  = selectedSizes.length === 0  || (p.sizes  || []).some(s => selectedSizes.includes(s))
    const inBrand = selectedBrands.length === 0 || selectedBrands.includes(p.brand)
    return inPrice && inColor && inSize && inBrand
  })

  const show = filterSettings || { show_price:true, show_color:true, show_size:true, show_brand:true }

  const SORT_OPTIONS = [
    { value:'newest',    label:'Mới nhất' },
    { value:'bestseller',label:'Nổi bật' },
    { value:'price_asc', label:'Giá thấp → cao' },
    { value:'price_desc',label:'Giá cao → thấp' },
  ]

  const FilterPanel = () => (
    <div className="space-y-0">
      {/* ✅ Bộ lọc màu — hiển thị ô tròn mang mã màu + tooltip */}
      {show.show_color && availableColors.length > 0 && (
        <div className="py-5">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-bold text-sm uppercase tracking-wider text-gray-800">Màu sắc</h3>
            {selectedColors.length>0 && <button onClick={()=>setSelectedColors([])} className="text-xs" style={{color:BRAND}}>Bỏ</button>}
          </div>
          <div className="flex flex-wrap gap-3">
            {availableColors.map(({ name, code }) => (
              <div key={name} className="relative group/col">
                <button
                  onClick={() => setSelectedColors(prev => prev.includes(name) ? prev.filter(x=>x!==name) : [...prev, name])}
                  className={`w-7 h-7 rounded-full border-2 transition-all hover:scale-110 flex-shrink-0 ${
                    selectedColors.includes(name)
                      ? 'border-red-700 scale-110 ring-2 ring-red-200'
                      : 'border-gray-200 hover:border-gray-400'
                  }`}
                  style={{ backgroundColor: code }}
                  title={name}
                />
                {/* Tooltip tên màu */}
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 bg-gray-800 text-white text-[10px] px-2 py-0.5 rounded whitespace-nowrap
                  opacity-0 group-hover/col:opacity-100 transition-opacity pointer-events-none z-20">
                  {name}
                  <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-gray-800" />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
      {show.show_color && availableColors.length>0 && <FilterDivider />}

      {category!=='Phụ Kiện' && show.show_size && availableSizes.length>0 && (
        <div className="py-5">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-bold text-sm uppercase tracking-wider text-gray-800">Size</h3>
            {selectedSizes.length>0 && <button onClick={()=>setSelectedSizes([])} className="text-xs" style={{color:BRAND}}>Bỏ</button>}
          </div>
          <div className="flex flex-wrap gap-2">
            {availableSizes.map(s => (
              <button key={s}
                onClick={() => setSelectedSizes(prev=>prev.includes(s)?prev.filter(x=>x!==s):[...prev,s])}
                className={`w-10 h-10 text-xs border-2 rounded-lg font-medium transition-all ${selectedSizes.includes(s)?'bg-red-700 border-red-700 text-white':'border-gray-200 text-gray-600 hover:border-gray-400'}`}>
                {s}
              </button>
            ))}
          </div>
        </div>
      )}
      {category!=='Phụ Kiện' && show.show_size && availableSizes.length>0 && <FilterDivider />}

      {show.show_price && (
        <div className="py-5">
          <h3 className="font-bold text-sm uppercase tracking-wider text-gray-800 mb-3">Giá</h3>
          <PriceInputFilter min={0} max={maxPrice} value={priceRange} onChange={setPriceRange}/>
        </div>
      )}
      {show.show_price && <FilterDivider />}

      {show.show_brand && availableBrands.length>0 && (
        <div className="py-5">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-bold text-sm uppercase tracking-wider text-gray-800">Thương hiệu</h3>
            {selectedBrands.length>0 && <button onClick={()=>setSelectedBrands([])} className="text-xs" style={{color:BRAND}}>Bỏ</button>}
          </div>
          {availableBrands.map(b => (
            <label key={b} className="flex items-center gap-2 cursor-pointer mb-2">
              <input type="checkbox" checked={selectedBrands.includes(b)}
                onChange={()=>setSelectedBrands(prev=>prev.includes(b)?prev.filter(x=>x!==b):[...prev,b])}
                className="w-4 h-4 accent-red-800"/>
              <span className="text-sm text-gray-700">{b}</span>
            </label>
          ))}
        </div>
      )}

      {(selectedColors.length>0||selectedSizes.length>0||selectedBrands.length>0) && (
        <><FilterDivider />
        <div className="py-4">
          <button onClick={()=>{setSelectedColors([]);setSelectedSizes([]);setSelectedBrands([]);setPriceRange([0,maxPrice])}}
            className="w-full py-2.5 border-2 text-sm font-semibold rounded-xl"
            style={{borderColor:BRAND,color:BRAND}}>
            Xoá tất cả bộ lọc
          </button>
        </div></>
      )}
    </div>
  )

  return (
    <div className="min-h-screen bg-white">
      <div className="container mx-auto px-4 py-5 pb-3">
        <nav className="flex items-center gap-2 text-sm text-gray-400">
          <Link to="/" className="hover:text-red-800">Trang chủ</Link>
          {category && <><span>/</span><span className="text-gray-700">{category}</span></>}
          {sub && <><span>/</span><span className="text-gray-700">{sub}</span></>}
          {search && <><span>/</span><span className="text-gray-700">"{search}"</span></>}
        </nav>
      </div>
      <div className="container mx-auto px-4 pb-16">
        <div className="flex items-start justify-between mb-6">
          <h1 className="text-2xl md:text-3xl font-bold uppercase">
            {search ? `Kết quả: "${search}"` : sub||category||'Tất cả sản phẩm'}
          </h1>
          <span className="text-sm text-gray-400 mt-2">{total} sản phẩm</span>
        </div>
        <div className="flex gap-8">
          <aside className="hidden md:block w-56 flex-shrink-0"><FilterPanel /></aside>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between mb-5 gap-3">
              <button onClick={()=>setShowFilterMobile(true)}
                className="md:hidden flex items-center gap-2 border border-gray-200 px-4 py-2 rounded-xl text-sm text-gray-600">
                <SlidersHorizontal size={16}/> Bộ lọc
              </button>
              <div className="relative ml-auto">
                <select value={sortBy} onChange={e=>handleSortChange(e.target.value)}
                  className="border border-gray-200 rounded-xl px-4 py-2 text-sm bg-white outline-none appearance-none pr-8 cursor-pointer">
                  {SORT_OPTIONS.map(o=><option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
                <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"/>
              </div>
            </div>
            {loading ? (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {[...Array(10)].map((_,i)=><div key={i} className="bg-gray-100 animate-pulse rounded-2xl aspect-square"/>)}
              </div>
            ) : filteredProducts.length===0 ? (
              <div className="text-center py-24 text-gray-400">
                <div className="text-6xl mb-4">😔</div>
                <p className="text-xl font-medium">Không tìm thấy sản phẩm</p>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {filteredProducts.map(p=><ProductCard key={p.id} product={p}/>)}
                </div>
                <div className="mt-6 flex flex-col items-center gap-1">
                  <p className="text-sm text-gray-400">
                    Trang {currentPage}/{totalPages} — {(currentPage-1)*PER_PAGE+1}–{Math.min(currentPage*PER_PAGE,total)} trong {total} sản phẩm
                  </p>
                  <Pagination current={currentPage} total={totalPages} onChange={goToPage}/>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
      {showFilterMobile && (
        <>
          <div className="fixed inset-0 bg-black/50 z-40" onClick={()=>setShowFilterMobile(false)}/>
          <div className="fixed left-0 top-0 h-full w-80 bg-white z-50 overflow-y-auto p-6 shadow-2xl">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-bold text-lg">Bộ lọc</h3>
              <button onClick={()=>setShowFilterMobile(false)}><X size={22}/></button>
            </div>
            <FilterPanel/>
          </div>
        </>
      )}
    </div>
  )
}