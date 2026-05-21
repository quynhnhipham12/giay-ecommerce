// Copy toàn bộ code dưới đây dán vào file: src/pages/FooterContentPage.jsx (frontend)
import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { supabase } from '../supabaseClient'

export default function FooterContentPage() {
  const { slug } = useParams()
  const [page, setPage] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.from('footer_pages').select('*').eq('slug', slug).single()
      .then(({ data }) => { setPage(data); setLoading(false) })
  }, [slug])

  if (loading) return (
    <div className="container mx-auto px-4 py-16 max-w-3xl">
      <div className="animate-pulse space-y-4">
        <div className="h-8 bg-gray-100 rounded w-1/3" />
        {[...Array(6)].map((_, i) => <div key={i} className="h-4 bg-gray-100 rounded" />)}
      </div>
    </div>
  )

  if (!page) return (
    <div className="container mx-auto px-4 py-16 text-center">
      <p className="text-gray-400 text-xl">Không tìm thấy trang này</p>
      <Link to="/" className="text-red-700 hover:underline mt-4 inline-block">← Về trang chủ</Link>
    </div>
  )

  return (
    <div className="container mx-auto px-4 py-12 max-w-3xl">
      <nav className="flex items-center gap-2 text-sm text-gray-400 mb-6">
        <Link to="/" className="hover:text-red-700">Trang chủ</Link>
        <span>/</span>
        <span className="text-gray-700">{page.title}</span>
      </nav>
      <h1 className="text-2xl font-black text-gray-900 mb-8 uppercase tracking-wide">
        {page.title}
      </h1>
      {page.content ? (
        <div
          className="prose prose-sm max-w-none text-gray-600 leading-relaxed
            [&_h1]:text-xl [&_h1]:font-bold [&_h2]:text-lg [&_h2]:font-bold
            [&_strong]:font-bold [&_ul]:list-disc [&_ul]:pl-5 [&_table]:w-full
            [&_table]:border-collapse [&_td]:border [&_td]:border-gray-200 [&_td]:p-2
            [&_th]:border [&_th]:border-gray-200 [&_th]:p-2 [&_th]:bg-gray-50"
          dangerouslySetInnerHTML={{ __html: page.content }}
        />
      ) : (
        <p className="text-gray-400 italic">Nội dung đang được cập nhật...</p>
      )}
    </div>
  )
}