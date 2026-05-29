// Copy toàn bộ code dưới đây dán vào file: src/pages/ProductDetailPage.jsx (frontend)
import { useEffect, useState } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { supabase } from '../supabaseClient'
import { useCart } from '../context/CartContext'
import { ChevronDown, ChevronUp, MapPin, ShoppingCart, X } from 'lucide-react'
import toast from 'react-hot-toast'

const fmt = n => new Intl.NumberFormat('vi-VN').format(Number(n) || 0)
const BRAND = '#B71C1C'

function Accordion({ title, icon, children, defaultOpen = false }) {
  const [open, setOpen] = useState(defaultOpen)
  return (
    <div className="border-b border-gray-100">
      <button onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between py-4 text-left group">
        <span className="font-semibold text-gray-800 text-sm flex items-center gap-2 group-hover:text-red-800 transition-colors">
          {icon && <span>{icon}</span>}{title}
        </span>
        {open ? <ChevronUp size={17} className="text-gray-400 flex-shrink-0" />
               : <ChevronDown size={17} className="text-gray-400 flex-shrink-0" />}
      </button>
      {open && (
        <div className="pb-4 text-sm text-gray-600 leading-relaxed whitespace-pre-wrap">
          {children}
        </div>
      )}
    </div>
  )
}

function SizeGuideModal({ content, onClose }) {
  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl w-full max-w-lg max-h-[85vh] overflow-y-auto shadow-2xl"
        onClick={e => e.stopPropagation()}>
        <div className="sticky top-0 bg-white flex items-center justify-between px-6 py-4 border-b z-10">
          <h3 className="font-black text-xl">📏 Hướng dẫn chọn size</h3>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-xl"><X size={20} /></button>
        </div>
        <div className="p-6">
          {content
            ? <div className="prose prose-sm max-w-none" dangerouslySetInnerHTML={{ __html: content }} />
            : <p className="text-gray-400 text-center py-8">Cửa hàng chưa cập nhật bảng size. Vui lòng liên hệ để được tư vấn.</p>}
        </div>
      </div>
    </div>
  )
}

