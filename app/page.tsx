'use client'

import { useCallback, useEffect, useRef, useState } from 'react'

const message = 'Chúc người bạn thiên tài super cute siêu cấp tốt bụng tuổi mới luôn đầy năng lượng, giữ vững phong độ và ngủ cười khà khà thật nhiều. Hơn hết là nhớ ăn uống thật đầy đủ nhaaaaaaaa'

type StrokeState = 'pending' | 'drawing' | 'complete'
type Geometry = SVGPathElement | SVGCircleElement | SVGEllipseElement | SVGRectElement

const strokeGroups = [
  { name: 'plate', duration: 700 },
  { name: 'layers', duration: 1500 },
  { name: 'cream', duration: 1100 },
  { name: 'berries', duration: 900 },
  { name: 'candles', duration: 1000 },
  { name: 'bubbles', duration: 850 },
  { name: 'fireworks', duration: 850 },
  { name: 'envelope', duration: 1000 },
]

function Fireworks({ active }: { active: boolean }) {
  const ref = useRef<HTMLCanvasElement>(null)
  useEffect(() => {
    if (!active) return
    const canvas = ref.current
    const ctx = canvas?.getContext('2d')
    if (!canvas || !ctx) return
    let raf = 0
    let elapsed = 0
    const bursts: { x: number; y: number; age: number; phase: number }[] = []
    const resize = () => {
      const ratio = window.devicePixelRatio || 1
      canvas.width = window.innerWidth * ratio
      canvas.height = window.innerHeight * ratio
      canvas.style.width = `${window.innerWidth}px`
      canvas.style.height = `${window.innerHeight}px`
      ctx.setTransform(ratio, 0, 0, ratio, 0, 0)
    }
    const draw = (time: number) => {
      elapsed = time
      const w = window.innerWidth
      const h = window.innerHeight
      ctx.clearRect(0, 0, w, h)
      if (Math.floor(time / 1000) !== Math.floor((time - 16) / 1000) && bursts.length < 5) bursts.push({ x: w * (0.2 + Math.random() * 0.6), y: h * (0.12 + Math.random() * 0.3), age: 0, phase: Math.random() * 6 })
      bursts.forEach((burst) => {
        burst.age += 1
        const opacity = Math.max(0, 1 - burst.age / 80)
        ctx.strokeStyle = `rgba(61, 56, 51, ${opacity * 0.45})`
        ctx.lineWidth = 0.8
        for (let i = 0; i < 12; i += 1) {
          const angle = burst.phase + i * Math.PI / 6
          const radius = burst.age * 0.55
          ctx.beginPath()
          ctx.moveTo(burst.x + Math.cos(angle) * radius * 0.2, burst.y + Math.sin(angle) * radius * 0.2)
          ctx.lineTo(burst.x + Math.cos(angle) * radius, burst.y + Math.sin(angle) * radius)
          ctx.stroke()
        }
      })
      for (let i = bursts.length - 1; i >= 0; i -= 1) if (bursts[i].age > 80) bursts.splice(i, 1)
      raf = requestAnimationFrame(draw)
    }
    resize()
    window.addEventListener('resize', resize)
    raf = requestAnimationFrame(draw)
    return () => { cancelAnimationFrame(raf); window.removeEventListener('resize', resize); void elapsed }
  }, [active])
  return <canvas ref={ref} className="fireworks" aria-hidden="true" />
}

