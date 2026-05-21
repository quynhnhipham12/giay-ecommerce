// Copy toàn bộ code dưới đây dán vào file: src/components/ProductCard.jsx (frontend)
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useCart } from '../context/CartContext'
import toast from 'react-hot-toast'
import { ShoppingCart } from 'lucide-react'

export default function ProductCard({ product, flashSale = false }) {
  const { addToCart } = useCart()
  const colors = product.colors || []
  const [activeColorIdx, setActiveColorIdx] = useState(0)

  const activeColor = colors[activeColorIdx]
  const currentImage = activeColor?.images?.[0] || product.image_url
    || 'https://placehold.co/400x400/f5f5f5/999?text=No+Image'

  const isOutOfStock = typeof product.stock === 'number' && product.stock <= 0
  const isFreesize = product.sizes?.includes('freesize') && product.sizes?.length === 1

  const fmt = p => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(p)
  const discount = product.original_price && product.original_price > product.price
    ? Math.round((1 - product.price / product.original_price) * 100) : 0

  const handleQuickAdd = (e) => {
    e.preventDefault()
    e.stopPropagation()
    if (isOutOfStock) return
    const realSizes = (product.sizes || []).filter(s => s !== 'freesize')
    const defaultSize = realSizes[0] || product.sizes?.[0] || '39'
    addToCart({ ...product, image_url: currentImage }, defaultSize, 1)
    toast.success('Đã thêm vào giỏ hàng!', { duration: 2000 })
  }

  return (
    <Link to={`/product/${product.id}`} className="group block">
      <div className={`bg-white rounded-xl overflow-hidden transition-all duration-300 border ${
        flashSale ? 'border-red-100 shadow-md hover:shadow-xl' : 'border-gray-100 shadow-sm hover:shadow-lg'
      }`}>
        {/* Ảnh */}
        <div className="relative aspect-square overflow-hidden bg-gray-50">
          <img
            src={currentImage}
            alt={product.name}
            className={`w-full h-full object-cover transition-transform duration-500 group-hover:scale-110 ${
              isOutOfStock ? 'grayscale opacity-60' : ''
            }`}
            loading="lazy"
          />

          {/* Badges */}
          <div className="absolute top-2 left-2 flex flex-col gap-1">
            {isOutOfStock && (
              <span className="bg-gray-800 text-white text-xs font-bold px-2 py-0.5 rounded-full">
                Hết hàng
              </span>
            )}
            {!isOutOfStock && discount > 0 && (
              <span className="bg-red-600 text-white text-xs font-bold px-2 py-0.5 rounded-full">
                -{discount}%
              </span>
            )}
            {!isOutOfStock && product.is_new && (
              <span className="bg-emerald-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">
                MỚI
              </span>
            )}
            {flashSale && !isOutOfStock && (
              <span className="bg-amber-500 text-white text-xs font-bold px-2 py-0.5 rounded-full animate-pulse">
                🔥 SALE
              </span>
            )}
          </div>

          {/* Quick add */}
          {!isOutOfStock && (
            <button
              onClick={handleQuickAdd}
              className="absolute bottom-0 inset-x-0 bg-red-600 hover:bg-red-700 text-white py-2.5 text-xs font-semibold
                         flex items-center justify-center gap-1.5
                         translate-y-full group-hover:translate-y-0 transition-transform duration-300"
            >
              <ShoppingCart size={14} /> Thêm vào giỏ
            </button>
          )}
        </div>

        {/* Info */}
        <div className="p-3">
          {product.brand && (
            <p className="text-xs text-gray-400 uppercase tracking-wide font-medium mb-0.5">
              {product.brand}
            </p>
          )}
          <h3 className="text-sm font-medium text-gray-800 line-clamp-2 leading-snug mb-2 min-h-[36px]">
            {product.name}
          </h3>

          {/* Color swatches */}
          {colors.length > 0 && (
            <div className="flex items-center gap-1.5 mb-2 flex-wrap">
              {colors.map((color, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={e => { e.preventDefault(); setActiveColorIdx(idx) }}
                  title={color.name}
                  className={`w-5 h-5 rounded-full border-2 transition-all hover:scale-110 ${
                    activeColorIdx === idx ? 'border-red-500 scale-110' : 'border-gray-300'
                  }`}
                  style={{ backgroundColor: color.hex || '#cccccc' }}
                />
              ))}
            </div>
          )}

          {/* Giá */}
          <div className="flex items-baseline gap-1.5 flex-wrap">
            {isOutOfStock ? (
              <span className="text-gray-400 text-sm italic">Giá liên hệ</span>
            ) : (
              <>
                <span className="text-red-600 font-bold text-base leading-none">
                  {fmt(product.price)}
                </span>
                {product.original_price && product.original_price > product.price && (
                  <span className="text-gray-400 text-xs line-through">
                    {fmt(product.original_price)}
                  </span>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </Link>
  )
}