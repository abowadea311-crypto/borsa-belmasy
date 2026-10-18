import { useState, useEffect } from 'react'
import { createClient } from '@supabase/supabase-js'

// --- Supabase Client Safe ---
const url = import.meta.env.VITE_SUPABASE_URL
const key = import.meta.env.VITE_SUPABASE_ANON_KEY
let supabase: any = null
if (url && key) {
  try { supabase = createClient(url, key) } catch {}
}

type Stock = { symbol: string; name: string; price: number; pct: number }
const STOCKS: Stock[] = [
  { symbol: 'COMI', name: 'البنك التجاري الدولي', price: 85.5, pct: 1.42 },
  { symbol: 'ABUK', name: 'أبو قير للأسمدة', price: 55.3, pct: -0.81 },
  { symbol: 'TMGH', name: 'طلعت مصطفى', price: 62.3, pct: 3.49 },
  { symbol: 'HRHO', name: 'هيرميس', price: 18.7, pct: 0.81 },
  { symbol: 'ETEL', name: 'المصرية للاتصالات', price: 32.1, pct: -0.62 },
  { symbol: 'FWRY', name: 'فوري', price: 8.95, pct: 4.07 },
]
const EGX = [28400, 28420, 28390, 28450, 28480, 28430, 28510, 28490, 28530, 28600, 28550]

function useMarketStatus() {
  const [s, setS] = useState({ open: false, text: 'مغلق' })
  useEffect(() => {
    const check = () => {
      const now = new Date()
      const cairo = new Date(now.toLocaleString('en-US', { timeZone: 'Africa/Cairo' }))
      const day = cairo.getDay()
      const hour = cairo.getHours() + cairo.getMinutes() / 60
      const weekday = day !== 5 && day !== 6
      const openH = hour >= 10 && hour < 14.5
      if (!weekday) setS({ open: false, text: 'مغلق - عطلة' })
      else if (hour < 10) setS({ open: false, text: 'يفتح 10 صباحاً' })
      else if (hour >= 14.5) setS({ open: false, text: 'انتهت الجلسة' })
      else if (weekday && openH) setS({ open: true, text: 'مفتوح الآن' })
      else setS({ open: false, text: 'مغلق' })
    }
    check()
    const id = setInterval(check, 60000)
    return () => clearInterval(id)
  }, [])
  return s
}

