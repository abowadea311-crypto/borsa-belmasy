import { useState, useEffect } from 'react'
import { createClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL
const key = import.meta.env.VITE_SUPABASE_ANON_KEY
let supabase: any = null
if (url && key) { try { supabase = createClient(url, key) } catch {} }

const ADMIN_EMAIL = 'abowadea311@gmail.com'

type Stock = { symbol: string; tv: string; name: string; price: string; desc: string }
const STOCKS: Stock[] = [
  { symbol: 'COMI', tv: 'EGX:COMI', name: 'البنك التجاري الدولي', price: '85.50', desc: 'أكبر بنك قطاع خاص' },
  { symbol: 'ABUK', tv: 'EGX:ABUK', name: 'أبو قير للأسمدة', price: '55.30', desc: 'أكبر شركة أسمدة' },
  { symbol: 'TMGH', tv: 'EGX:TMGH', name: 'طلعت مصطفى', price: '62.30', desc: 'أكبر مطور عقاري' },
  { symbol: 'HRHO', tv: 'EGX:HRHO', name: 'هيرميس', price: '18.70', desc: 'بنك الاستثمار الرائد' },
  { symbol: 'ETEL', tv: 'EGX:ETEL', name: 'المصرية للاتصالات', price: '32.10', desc: 'المشغل الرئيسي' },
  { symbol: 'FWRY', tv: 'EGX:FWRY', name: 'فوري', price: '8.95', desc: 'أكبر منصة مدفوعات' },
]
const EGX = [28400, 28420, 28390, 28450, 28480, 28430, 28510, 28490, 28530, 28600, 28550]

function TradingViewWidget({ symbol, theme }: { symbol: string, theme: 'light'|'dark' }) {
  const containerRef = useState<HTMLDivElement | null>(null)[0]
  const [ref, setRef] = useState<HTMLDivElement | null>(null)

  useEffect(() => {
    if (!ref) return
    ref.innerHTML = ''
    const script = document.createElement('script')
    script.src = 'https://s3.tradingview.com/tv.js'
    script.async = true
    script.onload = () => {
      // @ts-ignore
      if (window.TradingView) {
        // @ts-ignore
        new window.TradingView.widget({
          autosize: true,
          symbol: symbol,
          interval: "D",
          timezone: "Africa/Cairo",
          theme: theme,
          style: "1",
          locale: "ar_AE",
          toolbar_bg: theme === 'dark' ? "#141415" : "#f1f3f6",
          enable_publishing: false,
          allow_symbol_change: false,
          container_id: ref.id,
          hide_top_toolbar: false,
          save_image: false,
        })
      }
    }
    document.body.appendChild(script)
    return () => { try { document.body.removeChild(script) } catch {} }
  }, [ref, symbol, theme])

  return <div id={`tv-${symbol.replace(':','-')}-${Math.random()}`} ref={setRef} style={{ width:'100%', height:'400px' }} />
}

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
      else setS({open:true,text:'مفتوح الآن • أسعار حقيقية من TradingView'})
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
  const [page, setPage] = useState<'home'|'admin'|'stock'>('home')
  const [articles, setArticles] = useState<any[]>([
    { id: 1, title: 'لماذا ارتفع سهم COMI اليوم 5%؟', tag: 'تحليل', created_at: 'منذ ساعتين' },
    { id: 2, title: 'أبو قير للأسمدة: فرصة شراء؟', tag: 'توصية', created_at: 'منذ 4 ساعات' },
  ])
  const [newTitle, setNewTitle] = useState('')
  const [newTag, setNewTag] = useState('تحليل')
  const [editingId, setEditingId] = useState<any>(null)
  const [editTitle, setEditTitle] = useState('')
  const [editTag, setEditTag] = useState('تحليل')

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
  const openStock = (s: Stock) => { setSelected(s); setPage('stock'); window.scrollTo(0,0) }

  const addArticle = async () => {
    if (!newTitle.trim() || !isAdmin) return
    const { data, error } = await supabase?.from('articles').insert({ title: newTitle, tag: newTag }).select()
    if (!error && data) { setArticles([...data, ...articles]); setNewTitle('') }
  }
  const deleteArticle = async (id: any) => {
    if (!isAdmin || !confirm('متأكد؟')) return
    setArticles(articles.filter((a:any)=>a.id!==id))
    await supabase?.from('articles').delete().eq('id', id)
  }
  const saveEdit = async () => {
    if (!isAdmin || !editingId) return
    setArticles(articles.map((a:any)=> a.id===editingId ? {...a, title: editTitle, tag: editTag} : a))
    await supabase?.from('articles').update({ title: editTitle, tag: editTag }).eq('id', editingId)
    setEditingId(null)
  }

  if (page==='stock' && selected) {
    return (
      <div dir="rtl" style={{ background: dark?'#0a0a0b':'#f5f5f7', color: dark?'white':'black', minHeight:'100vh', fontFamily:'system-ui' }}>
        <div style={{ position:'sticky', top:0, zIndex:40, background: dark?'#0a0a0b':'white', borderBottom:`1px solid ${dark?'rgba(255,255,255,0.08)':'rgba(0,0,0,0.08)'}`, padding:'16px 24px' }}>
          <div style={{ maxWidth:'1200px', margin:'0 auto', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
            <button onClick={()=>setPage('home')} style={{ padding:'8px 16px', borderRadius:'20px', background: dark?'rgba(255,255,255,0.08)':'rgba(0,0,0,0.06)', border:'none', color:'inherit', cursor:'pointer', fontWeight:700 }}>← رجوع</button>
            <div style={{ display:'flex', gap:'8px', alignItems:'center' }}><span style={{ fontSize:'11px', padding:'4px 10px', borderRadius:'20px', background:'#22c55e', color:'black', fontWeight:800 }}>أسعار حقيقية • TradingView</span><span style={{ fontWeight:900 }}>{selected.symbol}</span></div>
          </div>
        </div>
        <div style={{ maxWidth:'1200px', margin:'0 auto', padding:'24px' }}>
          <div style={{ background: dark?'#141415':'white', borderRadius:'24px', padding:'24px', marginBottom:'24px' }}>
            <div style={{ display:'flex', gap:'16px', alignItems:'center' }}>
              <div style={{ width:'64px', height:'64px', borderRadius:'16px', background:'#22c55e', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'24px', fontWeight:900, color:'black' }}>{selected.symbol[0]}</div>
              <div><h1 style={{ fontSize:'28px', fontWeight:900 }}>{selected.symbol}</h1><p style={{ opacity:0.6 }}>{selected.name} • {selected.desc}</p><div style={{ fontSize:'11px', marginTop:'6px', padding:'4px 10px', borderRadius:'20px', background:'rgba(59,130,246,0.1)', color:'#60a5fa', display:'inline-block' }}>📈 بيانات حقيقية من بورصة مصر عبر TradingView (تأخير 15 دقيقة)</div></div>
            </div>
          </div>
          <div style={{ display:'grid', gridTemplateColumns:'2fr 1fr', gap:'24px' }}>
            <div style={{ background: dark?'#141415':'white', borderRadius:'24px', padding:'16px', overflow:'hidden' }}>
              <TradingViewWidget symbol={selected.tv} theme={dark ? 'dark' : 'light'} />
            </div>
            <div style={{ display:'flex', flexDirection:'column', gap:'24px' }}>
              <div style={{ background: dark?'#141415':'white', borderRadius:'24px', padding:'20px' }}>
                <h3 style={{ fontWeight:800, marginBottom:'12px' }}>معلومات حية</h3>
                <div style={{ fontSize:'12px', lineHeight:1.8, opacity:0.7 }}>
                  <div>• السعر الظاهر في الرسم هو السعر الحقيقي للسهم في البورصة المصرية</div>
                  <div>• الرسم مقدم من TradingView - أكبر منصة شارتات في العالم</div>
                  <div>• البيانات متأخرة 15 دقيقة حسب قوانين البورصة (النسخة المجانية)</div>
                  <div>• للحصول على أسعار لحظية بدون تأخير، نحتاج اشتراك مدفوع من البورصة</div>
                </div>
                <div style={{ marginTop:'16px', padding:'12px', borderRadius:'12px', background:'rgba(34,197,94,0.08)', border:'1px solid rgba(34,197,94,0.15)' }}>
                  <div style={{ fontSize:'11px', fontWeight:700, color:'#22c55e' }}>✅ ده سعر حقيقي! مش Simulation زي قبل كده</div>
                </div>
              </div>
              <div style={{ background: dark?'#141415':'white', borderRadius:'24px', padding:'20px' }}>
                <h3 style={{ fontWeight:800, marginBottom:'12px' }}>أخبار {selected.symbol}</h3>
                {articles.filter((a:any)=> a.title.toUpperCase().includes(selected.symbol)).map((a:any)=>(
                  <div key={a.id} style={{ padding:'10px 0', borderBottom:'1px solid rgba(255,255,255,0.06)', fontSize:'12px', fontWeight:700 }}>{a.title}</div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (page==='admin' && isAdmin) {
    return (
      <div dir="rtl" style={{ background: dark?'#0a0a0b':'#f5f5f7', color: dark?'white':'black', minHeight:'100vh', padding:'24px', maxWidth:'800px', margin:'0 auto' }}>
        <button onClick={()=>setPage('home')} style={{ padding:'10px 20px', borderRadius:'20px', background: dark?'white':'black', color: dark?'black':'white', border:'none', fontWeight:700, cursor:'pointer', marginBottom:'24px' }}>← الموقع</button>
        <h1 style={{ fontSize:'24px', fontWeight:900, marginBottom:'20px' }}>👑 لوحة تحكم - أسعار حقيقية مفعلة ✅</h1>
        <div style={{ background: dark?'#141415':'white', borderRadius:'20px', padding:'20px', border:'2px solid #22c55e' }}>
          <input value={newTitle} onChange={e=>setNewTitle(e.target.value)} placeholder="عنوان التحليل..." style={{ width:'100%', padding:'12px', borderRadius:'12px', boxSizing:'border-box' }} />
          <div style={{ display:'flex', gap:'8px', marginTop:'12px' }}><select value={newTag} onChange={e=>setNewTag(e.target.value)}><option>تحليل</option><option>توصية</option><option>خبر</option></select><button onClick={addArticle} style={{ flex:1, padding:'12px', borderRadius:'12px', background:'#22c55e', border:'none', fontWeight:900, cursor:'pointer' }}>نشر</button></div>
        </div>
        <div style={{ marginTop:'20px' }}>
          {articles.map((a:any)=>(
            <div key={a.id} style={{ padding:'12px', marginBottom:'8px', background: dark?'#141415':'white', borderRadius:'12px', display:'flex', justifyContent:'space-between' }}>
              <span style={{ fontSize:'13px', fontWeight:700 }}>{a.title}</span>
              <button onClick={()=>deleteArticle(a.id)} style={{ color:'#ef4444', background:'none', border:'none', cursor:'pointer' }}>حذف</button>
            </div>
          ))}
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
            <div><div style={{ fontSize:'20px', fontWeight:900 }}>بورصة بالمصري</div><div style={{ fontSize:'11px', opacity:0.5, display:'flex', alignItems:'center', gap:'6px' }}><span style={{ background:'#22c55e', color:'black', padding:'2px 8px', borderRadius:'10px', fontSize:'10px', fontWeight:800 }}>أسعار حقيقية</span> {market.text}</div></div>
          </div>
          <div style={{ display:'flex', gap:'12px', alignItems:'center' }}>
            {isAdmin && <button onClick={()=>setPage('admin')} style={{ padding:'8px 14px', borderRadius:'20px', background:'#22c55e', color:'black', border:'none', cursor:'pointer', fontWeight:800, fontSize:'12px' }}>👑 لوحة التحكم</button>}
            <button onClick={()=>{ const n=!dark; setDark(n); localStorage.setItem('borsa-theme', n?'dark':'light') }} style={{ width:'40px', height:'40px', borderRadius:'50%', border:'1px solid rgba(255,255,255,0.1)', cursor:'pointer' }}>{dark?'☀️':'🌙'}</button>
            {user ? <div style={{ fontSize:'12px', fontWeight:700 }}>{user.email?.split('@')[0]} 👑</div> : <button onClick={()=>setShowAuth(true)} style={{ padding:'8px 16px', borderRadius:'20px', background: dark?'white':'black', color: dark?'black':'white', border:'none', cursor:'pointer', fontWeight:700, fontSize:'12px' }}>👤 دخول</button>}
          </div>
        </div>
      </div>
      {showAuth && (
        <div onClick={()=>setShowAuth(false)} style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.7)', zIndex:100, display:'flex', alignItems:'center', justifyContent:'center' }}>
          <div onClick={e=>e.stopPropagation()} style={{ background: dark?'#141415':'white', borderRadius:'24px', padding:'24px', width:'360px' }}>
            <input value={email} onChange={e=>setEmail(e.target.value)} placeholder="الإيميل" style={{ width:'100%', padding:'12px', borderRadius:'12px', marginBottom:'12px', boxSizing:'border-box' }} />
            <input type="password" value={password} onChange={e=>setPassword(e.target.value)} placeholder="الباسورد" style={{ width:'100%', padding:'12px', borderRadius:'12px', marginBottom:'12px', boxSizing:'border-box' }} />
            <button onClick={handleAuth} style={{ width:'100%', padding:'12px', borderRadius:'12px', background:'#22c55e', border:'none', fontWeight:800, cursor:'pointer' }}>دخول</button>
          </div>
        </div>
      )}
      <div style={{ maxWidth:'1400px', margin:'0 auto', padding:'24px' }}>
        <div style={{ background:'rgba(59,130,246,0.08)', border:'1px solid rgba(59,130,246,0.15)', borderRadius:'16px', padding:'12px 16px', marginBottom:'20px', fontSize:'12px', display:'flex', alignItems:'center', gap:'8px' }}>
          <span style={{ background:'#22c55e', color:'black', padding:'2px 8px', borderRadius:'20px', fontWeight:800, fontSize:'10px' }}>جديد</span>
          <span>الآن الأسعار <b>حقيقية</b> من بورصة مصر عبر TradingView! دوس على أي سهم هتشوف الشارت الحقيقي!</span>
        </div>
        <div style={{ display:'grid', gridTemplateColumns:'2fr 1fr', gap:'24px' }}>
          <div style={{ display:'flex', flexDirection:'column', gap:'24px' }}>
            <div style={{ background: dark?'#141415':'white', borderRadius:'24px', padding:'24px' }}>
              <div style={{ display:'flex', justifyContent:'space-between', marginBottom:'16px' }}><h2 style={{ fontSize:'20px', fontWeight:900 }}>EGX30 • سعر حقيقي</h2><div style={{ fontSize:'11px', padding:'4px 10px', borderRadius:'20px', background:'#22c55e', color:'black', fontWeight:800 }}>TradingView Real</div></div>
              <div style={{ height:'300px', borderRadius:'16px', overflow:'hidden' }}>
                <TradingViewWidget symbol="EGX:EGX30" theme={dark ? 'dark' : 'light'} />
              </div>
            </div>
            <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(180px, 1fr))', gap:'16px' }}>
              {STOCKS.map((s) => (
                <div key={s.symbol} onClick={()=>openStock(s)} style={{ background: dark?'#141415':'white', borderRadius:'20px', padding:'16px', cursor:'pointer', border:'1px solid transparent' }} onMouseEnter={e=> (e.currentTarget as any).style.borderColor='#22c55e'} onMouseLeave={e=> (e.currentTarget as any).style.borderColor='transparent'}>
                  <div style={{ display:'flex', justifyContent:'space-between' }}><span style={{ fontWeight:700, fontFamily:'monospace' }}>{s.symbol}</span><span style={{ fontSize:'10px', padding:'3px 8px', borderRadius:'10px', background:'#22c55e', color:'black', fontWeight:800 }}>حقيقي</span></div>
                  <div style={{ fontSize:'11px', opacity:0.5, marginTop:'8px' }}>{s.name}</div>
                  <div style={{ fontSize:'14px', fontWeight:800, marginTop:'12px', opacity:0.6 }}>دوس لعرض الشارت الحقيقي →</div>
                  <div style={{ fontSize:'10px', marginTop:'8px', color:'#22c55e' }}>EGX:{s.symbol} • TradingView</div>
                </div>
              ))}
            </div>
          </div>
          <div style={{ display:'flex', flexDirection:'column', gap:'24px' }}>
            <div style={{ background: dark?'#141415':'white', borderRadius:'24px', padding:'20px' }}><div style={{ fontWeight:700 }}>💡 الأسعار الحقيقية</div><div style={{ fontSize:'12px', opacity:0.6, marginTop:'8px', lineHeight:1.6 }}>كل الرسوم البيانية الآن من TradingView بأسعار حقيقية من بورصة مصر EGX. التأخير 15 دقيقة في النسخة المجانية وهو نفس اللي كل المواقع المصرية بتعمله.</div></div>
            <div style={{ background: dark?'#141415':'white', borderRadius:'24px', padding:'20px' }}>
              <div style={{ fontWeight:700 }}>أحدث التحليلات</div>
              {articles.map((a:any)=>(
                <div key={a.id} style={{ padding:'12px 0', borderBottom:'1px solid rgba(255,255,255,0.05)' }}><div style={{ fontSize:'13px', fontWeight:700 }}>{a.title}</div></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
