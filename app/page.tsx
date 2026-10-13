'use client'

import { useCallback, useEffect, useRef, useState } from 'react'

const message = 'Chúc người bạn thiên tài super cute siêu cấp tốt bụng tuổi mới luôn đầy năng lượng, giữ vững phong độ và ngủ cười khà khà thật nhiều. Hơn hết là nhớ ăn uống thật đầy đủ nhaaaaaaaa'

function Fireworks({ active }: { active: boolean }) {
  const ref = useRef<HTMLCanvasElement>(null)
  useEffect(() => {
    if (!active) return
    const canvas = ref.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    let frame = 0
    let raf = 0
    const bursts: { x: number; y: number; age: number; hue: number }[] = []
    const resize = () => { canvas.width = window.innerWidth * devicePixelRatio; canvas.height = window.innerHeight * devicePixelRatio; ctx.scale(devicePixelRatio, devicePixelRatio) }
    resize(); window.addEventListener('resize', resize)
    const draw = () => {
      const w = window.innerWidth, h = window.innerHeight
      ctx.clearRect(0, 0, w, h)
      if (frame % 145 === 0) bursts.push({ x: w * (0.18 + Math.random() * 0.64), y: h * (0.16 + Math.random() * 0.32), age: 0, hue: Math.random() })
      bursts.forEach((b) => { b.age += 1; const opacity = Math.max(0, 1 - b.age / 75); ctx.strokeStyle = `rgba(61, 56, 51, ${opacity * .42})`; ctx.lineWidth = .8; for (let i = 0; i < 10; i++) { const a = i * Math.PI / 5 + b.hue; const r = b.age * (0.35 + (i % 3) * .08); ctx.beginPath(); ctx.moveTo(b.x + Math.cos(a) * r * .35, b.y + Math.sin(a) * r * .35); ctx.lineTo(b.x + Math.cos(a) * r, b.y + Math.sin(a) * r); ctx.stroke() } })
      for (let i = bursts.length - 1; i >= 0; i--) if (bursts[i].age > 75) bursts.splice(i, 1)
      frame++; raf = requestAnimationFrame(draw)
    }
    draw(); return () => { cancelAnimationFrame(raf); window.removeEventListener('resize', resize) }
  }, [active])
  return <canvas ref={ref} className="fireworks" aria-hidden="true" />
}

export default function Page() {
  const [progress, setProgress] = useState(0)
  const [open, setOpen] = useState(false)
  const [reduced, setReduced] = useState(false)
  const timer = useRef<ReturnType<typeof setInterval> | null>(null)
  const replay = useCallback(() => { setOpen(false); setProgress(0); if (timer.current) clearInterval(timer.current); timer.current = setInterval(() => setProgress((p) => { if (p >= 100) { if (timer.current) clearInterval(timer.current); return 100 }; return p + 1.6 }), 75) }, [])
  useEffect(() => { setReduced(window.matchMedia('(prefers-reduced-motion: reduce)').matches); replay(); return () => { if (timer.current) clearInterval(timer.current) } }, [replay])
  const stage = (n: number) => reduced || progress >= n
  return <main className="gift-page">
    <Fireworks active={stage(35)} />
    <header className="intro"><p className="eyebrow">A little line of magic</p><h1>For Bảo Ngọc</h1><p className="subtitle">Một chiếc bánh được vẽ riêng cho người bạn đồng hành TOEIC.</p></header>
    <section className="scene" aria-label="Bức tranh bánh sinh nhật đang được vẽ">
      <svg className="drawing" viewBox="0 0 700 600" role="img">
        <g className={stage(8) ? 'drawn' : 'hidden'}><ellipse cx="350" cy="505" rx="220" ry="28"/><path d="M130 505c12 25 429 25 440 0"/></g>
        <g className={stage(20) ? 'drawn cake-breathe' : 'hidden'}><path d="M178 420v62c38 26 306 26 344 0v-62"/><path d="M178 420c24 29 320 29 344 0"/><path d="M205 345v75c35 24 255 24 290 0v-75"/><path d="M205 345c22 26 268 26 290 0"/><path d="M237 277v68c29 21 197 21 226 0v-68"/><path d="M237 277c22 24 204 24 226 0"/></g>
        <g className={stage(33) ? 'drawn cream-flow' : 'hidden'}><path d="M237 277c8 32 17 36 27 0 10 42 23 48 34 0 10 28 25 34 37 0 12 42 27 43 40 0 13 31 29 34 42 0 11 37 27 38 46 0"/><path d="M205 345c11 38 21 42 33 0 12 29 27 34 39 0 15 43 28 43 42 0 13 27 28 34 43 0 14 41 30 43 46 0 12 30 25 34 42 0"/></g>
        <g className={stage(48) ? 'drawn decorations' : 'hidden'}><path d="M275 270c-10-19 5-32 17-15 8-20 27-9 19 11"/><path d="M394 270c-10-19 5-32 17-15 8-20 27-9 19 11"/><path d="M298 236c-8-23 15-31 20-11 8-22 29-8 18 12"/><path d="M280 225c-13-18-31-2-17 13"/></g>
        <g className={stage(62) ? 'drawn flames' : 'hidden'}><path d="M281 215v-63"/><path d="M407 215v-63"/><path d="M267 153h28"/><path d="M393 153h28"/><path d="M281 145c-18-25 14-30 5-52 27 21 18 40 9 52-8 10-8 10-14 0Z"/><path d="M407 145c-18-25 14-30 5-52 27 21 18 40 9 52-8 10-8 10-14 0Z"/></g>
        <g className={stage(76) ? 'drawn bubbles' : 'hidden'}><circle cx="130" cy="220" r="18"/><circle cx="560" cy="270" r="25"/><circle cx="108" cy="335" r="9"/><circle cx="598" cy="375" r="12"/><circle cx="170" cy="150" r="7"/></g>
        <g className={stage(88) ? 'drawn envelope' : 'hidden'} onClick={() => progress >= 100 && setOpen(true)} role="button" tabIndex={0} aria-label="Mở lá thư"><rect x="245" y="535" width="210" height="42" rx="2"/><path d="m245 535 105 29 105-29M245 577l77-31M455 577l-77-31"/><circle cx="350" cy="558" r="7"/></g>
        <g className={stage(96) ? 'drawn stars' : 'hidden'}><path d="m105 180 3 9 9 3-9 3-3 9-3-9-9-3 9-3Z"/><path d="m594 180 3 9 9 3-9 3-3 9-3-9-9-3 9-3Z"/><circle cx="155" cy="395" r="3"/><circle cx="550" cy="420" r="3"/></g>
        {progress > 0 && progress < 100 && <circle className="pen-tip" cx="350" cy={570 - progress * 2.8} r="2.5"/>}
      </svg>
      {progress >= 100 && !open && <button className="hint" onClick={() => setOpen(true)}>Tap the letter to open <span aria-hidden="true">✉</span></button>}
      {open && <div className="letter" role="dialog" aria-label="Lá thư chúc mừng"><button className="close" onClick={() => setOpen(false)} aria-label="Đóng thư">×</button><p className="letter-kicker">gửi Bảo Ngọc,</p><p className="message">{message}</p><p className="signature">— người bạn cùng học</p></div>}
    </section>
    <nav className="controls" aria-label="Điều khiển"><button onClick={replay}>Replay Drawing</button><button onClick={() => progress >= 100 && setOpen(true)} disabled={progress < 100}>Open Letter</button></nav>
    <p className="status" aria-live="polite">{progress < 100 ? 'the pen is still wandering…' : 'all lines are in place'}</p>
  </main>
}
