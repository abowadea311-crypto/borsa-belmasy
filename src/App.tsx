import { useState, useEffect, useRef } from 'react'
import { createClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL
const key = import.meta.env.VITE_SUPABASE_ANON_KEY
let supabase: any = null
if (url && key) { try { supabase = createClient(url, key) } catch {} }

const ADMIN_EMAIL = 'abowadea311@gmail.com'

type Stock = { symbol: string; name: string; price: number; pct: number; high: number; low: number; open: number; vol: string; cap: string; pe: string; desc: string; about: string; flash?: 'up'|'down'|null }
const INITIAL_STOCKS: Stock[] = [
  { symbol: 'COMI', name: 'البنك التجاري الدولي', price: 85.5, pct: 1.42, high: 86.2, low: 84.1, open: 84.5, vol: '12.5M', cap: '89.2B', pe: '8.2', desc: 'أكبر بنك قطاع خاص.', about: 'البنك التجاري الدولي هو أكبر بنك خاص في مصر.' },
  { symbol: 'ABUK', name: 'أبو قير للأسمدة', price: 55.3, pct: -0.81, high: 56.0, low: 54.8, open: 55.8, vol: '3.2M', cap: '45.1B', pe: '6.5', desc: 'من أكبر شركات الأسمدة.', about: 'أبو قير للأسمدة من أكبر منتجي الأسمدة.' },
  { symbol: 'TMGH', name: 'طلعت مصطفى', price: 62.3, pct: 3.49, high: 63.1, low: 60.2, open: 60.5, vol: '8.7M', cap: '72.3B', pe: '12.4', desc: 'أكبر مطور عقاري.', about: 'مجموعة طلعت مصطفى أكبر مطور عقاري.' },
  { symbol: 'HRHO', name: 'هيرميس', price: 18.7, pct: 0.81, high: 18.9, low: 18.4, open: 18.5, vol: '5.1M', cap: '18.9B', pe: '9.1', desc: 'بنك الاستثمار الرائد.', about: 'هيرميس بنك الاستثمار الرائد.' },
  { symbol: 'ETEL', name: 'المصرية للاتصالات', price: 32.1, pct: -0.62, high: 32.5, low: 31.8, open: 32.3, vol: '2.4M', cap: '54.7B', pe: '7.3', desc: 'المشغل الرئيسي.', about: 'المصرية للاتصالات المشغل الرئيسي.' },
  { symbol: 'FWRY', name: 'فوري', price: 8.95, pct: 4.07, high: 9.10, low: 8.60, open: 8.65, vol: '15.3M', cap: '15.2B', pe: '22.1', desc: 'أكبر منصة مدفوعات.', about: 'فوري أكبر منصة مدفوعات.' },
]
const INITIAL_EGX = [28400, 28420, 28390, 28450, 28480, 28430, 28510, 28490, 28530, 28600, 28550]

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
      else setS({open:true,text:'مفتوح الآن • LIVE'})
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
  const [timeframe, setTimeframe] = useState('1D')
  const [stocks, setStocks] = useState<Stock[]>(INITIAL_STOCKS)
  const [egx, setEgx] = useState(INITIAL_EGX)
  const [egxPrice, setEgxPrice] = useState(28450.32)
  const [lastUpdate, setLastUpdate] = useState(new Date())
  const [live, setLive] = useState(true)
  const intervalRef = useRef<any>(null)

  const [articles, setArticles] = useState<any[]>([
    { id: 1, title: 'لماذا ارتفع سهم COMI اليوم 5%؟', tag: 'تحليل', created_at: 'منذ ساعتين' },
    { id: 2, title: 'أبو قير للأسمدة: فرصة شراء؟', tag: 'توصية', created_at: 'منذ 4 ساعات' },
    { id: 3, title: 'EGX30 يختبر 28,500 - ماذا بعد؟', tag: 'خبر', created_at: 'منذ 6 ساعات' },
  ])
  const [newTitle, setNewTitle] = useState('')
  const [newTag, setNewTag] = useState('تحليل')
  const [editingId, setEditingId] = useState<any>(null)
  const [editTitle, setEditTitle] = useState('')
  const [editTag, setEditTag] = useState('تحليل')

  // LIVE PRICES SIMULATION
  useEffect(() => {
    if (!live || !market.open) return
    intervalRef.current = setInterval(() => {
      setStocks(prev => prev.map(s => {
        const change = (Math.random() - 0.48) * 0.6 // slight up bias
        const newPrice = Math.max(s.open * 0.95, Math.min(s.open * 1.05, +(s.price + change).toFixed(2)))
        const pct = +(((newPrice - s.open) / s.open) * 100).toFixed(2)
        return {
          ...s,
          price: newPrice,
          pct,
          high: Math.max(s.high, newPrice),
          low: Math.min(s.low, newPrice),
          flash: newPrice > s.price ? 'up' : newPrice < s.price ? 'down' : null
        }
      }))
      setEgxPrice(p => {
        const c = (Math.random() - 0.5) * 20
        return +(p + c).toFixed(2)
      })
      setEgx(prev => {
        const next = [...prev.slice(1), prev[prev.length-1] + (Math.random()-0.5)*30]
        return next
      })
      setLastUpdate(new Date())
      // clear flash after 800ms
      setTimeout(() => {
        setStocks(prev => prev.map(s => ({ ...s, flash: null })))
      }, 800)
    }, 2500)
    return () => clearInterval(intervalRef.current)
  }, [live, market.open])

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
  const openStock = (s: Stock) => { 
    const liveStock = stocks.find(st => st.symbol === s.symbol) || s
    setSelected(liveStock); setPage('stock'); window.scrollTo(0,0) 
  }

  const addArticle = async () => {
    if (!newTitle.trim() || !isAdmin) return
    if (!supabase) { setArticles([{ id: Date.now(), title: newTitle, tag: newTag, created_at: 'الآن' }, ...articles]); setNewTitle(''); return }
    const { data, error } = await supabase.from('articles').insert({ title: newTitle, tag: newTag }).select()
    if (!error && data) { setArticles([...data, ...articles]); setNewTitle('') } else if (error) alert(error.message)
  }
  const deleteArticle = async (id: any) => {
    if (!isAdmin || !confirm('متأكد تحذف؟')) return
    setArticles(articles.filter((a:any)=>a.id!==id))
    if (supabase) await supabase.from('articles').delete().eq('id', id)
  }
  const saveEdit = async () => {
    if (!isAdmin || !editingId || !editTitle.trim()) return
    setArticles(articles.map((a:any)=> a.id===editingId ? {...a, title: editTitle, tag: editTag} : a))
    if (supabase) await supabase.from('articles').update({ title: editTitle, tag: editTag }).eq('id', editingId)
    setEditingId(null)
  }

  if (page==='stock' && selected) {
    const currentLive = stocks.find(s => s.symbol === selected.symbol) || selected
    const chartData = timeframe==='1D' ? [currentLive.open, currentLive.open+0.3, currentLive.open+0.1, currentLive.open+0.8, currentLive.price-0.2, currentLive.price] 
      : timeframe==='1W' ? [80, 81, 80.5, 82, 84, 83, currentLive.price]
      : timeframe==='1M' ? [75, 77, 76, 79, 81, 80, 82, currentLive.price]
      : [70, 72, 75, 73, 78, 80, currentLive.price]
    return (
      <div dir="rtl" style={{ background: dark?'#0a0a0b':'#f5f5f7', color: dark?'white':'black', minHeight:'100vh', fontFamily:'system-ui' }}>
        <div style={{ position:'sticky', top:0, zIndex:40, background: dark?'#0a0a0b':'white', borderBottom:`1px solid ${dark?'rgba(255,255,255,0.08)':'rgba(0,0,0,0.08)'}`, padding:'16px 24px' }}>
          <div style={{ maxWidth:'1200px', margin:'0 auto', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
            <button onClick={()=>setPage('home')} style={{ display:'flex', alignItems:'center', gap:'8px', padding:'8px 16px', borderRadius:'20px', background: dark?'rgba(255,255,255,0.08)':'rgba(0,0,0,0.06)', border:'none', color:'inherit', cursor:'pointer', fontWeight:700 }}>← رجوع</button>
            <div style={{ display:'flex', gap:'8px', alignItems:'center' }}><div style={{ width:'8px', height:'8px', borderRadius:'50%', background:'#22c55e', animation:'pulse 1s infinite' }}></div><span style={{ fontSize:'11px', color:'#22c55e', fontWeight:800 }}>LIVE</span><span style={{ fontWeight:900, marginRight:'8px' }}>{currentLive.symbol}</span></div>
          </div>
        </div>
        <div style={{ maxWidth:'1200px', margin:'0 auto', padding:'24px' }}>
          <div style={{ background: dark?'#141415':'white', borderRadius:'24px', padding:'24px', marginBottom:'24px' }}>
            <div style={{ display:'flex', justifyContent:'space-between', flexWrap:'wrap', gap:'16px' }}>
              <div style={{ display:'flex', gap:'16px', alignItems:'center' }}>
                <div style={{ width:'64px', height:'64px', borderRadius:'16px', background: currentLive.pct>=0?'#22c55e':'#ef4444', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'24px', fontWeight:900, color:'black' }}>{currentLive.symbol[0]}</div>
                <div><h1 style={{ fontSize:'28px', fontWeight:900, fontFamily:'monospace' }}>{currentLive.symbol}</h1><p style={{ opacity:0.6 }}>{currentLive.name}</p></div>
              </div>
              <div style={{ textAlign:'left' }}>
                <div style={{ fontSize:'40px', fontWeight:900, fontFamily:'monospace', transition:'all 0.3s', background: currentLive.flash==='up' ? 'rgba(34,197,94,0.2)' : currentLive.flash==='down' ? 'rgba(239,68,68,0.2)' : 'transparent', borderRadius:'12px', padding:'0 8px' }}>{currentLive.price} <span style={{ fontSize:'16px' }}>ج.م</span></div>
                <div style={{ display:'inline-block', padding:'6px 14px', borderRadius:'20px', background: currentLive.pct>=0?'#22c55e':'#ef4444', color:'black', fontWeight:800 }}>{currentLive.pct>0?'+':''}{currentLive.pct}%</div>
              </div>
            </div>
          </div>
          <div style={{ display:'grid', gridTemplateColumns:'2fr 1fr', gap:'24px' }}>
            <div style={{ background: dark?'#141415':'white', borderRadius:'24px', padding:'24px' }}>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'20px' }}>
                <h3 style={{ fontWeight:800 }}>الرسم البياني • {live && market.open ? '🔴 LIVE' : '⏸️ متوقف'}</h3>
                <div style={{ display:'flex', gap:'6px' }}>
                  {['1D','1W','1M','1Y'].map(tf=>(
                    <button key={tf} onClick={()=>setTimeframe(tf)} style={{ padding:'6px 12px', borderRadius:'20px', border:'none', background: timeframe===tf ? '#22c55e' : dark?'rgba(255,255,255,0.08)':'rgba(0,0,0,0.06)', color: timeframe===tf ? 'black' : 'inherit', fontWeight:700, cursor:'pointer', fontSize:'12px' }}>{tf}</button>
                  ))}
                </div>
              </div>
              <div style={{ height:'260px' }}>
                <svg viewBox="0 0 400 120" style={{ width:'100%', height:'100%' }}>
                  <defs><linearGradient id="gLive" x1="0" x2="0" y1="0" y2="1"><stop offset="0%" stopColor={currentLive.pct>=0?'#22c55e':'#ef4444'} stopOpacity="0.3" /><stop offset="100%" stopColor={currentLive.pct>=0?'#22c55e':'#ef4444'} stopOpacity="0" /></linearGradient></defs>
                  <path d={`M0,${120-(chartData[0]-70)*4} ${chartData.map((v,i)=>`L${(i/(chartData.length-1))*400},${120-(v-70)*4}`).join(' ')}`} fill="none" stroke={currentLive.pct>=0?'#22c55e':'#ef4444'} strokeWidth="3" />
                  <path d={`M0,${120-(chartData[0]-70)*4} ${chartData.map((v,i)=>`L${(i/(chartData.length-1))*400},${120-(v-70)*4}`).join(' ')} L400,120 L0,120 Z`} fill="url(#gLive)" />
                </svg>
              </div>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr 1fr', gap:'12px', marginTop:'20px' }}>
                <div style={{ padding:'12px', borderRadius:'12px', background: dark?'rgba(255,255,255,0.05)':'rgba(0,0,0,0.04)' }}><div style={{ fontSize:'11px', opacity:0.5 }}>افتتاح</div><div style={{ fontWeight:800 }}>{currentLive.open}</div></div>
                <div style={{ padding:'12px', borderRadius:'12px', background: dark?'rgba(255,255,255,0.05)':'rgba(0,0,0,0.04)' }}><div style={{ fontSize:'11px', opacity:0.5 }}>أعلى</div><div style={{ fontWeight:800, color:'#22c55e' }}>{currentLive.high.toFixed(2)}</div></div>
                <div style={{ padding:'12px', borderRadius:'12px', background: dark?'rgba(255,255,255,0.05)':'rgba(0,0,0,0.04)' }}><div style={{ fontSize:'11px', opacity:0.5 }}>أدنى</div><div style={{ fontWeight:800, color:'#ef4444' }}>{currentLive.low.toFixed(2)}</div></div>
                <div style={{ padding:'12px', borderRadius:'12px', background: dark?'rgba(255,255,255,0.05)':'rgba(0,0,0,0.04)' }}><div style={{ fontSize:'11px', opacity:0.5 }}>حجم</div><div style={{ fontWeight:800 }}>{currentLive.vol}</div></div>
              </div>
            </div>
            <div style={{ display:'flex', flexDirection:'column', gap:'24px' }}>
              <div style={{ background: dark?'#141415':'white', borderRadius:'24px', padding:'20px' }}>
                <h3 style={{ fontWeight:800, marginBottom:'16px' }}>تداول LIVE</h3>
                <div style={{ fontSize:'11px', opacity:0.5, marginBottom:'12px' }}>آخر تحديث: {lastUpdate.toLocaleTimeString('ar-EG')}</div>
                <button onClick={()=>alert(`تمت إضافة ${currentLive.symbol} بسعر ${currentLive.price}`)} style={{ width:'100%', padding:'14px', borderRadius:'16px', background:'#22c55e', color:'black', border:'none', fontWeight:900, cursor:'pointer' }}>+ إضافة للمحفظة بسعر {currentLive.price}</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (page==='admin' && !isAdmin) {
    return <div dir="rtl" style={{ background: dark?'#0a0a0b':'#f5f5f7', color: dark?'white':'black', minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center' }}><div style={{ textAlign:'center' }}><div style={{ fontSize:'60px' }}>🔒</div><h1 style={{ fontWeight:900 }}>غير مصرح</h1><button onClick={()=>setPage('home')} style={{ marginTop:'20px', padding:'10px 20px', borderRadius:'20px', background:'#22c55e', color:'black', border:'none', fontWeight:700, cursor:'pointer' }}>رجوع</button></div></div>
  }

  if (page==='admin' && isAdmin) {
    return (
      <div dir="rtl" style={{ background: dark?'#0a0a0b':'#f5f5f7', color: dark?'white':'black', minHeight:'100vh', fontFamily:'system-ui' }}>
        <div style={{ maxWidth:'800px', margin:'0 auto', padding:'24px' }}>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'32px' }}>
            <div style={{ display:'flex', gap:'12px', alignItems:'center' }}><div style={{ width:'48px', height:'48px', borderRadius:'14px', background:'#22c55e', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'24px' }}>👑</div><div><h1 style={{ fontSize:'24px', fontWeight:900 }}>لوحة تحكم الأدمن</h1><p style={{ fontSize:'12px', opacity:0.5 }}>LIVE Prices شغالة 🔴</p></div></div>
            <button onClick={()=>setPage('home')} style={{ padding:'10px 20px', borderRadius:'20px', background: dark?'white':'black', color: dark?'black':'white', border:'none', fontWeight:700, cursor:'pointer' }}>← الموقع</button>
          </div>
          <div style={{ background: dark?'#141415':'white', borderRadius:'20px', padding:'20px', marginBottom:'24px', border:'2px solid #22c55e' }}>
            <h3 style={{ fontWeight:800, marginBottom:'12px' }}>✍️ نشر تحليل جديد</h3>
            <input value={newTitle} onChange={e=>setNewTitle(e.target.value)} placeholder="اكتب عنوان التحليل..." style={{ width:'100%', padding:'14px 16px', borderRadius:'12px', border:`1px solid ${dark?'rgba(255,255,255,0.1)':'rgba(0,0,0,0.1)'}`, background: dark?'rgba(255,255,255,0.05)':'rgba(0,0,0,0.02)', color:'inherit', outline:'none', boxSizing:'border-box' }} />
            <div style={{ display:'flex', gap:'12px', marginTop:'12px' }}>
              <select value={newTag} onChange={e=>setNewTag(e.target.value)} style={{ padding:'12px 16px', borderRadius:'12px' }}><option>تحليل</option><option>توصية</option><option>خبر</option></select>
              <button onClick={addArticle} style={{ flex:1, padding:'12px', borderRadius:'12px', background:'#22c55e', color:'black', border:'none', fontWeight:900, cursor:'pointer' }}>نشر الآن 🚀</button>
            </div>
          </div>
          <div style={{ background: dark?'#141415':'white', borderRadius:'20px', padding:'20px' }}>
            <h3 style={{ fontWeight:800, marginBottom:'16px' }}>📋 كل التحليلات ({articles.length})</h3>
            <div style={{ display:'flex', flexDirection:'column', gap:'12px' }}>
              {articles.map((a:any)=>(
                <div key={a.id} style={{ padding:'14px', borderRadius:'12px', background: editingId===a.id ? 'rgba(34,197,94,0.1)' : dark?'rgba(255,255,255,0.03)':'rgba(0,0,0,0.03)', border: editingId===a.id ? '1px solid #22c55e' : '1px solid transparent' }}>
                  {editingId===a.id ? (
                    <div><input value={editTitle} onChange={e=>setEditTitle(e.target.value)} style={{ width:'100%', padding:'10px', borderRadius:'8px', border:'1px solid #22c55e', boxSizing:'border-box' }} /><div style={{ display:'flex', gap:'8px', marginTop:'8px' }}><select value={editTag} onChange={e=>setEditTag(e.target.value)} style={{ padding:'8px', borderRadius:'8px' }}><option>تحليل</option><option>توصية</option><option>خبر</option></select><button onClick={saveEdit} style={{ flex:1, padding:'8px', borderRadius:'8px', background:'#22c55e', color:'black', border:'none', fontWeight:700, cursor:'pointer' }}>حفظ ✅</button><button onClick={()=>setEditingId(null)} style={{ padding:'8px 12px', borderRadius:'8px', background: dark?'rgba(255,255,255,0.1)':'rgba(0,0,0,0.1)', border:'none', cursor:'pointer' }}>إلغاء</button></div></div>
                  ) : (
                    <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}><div><div style={{ fontSize:'13px', fontWeight:700 }}>{a.title}</div><div style={{ fontSize:'11px', opacity:0.5 }}>{a.tag}</div></div><div style={{ display:'flex', gap:'6px' }}><button onClick={()=>{ setEditingId(a.id); setEditTitle(a.title); setEditTag(a.tag) }} style={{ padding:'6px 12px', borderRadius:'8px', background:'rgba(59,130,246,0.15)', color:'#60a5fa', border:'none', cursor:'pointer', fontSize:'12px', fontWeight:700 }}>تعديل</button><button onClick={()=>deleteArticle(a.id)} style={{ padding:'6px 12px', borderRadius:'8px', background:'rgba(239,68,68,0.1)', color:'#ef4444', border:'none', cursor:'pointer', fontSize:'12px' }}>حذف</button></div></div>
                  )}
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
      <style>{`@keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.3} } @keyframes flashUp { 0%{background:rgba(34,197,94,0.4)} 100%{background:transparent} } @keyframes flashDown { 0%{background:rgba(239,68,68,0.4)} 100%{background:transparent} }`}</style>
      <div style={{ position:'sticky', top:0, zIndex:40, background: dark?'#0a0a0b':'white', borderBottom:`1px solid ${dark?'rgba(255,255,255,0.08)':'rgba(0,0,0,0.08)'}`, padding:'16px 24px' }}>
        <div style={{ maxWidth:'1400px', margin:'0 auto', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
          <div style={{ display:'flex', alignItems:'center', gap:'16px' }}>
            <div style={{ width:'40px', height:'40px', borderRadius:'12px', background:'linear-gradient(135deg,#4ade80,#16a34a)', display:'flex', alignItems:'center', justifyContent:'center', fontWeight:900, color:'black' }}>EG</div>
            <div><div style={{ fontSize:'20px', fontWeight:900 }}>بورصة بالمصري</div><div style={{ fontSize:'11px', opacity:0.5, display:'flex', alignItems:'center', gap:'6px' }}><span style={{ width:'6px', height:'6px', borderRadius:'50%', background: live && market.open ? '#22c55e' : '#6b7280', display:'inline-block', animation: live && market.open ? 'pulse 1s infinite' : 'none' }}></span>{market.text} • {live ? 'LIVE' : 'PAUSED'} • آخر تحديث {lastUpdate.toLocaleTimeString('ar-EG')}</div></div>
          </div>
          <div style={{ display:'flex', gap:'12px', alignItems:'center' }}>
            <button onClick={()=>setLive(!live)} style={{ padding:'6px 12px', borderRadius:'20px', background: live ? '#22c55e' : 'rgba(255,255,255,0.1)', color: live ? 'black' : 'inherit', border:'none', cursor:'pointer', fontWeight:800, fontSize:'11px' }}>{live ? '🔴 LIVE ON' : '⏸️ PAUSED'}</button>
            {isAdmin && <button onClick={()=>setPage('admin')} style={{ padding:'8px 14px', borderRadius:'20px', background:'#22c55e', color:'black', border:'none', cursor:'pointer', fontWeight:800, fontSize:'12px' }}>👑 لوحة التحكم</button>}
            <button onClick={()=>{ const n=!dark; setDark(n); localStorage.setItem('borsa-theme', n?'dark':'light') }} style={{ width:'40px', height:'40px', borderRadius:'50%', border:`1px solid ${dark?'rgba(255,255,255,0.1)':'rgba(0,0,0,0.1)'}`, background: dark?'rgba(255,255,255,0.05)':'rgba(0,0,0,0.05)', cursor:'pointer' }}>{dark?'☀️':'🌙'}</button>
            {user ? <div style={{ display:'flex', gap:'8px', alignItems:'center' }}><div style={{ padding:'6px 14px', borderRadius:'20px', background: isAdmin?'#22c55e':'rgba(255,255,255,0.08)', color: isAdmin?'black':'inherit', fontSize:'12px', fontWeight:700 }}>{user.email?.split('@')[0]} {isAdmin?'👑':''}</div><button onClick={async()=>{ if(supabase) await supabase.auth.signOut(); setPage('home') }} style={{ fontSize:'11px', opacity:0.5, cursor:'pointer', background:'none', border:'none', color:'inherit' }}>خروج</button></div> : <button onClick={()=>setShowAuth(true)} style={{ padding:'8px 16px', borderRadius:'20px', background: dark?'white':'black', color: dark?'black':'white', border:'none', cursor:'pointer', fontWeight:700, fontSize:'12px' }}>👤 دخول</button>}
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
      <div style={{ maxWidth:'1400px', margin:'0 auto', padding:'24px' }}>
        <div style={{ display:'grid', gridTemplateColumns:'2fr 1fr', gap:'24px' }}>
          <div style={{ display:'flex', flexDirection:'column', gap:'24px' }}>
            <div style={{ background: dark?'#141415':'white', borderRadius:'24px', padding:'24px' }}>
              <div style={{ display:'flex', justifyContent:'space-between', marginBottom:'24px' }}><div><h2 style={{ fontSize:'24px', fontWeight:900, display:'flex', alignItems:'center', gap:'10px' }}>EGX30 <span style={{ fontSize:'10px', padding:'4px 8px', borderRadius:'20px', background:'#ef4444', color:'white', animation:'pulse 1s infinite' }}>🔴 LIVE</span></h2><div style={{ fontSize:'11px', opacity:0.5, marginTop:'4px' }}>يتحدث كل 2.5 ثانية • {lastUpdate.toLocaleTimeString('ar-EG')}</div></div><div style={{ textAlign:'left' }}><div style={{ fontSize:'32px', fontWeight:700, fontFamily:'monospace' }}>{egxPrice.toFixed(2)}</div><div style={{ fontSize:'13px', color:'#22c55e' }}>+{ (egxPrice-28100).toFixed(1)}</div></div></div>
              <div style={{ height:'200px' }}><svg viewBox="0 0 400 100" style={{ width:'100%', height:'100%' }}><path d={`M0,${100-(egx[0]-28350)/3} ${egx.map((v,i)=>`L${(i/(egx.length-1))*400},${100-(v-28350)/3}`).join(' ')}`} fill="none" stroke="#22c55e" strokeWidth="2.5" /></svg></div>
            </div>
            <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(180px, 1fr))', gap:'16px' }}>
              {stocks.map((s) => (
                <div key={s.symbol} onClick={()=>openStock(s)} style={{ background: dark?'#141415':'white', borderRadius:'20px', padding:'16px', cursor:'pointer', border:'1px solid transparent', animation: s.flash ? (s.flash==='up' ? 'flashUp 0.8s' : 'flashDown 0.8s') : 'none', transition:'all 0.2s' }}>
                  <div style={{ display:'flex', justifyContent:'space-between' }}><span style={{ fontWeight:700 }}>{s.symbol}</span><span style={{ fontSize:'11px', padding:'2px 8px', borderRadius:'10px', background: s.pct>=0?'rgba(34,197,94,0.15)':'rgba(239,68,68,0.15)', color: s.pct>=0?'#22c55e':'#ef4444' }}>{s.pct>0?'+':''}{s.pct}%</span></div>
                  <div style={{ fontSize:'11px', opacity:0.4, marginTop:'8px' }}>{s.name}</div>
                  <div style={{ fontSize:'22px', fontWeight:800, marginTop:'12px', fontFamily:'monospace' }}>{s.price.toFixed(2)} ج.م</div>
                  <div style={{ fontSize:'10px', marginTop:'8px', color: s.flash ? (s.flash==='up'?'#22c55e':'#ef4444') : '#6b7280', fontWeight:700 }}>{s.flash ? (s.flash==='up'?'▲ يرتفع الآن':'▼ ينخفض الآن') : '● LIVE'}</div>
                </div>
              ))}
            </div>
          </div>
          <div style={{ display:'flex', flexDirection:'column', gap:'24px' }}>
            <div style={{ background: dark?'#141415':'white', borderRadius:'24px', padding:'20px', border:'1px solid #22c55e' }}><div style={{ fontWeight:700, display:'flex', alignItems:'center', gap:'8px' }}><span style={{ width:'8px', height:'8px', background:'#22c55e', borderRadius:'50%', animation:'pulse 1s infinite', display:'inline-block' }}></span>السوق LIVE</div><div style={{ fontSize:'32px', fontWeight:900, marginTop:'8px', fontFamily:'monospace' }}>124,530 ج.م</div><div style={{ fontSize:'11px', opacity:0.5, marginTop:'4px' }}>محفظتك تتحدث مع الأسعار الحية</div></div>
            <div style={{ background: dark?'#141415':'white', borderRadius:'24px', padding:'20px' }}>
              <div style={{ fontWeight:700, display:'flex', alignItems:'center', gap:'8px' }}>أحدث التحليلات <span style={{ fontSize:'10px', padding:'3px 8px', borderRadius:'20px', background:'#22c55e', color:'black' }}>LIVE</span></div>
              <div style={{ marginTop:'20px', display:'flex', flexDirection:'column', gap:'16px' }}>
                {articles.map((a:any)=>(
                  <div key={a.id} style={{ paddingBottom:'12px', borderBottom:`1px solid ${dark?'rgba(255,255,255,0.05)':'rgba(0,0,0,0.05)'}` }}><div style={{ fontSize:'13px', fontWeight:700 }}>{a.title}</div><div style={{ fontSize:'11px', opacity:0.5, marginTop:'4px' }}>{a.tag}</div></div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
      <div style={{ position:'fixed', bottom:'20px', left:'50%', transform:'translateX(-50%)', background: dark?'#141415':'white', borderRadius:'30px', padding:'8px 16px', boxShadow:'0 10px 30px rgba(0,0,0,0.3)', border:`1px solid ${dark?'rgba(255,255,255,0.1)':'rgba(0,0,0,0.1)'}`, fontSize:'11px', display:'flex', alignItems:'center', gap:'12px', zIndex:50 }}>
        <span style={{ display:'flex', alignItems:'center', gap:'6px' }}><span style={{ width:'6px', height:'6px', background:'#22c55e', borderRadius:'50%', animation:'pulse 1s infinite' }}></span>أسعار حية</span>
        <span style={{ opacity:0.3 }}>|</span>
        <span>تحديث كل 2.5 ثانية</span>
        <span style={{ opacity:0.3 }}>|</span>
        <span style={{ color:'#22c55e', fontWeight:700 }}>3/3 خلصنا! 🎉</span>
      </div>
    </div>
  )
}
