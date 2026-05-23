// Copy toàn bộ code dưới đây dán vào file: src/App.jsx (frontend)
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { CartProvider } from './context/CartContext'
import Navbar from './components/Navbar'
import Footer from './components/Footer'
import CartSidebar from './components/CartSidebar'
import HomePage from './pages/HomePage'
import ProductListingPage from './pages/ProductListingPage'
import ProductDetailPage from './pages/ProductDetailPage'
import LoginPage from './pages/LoginPage'
import CheckoutPage from './pages/CheckoutPage'
import FAQPage from './pages/FAQPage'
import FooterContentPage from './pages/FooterContentPage'
import { useEffect } from 'react'

function ScrollToTop() {
  const { pathname } = useLocation()
  useEffect(() => { window.scrollTo(0, 0) }, [pathname])
  return null
}

export default function App() {
  return (
    <CartProvider>
      <BrowserRouter>
        <Toaster position="top-right" />
        <ScrollToTop />
        {/* ✅ Wrapper chặn tràn ngang trên mọi thiết bị */}
        <div style={{
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          overflowX: 'hidden',
          maxWidth: '100vw',
        }}>
          <Navbar />
          <CartSidebar />
          <main style={{ flex: 1, overflowX: 'hidden' }}>
            <Routes>
              <Route path="/"            element={<HomePage />} />
              <Route path="/products"    element={<ProductListingPage />} />
              <Route path="/product/:id" element={<ProductDetailPage />} />
              <Route path="/login"       element={<LoginPage />} />
              <Route path="/checkout"    element={<CheckoutPage />} />
              <Route path="/faq"         element={<FAQPage />} />
              <Route path="/page/:slug"  element={<FooterContentPage />} />
            </Routes>
          </main>
          <Footer />
        </div>
      </BrowserRouter>
    </CartProvider>
  )
}