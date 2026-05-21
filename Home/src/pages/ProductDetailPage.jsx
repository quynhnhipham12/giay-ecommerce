// Copy toàn bộ code dưới đây dán vào file: src/pages/ProductDetailPage.jsx (frontend)
import { useEffect, useState } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { supabase } from '../supabaseClient'
import { useCart } from '../context/CartContext'
import toast from 'react-hot-toast'
import {
  ShoppingCart, ChevronLeft, Shield, RotateCcw,
  Truck, Tag, Plus, Minus, MapPin, ChevronDown, Phone
} from 'lucide-react'
import ProductCard from '../components/ProductCard'

// Accordion item
function AccordionItem({ title, content, isOpen, onToggle }) {
  return (
    <div className="border-b border-gray-100">
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between py-4 text-left hover:text-red-600 transition-colors"
      >
        <span className="font-semibold text-gray-800">{title}</span>
        <span className="text-xl font-light text-gray-400">{isOpen ? '−' : '+'}</span>
      </button>
      {isOpen && (
        <div
          className="pb-4 text-sm text-gray-600 leading-relaxed prose prose-sm max-w-none
            [&_strong]:font-bold [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:list-decimal [&_ol]:pl-5"
          dangerouslySetInnerHTML={{ __html: content || '<p>Chưa có thông tin</p>' }}
        />
      )}
    </div>
  )
}

// Modal tìm cửa hàng
function StoreModal({ productId, sizes, onClose }) {
  const [stores, setStores] = useState([])
  const [inventory, setInventory] = useState([])
  const [filterDistrict, setFilterDistrict] = useState('Tất cả')
  const [expandedStore, setExpandedStore] = useState(null)
  const [loading, setLoading] = useState(true)

  const DISTRICTS = ['Tất cả','Quận 1','Quận 2','Quận 3','Quận 4','Quận 5',
    'Quận 6','Quận 7','Quận 8','Quận 9','Quận 10','Quận 11','Quận 12',
    'Bình Thạnh','Phú Nhuận','Tân Bình','Gò Vấp','Thủ Đức',
    'Bình Dương','Nhà Bè','Củ Chi','Hóc Môn','Bình Chánh']

  useEffect(() => {
    const load = async () => {
      const [{ data: storeData }, { data: invData }] = await Promise.all([
        supabase.from('stores').select('*').eq('is_active', true).order('sort_order'),
        supabase.from('store_inventory').select('*').eq('product_id', productId).gt('quantity', 0),
      ])
      setStores(storeData || [])
      setInventory(invData || [])
      setLoading(false)
    }
    load()
  }, [productId])

  const getStoreSizes = (storeId) => {
    const items = inventory.filter(i => i.store_id === storeId)
    const sizeMap = {}
    items.forEach(i => {
      const key = i.size
      if (!sizeMap[key]) sizeMap[key] = 0
      sizeMap[key] += i.quantity
    })
    return sizeMap
  }

  const filteredStores = stores.filter(s =>
    filterDistrict === 'Tất cả' || s.district === filterDistrict
  ).filter(s => {
    const inv = inventory.filter(i => i.store_id === s.id)
    return inv.length > 0
  })

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-end md:items-center justify-center">
      <div className="bg-white w-full max-w-lg rounded-t-3xl md:rounded-2xl max-h-[85vh] flex flex-col shadow-2xl">
        <div className="flex items-center justify-between px-5 py-4 border-b">
          <h3 className="font-bold text-gray-800 flex items-center gap-2">
            <MapPin size={18} className="text-red-500" />
            Tìm sản phẩm tại cửa hàng
          </h3>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full text-gray-400">✕</button>
        </div>

        {/* Lọc quận */}
        <div className="px-5 py-3 border-b">
          <p className="text-xs text-gray-400 mb-2 font-medium uppercase tracking-wide">
            Lọc theo quận/huyện — TP. Hồ Chí Minh
          </p>
          <div className="flex gap-2 flex-wrap max-h-20 overflow-y-auto">
            {DISTRICTS.map(d => (
              <button key={d} onClick={() => setFilterDistrict(d)}
                className={`text-xs px-3 py-1 rounded-full border transition-all ${
                  filterDistrict === d
                    ? 'bg-red-600 text-white border-red-600'
                    : 'border-gray-200 text-gray-600 hover:border-red-300'
                }`}>
                {d}
              </button>
            ))}
          </div>
        </div>

        {/* Danh sách cửa hàng */}
        <div className="flex-1 overflow-y-auto px-5 py-3 space-y-3">
          {loading ? (
            <div className="text-center py-8 text-gray-400">Đang tải...</div>
          ) : filteredStores.length === 0 ? (
            <div className="text-center py-8 text-gray-400">
              <MapPin size={32} className="mx-auto mb-2 opacity-30" />
              <p>Không có cửa hàng nào còn hàng</p>
            </div>
          ) : filteredStores.map(store => {
            const sizeMap = getStoreSizes(store.id)
            const isExpanded = expandedStore === store.id
            return (
              <div key={store.id} className="border border-gray-100 rounded-2xl overflow-hidden">
                {/* Store header */}
                <button
                  onClick={() => setExpandedStore(isExpanded ? null : store.id)}
                  className="w-full flex items-start justify-between p-4 hover:bg-gray-50 transition-colors text-left"
                >
                  <div className="flex items-start gap-3">
                    <MapPin size={16} className="text-red-500 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="font-semibold text-gray-800 text-sm">{store.name}</p>
                      <p className="text-xs text-gray-400">{store.address}</p>
                      {/* Sizes có sẵn */}
                      <div className="flex gap-1 mt-2 flex-wrap">
                        {Object.entries(sizeMap).map(([size, qty]) => (
                          <span key={size}
                            className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                              qty > 0
                                ? 'bg-green-100 text-green-700 border border-green-200'
                                : 'bg-red-100 text-red-500 border border-red-200'
                            }`}>
                            {size === 'freesize' ? 'Freesize' : size}
                            {qty > 0
                              ? <span className="ml-1">✓</span>
                              : <span className="ml-1">✕</span>
                            }
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                  <span className="text-gray-400 text-xl font-light flex-shrink-0">
                    {isExpanded ? '−' : '+'}
                  </span>
                </button>

                {/* Expanded */}
                {isExpanded && (
                  <div className="border-t border-gray-100 px-4 pb-4 pt-3 bg-gray-50">
                    <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
                      <span className="font-medium">🕐 Giờ mở cửa:</span>
                      <span>{store.open_hours}</span>
                    </div>
                    {store.phone && (
                      <a href={`tel:${store.phone}`}
                        className="flex items-center gap-2 bg-red-600 text-white text-sm font-semibold px-4 py-2.5 rounded-full w-full justify-center hover:bg-red-700 transition-colors">
                        <Phone size={15} />
                        Gọi điện đặt hàng: {store.phone}
                      </a>
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

export default function ProductDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { addToCart } = useCart()

  const [product, setProduct] = useState(null)
  const [related, setRelated] = useState([])
  const [selectedSize, setSelectedSize] = useState(null)
  const [quantity, setQuantity] = useState(1)
  const [loading, setLoading] = useState(true)
  const [openAccordion, setOpenAccordion] = useState('detail')
  const [showStoreModal, setShowStoreModal] = useState(false)
  const [activeColorIdx, setActiveColorIdx] = useState(0)
  const [activeImageIdx, setActiveImageIdx] = useState(0)

  useEffect(() => {
    fetchProduct()
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }, [id])

  const fetchProduct = async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('products').select('*').eq('id', id).single()

    if (error || !data) { setProduct(null); setLoading(false); return }
    setProduct(data)

    const realSizes = (data.sizes || []).filter(s => s !== 'freesize')
    setSelectedSize(realSizes[0] || null)

    const { data: rel } = await supabase
      .from('products').select('*')
      .eq('category', data.category)
      .eq('is_active', true)
      .neq('id', id).limit(4)
    setRelated(rel || [])
    setLoading(false)
  }

  const fmt = p => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(p)

  const colors = product?.colors || []
  const activeColor = colors[activeColorIdx]
  const images = activeColor?.images?.length > 0
    ? activeColor.images
    : (product?.image_url ? [product.image_url] : [])

  const currentImage = images[activeImageIdx] || images[0]
    || 'https://placehold.co/600x600/f5f5f5/999?text=No+Image'

  const isOutOfStock = product && typeof product.stock === 'number' && product.stock <= 0
  const isFreesize = product?.sizes?.includes('freesize') && product?.sizes?.length === 1
  const displaySizes = (product?.sizes || []).filter(s => s !== 'freesize')
  const discount = product?.original_price && product?.original_price > product?.price
    ? Math.round((1 - product.price / product.original_price) * 100) : 0

  const handleAddToCart = () => {
    if (isOutOfStock) return toast.error('Sản phẩm đã hết hàng!')
    if (!isFreesize && !selectedSize) return toast.error('Vui lòng chọn size!')
    addToCart(
      { ...product, image_url: currentImage },
      isFreesize ? 'Freesize' : selectedSize,
      quantity
    )
    toast.success(`Đã thêm ${quantity} đôi vào giỏ!`)
  }

  const handleBuyNow = () => {
    if (isOutOfStock) return toast.error('Sản phẩm đã hết hàng!')
    if (!isFreesize && !selectedSize) return toast.error('Vui lòng chọn size!')
    addToCart(
      { ...product, image_url: currentImage },
      isFreesize ? 'Freesize' : selectedSize,
      quantity
    )
    navigate('/checkout')
  }

  if (loading) return (
    <div className="container mx-auto px-4 py-10">
      <div className="grid md:grid-cols-2 gap-10 animate-pulse">
        <div className="aspect-square bg-gray-100 rounded-2xl" />
        <div className="space-y-4">
          {[...Array(6)].map((_,i) => (
            <div key={i} className="h-6 bg-gray-100 rounded" style={{ width: `${[40,80,50,100,70,60][i]}%` }} />
          ))}
        </div>
      </div>
    </div>
  )

  if (!product) return (
    <div className="container mx-auto px-4 py-24 text-center">
      <p className="text-2xl text-gray-300 mb-4">Không tìm thấy sản phẩm 😔</p>
      <Link to="/" className="text-red-600 hover:underline flex items-center gap-1 justify-center">
        <ChevronLeft size={18} /> Về trang chủ
      </Link>
    </div>
  )

  return (
    <div className="min-h-screen bg-white">
      <div className="container mx-auto px-4 py-6 md:py-10">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-sm text-gray-400 mb-7 flex-wrap">
          <Link to="/" className="hover:text-red-500">Trang chủ</Link>
          <span>/</span>
          <Link to={`/?category=${encodeURIComponent(product.category)}`}
            className="hover:text-red-500">{product.category}</Link>
          <span>/</span>
          <span className="text-gray-600 line-clamp-1">{product.name}</span>
        </nav>

        <div className="grid md:grid-cols-2 gap-8 lg:gap-14">
          {/* ── Gallery ── */}
          <div className="flex gap-3">
            {/* Thumbnails dọc */}
            {images.length > 1 && (
              <div className="flex flex-col gap-2 w-16 flex-shrink-0 max-h-[520px] overflow-y-auto">
                {images.map((img, idx) => (
                  <button key={idx} onClick={() => setActiveImageIdx(idx)}
                    className={`w-16 h-16 rounded-xl overflow-hidden border-2 flex-shrink-0 transition-all ${
                      activeImageIdx === idx ? 'border-red-500 scale-105' : 'border-gray-200 hover:border-gray-300'
                    }`}>
                    <img src={img} alt={`${idx+1}`} className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}

            {/* Ảnh lớn */}
            <div className="flex-1 relative aspect-square overflow-hidden rounded-2xl bg-gray-50 border border-gray-100">
              <img
                src={currentImage}
                alt={product.name}
                className={`w-full h-full object-cover transition-opacity duration-300 ${
                  isOutOfStock ? 'grayscale opacity-70' : ''
                }`}
              />
              {isOutOfStock && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="bg-gray-800/80 text-white font-bold px-6 py-3 rounded-full text-lg">
                    Hết hàng
                  </span>
                </div>
              )}
              {discount > 0 && !isOutOfStock && (
                <div className="absolute top-4 left-4 bg-red-600 text-white font-bold text-sm px-3 py-1 rounded-full">
                  -{discount}%
                </div>
              )}
            </div>
          </div>

          {/* ── Thông tin ── */}
          <div>
            {product.brand && (
              <p className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-2">
                {product.brand}
              </p>
            )}
            <h1 className="text-2xl md:text-3xl font-black text-gray-900 leading-tight mb-3">
              {product.name}
            </h1>

            {/* SKU */}
            {product.sku && (
              <p className="text-xs text-gray-400 mb-3">SKU: {product.sku}</p>
            )}

            {/* Giá */}
            <div className="flex items-baseline gap-3 mb-5">
              {isOutOfStock ? (
                <span className="text-2xl text-gray-400 font-bold italic">Giá liên hệ</span>
              ) : (
                <>
                  <span className="text-3xl md:text-4xl font-black text-red-600">
                    {fmt(product.price)}
                  </span>
                  {product.original_price && product.original_price > product.price && (
                    <>
                      <span className="text-lg text-gray-400 line-through">
                        {fmt(product.original_price)}
                      </span>
                      <span className="bg-red-50 text-red-600 text-sm font-bold px-2.5 py-1 rounded-full border border-red-200">
                        -{discount}%
                      </span>
                    </>
                  )}
                </>
              )}
            </div>

            {/* Chọn màu */}
            {colors.length > 0 && (
              <div className="mb-5">
                <p className="font-bold text-gray-700 mb-2">
                  Màu sắc: <span className="text-red-600">{colors[activeColorIdx]?.name}</span>
                </p>
                <div className="flex gap-2 flex-wrap">
                  {colors.map((color, idx) => (
                    <button key={idx} onClick={() => { setActiveColorIdx(idx); setActiveImageIdx(0) }}
                      title={color.name}
                      className={`w-9 h-9 rounded-full border-4 transition-all hover:scale-110 ${
                        activeColorIdx === idx
                          ? 'border-red-500 scale-110 shadow-md'
                          : 'border-gray-200'
                      }`}
                      style={{ backgroundColor: color.hex || '#cccccc' }}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Chọn size — ẩn nếu freesize */}
            {!isFreesize && displaySizes.length > 0 && (
              <div className="mb-5">
                <div className="flex items-center justify-between mb-3">
                  <span className="font-bold text-gray-700">
                    Chọn size:
                    {selectedSize && (
                      <span className="ml-2 text-red-600 font-black">{selectedSize}</span>
                    )}
                  </span>
                  <button className="text-xs text-blue-500 hover:underline flex items-center gap-1">
                    <Tag size={11} /> Hướng dẫn chọn size
                  </button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {displaySizes.map(size => (
                    <button key={size} onClick={() => !isOutOfStock && setSelectedSize(size)}
                      disabled={isOutOfStock}
                      className={`w-12 h-12 rounded-xl border-2 text-sm font-bold transition-all ${
                        isOutOfStock
                          ? 'border-gray-100 text-gray-300 cursor-not-allowed'
                          : selectedSize === size
                            ? 'border-red-600 bg-red-600 text-white scale-110 shadow-lg'
                            : 'border-gray-200 text-gray-600 hover:border-red-300 hover:bg-red-50'
                      }`}>
                      {size}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Số lượng */}
            {!isOutOfStock && (
              <div className="flex items-center gap-5 mb-6">
                <span className="font-bold text-gray-700">Số lượng:</span>
                <div className="flex items-center gap-0 border-2 border-gray-200 rounded-xl overflow-hidden">
                  <button onClick={() => setQuantity(q => Math.max(1, q - 1))}
                    className="px-4 py-2.5 text-gray-500 hover:bg-gray-100 transition-colors">
                    <Minus size={16} />
                  </button>
                  <span className="px-5 py-2.5 font-bold text-gray-800 min-w-[50px] text-center border-x border-gray-200">
                    {quantity}
                  </span>
                  <button onClick={() => setQuantity(q => q + 1)}
                    className="px-4 py-2.5 text-gray-500 hover:bg-gray-100 transition-colors">
                    <Plus size={16} />
                  </button>
                </div>
                {typeof product.stock === 'number' && product.stock > 0 && product.stock <= 10 && (
                  <span className="text-xs text-orange-500 font-medium animate-pulse">
                    ⚠️ Chỉ còn {product.stock} sản phẩm!
                  </span>
                )}
              </div>
            )}

            {/* Hết hàng */}
            {isOutOfStock && (
              <div className="mb-6 bg-gray-100 rounded-2xl p-4 text-center">
                <p className="text-gray-500 font-semibold mb-1">Sản phẩm tạm hết hàng</p>
                <p className="text-sm text-gray-400">Sắp có hàng trở lại — Liên hệ để được thông báo</p>
              </div>
            )}

            {/* Buttons */}
            {!isOutOfStock ? (
              <div className="flex gap-3 mb-6">
                <button onClick={handleAddToCart}
                  className="flex-1 flex items-center justify-center gap-2 border-2 border-red-600 text-red-600 hover:bg-red-50 active:scale-95 py-3.5 rounded-full font-bold text-sm transition-all">
                  <ShoppingCart size={18} /> Thêm vào giỏ
                </button>
                <button onClick={handleBuyNow}
                  className="flex-1 bg-red-600 hover:bg-red-700 active:scale-95 text-white py-3.5 rounded-full font-bold text-sm transition-all shadow-md">
                  Mua ngay →
                </button>
              </div>
            ) : (
              <div className="flex gap-3 mb-6">
                <button disabled
                  className="flex-1 border-2 border-gray-200 text-gray-300 py-3.5 rounded-full font-bold text-sm cursor-not-allowed flex items-center justify-center gap-2">
                  <ShoppingCart size={18} /> Thêm vào giỏ
                </button>
                <button disabled
                  className="flex-1 bg-gray-200 text-gray-400 py-3.5 rounded-full font-bold text-sm cursor-not-allowed">
                  Hết hàng
                </button>
              </div>
            )}

            {/* Tìm cửa hàng */}
            <button
              onClick={() => setShowStoreModal(true)}
              className="w-full flex items-center justify-center gap-2 border border-gray-200 hover:border-red-400 hover:bg-red-50 text-gray-600 hover:text-red-600 py-3 rounded-full text-sm font-medium transition-all mb-5"
            >
              <MapPin size={16} /> Tìm sản phẩm tại cửa hàng
            </button>

            {/* Chính sách */}
            <div className="grid grid-cols-2 gap-2">
              {[
                { icon: Truck, text: 'Miễn phí ship từ 500k' },
                { icon: RotateCcw, text: 'Đổi trả trong 30 ngày' },
                { icon: Shield, text: 'Bảo hành 1 năm' },
                { icon: Tag, text: 'Hàng chính hãng 100%' },
              ].map(({ icon: Icon, text }) => (
                <div key={text}
                  className="flex items-center gap-2 bg-gray-50 rounded-xl p-3 text-xs text-gray-500 font-medium">
                  <Icon size={14} className="text-red-500 flex-shrink-0" />
                  {text}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Accordion thông tin */}
        <div className="mt-12 max-w-3xl">
          <AccordionItem
            title="Chi tiết Sản Phẩm"
            content={product.description}
            isOpen={openAccordion === 'detail'}
            onToggle={() => setOpenAccordion(openAccordion === 'detail' ? null : 'detail')}
          />
          <AccordionItem
            title="Bảo Hành & Đổi"
            content={product.warranty_info}
            isOpen={openAccordion === 'warranty'}
            onToggle={() => setOpenAccordion(openAccordion === 'warranty' ? null : 'warranty')}
          />
          <AccordionItem
            title="Thông Tin Giao Nhận"
            content={product.delivery_info}
            isOpen={openAccordion === 'delivery'}
            onToggle={() => setOpenAccordion(openAccordion === 'delivery' ? null : 'delivery')}
          />
        </div>

        {/* Sản phẩm liên quan */}
        {related.length > 0 && (
          <div className="mt-14 md:mt-20">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-black text-gray-800 uppercase">
                Sản phẩm tương tự
              </h2>
              <Link to={`/?category=${encodeURIComponent(product.category)}`}
                className="text-sm text-red-600 hover:underline font-semibold">
                Xem thêm →
              </Link>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {related.map(p => <ProductCard key={p.id} product={p} />)}
            </div>
          </div>
        )}
      </div>

      {/* Store modal */}
      {showStoreModal && (
        <StoreModal
          productId={product.id}
          sizes={product.sizes || []}
          onClose={() => setShowStoreModal(false)}
        />
      )}
    </div>
  )
}