export default function ProductDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { addToCart, user } = useCart()

  const [product, setProduct]       = useState(null)
  const [loading, setLoading]       = useState(true)
  const [selectedColor, setSelectedColor] = useState(null)
  const [selectedSize, setSelectedSize]   = useState(null)
  const [qty, setQty]               = useState(1)
  const [activeImg, setActiveImg]   = useState(0)
  const [showSizeGuide, setShowSizeGuide] = useState(false)
  const [sizeGuideContent, setSizeGuideContent] = useState('')

  useEffect(() => {
    setLoading(true)
    setSelectedColor(null); setSelectedSize(null); setActiveImg(0)
    Promise.all([
      supabase.from('products').select('*').eq('id', id).single(),
      supabase.from('settings').select('value').eq('key','size_guide_content').single(),
    ]).then(([{ data: p }, { data: sg }]) => {
      setProduct(p)
      if (p?.colors?.[0]) setSelectedColor(p.colors[0])
      setSizeGuideContent(sg?.value || '')
      setLoading(false)
    })
  }, [id])

  if (loading) return (
    <div className="container mx-auto px-4 py-12 animate-pulse">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="bg-gray-200 rounded-2xl aspect-square" />
        <div className="space-y-4 pt-4">
          {[...Array(5)].map((_,i) => <div key={i} className={`h-${i===0?8:5} bg-gray-200 rounded-xl`} />)}
        </div>
      </div>
    </div>
  )

  if (!product) return (
    <div className="text-center py-24 text-gray-400">
      <div className="text-6xl mb-4">😔</div>
      <p className="text-xl font-medium">Không tìm thấy sản phẩm</p>
      <Link to="/products" className="mt-4 inline-block text-red-700 underline">← Quay lại</Link>
    </div>
  )

  const images       = selectedColor?.images || product.colors?.[0]?.images || []
  const isFlashSale  = product.is_flash_sale && Number(product.flash_sale_price) > 0
  const displayPrice = isFlashSale ? product.flash_sale_price : product.price
  const origPrice    = isFlashSale ? product.price : product.compare_price
  const discountPct  = isFlashSale
    ? Math.round(Number(product.flash_sale_percent) || 0)
    : Number(product.compare_price) > Number(product.price)
      ? Math.round((1 - product.price / product.compare_price) * 100) : 0
  const isSoldOut = Number(product.stock_quantity) === 0
  const nonFreeSizes = (product.sizes || []).filter(s => s !== 'freesize')

  const handleAddToCart = () => {
    if (!user) { toast.error('Vui lòng đăng nhập để mua hàng'); navigate('/login'); return }
    if (nonFreeSizes.length > 0 && !selectedSize) { toast.error('Vui lòng chọn size'); return }
    if (isSoldOut) { toast.error('Sản phẩm đã hết hàng'); return }
    addToCart({
      id: product.id, name: product.name,
      price: Number(displayPrice), originalPrice: Number(product.price),
      image: images[0] || '',
      color: selectedColor?.name || '', colorCode: selectedColor?.colorCode || '',
      size: selectedSize || 'Freesize', brand: product.brand || '',
    }, qty)
    toast.success('Đã thêm vào giỏ hàng! 🛒')
  }

  return (
    <div className="min-h-screen bg-white">
      <div className="container mx-auto px-4 py-6 max-w-6xl">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-sm text-gray-400 mb-6 flex-wrap">
          <Link to="/" className="hover:text-red-800">Trang chủ</Link>
          <span>/</span>
          <Link to={`/products?category=${encodeURIComponent(product.category)}`}
            className="hover:text-red-800">{product.category}</Link>
          {product.subcategory && <><span>/</span>
            <Link to={`/products?category=${encodeURIComponent(product.category)}&sub=${encodeURIComponent(product.subcategory)}`}
              className="hover:text-red-800">{product.subcategory}</Link></>}
          <span>/</span>
          <span className="text-gray-600 line-clamp-1">{product.name}</span>
        </nav>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-14">

          {/* ── LEFT: Gallery ── */}
          <div>
            <div className="relative rounded-2xl overflow-hidden bg-gray-100 aspect-square mb-3">
              {images[activeImg]
                ? <img src={images[activeImg]} alt={product.name} className="w-full h-full object-cover" />
                : <div className="w-full h-full flex items-center justify-center text-gray-200 text-8xl">👟</div>
              }
              {/* Flash sale badge */}
              {isFlashSale && (
                <div className="absolute top-3 left-3 bg-orange-500 text-white text-sm font-black px-3 py-1.5 rounded-full flex items-center gap-1">
                  🔥 -{discountPct}% Flash Sale
                </div>
              )}
              {discountPct > 0 && !isFlashSale && (
                <div className="absolute top-3 left-3 bg-red-600 text-white text-sm font-black px-3 py-1.5 rounded-full">
                  -{discountPct}%
                </div>
              )}
            </div>
            {/* Thumbnails */}
            {images.length > 1 && (
              <div className="flex gap-2 overflow-x-auto pb-1">
                {images.map((img, i) => (
                  <button key={i} onClick={() => setActiveImg(i)}
                    className={`w-16 h-16 rounded-xl overflow-hidden border-2 flex-shrink-0 transition-all ${activeImg===i ? 'border-red-700 shadow-sm' : 'border-transparent hover:border-gray-300'}`}>
                    <img src={img} alt="" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* ── RIGHT: Info ── */}
          <div className="space-y-5">
            {product.brand && (
              <p className="text-xs font-black uppercase tracking-widest text-gray-400">{product.brand}</p>
            )}
            <h1 className="text-2xl md:text-3xl font-black text-gray-900 leading-tight">{product.name}</h1>

            {/* Giá */}
            <div className="space-y-2">
              <div className="flex items-end gap-3 flex-wrap">
                <span className="text-3xl font-black" style={{ color: isFlashSale ? '#f97316' : BRAND }}>
                  {fmt(displayPrice)}đ
                </span>
                {Number(origPrice) > Number(displayPrice) && (
                  <>
                    <span className="text-lg text-gray-400 line-through font-medium">{fmt(origPrice)}đ</span>
                    {discountPct > 0 && (
                      <span className={`px-2.5 py-1 rounded-full text-sm font-black text-white ${isFlashSale ? 'bg-orange-500' : 'bg-red-600'}`}>
                        Tiết kiệm {discountPct}%
                      </span>
                    )}
                  </>
                )}
              </div>
              {isFlashSale && (
                <div className="bg-orange-50 border border-orange-200 rounded-xl px-4 py-2.5 text-sm text-orange-700 font-semibold flex items-center gap-2">
                  🔥 Flash Sale — Ưu đãi có thời hạn!
                </div>
              )}
            </div>

            {/* Màu */}
            {(product.colors || []).length > 0 && (
              <div>
                <p className="text-sm font-semibold text-gray-700 mb-2">
                  Màu sắc: <span className="font-normal text-gray-500">{selectedColor?.name}</span>
                </p>
                <div className="flex gap-2.5 flex-wrap">
                  {product.colors.map(color => (
                    <button key={color.id}
                      onClick={() => { setSelectedColor(color); setActiveImg(0); setSelectedSize(null) }}
                      className={`w-10 h-10 rounded-full border-3 transition-all hover:scale-110 ${selectedColor?.id===color.id ? 'border-red-700 ring-2 ring-red-200 scale-110' : 'border-gray-300'}`}
                      style={{ backgroundColor: color.colorCode || '#ccc', borderWidth: 2 }}
                      title={color.name} />
                  ))}
                </div>
              </div>
            )}

            {/* Size */}
            {nonFreeSizes.length > 0 && (
              <div>
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm font-semibold text-gray-700">
                    Size:{selectedSize && <span style={{ color: BRAND }} className="ml-2 font-black">{selectedSize}</span>}
                  </p>
                  <button onClick={() => setShowSizeGuide(true)}
                    className="text-xs font-semibold flex items-center gap-1 hover:opacity-80"
                    style={{ color: BRAND }}>
                    📏 Hướng dẫn chọn size
                  </button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {nonFreeSizes.map(size => (
                    <button key={size} onClick={() => setSelectedSize(size)}
                      className={`w-12 h-12 rounded-xl border-2 text-sm font-bold transition-all ${selectedSize===size ? 'border-red-700 bg-red-700 text-white shadow-md scale-105' : 'border-gray-200 text-gray-700 hover:border-red-400 hover:text-red-700'}`}>
                      {size}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Quantity + Add to cart */}
            <div className="flex gap-3">
              <div className="flex items-center border-2 border-gray-200 rounded-xl overflow-hidden">
                <button onClick={() => setQty(q => Math.max(1,q-1))}
                  className="w-11 h-12 flex items-center justify-center text-gray-500 hover:bg-gray-50 text-xl font-black">−</button>
                <span className="w-10 text-center font-black text-lg">{qty}</span>
                <button onClick={() => setQty(q => q+1)}
                  className="w-11 h-12 flex items-center justify-center text-gray-500 hover:bg-gray-50 text-xl font-black">+</button>
              </div>
              <button onClick={handleAddToCart} disabled={isSoldOut}
                className="flex-1 py-3 rounded-xl font-black text-white flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all active:scale-95"
                style={{ backgroundColor: isSoldOut ? '#9ca3af' : BRAND }}>
                <ShoppingCart size={20} />
                {isSoldOut ? 'Hết hàng' : 'Thêm vào giỏ'}
              </button>
            </div>

            {/* Store finder button */}
            <button className="w-full flex items-center justify-center gap-2 py-3 border-2 border-gray-200 rounded-xl text-sm font-semibold text-gray-600 hover:border-red-400 hover:text-red-700 transition-all">
              <MapPin size={18} /> Tìm cửa hàng gần bạn
            </button>

            {/* Accordion */}
            <div className="border-t border-gray-100">
              {product.description && (
                <Accordion title="Mô tả sản phẩm" icon="📋" defaultOpen>
                  {product.description}
                </Accordion>
              )}
              {product.material && (
                <Accordion title="Chất liệu" icon="🧵">
                  {product.material}
                </Accordion>
              )}
              <Accordion title="Hướng dẫn chọn size" icon="📏">
                <button onClick={() => setShowSizeGuide(true)}
                  className="text-sm font-semibold underline" style={{ color: BRAND }}>
                  Xem bảng chọn size đầy đủ →
                </button>
              </Accordion>
              {product.warranty && (
                <Accordion title="Bảo hành & Đổi trả" icon="🛡️">
                  {product.warranty}
                </Accordion>
              )}
              {product.delivery_info && (
                <Accordion title="Giao hàng & Thanh toán" icon="🚚">
                  {product.delivery_info}
                </Accordion>
              )}
            </div>
          </div>
        </div>
      </div>

      {showSizeGuide && (
        <SizeGuideModal content={sizeGuideContent} onClose={() => setShowSizeGuide(false)} />
      )}
    </div>
  )
}