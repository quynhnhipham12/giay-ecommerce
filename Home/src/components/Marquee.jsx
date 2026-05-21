// Copy toàn bộ code dưới đây dán vào file: src/components/Marquee.jsx (frontend)
import { useEffect, useState } from 'react'
import { supabase } from '../supabaseClient'

export default function MarqueeTicker() {
  const [items, setItems] = useState([])

  useEffect(() => {
    supabase.from('marquee_items').select('*').eq('is_active', true).order('sort_order')
      .then(({ data }) => setItems(data || []))
  }, [])

  if (!items.length) return null

  const f = items[0]
  const fontStyle = {
    fontSize:   f?.font_size   || '12px',
    fontWeight: f?.font_weight || '400',
    fontFamily: f?.font_family || 'Inter, sans-serif',
  }

  return (
    <div style={{ backgroundColor: '#7F0000', height: 32, display: 'flex', alignItems: 'center' }}>
      {/*
        ✅ Hoàn toàn tĩnh — không animation, không lỗi chạy ngắt quãng
        Các item chia đều bằng justifyContent: space-evenly
        Ví dụ 3 item → trái / giữa / phải
      */}
      <div style={{
        width: '100%',
        display: 'flex',
        justifyContent: items.length === 1 ? 'center' : 'space-evenly',
        alignItems: 'center',
        padding: '0 16px',
      }}>
        {items.map(item => (
          <span key={item.id} style={{ ...fontStyle, color: '#fff', whiteSpace: 'nowrap' }}>
            {item.content}
          </span>
        ))}
      </div>
    </div>
  )
}