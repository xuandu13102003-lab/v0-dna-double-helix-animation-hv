'use client'

import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react'

type StrokeState = 'pending' | 'drawing' | 'complete'
type Geometry = SVGPathElement | SVGCircleElement | SVGEllipseElement | SVGRectElement

const groups = ['plate', 'layers', 'cream', 'berries', 'candles', 'bubbles', 'fireworks', 'envelope'] as const
const message = 'Chúc người bạn thiên tài super cute siêu cấp tốt bụng tuổi mới luôn đầy năng lượng, giữ vững phong độ và ngủ cười khà khà thật nhiều. Hơn hết là nhớ ăn uống thật đầy đủ nhaaaaaaaa'

function Fireworks({ active }: { active: boolean }) {
  const ref = useRef<HTMLCanvasElement>(null)
  useEffect(() => {
    if (!active) return
    const canvas = ref.current; const ctx = canvas?.getContext('2d')
    if (!canvas || !ctx) return
    let frame = 0; let last = 0; const bursts: { x: number; y: number; age: number; phase: number }[] = []
    const resize = () => { const ratio = devicePixelRatio || 1; canvas.width = innerWidth * ratio; canvas.height = innerHeight * ratio; canvas.style.width = `${innerWidth}px`; canvas.style.height = `${innerHeight}px`; ctx.setTransform(ratio, 0, 0, ratio, 0, 0) }
    const draw = (time: number) => { if (time - last > 900 && bursts.length < 4) { bursts.push({ x: innerWidth * (.18 + Math.random() * .64), y: innerHeight * (.12 + Math.random() * .28), age: 0, phase: Math.random() * 6 }); last = time } ctx.clearRect(0, 0, innerWidth, innerHeight); bursts.forEach((b) => { b.age += 1; const opacity = Math.max(0, 1 - b.age / 90); ctx.strokeStyle = `rgba(141,235,255,${opacity * .7})`; ctx.lineWidth = .8; for (let i = 0; i < 12; i += 1) { const a = b.phase + i * Math.PI / 6; const r = b.age * .6; ctx.beginPath(); ctx.moveTo(b.x + Math.cos(a) * r * .2, b.y + Math.sin(a) * r * .2); ctx.lineTo(b.x + Math.cos(a) * r, b.y + Math.sin(a) * r); ctx.stroke() } }); for (let i = bursts.length - 1; i >= 0; i -= 1) if (bursts[i].age > 90) bursts.splice(i, 1); frame = requestAnimationFrame(draw) }
    resize(); addEventListener('resize', resize); frame = requestAnimationFrame(draw); return () => { cancelAnimationFrame(frame); removeEventListener('resize', resize) }
  }, [active])
  return <canvas ref={ref} className="fireworks" aria-hidden="true" />
}

