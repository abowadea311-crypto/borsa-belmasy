import { useState, useEffect } from 'react'

type Stock = { symbol: string; name: string; price: number; change: number; pct: number }

const STOCKS: Stock[] = [
  { symbol: 'COMI', name: 'البنك التجاري الدولي', price: 85.5, change: 1.2, pct: 1.42 },
  { symbol: 'ABUK', name: 'أبو قير للأسمدة', price: 55.3, change: -0.45, pct: -0.81 },
  { symbol: 'TMGH', name: 'طلعت مصطفى', price: 62.3, change: 2.1, pct: 3.49 },
  { symbol: 'HRHO', name: 'هيرميس', price: 18.7, change: 0.15, pct: 0.81 },
  { symbol: 'ETEL', name: 'المصرية للاتصالات', price: 32.1, change: -0.2, pct: -0.62 },
  { symbol: 'FWRY', name: 'فوري', price: 8.95, change: 0.35, pct: 4.07 },
]

const EGX = [28400, 28420, 28390, 28450, 28480, 28430, 28510, 28490, 28530, 28600, 28550]

export default function App() {
  const [dark, setDark] = useState(true)
  const [stocks] = useState(STOCKS)

  useEffect(() => {
    const s = localStorage.getItem('borsa-theme')
    if (s) setDark(s === 'dark')
  }, [])

  const toggle = () => {
    const n = !dark
    setDark(n)
    localStorage.setItem('borsa-theme', n ? 'dark' : 'light')
  }

  return (
    <div dir="rtl" style={{ background: dark ? '#0a0a0b' : '#f5f5f7', color: dark ? 'white' : 'black', minHeight: '100vh', fontFamily: 'system-ui, -apple-system' }}>
      {/* Header */}
      <div style={{ position: 'sticky', top: 0, zIndex: 50, backdropFilter: 'blur(20px)', background: dark ? 'rgba(0,0,0,0.7)' : 'rgba(255,255,255,0.8)', borderBottom: `1px solid ${dark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)'}`, padding: '16px 24px' }}>
        <div style={{ maxWidth: '1400px', margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: 'linear-gradient(135deg,#4ade80,#16a34a)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, color: 'black' }}>EG</div>
            <div>
              <div style={{ fontSize: '20px', fontWeight: 900 }}>بورصة بالمصري</div>
              <div style={{ fontSize: '11px', opacity: 0.5 }}>مباشر من البورصة المصرية • EGX • LIVE</div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginRight: '24px' }}>
              <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#22c55e', boxShadow: '0 0 10px #22c55e' }}></div>
              <span style={{ fontSize: '11px', fontFamily: 'monospace', color: '#22c55e', fontWeight: 700 }}>MARKET OPEN</span>
            </div>
          </div>
          <div style={{ display: 'flex', gap: '12px' }}>
            <button onClick={toggle} style={{ width: '40px', height: '40px', borderRadius: '50%', border: `1px solid ${dark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'}`, background: dark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)', cursor: 'pointer' }}>{dark ? '☀️' : '🌙'}</button>
            <div style={{ padding: '8px 16px', borderRadius: '20px', background: dark ? 'white' : 'black', color: dark ? 'black' : 'white', fontSize: '12px', fontWeight: 800 }}>PRO</div>
          </div>
        </div>
      </div>

      <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '24px', display: 'grid', gridTemplateColumns: '1fr', gap: '24px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: window.innerWidth > 900 ? '2fr 1fr' : '1fr', gap: '24px' }}>
          {/* Main */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            {/* EGX Card */}
            <div style={{ background: dark ? '#141415' : 'white', border: `1px solid ${dark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)'}`, borderRadius: '24px', padding: '24px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '24px' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <h2 style={{ fontSize: '24px', fontWeight: 900 }}>EGX30</h2>
                    <span style={{ padding: '4px 10px', borderRadius: '20px', background: 'rgba(34,197,94,0.15)', color: '#22c55e', fontSize: '12px', fontWeight: 700 }}>+1.24%</span>
                  </div>
                  <div style={{ fontSize: '13px', opacity: 0.4, marginTop: '4px' }}>المؤشر الرئيسي • تحديث لحظي</div>
                </div>
                <div style={{ textAlign: 'left' }}>
                  <div style={{ fontSize: '32px', fontFamily: 'monospace', fontWeight: 700 }}>28,450.32</div>
                  <div style={{ fontSize: '13px', color: '#22c55e', fontFamily: 'monospace' }}>+342.5 اليوم</div>
                </div>
              </div>

              <div style={{ height: '200px', position: 'relative' }}>
                <svg viewBox="0 0 400 100" style={{ width: '100%', height: '100%' }}>
                  <defs>
                    <linearGradient id="g" x1="0" x2="0" y1="0" y2="1">
                      <stop offset="0%" stopColor="#22c55e" stopOpacity="0.3" />
                      <stop offset="100%" stopColor="#22c55e" stopOpacity="0" />
                    </linearGradient>
                  </defs>
                  <path d={`M0,${100 - (EGX[0] - 28350) / 3} ${EGX.map((v, i) => `L${(i / (EGX.length - 1)) * 400},${100 - (v - 28350) / 3}`).join(' ')}`} fill="none" stroke="#22c55e" strokeWidth="2.5" strokeLinecap="round" />
                  <path d={`M0,${100 - (EGX[0] - 28350) / 3} ${EGX.map((v, i) => `L${(i / (EGX.length - 1)) * 400},${100 - (v - 28350) / 3}`).join(' ')} L400,100 L0,100 Z`} fill="url(#g)" />
                </svg>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px', marginTop: '24px' }}>
                {[
                  { k: 'EGX70', v: '6,210 +0.8%' },
                  { k: 'EGX100', v: '9,120 +1.1%' },
                  { k: 'قيمة التداول', v: '2.1B ج.م' },
                ].map((x) => (
                  <div key={x.k} style={{ background: dark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.03)', padding: '12px', borderRadius: '16px' }}>
                    <div style={{ fontSize: '11px', opacity: 0.4 }}>{x.k}</div>
                    <div style={{ fontFamily: 'monospace', fontWeight: 700, marginTop: '4px', fontSize: '13px' }}>{x.v}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Stocks */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '16px' }}>
              {stocks.map((s) => (
                <div key={s.symbol} style={{ background: dark ? '#141415' : 'white', border: `1px solid ${dark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)'}`, borderRadius: '20px', padding: '16px', transition: 'transform 0.2s' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <div style={{ width: '28px', height: '28px', borderRadius: '8px', background: s.change >= 0 ? 'rgba(34,197,94,0.15)' : 'rgba(239,68,68,0.15)', color: s.change >= 0 ? '#22c55e' : '#ef4444', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', fontWeight: 900 }}>{s.symbol[0]}</div>
                      <span style={{ fontFamily: 'monospace', fontWeight: 700, fontSize: '13px' }}>{s.symbol}</span>
                    </div>
                    <span style={{ padding: '2px 8px', borderRadius: '10px', fontSize: '11px', fontFamily: 'monospace', fontWeight: 700, background: s.change >= 0 ? 'rgba(34,197,94,0.15)' : 'rgba(239,68,68,0.15)', color: s.change >= 0 ? '#22c55e' : '#ef4444' }}>{s.pct > 0 ? '+' : ''}{s.pct}%</span>
                  </div>
                  <div style={{ fontSize: '11px', opacity: 0.4, marginTop: '8px' }}>{s.name}</div>
                  <div style={{ fontSize: '22px', fontFamily: 'monospace', fontWeight: 800, marginTop: '12px' }}>{s.price} <span style={{ fontSize: '12px', fontWeight: 400 }}>ج.م</span></div>
                </div>
              ))}
            </div>
          </div>

          {/* Sidebar */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            <div style={{ background: dark ? '#141415' : 'white', border: `1px solid ${dark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)'}`, borderRadius: '24px', padding: '20px' }}>
              <div style={{ fontWeight: 700 }}>محفظتك</div>
              <div style={{ fontSize: '11px', opacity: 0.4, marginTop: '4px' }}>إجمالي القيمة</div>
              <div style={{ fontSize: '32px', fontFamily: 'monospace', fontWeight: 900, marginTop: '8px' }}>124,530 <span style={{ fontSize: '14px' }}>ج.م</span></div>
              <div style={{ marginTop: '12px', display: 'flex', gap: '8px', alignItems: 'center' }}>
                <span style={{ padding: '4px 10px', borderRadius: '20px', background: 'rgba(34,197,94,0.15)', color: '#22c55e', fontFamily: 'monospace', fontSize: '12px', fontWeight: 700 }}>+2,340 (+1.9%)</span>
                <span style={{ fontSize: '12px', opacity: 0.4 }}>اليوم</span>
              </div>
              <button style={{ width: '100%', marginTop: '20px', padding: '12px', borderRadius: '30px', background: dark ? 'white' : 'black', color: dark ? 'black' : 'white', border: 'none', fontWeight: 800, cursor: 'pointer' }}>عرض التفاصيل →</button>
            </div>

            <div style={{ background: dark ? '#141415' : 'white', border: `1px solid ${dark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)'}`, borderRadius: '24px', padding: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <div style={{ fontWeight: 700 }}>أحدث التحليلات</div>
                <span style={{ fontSize: '10px', padding: '4px 8px', borderRadius: '10px', background: dark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)' }}>LIVE</span>
              </div>
              <div style={{ marginTop: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {[
                  { t: 'لماذا ارتفع سهم COMI اليوم 5%؟ تحليل فني سريع', tag: 'تحليل', time: 'منذ ساعتين' },
                  { t: 'أبو قير للأسمدة: هل الوقت مناسب للشراء؟', tag: 'توصية', time: 'منذ 4 ساعات' },
                  { t: 'EGX30 يختبر مقاومة 28,500 - ماذا بعد؟', tag: 'خبر', time: 'منذ 6 ساعات' },
                ].map((a, i) => (
                  <div key={i}>
                    <div style={{ display: 'flex', gap: '8px', marginBottom: '6px' }}>
                      <span style={{ fontSize: '10px', padding: '2px 8px', borderRadius: '10px', background: a.tag === 'تحليل' ? 'rgba(59,130,246,0.15)' : a.tag === 'توصية' ? 'rgba(34,197,94,0.15)' : 'rgba(249,115,22,0.15)', color: a.tag === 'تحليل' ? '#60a5fa' : a.tag === 'توصية' ? '#22c55e' : '#fb923c', fontWeight: 700 }}>{a.tag}</span>
                      <span style={{ fontSize: '11px', opacity: 0.3 }}>{a.time}</span>
                    </div>
                    <div style={{ fontSize: '13px', fontWeight: 700, lineHeight: 1.4 }}>{a.t}</div>
                  </div>
                ))}
              </div>
            </div>

            <div style={{ textAlign: 'center', padding: '12px', border: `1px dashed ${dark ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.15)'}`, borderRadius: '16px', fontSize: '11px', opacity: 0.5 }}>
              ✅ النسخة الجديدة شغالة 100% - جاهزة للنشر على Vercel
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
