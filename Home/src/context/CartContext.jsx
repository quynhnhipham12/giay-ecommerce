// Copy toàn bộ code dưới đây dán vào file: src/context/CartContext.jsx (frontend)
import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { supabase } from '../supabaseClient'
import toast from 'react-hot-toast'

const CartContext = createContext(null)

export function CartProvider({ children }) {
  const [cartItems, setCartItems] = useState(() => {
    try { return JSON.parse(localStorage.getItem('cart') || '[]') } catch { return [] }
  })
  const [isCartOpen, setIsCartOpen] = useState(false)
  const [user, setUser] = useState(null)

  // Theo dõi trạng thái đăng nhập
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user || null)
    })
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_, session) => {
      setUser(session?.user || null)
    })
    return () => subscription.unsubscribe()
  }, [])

  // Lưu cart vào localStorage
  useEffect(() => {
    localStorage.setItem('cart', JSON.stringify(cartItems))
  }, [cartItems])

  const addToCart = useCallback((product, size, quantity = 1) => {
    // ✅ Yêu cầu đăng nhập trước khi thêm vào giỏ
    if (!user) {
      toast.error(
        (t) => (
          <div className="flex items-center gap-3">
            <span>🔐 Vui lòng đăng nhập để mua hàng!</span>
            <button
              onClick={() => {
                toast.dismiss(t.id)
                window.location.href = '/login'
              }}
              className="text-xs font-bold underline whitespace-nowrap"
              style={{ color: '#B71C1C' }}>
              Đăng nhập
            </button>
          </div>
        ),
        { duration: 4000 }
      )
      return false
    }

    const key = `${product.id}_${size}`
    setCartItems(prev => {
      const existing = prev.find(i => i.key === key)
      if (existing) {
        return prev.map(i => i.key === key ? { ...i, quantity: i.quantity + quantity } : i)
      }
      return [...prev, {
        key,
        id:        product.id,
        name:      product.name,
        image_url: product.image_url,
        price:     product.price,
        size,
        quantity,
        brand:     product.brand,
      }]
    })
    return true
  }, [user])

  const removeFromCart = useCallback((key) => {
    setCartItems(prev => prev.filter(i => i.key !== key))
  }, [])

  const updateQuantity = useCallback((key, qty) => {
    if (qty <= 0) {
      setCartItems(prev => prev.filter(i => i.key !== key))
    } else {
      setCartItems(prev => prev.map(i => i.key === key ? { ...i, quantity: qty } : i))
    }
  }, [])

  const clearCart = useCallback(() => setCartItems([]), [])

  const totalPrice = cartItems.reduce((sum, i) => sum + i.price * i.quantity, 0)
  const totalItems = cartItems.reduce((sum, i) => sum + i.quantity, 0)

  return (
    <CartContext.Provider value={{
      cartItems, addToCart, removeFromCart, updateQuantity, clearCart,
      totalPrice, totalItems, isCartOpen, setIsCartOpen, user,
    }}>
      {children}
    </CartContext.Provider>
  )
}

export const useCart = () => {
  const ctx = useContext(CartContext)
  if (!ctx) throw new Error('useCart must be used inside CartProvider')
  return ctx
}