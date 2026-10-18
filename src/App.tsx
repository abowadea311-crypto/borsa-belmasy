import { useState, useEffect } from 'react'
import { supabase } from './lib/supabaseClient'
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'
import './App.css'

const chartData = [
  {t:'9:30',p:28500},{t:'10:00',p:28620},{t:'10:30',p:28580},
  {t:'11:00',p:28710},{t:'11:30',p:28800},{t:'12:00',p:28750},{t:'1:00',p:28890}
]

export default function App(){
  const [stocks,setStocks]=useState<any[]>([])
  useEffect(()=>{ 
    supabase.from('stocks').select('*').then(({data})=> {
      if(data?.length) setStocks(data)
    })
  },[])

  return (
    <div className="borsa" dir="rtl">
      <header>
        <h1>🇪🇬 بورصة بالمصري</h1>
        <p>EGX30 • تحديث لحظي من Supabase</p>
      </header>

      <div className="card chart">
        <h3>مؤشر EGX30</h3>
        <ResponsiveContainer width="100%" height={250}>
          <LineChart data={chartData}>
            <XAxis dataKey="t" stroke="#666"/>
            <YAxis stroke="#666"/>
            <Tooltip contentStyle={{background:'#222',border:'none'}}/>
            <Line type="monotone" dataKey="p" stroke="#00e676" strokeWidth={3} dot={false}/>
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="grid">
        {stocks.map(s=>(
          <div key={s.ticker} className="stock">
            <div className="row"><b>{s.ticker}</b><span className={s.change_percent>=0?'up':'down'}>{s.change_percent>0?'▲':'▼'} {s.change_percent}%</span></div>
            <div className="name">{s.name_ar}</div>
            <div className="price">{s.price} ج.م</div>
          </div>
        ))}
      </div>
    </div>
  )
}