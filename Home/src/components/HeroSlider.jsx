// Copy toàn bộ code dưới đây dán vào file: src/components/HeroSlider.jsx (frontend)
import { useEffect, useState } from 'react'
import { Swiper, SwiperSlide } from 'swiper/react'
import { Autoplay, Pagination, Navigation } from 'swiper/modules'
import { Link } from 'react-router-dom'
import { supabase } from '../supabaseClient'
import 'swiper/css'
import 'swiper/css/pagination'
import 'swiper/css/navigation'

export default function HeroSlider() {
  const [banners, setBanners] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => { fetchBanners() }, [])

  const fetchBanners = async () => {
    const now = new Date().toISOString()
    const { data } = await supabase
      .from('banners')
      .select('*')
      .eq('is_active', true)
      .order('sort_order', { ascending: true })
    // Lọc theo lịch hẹn giờ
    const filtered = (data || []).filter(b => {
      const startOk = !b.scheduled_start || new Date(b.scheduled_start) <= new Date()
      const endOk = !b.scheduled_end || new Date(b.scheduled_end) >= new Date()
      return startOk && endOk
    })
    setBanners(filtered)
    setLoading(false)
  }

  if (loading) return (
    <div className="w-full h-[260px] md:h-[460px] bg-gray-100 animate-pulse" />
  )

  if (banners.length === 0) return (
    <div className="w-full h-[180px] bg-gradient-to-r from-red-700 to-red-500 flex items-center justify-center">
      <div className="text-white text-center">
        <p className="text-red-200 text-sm">Admin chưa thêm banner nào</p>
      </div>
    </div>
  )

  return (
    <div className="relative">
      <Swiper
        modules={[Autoplay, Pagination, Navigation]}
        autoplay={{ delay: 4500, disableOnInteraction: false, pauseOnMouseEnter: true }}
        pagination={{ clickable: true }}
        navigation
        loop={banners.length > 1}
        className="w-full"
        style={{
          '--swiper-navigation-color': '#fff',
          '--swiper-navigation-size': '20px',
          '--swiper-pagination-color': '#ef4444',
          '--swiper-pagination-bullet-inactive-color': '#fff',
          '--swiper-pagination-bullet-inactive-opacity': '0.5',
        }}
      >
        {banners.map(banner => (
          <SwiperSlide key={banner.id}>
            <Link to={banner.link_url || '/'}>
              <div className="relative h-[260px] md:h-[460px] lg:h-[520px] overflow-hidden bg-gray-900">
                <img
                  src={banner.image_url}
                  alt={banner.headline || 'Banner'}
                  className="absolute inset-0 w-full h-full object-cover object-center"
                  loading="lazy"
                />
                {(banner.headline || banner.badge_text || banner.subtitle) && (
                  <>
                    <div className={`absolute inset-0 bg-gradient-to-r ${banner.overlay_color}`} />
                    <div className="absolute inset-0 flex items-center">
                      <div className="container mx-auto px-8 md:px-16 lg:px-24">
                        <div className="max-w-lg text-white">
                          {banner.badge_text && (
                            <span className="inline-block bg-red-600 text-white text-xs font-bold px-3 py-1 rounded-full mb-3 uppercase tracking-wide">
                              {banner.badge_text}
                            </span>
                          )}
                          {banner.headline && (
                            <h2 className="text-3xl md:text-5xl lg:text-6xl font-black leading-none mb-3 drop-shadow-lg">
                              {banner.headline}
                            </h2>
                          )}
                          {banner.subtitle && (
                            <p className="text-sm md:text-lg text-gray-200 mb-6 drop-shadow">
                              {banner.subtitle}
                            </p>
                          )}
                          {banner.cta_text && (
                            <span className="inline-flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white px-7 py-3 rounded-full font-bold text-sm shadow-lg">
                              {banner.cta_text} →
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </Link>
          </SwiperSlide>
        ))}
      </Swiper>

      {/* Promo bar */}
      <div className="bg-red-600">
        <div className="container mx-auto px-4 py-2">
          <div className="flex flex-wrap justify-center gap-4 md:gap-8 text-white text-xs font-medium">
            {['🚚 Miễn phí ship từ 500k','🔄 Đổi trả 30 ngày','✅ Hàng chính hãng 100%','💳 Thanh toán khi nhận hàng'].map(t => (
              <span key={t}>{t}</span>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}