export default function Page() {
  const [states, setStates] = useState<StrokeState[]>(groups.map(() => 'pending'))
  const [open, setOpen] = useState(false); const [drawing, setDrawing] = useState(true); const [pen, setPen] = useState<{ x: number; y: number } | null>(null)
  const geometries = useRef<Geometry[]>([]); const raf = useRef<number>(); const runId = useRef(0)
  const register = (element: Geometry | null) => { if (element && !geometries.current.includes(element)) geometries.current.push(element) }
  const replay = useCallback(() => {
    runId.current += 1; const id = runId.current; if (raf.current) cancelAnimationFrame(raf.current); setOpen(false); setPen(null); setDrawing(true); setStates(groups.map(() => 'pending'))
    const ordered = geometries.current
    ordered.forEach((element) => { const length = element.getTotalLength(); element.style.strokeDasharray = `${length}`; element.style.strokeDashoffset = `${length}`; element.style.opacity = '0' })
    let index = 0; let started = 0; let currentGroup = ''
    const draw = (now: number) => {
      if (id !== runId.current) return
      const element = ordered[index]
      if (!element) { setDrawing(false); setPen(null); return }
      if (element.dataset.group !== currentGroup) { currentGroup = element.dataset.group || ''; const groupIndex = groups.indexOf(currentGroup as typeof groups[number]); setStates((s) => s.map((v, i) => i === groupIndex ? 'drawing' : v)); started = now + (index ? 130 : 0) }
      const length = element.getTotalLength(); const duration = Math.max(650, length * 10); const progress = Math.min(1, Math.max(0, (now - started) / duration)); element.style.opacity = '1'; element.style.strokeDashoffset = `${length * (1 - progress)}`
      const point = element.getPointAtLength(length * progress); setPen({ x: point.x, y: point.y })
      if (progress >= 1) { const finishedGroup = element.dataset.group; index += 1; if (ordered[index]?.dataset.group !== finishedGroup) { const groupIndex = groups.indexOf(finishedGroup as typeof groups[number]); setStates((s) => s.map((v, i) => i === groupIndex ? 'complete' : v)) }; started = now + 120 }
      raf.current = requestAnimationFrame(draw)
    }
    raf.current = requestAnimationFrame(draw)
  }, [])
  useEffect(() => { const frame = requestAnimationFrame(replay); return () => { cancelAnimationFrame(frame); if (raf.current) cancelAnimationFrame(raf.current) } }, [replay])
  const completed = states.length === groups.length && states.every((state) => state === 'complete')
  const line = (group: string, d: string, className = '', children?: ReactNode) => <path ref={register} data-stroke data-group={group} className={className} d={d}>{children}</path>
  return <main className="gift-page">
    <Fireworks active={states[6] === 'complete'} />
    <header className="intro"><p className="eyebrow">A little line of magic</p><h1>For Bảo Ngọc</h1><p className="subtitle">Một chiếc bánh được vẽ riêng cho người bạn đồng hành TOEIC.</p></header>
    <section className="scene" aria-label="Bức tranh bánh sinh nhật đang được vẽ">
      <svg className="drawing" viewBox="0 0 700 600" role="img" aria-label="Một chiếc bánh sinh nhật được vẽ bằng nét mực"><defs><filter id="soft-glow" x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur stdDeviation="2.8" result="blur" /><feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge></filter><filter id="flame-glow" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="3" result="blur" /><feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge></filter></defs>
        {line('plate', 'M130 505c12 25 429 25 440 0')}{line('plate', 'M130 505c40-30 400-30 440 0')}
        {line('layers', 'M178 420v62c38 26 306 26 344 0v-62M178 420c24 29 320 29 344 0')}{line('layers', 'M205 345v75c35 24 255 24 290 0v-75M205 345c22 26 268 26 290 0')}{line('layers', 'M237 277v68c29 21 197 21 226 0v-68M237 277c22 24 204 24 226 0')}
        {line('cream', 'M237 277c8 32 17 36 27 0 10 42 23 48 34 0 10 28 25 34 37 0 12 42 27 43 40 0 13 31 29 34 42 0 11 37 27 38 46 0', 'cream-line')}{line('cream', 'M205 345c11 38 21 42 33 0 12 29 27 34 39 0 15 43 28 43 42 0 13 27 28 34 43 0 14 41 30 43 46 0 12 30 25 34 42 0', 'cream-line')}
        {line('berries', 'M275 270c-10-19 5-32 17-15 8-20 27-9 19 11')}{line('berries', 'M394 270c-10-19 5-32 17-15 8-20 27-9 19 11')}{line('berries', 'M298 236c-8-23 15-31 20-11 8-22 29-8 18 12')}
        {line('candles', 'M276 277V225M289 277V225M276 225h13M274 267c5 5 10 5 16 0', 'candle-blue')}{line('candles', 'M402 277V225M415 277V225M402 225h13M400 267c5 5 10 5 16 0', 'candle-lavender')}{line('candles', 'M282.5 225v-9M408.5 225v-9', 'wick')}
        {line('candles', 'M282.5 216c-7-10-1-19 5-27 3 9 11 14 7 23-2 5-7 8-12 4Z', 'flame flame-one', <animate attributeName="d" dur="1.35s" repeatCount="indefinite" values="M282.5 216c-7-10-1-19 5-27 3 9 11 14 7 23-2 5-7 8-12 4Z;M282.5 216c-2-13 6-18 10-28 7 10 6 18 1 25-3 5-7 6-11 3Z;M282.5 216c-8-8-5-18 3-27 1 10 10 13 8 22-1 5-6 8-11 5Z;M282.5 216c-7-10-1-19 5-27 3 9 11 14 7 23-2 5-7 8-12 4Z" />)}
        {line('candles', 'M408.5 216c-5-9 1-17 9-25 1 9 8 14 5 22-3 6-8 7-14 3Z', 'flame flame-two', <animate attributeName="d" dur="1.8s" begin=".25s" repeatCount="indefinite" values="M408.5 216c-5-9 1-17 9-25 1 9 8 14 5 22-3 6-8 7-14 3Z;M408.5 216c-1-12 7-18 12-25 4 11 2 18-4 24-3 4-6 5-8 1Z;M408.5 216c-7-8-3-17 5-26 2 9 10 15 6 23-3 5-7 7-11 3Z;M408.5 216c-5-9 1-17 9-25 1 9 8 14 5 22-3 6-8 7-14 3Z" />)}
        {line('bubbles', 'M130 220a18 18 0 1 0 .1 0', 'bubble bubble-one')}{line('bubbles', 'M560 270a25 25 0 1 0 .1 0', 'bubble bubble-two')}{line('bubbles', 'M108 335a9 9 0 1 0 .1 0', 'bubble bubble-three')}{line('bubbles', 'M598 375a12 12 0 1 0 .1 0', 'bubble bubble-four')}
        {line('fireworks', 'M92 194l14-14M608 194l-14-14M105 180l3 9 9 3-9 3-3 9-3-9-9-3 9-3Z')}
        <g className={`envelope ${completed ? 'envelope-ready' : ''}`} onClick={() => completed && setOpen(true)} role="button" tabIndex={completed ? 0 : -1} aria-disabled={!completed} aria-label="Mở lá thư">{line('envelope', 'M245 535h210v42H245z')}{line('envelope', 'm245 535 105 29 105-29M245 577l77-31M455 577l-77-31')}{<circle ref={register} data-stroke data-group="envelope" cx="350" cy="558" r="7" />}</g>
        {pen && <circle className="pen-tip" cx={pen.x} cy={pen.y} r="3" />}
      </svg>
      {completed && !open && <button className="hint" onClick={() => setOpen(true)}>Tap the letter to open</button>}
      {open && <div className="letter" role="dialog" aria-label="Lá thư chúc mừng"><button className="close" onClick={() => setOpen(false)} aria-label="Đóng thư">×</button><p className="letter-kicker">gửi Bảo Ngọc,</p><svg className="handwriting" viewBox="0 0 360 260" role="img" aria-label={message}><text x="180" y="25" textAnchor="middle"><tspan x="180" dy="0">Chúc người bạn thiên tài</tspan><tspan x="180" dy="31">super cute siêu cấp tốt bụng</tspan><tspan x="180" dy="31">tuổi mới luôn đầy năng lượng,</tspan><tspan x="180" dy="31">giữ vững phong độ và ngủ cười</tspan><tspan x="180" dy="31">khà khà thật nhiều. Hơn hết là</tspan><tspan x="180" dy="31">nhớ ăn uống thật đầy đủ nhaaaaaaaa</tspan></text></svg><p className="signature">— người bạn cùng học</p></div>}
    </section>
    <nav className="controls" aria-label="Điều khiển"><button onClick={replay}>Replay Drawing</button><button onClick={() => completed && setOpen(true)} disabled={!completed}>Open Letter</button></nav><p className="status" aria-live="polite">{drawing ? 'the pen is still wandering…' : 'all lines are in place'}</p>
  </main>
}
