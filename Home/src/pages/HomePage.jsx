// Copy toàn bộ code dưới đây dán vào file: src/pages/HomePage.jsx (frontend)
import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { supabase } from '../supabaseClient'
import { Swiper, SwiperSlide } from 'swiper/react'
import { Autoplay, Pagination, Navigation } from 'swiper/modules'
import ProductCard from '../components/ProductCard'
import 'swiper/css'
import 'swiper/css/pagination'
import 'swiper/css/navigation'

const BRAND = '#B71C1C'

// ── Banner slider (dùng cho section type=banner) ──
function SectionBanner({ banner }) {
  return (
    <Link to={banner.link_url || '/'}>
      <div className="relative w-full overflow-hidden rounded-xl"
        style={{ aspectRatio: '16/6', maxHeight: 520 }}>
        <img
          src={banner.banner_url}
          alt={banner.title}
          className="w-full h-full object-cover transition-transform duration-700 hover:scale-105"
        />
        {(banner.title || banner.subtitle) && (
          <>
            <div className="absolute inset-0 bg-gradient-to-r from-black/60 via-black/30 to-transparent" />
            <div className="absolute inset-0 flex items-center px-10 md:px-20">
              <div className="text-white max-w-lg">
                {banner.subtitle && (
                  <p className="text-sm font-medium uppercase tracking-widest mb-2 opacity-80">
                    {banner.subtitle}
                  </p>
                )}
                {banner.title && (
                  <h2 className="text-3xl md:text-5xl font-black leading-tight mb-4">
                    {banner.title}
                  </h2>
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </Link>
  )
}

// ── Phần sản phẩm theo danh mục ──
function SectionProducts({ section }) {
  const [products, setProducts] = useState([])

  useEffect(() => {
    const fetchData = async () => {
      // Nếu có danh sách product_ids cụ thể
      if (section.product_ids && section.product_ids.length > 0) {
        const { data } = await supabase
          .from('products').select('*')
          .in('id', section.product_ids)
          .eq('is_active', true)
        setProducts(data || [])
        return
      }
      // Nếu không, lấy theo category/subcategory
      let q = supabase.from('products').select('*').eq('is_active', true)
      if (section.category) q = q.eq('category', section.category)
      if (section.subcategory) q = q.eq('subcategory', section.subcategory)
      q = q.order('created_at', { ascending: false }).limit(8)
      const { data } = await q
      setProducts(data || [])
    }
    fetchData()
  }, [section.id])

  if (!products.length) return null

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl md:text-2xl font-black uppercase tracking-wide text-gray-900">
          {section.title || section.category}
        </h2>
        <Link
          to={section.subcategory
            ? `/?category=${encodeURIComponent(section.category)}&sub=${encodeURIComponent(section.subcategory)}`
            : `/?category=${encodeURIComponent(section.category)}`
          }
          className="text-sm font-semibold flex items-center gap-1 hover:gap-2 transition-all"
          style={{ color: BRAND }}
        >
          Xem Thêm →
        </Link>
      </div>

      {/* Products — horizontal scroll on mobile, grid on desktop */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {products.slice(0, 4).map(p => (
          <ProductCard key={p.id} product={p} />
        ))}
      </div>
    </div>
  )
}

// ── Hero Slider (banners từ DB) ──
function HeroSlider() {
  const [banners, setBanners] = useState([])

  useEffect(() => {
    const now = new Date()
    supabase.from('banners').select('*').eq('is_active', true)
      .order('sort_order').then(({ data }) => {
        const filtered = (data || []).filter(b => {
          const startOk = !b.scheduled_start || new Date(b.scheduled_start) <= now
          const endOk = !b.scheduled_end || new Date(b.scheduled_end) >= now
          return startOk && endOk
        })
        setBanners(filtered)
      })
  }, [])

  if (!banners.length) return (
    <div className="w-full bg-gray-100 flex items-center justify-center"
      style={{ height: 320 }}>
      <p className="text-gray-400">Chưa có banner — vào Admin → Banner để thêm</p>
    </div>
  )

  return (
    <Swiper
      modules={[Autoplay, Pagination, Navigation]}
      autoplay={{ delay: 4500, disableOnInteraction: false, pauseOnMouseEnter: true }}
      pagination={{ clickable: true }}
      navigation
      loop={banners.length > 1}
      style={{
        '--swiper-navigation-color': '#fff',
        '--swiper-navigation-size': '20px',
        '--swiper-pagination-color': BRAND,
      }}
    >
      {banners.map(banner => (
        <SwiperSlide key={banner.id}>
          <Link to={banner.link_url || '/'}>
            <div className="relative overflow-hidden bg-gray-900"
              style={{ height: 'clamp(260px, 55vw, 560px)' }}>
              <img src={banner.image_url} alt={banner.headline || 'Banner'}
                className="absolute inset-0 w-full h-full object-cover object-center" />
              {(banner.headline || banner.badge_text) && (
                <>
                  <div className={`absolute inset-0 bg-gradient-to-r ${banner.overlay_color || 'from-black/70 to-transparent'}`} />
                  <div className="absolute inset-0 flex items-center">
                    <div className="container mx-auto px-8 md:px-20">
                      <div className="max-w-xl text-white">
                        {banner.badge_text && (
                          <span className="inline-block text-xs font-bold px-3 py-1 rounded-full mb-3 uppercase tracking-widest"
                            style={{ backgroundColor: BRAND }}>
                            {banner.badge_text}
                          </span>
                        )}
                        {banner.headline && (
                          <h2 className="text-4xl md:text-6xl font-black leading-none mb-3 drop-shadow-lg">
                            {banner.headline}
                          </h2>
                        )}
                        {banner.subtitle && (
                          <p className="text-sm md:text-lg text-gray-200 mb-6">{banner.subtitle}</p>
                        )}
                        {banner.cta_text && (
                          <span className="inline-block text-white text-sm font-bold px-8 py-3 rounded-full"
                            style={{ backgroundColor: BRAND }}>
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
  )
}

// ── Collection Grid (cuối trang) ──
function CollectionGrid() {
  const [cols, setCols] = useState([])

  useEffect(() => {
    supabase.from('collections').select('*')
      .eq('is_active', true).order('sort_order')
      .then(({ data }) => setCols(data || []))
  }, [])

  if (!cols.length) return null

  return (
    <div className="container mx-auto px-4 py-10">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 md:gap-3 auto-rows-[240px] md:auto-rows-[280px]">
        {cols.map(col => (
          <Link
            key={col.id}
            to={col.link_url || '/'}
            className={`relative overflow-hidden rounded-xl group ${
              col.grid_span === 2 ? 'col-span-2 row-span-2' :
              col.grid_span === 3 ? 'row-span-2' : ''
            }`}
          >
            <img
              src={col.image_url}
              alt={col.title}
              className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
            />
            {/* Overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />

            {/* Text */}
            <div className="absolute bottom-0 left-0 p-4 md:p-6">
              {col.brand_label && (
                <p style={{
                  color: col.brand_color || '#fff',
                  fontSize: col.brand_size || '11px',
                  fontWeight: col.brand_font === 'bold' ? '700' : '400',
                  textTransform: 'uppercase',
                  letterSpacing: '0.1em',
                  marginBottom: 4,
                }}>
                  {col.brand_label}
                </p>
              )}
              {col.title && (
                <h3 style={{
                  color: col.title_color || '#fff',
                  fontSize: col.title_size || '20px',
                  fontWeight: col.title_font === 'bold' ? '700'
                    : col.title_font === 'semibold' ? '600' : '400',
                  lineHeight: 1.2,
                }}>
                  {col.title}
                </h3>
              )}
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}

// ── Trang chủ chính ──
export default function HomePage() {
  const [sections, setSections] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.from('homepage_sections').select('*')
      .eq('is_active', true).order('sort_order')
      .then(({ data }) => {
        setSections(data || [])
        setLoading(false)
      })
  }, [])

  return (
    <main className="min-h-screen">
      {/* Hero slider */}
      <HeroSlider />

      {/* Nội dung sections do admin cấu hình */}
      {!loading && sections.map(section => {
        if (section.section_type === 'banner') {
          return (
            <div key={section.id} className="container mx-auto px-4 py-6">
              <SectionBanner banner={section} />
            </div>
          )
        }
        if (section.section_type === 'products') {
          return <SectionProducts key={section.id} section={section} />
        }
        return null
      })}

      {/* Collection grid — luôn ở cuối trước footer */}
      <CollectionGrid />
    </main>
  )
}