export default function Page() {
  const [states, setStates] = useState<StrokeState[]>([])
  const [open, setOpen] = useState(false)
  const [reduced, setReduced] = useState(false)
  const [drawing, setDrawing] = useState(true)
  const [pen, setPen] = useState<{ x: number; y: number } | null>(null)
  const geometries = useRef<Geometry[]>([])
  const raf = useRef<number | null>(null)
  const runId = useRef(0)

  const replay = useCallback(() => {
    runId.current += 1
    if (raf.current) cancelAnimationFrame(raf.current)
    setOpen(false)
    setPen(null)
    setDrawing(true)
    setStates(strokeGroups.map(() => 'pending'))
    const id = runId.current
    const elements = geometries.current
    elements.forEach((element) => {
      const length = element.getTotalLength()
      element.style.strokeDasharray = `${length}`
      element.style.strokeDashoffset = `${length}`
      element.style.opacity = '0'
    })
    const grouped = strokeGroups.map((group) => elements.filter((element) => element.dataset.group === group.name))
    let groupIndex = 0
    let elementIndex = 0
    let started = 0
    const drawFrame = (now: number) => {
      if (id !== runId.current) return
      const group = grouped[groupIndex]
      if (!group) { setDrawing(false); setPen(null); return }
      const element = group[elementIndex]
      if (!element) { groupIndex += 1; elementIndex = 0; started = now + 130; setStates((current) => current.map((state, i) => i === groupIndex - 1 ? 'complete' : state)); raf.current = requestAnimationFrame(drawFrame); return }
      if (now < started) { raf.current = requestAnimationFrame(drawFrame); return }
      const length = element.getTotalLength()
      const duration = strokeGroups[groupIndex].duration
      const progress = Math.min(1, (now - started) / duration)
      if (progress === 0) setStates((current) => current.map((state, i) => i === groupIndex ? 'drawing' : state))
      element.style.opacity = '1'
      element.style.strokeDashoffset = `${length * (1 - progress)}`
      const point = element.getPointAtLength(length * progress)
      setPen({ x: point.x, y: point.y })
      if (progress >= 1) { elementIndex += 1; started = now + 55; setPen(null) }
      raf.current = requestAnimationFrame(drawFrame)
    }
    raf.current = requestAnimationFrame(drawFrame)
  }, [])

  useEffect(() => {
    setReduced(window.matchMedia('(prefers-reduced-motion: reduce)').matches)
    const id = requestAnimationFrame(() => replay())
    return () => { cancelAnimationFrame(id); if (raf.current) cancelAnimationFrame(raf.current) }
  }, [replay])

  const completed = states.length === strokeGroups.length && states.every((state) => state === 'complete')
  const register = (element: Geometry | null) => { if (element && !geometries.current.includes(element)) geometries.current.push(element) }
  const stroke = (group: string, children: React.ReactNode) => <g data-group={group}>{children}</g>
  const line = (group: string, d: string, className = '') => <path ref={register} data-stroke data-group={group} className={className} d={d} />
  const circle = (group: string, cx: number, cy: number, r: number, className = '') => <circle ref={register} data-stroke data-group={group} className={className} cx={cx} cy={cy} r={r} />

  return <main className="gift-page">
    <Fireworks active={states[6] === 'complete'} />
    <header className="intro"><p className="eyebrow">A little line of magic</p><h1>For Bảo Ngọc</h1><p className="subtitle">Một chiếc bánh được vẽ riêng cho người bạn đồng hành TOEIC.</p></header>
    <section className="scene" aria-label="Bức tranh bánh sinh nhật đang được vẽ">
      <svg className="drawing" viewBox="0 0 700 600" role="img" aria-label="Một chiếc bánh sinh nhật được vẽ bằng nét mực">
        {stroke('plate', <>{line('plate', 'M130 505c12 25 429 25 440 0')}<ellipse ref={register} data-stroke data-group="plate" cx="350" cy="505" rx="220" ry="28" /></>)}
        {stroke('layers', <>{line('layers', 'M178 420v62c38 26 306 26 344 0v-62')}<path ref={register} data-stroke data-group="layers" d="M178 420c24 29 320 29 344 0" />{line('layers', 'M205 345v75c35 24 255 24 290 0v-75')}<path ref={register} data-stroke data-group="layers" d="M205 345c22 26 268 26 290 0" />{line('layers', 'M237 277v68c29 21 197 21 226 0v-68')}<path ref={register} data-stroke data-group="layers" d="M237 277c22 24 204 24 226 0" /></>)}
        {stroke('cream', <>{line('cream', 'M237 277c8 32 17 36 27 0 10 42 23 48 34 0 10 28 25 34 37 0 12 42 27 43 40 0 13 31 29 34 42 0 11 37 27 38 46 0', 'cream-line')}<path ref={register} data-stroke data-group="cream" className="cream-line" d="M205 345c11 38 21 42 33 0 12 29 27 34 39 0 15 43 28 43 42 0 13 27 28 34 43 0 14 41 30 43 46 0 12 30 25 34 42 0" /></>)}
        {stroke('berries', <>{line('berries', 'M275 270c-10-19 5-32 17-15 8-20 27-9 19 11')}<path ref={register} data-stroke data-group="berries" d="M394 270c-10-19 5-32 17-15 8-20 27-9 19 11" />{line('berries', 'M298 236c-8-23 15-31 20-11 8-22 29-8 18 12')}<path ref={register} data-stroke data-group="berries" d="M280 225c-13-18-31-2-17 13" /></>)}
        {stroke('candles', <>{line('candles', 'M281 215v-63')}<path ref={register} data-stroke data-group="candles" d="M407 215v-63" />{line('candles', 'M267 153h28')}<path ref={register} data-stroke data-group="candles" d="M393 153h28" />{line('candles', 'M281 145c-18-25 14-30 5-52 27 21 18 40 9 52-8 10-8 10-14 0Z', 'flame')}<path ref={register} data-stroke data-group="candles" className="flame" d="M407 145c-18-25 14-30 5-52 27 21 18 40 9 52-8 10-8 10-14 0Z" /></>)}
        {stroke('bubbles', <>{circle('bubbles', 130, 220, 18, 'bubble bubble-one')}{circle('bubbles', 560, 270, 25, 'bubble bubble-two')}{circle('bubbles', 108, 335, 9, 'bubble bubble-three')}{circle('bubbles', 598, 375, 12, 'bubble bubble-four')}{circle('bubbles', 170, 150, 7, 'bubble bubble-five')}</>)}
        {stroke('fireworks', <>{line('fireworks', 'M92 194l14-14M608 194l-14-14')}<path ref={register} data-stroke data-group="fireworks" d="m105 180 3 9 9 3-9 3-3 9-3-9-9-3 9-3Z" /></>)}
        {stroke('envelope', <g className={`envelope ${completed ? 'envelope-ready' : ''}`} onClick={() => completed && setOpen(true)} onKeyDown={(event) => { if (event.key === 'Enter' && completed) setOpen(true) }} role="button" tabIndex={completed ? 0 : -1} aria-disabled={!completed} aria-label="Mở lá thư"><rect ref={register} data-stroke data-group="envelope" x="245" y="535" width="210" height="42" rx="2" /><path ref={register} data-stroke data-group="envelope" d="m245 535 105 29 105-29M245 577l77-31M455 577l-77-31" /><circle ref={register} data-stroke data-group="envelope" cx="350" cy="558" r="7" /></g>)}
        {pen && <circle className="pen-tip" cx={pen.x} cy={pen.y} r="3" />}
      </svg>
      {completed && !open && <button className="hint" onClick={() => setOpen(true)}>Tap the letter to open</button>}
      {open && <div className="letter" role="dialog" aria-label="Lá thư chúc mừng"><button className="close" onClick={() => setOpen(false)} aria-label="Đóng thư">×</button><p className="letter-kicker">gửi Bảo Ngọc,</p><p className="message">{message}</p><p className="signature">— người bạn cùng học</p></div>}
    </section>
    <nav className="controls" aria-label="Điều khiển"><button onClick={replay}>Replay Drawing</button><button onClick={() => completed && setOpen(true)} disabled={!completed}>Open Letter</button></nav>
    <p className="status" aria-live="polite">{drawing ? 'the pen is still wandering…' : 'all lines are in place'}</p>
  </main>
}
