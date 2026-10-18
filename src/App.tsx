import { useState, useEffect } from 'react'
import { createClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL
const key = import.meta.env.VITE_SUPABASE_ANON_KEY
let supabase: any = null
if (url && key) { try { supabase = createClient(url, key) } catch {} }

const ADMIN_EMAIL = 'abowadea311@gmail.com'

type Stock = { symbol: string; name: string; price: number; pct: number; high: number; low: number; vol: string; desc: string }
const STOCKS: Stock[] = [
  { symbol: 'COMI', name: 'البنك التجاري الدولي', price: 85.5, pct: 1.42, high: 86.2, low: 84.1, vol: '12.5M', desc: 'أكبر بنك قطاع خاص في مصر.' },
  { symbol: 'ABUK', name: 'أبو قير للأسمدة', price: 55.3, pct: -0.81, high: 56.0, low: 54.8, vol: '3.2M', desc: 'من أكبر شركات الأسمدة.' },
  { symbol: 'TMGH', name: 'طلعت مصطفى', price: 62.3, pct: 3.49, high: 63.1, low: 60.2, vol: '8.7M', desc: 'أكبر مطور عقاري.' },
  { symbol: 'HRHO', name: 'هيرميس', price: 18.7, pct: 0.81, high: 18.9, low: 18.4, vol: '5.1M', desc: 'بنك الاستثمار الرائد.' },
  { symbol: 'ETEL', name: 'المصرية للاتصالات', price: 32.1, pct: -0.62, high: 32.5, low: 31.8, vol: '2.4M', desc: 'المشغل الرئيسي للاتصالات.' },
  { symbol: 'FWRY', name: 'فوري', price: 8.95, pct: 4.07, high: 9.10, low: 8.60, vol: '15.3M', desc: 'أكبر منصة مدفوعات.' },
]
const EGX = [28400, 28420, 28390, 28450, 28480, 28430, 28510, 28490, 28530, 28600, 28550]

function useMarketStatus() {
  const [s, setS] = useState({ open: false, text: 'مغلق' })
  useEffect(() => {
    const check = () => {
      const now = new Date()
      const cairo = new Date(now.toLocaleString('en-US', { timeZone: 'Africa/Cairo' }))
      const day = cairo.getDay(); const hour = cairo.getHours() + cairo.getMinutes()/60
      if (day===5||day===6) setS({open:false,text:'مغلق - عطلة'})
      else if (hour<10) setS({open:false,text:'يفتح 10 صباحاً'})
      else if (hour>=14.5) setS({open:false,text:'انتهت الجلسة'})
      else setS({open:true,text:'مفتوح الآن'})
    }
    check(); const id=setInterval(check,60000); return()=>clearInterval(id)
  }, [])
  return s
}

export default function App() {
  const [dark, setDark] = useState(true)
  const market = useMarketStatus()
  const [user, setUser] = useState<any>(null)
  const [showAuth, setShowAuth] = useState(false)
  const [authMode, setAuthMode] = useState<'login'|'signup'>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [selected, setSelected] = useState<Stock|null>(null)
  const [page, setPage] = useState<'home'|'admin'>('home')
  const [articles, setArticles] = useState<any[]>([
    { id: 1, title: 'لماذا ارتفع سهم COMI اليوم 5%؟', tag: 'تحليل', created_at: 'منذ ساعتين' },
    { id: 2, title: 'أبو قير للأسمدة: فرصة شراء؟', tag: 'توصية', created_at: 'منذ 4 ساعات' },
    { id: 3, title: 'EGX30 يختبر 28,500 - ماذا بعد؟', tag: 'خبر', created_at: 'منذ 6 ساعات' },
  ])
  const [newTitle, setNewTitle] = useState('')
  const [newTag, setNewTag] = useState('تحليل')

  useEffect(() => {
    const t = localStorage.getItem('borsa-theme'); if (t) setDark(t==='dark')
    if (supabase) {
      supabase.auth.getSession().then(({data:{session}}:any)=>setUser(session?.user??null))
      supabase.auth.onAuthStateChange((_e:any,session:any)=>setUser(session?.user??null))
      supabase.from('articles').select('*').order('created_at',{ascending:false}).limit(20).then(({data}:any)=>{ if(data?.length) setArticles(data) })
    }
  }, [])

  const handleAuth = async () => {
    if (!supabase) return alert('Supabase مش متوصل')
    setLoading(true)
    try {
      if (authMode==='signup'){ const {error}=await supabase.auth.signUp({email,password}); if(error) throw error; alert('تم إنشاء الحساب!') }
      else { const {error}=await supabase.auth.signInWithPassword({email,password}); if(error) throw error }
      setShowAuth(false); setEmail(''); setPassword('')
    } catch(e:any){ alert(e.message) }
    setLoading(false)
  }

  const isAdmin = user?.email?.toLowerCase() === ADMIN_EMAIL.toLowerCase()
  const displayName = user ? (isAdmin ? 'Admin' : user.email?.split('@')[0]) : ''

  const addArticle = async () => {
    if (!newTitle.trim() || !isAdmin) return
    const newArt = { id: Date.now(), title: newTitle, tag: newTag, created_at: 'الآن' }
    if (!supabase) { setArticles([newArt, ...articles]); setNewTitle(''); return }
    const { data, error } = await supabase.from('articles').insert({ title: newTitle, tag: newTag }).select()
    if (!error && data) { setArticles([...data, ...articles]); setNewTitle('') }
    else if (error) { alert(error.message) }
  }

  const deleteArticle = async (id: any) => {
    if (!isAdmin) return
    if (!confirm('متأكد تحذف التحليل ده؟')) return
    setArticles(articles.filter((a:any)=>a.id!==id))
    if (supabase) await supabase.from('articles').delete().eq('id', id)
  }

  // لو حد مش ادمن وحاول يدخل /admin
  if (page==='admin' && !isAdmin) {
    return (
      <div dir="rtl" style={{ background: dark?'#0a0a0b':'#f5f5f7', color: dark?'white':'black', minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center', fontFamily:'system-ui' }}>
        <div style={{ textAlign:'center' }}>
          <div style={{ fontSize:'60px' }}>🔒</div>
          <h1 style={{ fontWeight:900, marginTop:'16px' }}>غير مصرح</h1>
          <p style={{ opacity:0.5, marginTop:'8px' }}>الصفحة دي للأدمن فقط</p>
          <button onClick={()=>setPage('home')} style={{ marginTop:'20px', padding:'10px 20px', borderRadius:'20px', background:'#22c55e', color:'black', border:'none', fontWeight:700, cursor:'pointer' }}>رجوع للرئيسية</button>
        </div>
      </div>
    )
  }

  // صفحة الادمن المنفصلة
  if (page==='admin' && isAdmin) {
    return (
      <div dir="rtl" style={{ background: dark?'#0a0a0b':'#f5f5f7', color: dark?'white':'black', minHeight:'100vh', fontFamily:'system-ui' }}>
        <div style={{ maxWidth:'800px', margin:'0 auto', padding:'24px' }}>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'32px' }}>
            <div style={{ display:'flex', gap:'12px', alignItems:'center' }}>
              <div style={{ width:'48px', height:'48px', borderRadius:'14px', background:'#22c55e', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'24px' }}>👑</div>
              <div><h1 style={{ fontSize:'24px', fontWeight:900 }}>لوحة تحكم الأدمن</h1><p style={{ fontSize:'12px', opacity:0.5 }}>أهلا {ADMIN_EMAIL}</p></div>
            </div>
            <button onClick={()=>setPage('home')} style={{ padding:'10px 20px', borderRadius:'20px', background: dark?'white':'black', color: dark?'black':'white', border:'none', fontWeight:700, cursor:'pointer' }}>← رجوع للموقع</button>
          </div>

          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:'16px', marginBottom:'24px' }}>
            <div style={{ background: dark?'#141415':'white', borderRadius:'16px', padding:'16px' }}><div style={{ fontSize:'11px', opacity:0.5 }}>إجمالي التحليلات</div><div style={{ fontSize:'28px', fontWeight:900 }}>{articles.length}</div></div>
            <div style={{ background: dark?'#141415':'white', borderRadius:'16px', padding:'16px' }}><div style={{ fontSize:'11px', opacity:0.5 }}>المستخدمين</div><div style={{ fontSize:'28px', fontWeight:900 }}>1</div></div>
            <div style={{ background: dark?'#141415':'white', borderRadius:'16px', padding:'16px' }}><div style={{ fontSize:'11px', opacity:0.5 }}>حالة السوق</div><div style={{ fontSize:'16px', fontWeight:700, color: market.open?'#22c55e':'#ef4444' }}>{market.text}</div></div>
          </div>

          <div style={{ background: dark?'#141415':'white', borderRadius:'20px', padding:'20px', marginBottom:'24px', border:'2px solid #22c55e' }}>
            <h3 style={{ fontWeight:800, marginBottom:'12px' }}>✍️ نشر تحليل جديد</h3>
            <input value={newTitle} onChange={e=>setNewTitle(e.target.value)} placeholder="اكتب عنوان التحليل هنا..." style={{ width:'100%', padding:'14px 16px', borderRadius:'12px', border:`1px solid ${dark?'rgba(255,255,255,0.1)':'rgba(0,0,0,0.1)'}`, background: dark?'rgba(255,255,255,0.05)':'rgba(0,0,0,0.02)', color:'inherit', outline:'none', fontSize:'14px', boxSizing:'border-box' }} />
            <div style={{ display:'flex', gap:'12px', marginTop:'12px' }}>
              <select value={newTag} onChange={e=>setNewTag(e.target.value)} style={{ padding:'12px 16px', borderRadius:'12px', border:`1px solid ${dark?'rgba(255,255,255,0.1)':'rgba(0,0,0,0.1)'}`, background: dark?'#141415':'white' }}><option>تحليل</option><option>توصية</option><option>خبر</option></select>
              <button onClick={addArticle} style={{ flex:1, padding:'12px', borderRadius:'12px', background:'#22c55e', color:'black', border:'none', fontWeight:900, cursor:'pointer', fontSize:'14px' }}>نشر الآن 🚀</button>
            </div>
          </div>

          <div style={{ background: dark?'#141415':'white', borderRadius:'20px', padding:'20px' }}>
            <h3 style={{ fontWeight:800, marginBottom:'16px' }}>📋 كل التحليلات ({articles.length})</h3>
            <div style={{ display:'flex', flexDirection:'column', gap:'12px' }}>
              {articles.map((a:any)=>(
                <div key={a.id} style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'12px', borderRadius:'12px', background: dark?'rgba(255,255,255,0.03)':'rgba(0,0,0,0.03)' }}>
                  <div><div style={{ fontSize:'13px', fontWeight:700 }}>{a.title}</div><div style={{ fontSize:'11px', opacity:0.5, marginTop:'4px' }}>{a.tag} • {a.created_at?.toString().slice(0,16) || 'الآن'}</div></div>
                  <button onClick={()=>deleteArticle(a.id)} style={{ padding:'6px 12px', borderRadius:'8px', background:'rgba(239,68,68,0.1)', color:'#ef4444', border:'none', cursor:'pointer', fontSize:'12px', fontWeight:700 }}>حذف</button>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div dir="rtl" style={{ background: dark?'#0a0a0b':'#f5f5f7', color: dark?'white':'black', minHeight:'100vh', fontFamily:'system-ui' }}>
      <div style={{ position:'sticky', top:0, zIndex:40, background: dark?'#0a0a0b':'white', borderBottom:`1px solid ${dark?'rgba(255,255,255,0.08)':'rgba(0,0,0,0.08)'}`, padding:'16px 24px' }}>
        <div style={{ maxWidth:'1400px', margin:'0 auto', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
          <div style={{ display:'flex', alignItems:'center', gap:'16px' }}>
            <div style={{ width:'40px', height:'40px', borderRadius:'12px', background:'linear-gradient(135deg,#4ade80,#16a34a)', display:'flex', alignItems:'center', justifyContent:'center', fontWeight:900, color:'black' }}>EG</div>
            <div><div style={{ fontSize:'20px', fontWeight:900 }}>بورصة بالمصري</div><div style={{ fontSize:'11px', opacity:0.5 }}>EGX • مباشر</div></div>
            <div style={{ display:'flex', alignItems:'center', gap:'8px', marginRight:'16px', padding:'6px 12px', borderRadius:'20px', background: market.open?'rgba(34,197,94,0.1)':'rgba(239,68,68,0.1)' }}>
              <div style={{ width:'8px', height:'8px', borderRadius:'50%', background: market.open?'#22c55e':'#ef4444' }}></div>
              <span style={{ fontSize:'11px', fontWeight:700, color: market.open?'#22c55e':'#ef4444' }}>{market.text}</span>
            </div>
          </div>
          <div style={{ display:'flex', gap:'12px', alignItems:'center' }}>
            {isAdmin && <button onClick={()=>setPage('admin')} style={{ padding:'8px 14px', borderRadius:'20px', background:'#22c55e', color:'black', border:'none', cursor:'pointer', fontWeight:800, fontSize:'12px' }}>👑 لوحة التحكم</button>}
            <button onClick={()=>{ const n=!dark; setDark(n); localStorage.setItem('borsa-theme', n?'dark':'light') }} style={{ width:'40px', height:'40px', borderRadius:'50%', border:`1px solid ${dark?'rgba(255,255,255,0.1)':'rgba(0,0,0,0.1)'}`, background: dark?'rgba(255,255,255,0.05)':'rgba(0,0,0,0.05)', cursor:'pointer' }}>{dark?'☀️':'🌙'}</button>
            {user ? (
              <div style={{ display:'flex', gap:'8px', alignItems:'center' }}>
                <div style={{ padding:'6px 14px', borderRadius:'20px', background: isAdmin?'#22c55e':'rgba(255,255,255,0.08)', color: isAdmin?'black':'inherit', fontSize:'12px', fontWeight:700 }}>{displayName} {isAdmin?'👑':''}</div>
                <button onClick={async()=>{ if(supabase) await supabase.auth.signOut(); setPage('home') }} style={{ fontSize:'11px', opacity:0.5, cursor:'pointer', background:'none', border:'none', color:'inherit' }}>خروج</button>
              </div>
            ) : (
              <button onClick={()=>setShowAuth(true)} style={{ padding:'8px 16px', borderRadius:'20px', background: dark?'white':'black', color: dark?'black':'white', border:'none', cursor:'pointer', fontWeight:700, fontSize:'12px' }}>👤 دخول</button>
            )}
          </div>
        </div>
      </div>

      {showAuth && (
        <div onClick={()=>setShowAuth(false)} style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.7)', zIndex:100, display:'flex', alignItems:'center', justifyContent:'center', padding:'20px' }}>
          <div onClick={e=>e.stopPropagation()} style={{ background: dark?'#141415':'white', borderRadius:'24px', padding:'24px', width:'100%', maxWidth:'360px' }}>
            <h3 style={{ fontWeight:900, fontSize:'18px', marginBottom:'20px' }}>{authMode==='login'?'تسجيل دخول':'إنشاء حساب'}</h3>
            <div style={{ display:'flex', flexDirection:'column', gap:'12px' }}>
              <input value={email} onChange={e=>setEmail(e.target.value)} placeholder="الإيميل" style={{ padding:'12px 16px', borderRadius:'12px', border:`1px solid ${dark?'rgba(255,255,255,0.1)':'rgba(0,0,0,0.1)'}`, background: dark?'rgba(255,255,255,0.05)':'rgba(0,0,0,0.02)', color:'inherit', outline:'none' }} />
              <input type="password" value={password} onChange={e=>setPassword(e.target.value)} placeholder="الباسورد" style={{ padding:'12px 16px', borderRadius:'12px', border:`1px solid ${dark?'rgba(255,255,255,0.1)':'rgba(0,0,0,0.1)'}`, background: dark?'rgba(255,255,255,0.05)':'rgba(0,0,0,0.02)', color:'inherit', outline:'none' }} />
              <button onClick={handleAuth} disabled={loading} style={{ padding:'12px', borderRadius:'12px', background:'#22c55e', color:'black', border:'none', fontWeight:800, cursor:'pointer' }}>{loading?'...':authMode==='login'?'دخول':'إنشاء حساب'}</button>
              <button onClick={()=>setAuthMode(authMode==='login'?'signup':'login')} style={{ background:'none', border:'none', fontSize:'12px', opacity:0.6, cursor:'pointer', color:'inherit' }}>{authMode==='login'?'معندكش حساب؟ إنشاء حساب':'عندك حساب؟ دخول'}</button>
            </div>
          </div>
        </div>
      )}

      {selected && (
        <div onClick={()=>setSelected(null)} style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.8)', zIndex:200, display:'flex', alignItems:'center', justifyContent:'center', padding:'20px' }}>
          <div onClick={e=>e.stopPropagation()} style={{ background: dark?'#141415':'white', borderRadius:'32px', width:'100%', maxWidth:'500px', overflow:'hidden' }}>
            <div style={{ padding:'24px', background: selected.pct>=0?'rgba(34,197,94,0.1)':'rgba(239,68,68,0.1)' }}>
              <div style={{ display:'flex', justifyContent:'space-between' }}><div style={{ display:'flex', gap:'12px', alignItems:'center' }}><div style={{ width:'48px', height:'48px', borderRadius:'14px', background: selected.pct>=0?'#22c55e':'#ef4444', display:'flex', alignItems:'center', justifyContent:'center', fontWeight:900, color:'black' }}>{selected.symbol[0]}</div><div><div style={{ fontSize:'22px', fontWeight:900 }}>{selected.symbol}</div><div style={{ fontSize:'13px', opacity:0.6 }}>{selected.name}</div></div></div><button onClick={()=>setSelected(null)} style={{ width:'32px', height:'32px', borderRadius:'50%', border:'none', background: dark?'rgba(255,255,255,0.1)':'rgba(0,0,0,0.1)', cursor:'pointer' }}>×</button></div>
              <div style={{ fontSize:'36px', fontWeight:900, marginTop:'20px' }}>{selected.price} ج.م <span style={{ fontSize:'14px', padding:'6px 12px', borderRadius:'20px', background: selected.pct>=0?'#22c55e':'#ef4444', color:'black' }}>{selected.pct}%</span></div>
            </div>
            <div style={{ padding:'24px' }}><div style={{ fontSize:'13px', opacity:0.7, marginBottom:'24px' }}>{selected.desc}</div><button onClick={()=>setSelected(null)} style={{ width:'100%', padding:'14px', borderRadius:'16px', background: dark?'white':'black', color: dark?'black':'white', border:'none', fontWeight:800, cursor:'pointer' }}>إغلاق</button></div>
          </div>
        </div>
      )}

      <div style={{ maxWidth:'1400px', margin:'0 auto', padding:'24px' }}>
        <div style={{ display:'grid', gridTemplateColumns:'2fr 1fr', gap:'24px' }}>
          <div style={{ display:'flex', flexDirection:'column', gap:'24px' }}>
            <div style={{ background: dark?'#141415':'white', borderRadius:'24px', padding:'24px' }}>
              <div style={{ display:'flex', justifyContent:'space-between', marginBottom:'24px' }}><div><h2 style={{ fontSize:'24px', fontWeight:900 }}>EGX30</h2><div style={{ fontSize:'13px', opacity:0.4 }}>المؤشر الرئيسي</div></div><div style={{ textAlign:'left' }}><div style={{ fontSize:'32px', fontWeight:700 }}>28,450.32</div><div style={{ fontSize:'13px', color:'#22c55e' }}>+342.5</div></div></div>
              <div style={{ height:'200px' }}><svg viewBox="0 0 400 100" style={{ width:'100%', height:'100%' }}><path d={`M0,${100-(EGX[0]-28350)/3} ${EGX.map((v,i)=>`L${(i/(EGX.length-1))*400},${100-(v-28350)/3}`).join(' ')}`} fill="none" stroke="#22c55e" strokeWidth="2.5" /></svg></div>
            </div>
            <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(180px, 1fr))', gap:'16px' }}>
              {STOCKS.map((s) => (
                <div key={s.symbol} onClick={()=>setSelected(s)} style={{ background: dark?'#141415':'white', borderRadius:'20px', padding:'16px', cursor:'pointer', border:'1px solid transparent' }}>
                  <div style={{ display:'flex', justifyContent:'space-between' }}><span style={{ fontWeight:700 }}>{s.symbol}</span><span style={{ fontSize:'11px', padding:'2px 8px', borderRadius:'10px', background: s.pct>=0?'rgba(34,197,94,0.15)':'rgba(239,68,68,0.15)', color: s.pct>=0?'#22c55e':'#ef4444' }}>{s.pct}%</span></div>
                  <div style={{ fontSize:'11px', opacity:0.4, marginTop:'8px' }}>{s.name}</div>
                  <div style={{ fontSize:'22px', fontWeight:800, marginTop:'12px' }}>{s.price} ج.م</div>
                </div>
              ))}
            </div>
          </div>
          <div style={{ display:'flex', flexDirection:'column', gap:'24px' }}>
            <div style={{ background: dark?'#141415':'white', borderRadius:'24px', padding:'20px' }}>
              <div style={{ fontWeight:700 }}>محفظتك</div>
              <div style={{ fontSize:'32px', fontWeight:900, marginTop:'8px' }}>124,530 ج.م</div>
            </div>
            <div style={{ background: dark?'#141415':'white', borderRadius:'24px', padding:'20px' }}>
              <div style={{ fontWeight:700, display:'flex', alignItems:'center', gap:'8px' }}><span style={{ width:'8px', height:'8px', background:'#22c55e', borderRadius:'50%', display:'inline-block' }}></span>أحدث التحليلات <span style={{ fontSize:'10px', background:'#22c55e', color:'black', padding:'2px 6px', borderRadius:'8px', fontWeight:800 }}>LIVE</span></div>
              <div style={{ marginTop:'20px', display:'flex', flexDirection:'column', gap:'16px' }}>
                {articles.map((a:any)=>(
                  <div key={a.id} style={{ paddingBottom:'12px', borderBottom:`1px solid ${dark?'rgba(255,255,255,0.05)':'rgba(0,0,0,0.05)'}` }}>
                    <div style={{ display:'flex', gap:'6px' }}><span style={{ fontSize:'10px', padding:'2px 8px', borderRadius:'10px', background:'rgba(59,130,246,0.15)', color:'#60a5fa' }}>{a.tag}</span><span style={{ fontSize:'10px', opacity:0.4 }}>{a.created_at?.toString().slice(0,16) || ''}</span></div>
                    <div style={{ fontSize:'13px', fontWeight:700, marginTop:'6px' }}>{a.title}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
