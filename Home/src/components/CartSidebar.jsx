import { useCart } from '../context/CartContext'
import { X, Trash2, Plus, Minus, ShoppingBag, ArrowRight } from 'lucide-react'
import { Link } from 'react-router-dom'

export default function CartSidebar() {
  const {
    cartItems, removeFromCart, updateQuantity,
    totalPrice, totalItems,
    isCartOpen, setIsCartOpen,
  } = useCart()

  const fmt = (p) =>
    new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(p)

  const shippingFee = totalPrice >= 500000 ? 0 : 30000
  const remaining = 500000 - totalPrice

  if (!isCartOpen) return null

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 z-40 backdrop-blur-sm"
        onClick={() => setIsCartOpen(false)}
      />

      {/* Sidebar panel */}
      <div className="fixed right-0 top-0 h-full w-full max-w-[420px] bg-white z-50 flex flex-col shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b">
          <h2 className="text-base font-bold text-gray-800 flex items-center gap-2">
            <ShoppingBag size={20} className="text-red-600" />
            Giỏ hàng
            {totalItems > 0 && (
              <span className="bg-red-100 text-red-600 text-xs font-bold px-2 py-0.5 rounded-full">
                {totalItems} sản phẩm
              </span>
            )}
          </h2>
          <button
            onClick={() => setIsCartOpen(false)}
            className="p-1.5 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Free shipping progress */}
        {totalPrice > 0 && totalPrice < 500000 && (
          <div className="px-5 py-3 bg-amber-50 border-b border-amber-100">
            <p className="text-xs text-amber-700 mb-1.5 font-medium">
              Mua thêm <strong className="text-amber-800">{fmt(remaining)}</strong> để được miễn phí vận chuyển!
            </p>
            <div className="w-full bg-amber-200 rounded-full h-1.5">
              <div
                className="bg-amber-500 h-1.5 rounded-full transition-all duration-500"
                style={{ width: `${Math.min(100, (totalPrice / 500000) * 100)}%` }}
              />
            </div>
          </div>
        )}
        {totalPrice >= 500000 && (
          <div className="px-5 py-2.5 bg-green-50 border-b border-green-100">
            <p className="text-xs text-green-700 font-medium">
              🎉 Bạn được miễn phí vận chuyển!
            </p>
          </div>
        )}

        {/* Items list */}
        <div className="flex-1 overflow-y-auto">
          {cartItems.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center px-8 py-16">
              <ShoppingBag size={56} className="text-gray-200 mb-4" />
              <p className="text-gray-400 font-medium mb-1">Giỏ hàng trống</p>
              <p className="text-gray-300 text-sm mb-6">Thêm sản phẩm để bắt đầu mua sắm</p>
              <button
                onClick={() => setIsCartOpen(false)}
                className="bg-red-600 text-white px-6 py-2.5 rounded-full text-sm font-semibold hover:bg-red-700 transition-colors"
              >
                Tiếp tục mua sắm
              </button>
            </div>
          ) : (
            <div className="divide-y divide-gray-50">
              {cartItems.map(item => (
                <div key={item.key} className="flex gap-3 px-5 py-4 hover:bg-gray-50/50 transition-colors">
                  {/* Ảnh */}
                  <Link
                    to={`/product/${item.id}`}
                    onClick={() => setIsCartOpen(false)}
                    className="flex-shrink-0"
                  >
                    <img
                      src={item.image_url || 'https://placehold.co/80x80/f5f5f5/999?text=?'}
                      alt={item.name}
                      className="w-20 h-20 object-cover rounded-xl border border-gray-100"
                    />
                  </Link>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <Link
                      to={`/product/${item.id}`}
                      onClick={() => setIsCartOpen(false)}
                      className="text-sm font-medium text-gray-800 line-clamp-2 hover:text-red-600 transition-colors leading-snug"
                    >
                      {item.name}
                    </Link>
                    <p className="text-xs text-gray-400 mt-1">Size: <strong>{item.size}</strong></p>

                    <div className="flex items-center justify-between mt-2">
                      {/* Quantity control */}
                      <div className="flex items-center gap-1 border border-gray-200 rounded-full overflow-hidden">
                        <button
                          onClick={() => updateQuantity(item.key, item.quantity - 1)}
                          className="p-1.5 hover:bg-gray-100 text-gray-500 transition-colors"
                        >
                          <Minus size={12} />
                        </button>
                        <span className="text-sm font-medium px-2 min-w-[24px] text-center">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() => updateQuantity(item.key, item.quantity + 1)}
                          className="p-1.5 hover:bg-gray-100 text-gray-500 transition-colors"
                        >
                          <Plus size={12} />
                        </button>
                      </div>

                      {/* Price */}
                      <span className="text-red-600 font-bold text-sm">
                        {fmt(item.price * item.quantity)}
                      </span>
                    </div>
                  </div>

                  {/* Delete */}
                  <button
                    onClick={() => removeFromCart(item.key)}
                    className="flex-shrink-0 self-start mt-1 p-1.5 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        {cartItems.length > 0 && (
          <div className="border-t bg-gray-50 px-5 py-4 space-y-3">
            <div className="space-y-1.5">
              <div className="flex justify-between text-sm text-gray-500">
                <span>Tạm tính</span>
                <span className="font-medium text-gray-700">{fmt(totalPrice)}</span>
              </div>
              <div className="flex justify-between text-sm text-gray-500">
                <span>Phí vận chuyển</span>
                <span className={shippingFee === 0 ? 'text-green-500 font-semibold' : 'font-medium text-gray-700'}>
                  {shippingFee === 0 ? 'MIỄN PHÍ' : fmt(shippingFee)}
                </span>
              </div>
              <div className="flex justify-between font-bold text-base pt-1.5 border-t border-gray-200">
                <span className="text-gray-800">Tổng cộng</span>
                <span className="text-red-600 text-lg">{fmt(totalPrice + shippingFee)}</span>
              </div>
            </div>

            <Link
              to="/checkout"
              onClick={() => setIsCartOpen(false)}
              className="flex items-center justify-center gap-2 w-full bg-red-600 hover:bg-red-700 active:scale-98 text-white py-3.5 rounded-full font-bold text-sm transition-all shadow-md hover:shadow-red-500/20"
            >
              Tiến hành đặt hàng
              <ArrowRight size={16} />
            </Link>

            <button
              onClick={() => setIsCartOpen(false)}
              className="w-full text-center text-sm text-gray-400 hover:text-gray-600 py-1 transition-colors"
            >
              ← Tiếp tục mua sắm
            </button>
          </div>
        )}
      </div>
    </>
  )
}