// Copy toàn bộ code dưới đây dán vào file: src/components/FlashSale.jsx (frontend)
import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import ProductCard from './ProductCard'

function getTimeLeft() {
  const now = new Date()
  const end = new Date()
  end.setHours(23, 59, 59, 0)
  const diff = Math.max(0, end - now)
  return {
    h: Math.floor(diff / 3600000),
    m: Math.floor((diff % 3600000) / 60000),
    s: Math.floor((diff % 60000) / 1000),
  }
}

function TimeBox({ value, label }) {
  return (
    <div className="flex flex-col items-center">
      <div className="bg-gray-900 text-white font-black text-lg md:text-2xl min-w-[48px] text-center px-2 py-1.5 rounded-lg tabular-nums shadow-inner">
        {String(value).padStart(2, '0')}
      </div>
      <span className="text-gray-500 text-[10px] mt-1 font-bold uppercase tracking-widest">
        {label}
      </span>
    </div>
  )
}

export default function FlashSale({ products = [] }) {
  const [timeLeft, setTimeLeft] = useState(getTimeLeft)

  useEffect(() => {
    const t = setInterval(() => setTimeLeft(getTimeLeft()), 1000)
    return () => clearInterval(t)
  }, [])

  if (!products.length) return null

  return (
    <section className="container mx-auto px-4 mt-8 md:mt-12">
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-3 flex-wrap">
          {/* Badge */}
          <div className="relative flex items-center gap-2 bg-gradient-to-r from-red-600 to-orange-500 text-white px-4 py-2.5 rounded-2xl shadow-lg shadow-red-200">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
              <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/>
            </svg>
            <span className="font-black text-base tracking-wide">FLASH SALE</span>
            {/* Glow effect */}
            <div className="absolute inset-0 bg-gradient-to-r from-red-400 to-orange-400 rounded-2xl blur-md opacity-40 -z-10" />
          </div>

          {/* Countdown */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-500 font-medium hidden sm:block">Kết thúc sau:</span>
            <div className="flex items-center gap-1">
              <TimeBox value={timeLeft.h} label="Giờ" />
              <span className="font-black text-red-400 text-xl mb-5">:</span>
              <TimeBox value={timeLeft.m} label="Phút" />
              <span className="font-black text-red-400 text-xl mb-5">:</span>
              <TimeBox value={timeLeft.s} label="Giây" />
            </div>
          </div>
        </div>

        <Link
          to="/?category=flash-sale"
          className="text-red-600 text-sm font-semibold hover:underline flex items-center gap-1 whitespace-nowrap"
        >
          Xem tất cả
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="M5 12h14M12 5l7 7-7 7"/>
          </svg>
        </Link>
      </div>

      {/* Products */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 md:gap-4">
        {products.slice(0, 5).map(p => (
          <ProductCard key={p.id} product={p} flashSale />
        ))}
      </div>
    </section>
  )
}