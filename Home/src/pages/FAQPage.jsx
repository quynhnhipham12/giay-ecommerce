// Copy toàn bộ code dưới đây dán vào file: src/pages/FAQPage.jsx (frontend)
import { useEffect, useState } from 'react'
import { supabase } from '../supabaseClient'
import { Link } from 'react-router-dom'

export default function FAQPage() {
  const [faqs, setFaqs] = useState([])
  const [openId, setOpenId] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.from('faqs').select('*').eq('is_active', true).order('sort_order')
      .then(({ data }) => { setFaqs(data || []); setLoading(false) })
  }, [])

  const toggle = (id) => setOpenId(prev => prev === id ? null : id)

  return (
    <div className="container mx-auto px-4 py-12 max-w-3xl">
      <nav className="flex items-center gap-2 text-sm text-gray-400 mb-6">
        <Link to="/" className="hover:text-red-700">Trang chủ</Link>
        <span>/</span>
        <span className="text-gray-700">Câu hỏi thường gặp</span>
      </nav>

      <h1 className="text-2xl font-black text-gray-900 mb-8 uppercase tracking-wide">
        Câu hỏi thường gặp
      </h1>

      {loading ? (
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-14 bg-gray-100 animate-pulse rounded-xl" />
          ))}
        </div>
      ) : faqs.length === 0 ? (
        <p className="text-gray-400 text-center py-12">Chưa có câu hỏi nào</p>
      ) : (
        <div className="space-y-2">
          {faqs.map(faq => (
            <div key={faq.id} className="border border-gray-200 rounded-xl overflow-hidden">
              <button
                onClick={() => toggle(faq.id)}
                className="w-full flex items-center justify-between px-5 py-4 text-left hover:bg-gray-50 transition-colors"
              >
                <span className="font-medium text-gray-800 pr-4">{faq.question}</span>
                <span className="text-xl font-light text-gray-400 flex-shrink-0">
                  {openId === faq.id ? '−' : '+'}
                </span>
              </button>
              {openId === faq.id && (
                <div className="px-5 pb-4 border-t border-gray-100 bg-gray-50">
                  <div
                    className="prose prose-sm max-w-none text-gray-600 pt-3 leading-relaxed"
                    dangerouslySetInnerHTML={{ __html: faq.answer || '<p>Chưa có câu trả lời.</p>' }}
                  />
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}