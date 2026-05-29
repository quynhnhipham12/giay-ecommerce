// Copy toàn bộ code dưới đây dán vào file: src/components/ProductCard.jsx (frontend)
import { Link } from 'react-router-dom'

const fmt = n => new Intl.NumberFormat('vi-VN').format(Number(n) || 0)
const BRAND = '#B71C1C'

export default function ProductCard({ product }) {
  const thumb = product.colors?.[0]?.images?.[0] || ''
  const isSoldOut  = Number(product.stock_quantity) === 0
  const isFlashSale = product.is_flash_sale && Number(product.flash_sale_price) > 0

  const displayPrice  = isFlashSale ? product.flash_sale_price : product.price
  const originalPrice = isFlashSale ? product.price : product.compare_price

  const discountPct = isFlashSale
    ? Math.round(Number(product.flash_sale_percent) || 0)
    : product.compare_price > product.price
      ? Math.round((1 - product.price / product.compare_price) * 100)
      : 0

  return (
    <Link to={`/product/${product.id}`} className="block group cursor-pointer">
      {/* Ảnh */}
      <div className="relative rounded-2xl overflow-hidden bg-gray-100 aspect-square mb-3">
        {thumb ? (
          <img src={thumb} alt={product.name}
            className={`w-full h-full object-cover transition-transform duration-500 group-hover:scale-105 ${isSoldOut ? 'grayscale opacity-60' : ''}`} />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-200 text-5xl">👟</div>
        )}

        {/* Badges */}
        <div className="absolute top-2 left-2 flex flex-col gap-1">
          {discountPct > 0 && (
            <span className={`text-white text-xs px-2 py-0.5 rounded-full font-black ${isFlashSale ? 'bg-orange-500' : 'bg-red-600'}`}>
              -{discountPct}%
            </span>
          )}
          {isFlashSale && (
            <span className="bg-orange-500 text-white text-[10px] px-2 py-0.5 rounded-full font-bold">🔥 Flash</span>
          )}
          {product.is_new && !discountPct && !isFlashSale && (
            <span className="bg-green-500 text-white text-xs px-2 py-0.5 rounded-full font-bold">MỚI</span>
          )}
        </div>

        {isSoldOut && (
          <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
            <span className="bg-white/90 text-gray-700 text-xs px-3 py-1 rounded-full font-bold">Hết hàng</span>
          </div>
        )}
      </div>

      {/* Thông tin */}
      <div className="space-y-1 px-0.5">
        {product.brand && (
          <p className="text-[10px] uppercase tracking-widest text-gray-400 font-semibold">{product.brand}</p>
        )}
        <p className="text-sm font-semibold text-gray-800 line-clamp-2 group-hover:text-red-800 transition-colors leading-snug">
          {product.name}
        </p>

        {/* Giá */}
        <div className="flex items-center gap-1.5 flex-wrap pt-0.5">
          <span className="font-black text-base" style={{ color: isFlashSale ? '#f97316' : BRAND }}>
            {fmt(displayPrice)}đ
          </span>
          {Number(originalPrice) > Number(displayPrice) && (
            <span className="text-xs text-gray-400 line-through">{fmt(originalPrice)}đ</span>
          )}
        </div>

        {/* Màu */}
        {(product.colors || []).length > 0 && (
          <div className="flex gap-1 flex-wrap pt-0.5">
            {product.colors.slice(0, 6).map((c, i) => (
              <div key={i} className="w-3.5 h-3.5 rounded-full border border-gray-300"
                style={{ backgroundColor: c.colorCode || '#ccc' }} title={c.name} />
            ))}
          </div>
        )}
      </div>
    </Link>
  )
}