export default function App() {
  const [dark, setDark] = useState(true)
  const market = useMarketStatus()
  
  // Auth State
  const [user, setUser] = useState<any>(null)
  const [showAuth, setShowAuth] = useState(false)
  const [authMode, setAuthMode] = useState<'login' | 'signup'>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)

  // Articles
  const [articles, setArticles] = useState<any[]>([
    { title: 'لماذا ارتفع سهم COMI اليوم 5%؟ تحليل فني سريع', tag: 'تحليل', created_at: 'منذ ساعتين' },
    { title: 'أبو قير للأسمدة: هل الوقت مناسب للشراء؟', tag: 'توصية', created_at: 'منذ 4 ساعات' },
    { title: 'EGX30 يختبر مقاومة 28,500 - ماذا بعد؟', tag: 'خبر', created_at: 'منذ 6 ساعات' },
  ])
  const [newTitle, setNewTitle] = useState('')
  const [newTag, setNewTag] = useState('تحليل')

  useEffect(() => {
    const t = localStorage.getItem('borsa-theme')
    if (t) setDark(t === 'dark')

    // Auth listener
    if (supabase) {
      supabase.auth.getSession().then(({ data: { session } }: any) => setUser(session?.user ?? null))
      const { data: { subscription } } = supabase.auth.onAuthStateChange((_e: any, session: any) => setUser(session?.user ?? null))
      // Fetch articles
      supabase.from('articles').select('*').order('created_at', { ascending: false }).limit(10).then(({ data }: any) => { if (data && data.length) setArticles(data) })
      return () => subscription.unsubscribe()
    }
  }, [])

  const handleAuth = async () => {
    if (!supabase) return alert('Supabase مش متوصل - اتأكد من الـ .env')
    setLoading(true)
    try {
      if (authMode === 'signup') {
        const { error } = await supabase.auth.signUp({ email, password })
        if (error) throw error
        alert('تم إنشاء الحساب! شيك الإيميل لو محتاج تأكيد')
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password })
        if (error) throw error
      }
      setShowAuth(false)
      setEmail(''); setPassword('')
    } catch (e: any) { alert(e.message) }
    setLoading(false)
  }

  const handleLogout = async () => { if (supabase) await supabase.auth.signOut() }

  const addArticle = async () => {
    if (!newTitle.trim()) return
    if (!supabase) {
      setArticles([{ title: newTitle, tag: newTag, created_at: 'الآن' }, ...articles])
      setNewTitle('')
      return
    }
    const { data, error } = await supabase.from('articles').insert({ title: newTitle, tag: newTag }).select()
    if (!error && data) { setArticles(data.concat(articles)); setNewTitle('') }
    else if (error) { alert('لازم تعمل جدول articles في Supabase الأول - هبعتلك الـ SQL'); console.log(error) }
  }

  const displayName = user ? (user.email?.split('@')[0] || 'حسابي') : 'حسابي'

  return (
    <div dir="rtl" style={{ background: dark ? '#0a0a0b' : '#f5f5f7', color: dark ? 'white' : 'black', minHeight: '100vh', fontFamily: 'system-ui' }}>
      {/* Header */}
      <div style={{ position: 'sticky', top: 0, zIndex: 40, backdropFilter: 'blur(20px)', background: dark ? 'rgba(0,0,0,0.8)' : 'rgba(255,255,255,0.9)', borderBottom: `1px solid ${dark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)'}`, padding: '16px 24px' }}>
        <div style={{ maxWidth: '1400px', margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: 'linear-gradient(135deg,#4ade80,#16a34a)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, color: 'black' }}>EG</div>
            <div><div style={{ fontSize: '20px', fontWeight: 900 }}>بورصة بالمصري</div><div style={{ fontSize: '11px', opacity: 0.5 }}>EGX • مباشر</div></div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginRight: '16px', padding: '6px 12px', borderRadius: '20px', background: market.open ? 'rgba(34,197,94,0.1)' : 'rgba(239,68,68,0.1)', border: `1px solid ${market.open ? 'rgba(34,197,94,0.2)' : 'rgba(239,68,68,0.2)'}` }}>
              <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: market.open ? '#22c55e' : '#ef4444' }}></div>
              <span style={{ fontSize: '11px', fontWeight: 700, color: market.open ? '#22c55e' : '#ef4444' }}>{market.text}</span>
            </div>
          </div>
          <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
            <button onClick={() => { const n = !dark; setDark(n); localStorage.setItem('borsa-theme', n ? 'dark' : 'light') }} style={{ width: '40px', height: '40px', borderRadius: '50%', border: `1px solid ${dark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'}`, background: dark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)', cursor: 'pointer' }}>{dark ? '☀️' : '🌙'}</button>
            {user ? (
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '6px 14px', borderRadius: '20px', background: dark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.05)', border: `1px solid ${dark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'}` }}>
                  <div style={{ width: '24px', height: '24px', borderRadius: '50%', background: '#22c55e', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: 900, color: 'black' }}>{displayName[0]?.toUpperCase()}</div>
                  <span style={{ fontSize: '12px', fontWeight: 700 }}>{displayName}</span>
                </div>
                <button onClick={handleLogout} style={{ fontSize: '11px', opacity: 0.5, cursor: 'pointer', background: 'none', border: 'none', color: 'inherit' }}>خروج</button>
              </div>
            ) : (
              <button onClick={() => setShowAuth(true)} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 16px', borderRadius: '20px', background: dark ? 'white' : 'black', color: dark ? 'black' : 'white', border: 'none', cursor: 'pointer', fontWeight: 700, fontSize: '12px' }}>
                <span>👤</span> تسجيل دخول
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Auth Modal */}
      {showAuth && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(10px)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
          <div style={{ background: dark ? '#141415' : 'white', border: `1px solid ${dark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'}`, borderRadius: '24px', padding: '24px', width: '100%', maxWidth: '360px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3 style={{ fontWeight: 900, fontSize: '18px' }}>{authMode === 'login' ? 'تسجيل دخول' : 'إنشاء حساب'}</h3>
              <button onClick={() => setShowAuth(false)} style={{ background: 'none', border: 'none', fontSize: '20px', cursor: 'pointer', opacity: 0.5 }}>×</button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <input value={email} onChange={e => setEmail(e.target.value)} placeholder="الإيميل" style={{ padding: '12px 16px', borderRadius: '12px', border: `1px solid ${dark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'}`, background: dark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.02)', color: 'inherit', outline: 'none' }} />
              <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="الباسورد" style={{ padding: '12px 16px', borderRadius: '12px', border: `1px solid ${dark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'}`, background: dark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.02)', color: 'inherit', outline: 'none' }} />
              <button onClick={handleAuth} disabled={loading} style={{ padding: '12px', borderRadius: '12px', background: '#22c55e', color: 'black', border: 'none', fontWeight: 800, cursor: 'pointer', marginTop: '8px' }}>{loading ? '...' : authMode === 'login' ? 'دخول' : 'إنشاء حساب'}</button>
              <button onClick={() => setAuthMode(authMode === 'login' ? 'signup' : 'login')} style={{ background: 'none', border: 'none', fontSize: '12px', opacity: 0.6, cursor: 'pointer', color: 'inherit' }}>{authMode === 'login' ? 'معندكش حساب؟ إنشاء حساب' : 'عندك حساب؟ تسجيل دخول'}</button>
            </div>
          </div>
        </div>
      )}

      <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '24px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: window.innerWidth > 900 ? '2fr 1fr' : '1fr', gap: '24px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            <div style={{ background: dark ? '#141415' : 'white', border: `1px solid ${dark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)'}`, borderRadius: '24px', padding: '24px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '24px' }}><div><div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}><h2 style={{ fontSize: '24px', fontWeight: 900 }}>EGX30</h2><span style={{ padding: '4px 10px', borderRadius: '20px', background: 'rgba(34,197,94,0.15)', color: '#22c55e', fontSize: '12px', fontWeight: 700 }}>+1.24%</span></div><div style={{ fontSize: '13px', opacity: 0.4, marginTop: '4px' }}>المؤشر الرئيسي</div></div><div style={{ textAlign: 'left' }}><div style={{ fontSize: '32px', fontFamily: 'monospace', fontWeight: 700 }}>28,450.32</div><div style={{ fontSize: '13px', color: '#22c55e', fontFamily: 'monospace' }}>+342.5</div></div></div>
              <div style={{ height: '200px' }}><svg viewBox="0 0 400 100" style={{ width: '100%', height: '100%' }}><defs><linearGradient id="g" x1="0" x2="0" y1="0" y2="1"><stop offset="0%" stopColor="#22c55e" stopOpacity="0.3" /><stop offset="100%" stopColor="#22c55e" stopOpacity="0" /></linearGradient></defs><path d={`M0,${100 - (EGX[0] - 28350) / 3} ${EGX.map((v, i) => `L${(i / (EGX.length - 1)) * 400},${100 - (v - 28350) / 3}`).join(' ')}`} fill="none" stroke="#22c55e" strokeWidth="2.5" /><path d={`M0,${100 - (EGX[0] - 28350) / 3} ${EGX.map((v, i) => `L${(i / (EGX.length - 1)) * 400},${100 - (v - 28350) / 3}`).join(' ')} L400,100 L0,100 Z`} fill="url(#g)" /></svg></div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '16px' }}>
              {STOCKS.map((s) => (
                <div key={s.symbol} style={{ background: dark ? '#141415' : 'white', border: `1px solid ${dark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)'}`, borderRadius: '20px', padding: '16px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}><div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}><div style={{ width: '28px', height: '28px', borderRadius: '8px', background: s.pct >= 0 ? 'rgba(34,197,94,0.15)' : 'rgba(239,68,68,0.15)', color: s.pct >= 0 ? '#22c55e' : '#ef4444', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', fontWeight: 900 }}>{s.symbol[0]}</div><span style={{ fontFamily: 'monospace', fontWeight: 700, fontSize: '13px' }}>{s.symbol}</span></div><span style={{ padding: '2px 8px', borderRadius: '10px', fontSize: '11px', fontFamily: 'monospace', fontWeight: 700, background: s.pct >= 0 ? 'rgba(34,197,94,0.15)' : 'rgba(239,68,68,0.15)', color: s.pct >= 0 ? '#22c55e' : '#ef4444' }}>{s.pct > 0 ? '+' : ''}{s.pct}%</span></div>
                  <div style={{ fontSize: '11px', opacity: 0.4, marginTop: '8px' }}>{s.name}</div><div style={{ fontSize: '22px', fontFamily: 'monospace', fontWeight: 800, marginTop: '12px' }}>{s.price} <span style={{ fontSize: '12px' }}>ج.م</span></div>
                </div>
              ))}
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            <div style={{ background: dark ? '#141415' : 'white', border: `1px solid ${dark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)'}`, borderRadius: '24px', padding: '20px' }}>
              <div style={{ fontWeight: 700 }}>محفظتك {user ? `- ${displayName}` : '(سجل دخول)'}</div>
              {user ? (
                <>
                  <div style={{ fontSize: '32px', fontFamily: 'monospace', fontWeight: 900, marginTop: '8px' }}>124,530 <span style={{ fontSize: '14px' }}>ج.م</span></div>
                  <div style={{ marginTop: '12px' }}><span style={{ padding: '4px 10px', borderRadius: '20px', background: 'rgba(34,197,94,0.15)', color: '#22c55e', fontFamily: 'monospace', fontSize: '12px', fontWeight: 700 }}>+2,340 (+1.9%)</span></div>
                  <button style={{ width: '100%', marginTop: '20px', padding: '12px', borderRadius: '30px', background: dark ? 'white' : 'black', color: dark ? 'black' : 'white', border: 'none', fontWeight: 800, cursor: 'pointer' }}>عرض التفاصيل →</button>
                </>
              ) : (
                <div style={{ marginTop: '16px' }}><div style={{ fontSize: '13px', opacity: 0.5, lineHeight: 1.5 }}>سجل دخول عشان تشوف محفظتك الحقيقية ومكسبك وخسارتك</div><button onClick={() => setShowAuth(true)} style={{ width: '100%', marginTop: '16px', padding: '12px', borderRadius: '30px', background: '#22c55e', color: 'black', border: 'none', fontWeight: 800, cursor: 'pointer' }}>تسجيل دخول</button></div>
              )}
            </div>

            <div style={{ background: dark ? '#141415' : 'white', border: `1px solid ${dark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)'}`, borderRadius: '24px', padding: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}><div style={{ fontWeight: 700 }}>أحدث التحليلات</div><span style={{ fontSize: '10px', padding: '4px 8px', borderRadius: '10px', background: dark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)' }}>LIVE</span></div>
              
              {/* Add Article - Only for logged in */}
              {user && (
                <div style={{ marginTop: '16px', padding: '12px', borderRadius: '16px', background: dark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.03)', border: `1px dashed ${dark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'}` }}>
                  <input value={newTitle} onChange={e => setNewTitle(e.target.value)} placeholder="اكتب تحليل جديد..." style={{ width: '100%', padding: '10px 12px', borderRadius: '10px', border: `1px solid ${dark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'}`, background: dark ? 'rgba(0,0,0,0.3)' : 'white', color: 'inherit', fontSize: '13px', outline: 'none' }} />
                  <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
                    <select value={newTag} onChange={e => setNewTag(e.target.value)} style={{ padding: '6px 10px', borderRadius: '8px', border: `1px solid ${dark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'}`, background: dark ? '#0a0a0b' : 'white', color: 'inherit', fontSize: '11px' }}><option>تحليل</option><option>توصية</option><option>خبر</option></select>
                    <button onClick={addArticle} style={{ flex: 1, padding: '6px', borderRadius: '8px', background: '#22c55e', color: 'black', border: 'none', fontWeight: 700, fontSize: '12px', cursor: 'pointer' }}>نشر</button>
                  </div>
                </div>
              )}

              <div style={{ marginTop: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {articles.map((a, i) => (
                  <div key={i}><div style={{ display: 'flex', gap: '8px', marginBottom: '6px' }}><span style={{ fontSize: '10px', padding: '2px 8px', borderRadius: '10px', background: a.tag === 'تحليل' ? 'rgba(59,130,246,0.15)' : a.tag === 'توصية' ? 'rgba(34,197,94,0.15)' : 'rgba(249,115,22,0.15)', color: a.tag === 'تحليل' ? '#60a5fa' : a.tag === 'توصية' ? '#22c55e' : '#fb923c', fontWeight: 700 }}>{a.tag || 'خبر'}</span><span style={{ fontSize: '11px', opacity: 0.3 }}>{a.created_at ? (typeof a.created_at === 'string' && a.created_at.includes('منذ') ? a.created_at : new Date(a.created_at).toLocaleDateString('ar-EG')) : 'الآن'}</span></div><div style={{ fontSize: '13px', fontWeight: 700 }}>{a.title}</div></div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
