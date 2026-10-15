'use client'

import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react'

type StrokeState = 'pending' | 'drawing' | 'complete'
type Geometry = SVGPathElement

function getGeometryLength(element: Geometry) {
  try {
    if (!element.isConnected) return null
    // Some browsers reject getTotalLength while an SVG path is fully hidden.
    // Measure it in its rendered state, then let the queue hide it again.
    const previousOpacity = element.style.opacity
    const previousVisibility = element.style.visibility
    element.style.opacity = '1'
    element.style.visibility = 'visible'
    element.style.display = 'inline'
    const length = element.getTotalLength()
    element.style.opacity = previousOpacity
    element.style.visibility = previousVisibility
    element.style.display = ''
    return Number.isFinite(length) && length > 0 ? length : null
  } catch {
    element.style.opacity = '0'
    return null
  }
}

const groups = ['plate', 'layers', 'cream', 'candles', 'berries', 'bubbles', 'fireworks', 'envelope'] as const

type Rim = { cx: number; cy: number; rx: number; ry: number }
const upperRim: Rim = { cx: 350, cy: 277, rx: 113, ry: 24 }
const middleRim: Rim = { cx: 350, cy: 345, rx: 145, ry: 26 }

const rimArc = ({ cx, cy, rx, ry }: Rim) => `M${cx - rx} ${cy} A${rx} ${ry} 0 0 0 ${cx + rx} ${cy}`
function frostingPath(rim: Rim, count: number, seed: number, softness = 1) {
  let state = seed >>> 0
  const random = () => { state = (state * 1664525 + 1013904223) >>> 0; return state / 4294967296 }
  const rimY = (x: number) => rim.cy + rim.ry * Math.sqrt(Math.max(0, 1 - ((x - rim.cx) / rim.rx) ** 2))
  const arcSamples = Array.from({ length: 257 }, (_, index) => { const t = Math.PI - (Math.PI * index) / 256; return { x: rim.cx + rim.rx * Math.cos(t), y: rim.cy + rim.ry * Math.sin(t) } })
  const arcLengths = [0]; for (let index = 1; index < arcSamples.length; index += 1) { const a = arcSamples[index - 1]; const b = arcSamples[index]; arcLengths.push(arcLengths[index - 1] + Math.hypot(b.x - a.x, b.y - a.y)) }
  const totalArc = arcLengths[arcLengths.length - 1]; const pointAtArc = (distance: number) => { const target = Math.max(0, Math.min(totalArc, distance)); let index = 1; while (index < arcLengths.length && arcLengths[index] < target) index += 1; const a = arcSamples[index - 1]; const b = arcSamples[index]; const mix = (target - arcLengths[index - 1]) / (arcLengths[index] - arcLengths[index - 1] || 1); return { x: a.x + (b.x - a.x) * mix, y: a.y + (b.y - a.y) * mix } }
  const left = rim.cx - rim.rx; const right = rim.cx + rim.rx; const spacing = totalArc / (count + 1)
  const waves: Array<{ center: number; period: number; depth: number; phase: number }> = []
  for (let index = 0; index < count; index += 1) {
    const center = spacing * (index + 1) + (random() - .5) * spacing * .24
    waves.push({ center, period: spacing * (1.02 + random() * .28) / softness, depth: (5.5 + random() * 8) * softness, phase: (random() - .5) * .07 * softness })
  }
  const samples = Math.ceil(right - left); const edgeGap = 13; let path = `M${left.toFixed(1)} ${rimY(left).toFixed(1)} L${left.toFixed(1)} ${(rimY(left) + edgeGap).toFixed(1)}`
  for (let index = 1; index <= samples; index += 1) {
    const x = left + index; const distance = (x - left) / (right - left)
    const waveIndex = Math.min(waves.length - 1, Math.floor(distance * waves.length)); const wave = waves[waveIndex]; const local = distance * waves.length - waveIndex + wave.phase; const smoothS = 0.5 - 0.5 * Math.cos(2 * Math.PI * local)
    const irregularity = 1 + 0.09 * Math.sin(distance * Math.PI * 11 + wave.phase * 9) + 0.05 * Math.sin(distance * Math.PI * 17 + wave.depth)
    const depthLimit = softness > 0.9 ? Number.POSITIVE_INFINITY : edgeGap - 1
    const depth = Math.min(depthLimit, wave.depth * smoothS * irregularity)
    path += ` Q${(x - 0.5).toFixed(1)} ${(rimY(x - 0.5) + edgeGap + depth).toFixed(1)} ${x.toFixed(1)} ${(rimY(x) + edgeGap + depth).toFixed(1)}`
  }
  path += ` L${right.toFixed(1)} ${(rimY(right) + edgeGap).toFixed(1)} L${right.toFixed(1)} ${rimY(right).toFixed(1)}`
  for (let index = 1; index <= samples; index += 1) {
    const x = right - index; path += ` L${x.toFixed(1)} ${rimY(x).toFixed(1)}`
  }
  return path
}
const upperFrosting = frostingPath(upperRim, 4, 173, 0.84)
const middleFrosting = frostingPath(middleRim, 6, 419, 1)

const message = 'Chúc người bạn thiên tài super cute siêu cấp tốt bụng tuổi mới luôn đầy năng lượng nhaa, giữ vững phong độ và ngủ cười khà khà thật nhiềuuu. Hơn hết là nhớ ăn uống thật đầy đủ nhaaaaaaaa 💖💖'

function ShootingStars() {
  const particles = useRef<(HTMLSpanElement | null)[]>([])

  useEffect(() => {
    const elements = particles.current.filter((element): element is HTMLSpanElement => Boolean(element))
    if (!elements.length) return
    let cancelled = false
    const frames = new Set<number>()
    const timers = new Set<number>()
    const launch = (element: HTMLSpanElement, delay: number) => {
      const timer = window.setTimeout(() => {
        timers.delete(timer)
        if (cancelled) return
        const fixed = elements.indexOf(element) === 0
        const motion = { x: fixed ? 22 : 8 + Math.random() * 70, y: fixed ? 12 : 9 + Math.random() * 25, dx: fixed ? 42 : (Math.random() > .5 ? 1 : -1) * (30 + Math.random() * 50), dy: fixed ? 25 : 18 + Math.random() * 32, duration: fixed ? 2200 : 1500 + Math.random() * 1300 }
        const dot = element.querySelector<HTMLElement>('.particle-dot')
        const trails = [...element.querySelectorAll<HTMLElement>('.particle-trail')]
        const history: { x: number; y: number; time: number }[] = []
        const angle = Math.atan2(motion.dy, motion.dx)
        element.style.left = `${motion.x}%`; element.style.top = `${motion.y}%`
        const started = performance.now()
        const update = (now: number) => {
          if (cancelled) return
          const progress = Math.min(1, (now - started) / motion.duration)
          const entrance = Math.min(1, progress / .1)
          const dotFade = progress <= .68 ? 1 : Math.max(0, 1 - (progress - .68) / .14)
          const x = motion.dx * progress; const y = motion.dy * progress
          history.push({ x, y, time: now })
          while (history.length && now - history[0].time > 260) history.shift()
          if (dot) { dot.style.opacity = `${Math.max(0, entrance * dotFade)}`; dot.style.transform = `translate(${x}px, ${y}px) scale(.85)` }
          trails.forEach((trail, index) => {
            const sample = history[Math.max(0, history.length - 1 - (index + 1) * 3)]
            const age = sample ? now - sample.time : Infinity
            const trailFadeStart = .68 + index * .07
            const trailFade = progress <= trailFadeStart ? 1 : Math.max(0, 1 - (progress - trailFadeStart) / .16)
            const alpha = sample ? Math.max(0, entrance * trailFade * (1 - age / 300) * (1 - index * .18)) : 0
            trail.style.opacity = `${alpha}`
            trail.style.transform = sample ? `translate(${sample.x}px, ${sample.y}px) rotate(${angle}rad)` : 'translate(0, 0)'
          })
          if (progress < 1) { const nextFrame = requestAnimationFrame(update); frames.add(nextFrame) }
          else { history.length = 0; if (dot) dot.style.opacity = '0'; trails.forEach((trail) => { trail.style.opacity = '0' }); if (!cancelled) launch(element, 1800 + Math.random() * 3600) }
        }
        const nextFrame = requestAnimationFrame(update); frames.add(nextFrame)
      }, delay)
      timers.add(timer)
    }
    elements.forEach((element, index) => launch(element, index * 1700))
    return () => { cancelled = true; frames.forEach(cancelAnimationFrame); timers.forEach(window.clearTimeout) }
  }, [])

  return <div className="shooting-stars" aria-hidden="true">
    {['particle-one', 'particle-two', 'particle-three', 'particle-four'].map((className, index) => <span key={className} ref={(element) => { particles.current[index] = element }} className={`shooting-particle ${className}`}><span className="particle-trail" /><span className="particle-trail" /><span className="particle-trail" /><span className="particle-dot" /></span>)}
  </div>
}

function Fireworks({ active }: { active: boolean }) {
  const ref = useRef<HTMLCanvasElement>(null)
  useEffect(() => {
    if (!active) return
    const canvas = ref.current; const ctx = canvas?.getContext('2d')
    if (!canvas || !ctx) return
    type TrailPoint = { x: number; y: number }
    type Rocket = { x: number; y: number; vx: number; vy: number; targetX: number; targetY: number; color: string; trail: TrailPoint[] }
    type Spark = { x: number; y: number; vx: number; vy: number; gravity: number; drag: number; life: number; age: number; size: number; alpha: number; color: string; trail: TrailPoint[] }
    const rockets: Rocket[] = []; const sparks: Spark[] = []; const colors = ['#8DEBFF', '#ffaacd', '#c9b8ff', '#ffc46b', '#f4e9d8']
    let frame = 0; let nextLaunch = 250 + Math.random() * 700; let last = performance.now()
    const resize = () => { const ratio = Math.min(2, devicePixelRatio || 1); canvas.width = innerWidth * ratio; canvas.height = innerHeight * ratio; canvas.style.width = `${innerWidth}px`; canvas.style.height = `${innerHeight}px`; ctx.setTransform(ratio, 0, 0, ratio, 0, 0) }
    const origin = () => ({ x: innerWidth / 2, y: innerHeight - 18 })
    const launch = (targetX = innerWidth * (.08 + Math.random() * .84), targetY = innerHeight * (.08 + Math.random() * .55)) => {
      const start = origin(); const flight = 700 + Math.random() * 650; const dx = targetX - start.x; const dy = targetY - start.y
      rockets.push({ x: start.x, y: start.y, vx: dx / flight * 16.67, vy: dy / flight * 16.67, targetX, targetY, color: colors[Math.floor(Math.random() * colors.length)], trail: [] })
    }
    const launchAtPointer = (event: MouseEvent) => launch(event.clientX, event.clientY)
    const burst = (rocket: Rocket) => { const count = 38 + Math.floor(Math.random() * 28); for (let i = 0; i < count; i += 1) { const angle = Math.random() * Math.PI * 2; const speed = (.8 + Math.random() * 3.2) * .82; sparks.push({ x: rocket.x, y: rocket.y, vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed - Math.random() * .5, gravity: .018 + Math.random() * .03, drag: .985 + Math.random() * .01, life: 520 + Math.random() * 680, age: 0, size: .4 + Math.random() * 1.02, alpha: .45 + Math.random() * .5, color: colors[Math.floor(Math.random() * colors.length)], trail: [] }) } }
    const drawTrail = (trail: TrailPoint[], color: string, alpha: number, width: number) => { if (trail.length < 2) return; ctx.lineCap = 'round'; ctx.shadowBlur = 0; for (let i = 1; i < trail.length; i += 1) { const p = trail[i - 1]; const q = trail[i]; ctx.strokeStyle = `${color}${Math.round(alpha * (i / trail.length) * 255).toString(16).padStart(2, '0')}`; ctx.lineWidth = width * (.55 + .45 * (i / trail.length)); ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.lineTo(q.x, q.y); ctx.stroke() } }
    const draw = (time: number) => {
      const dt = Math.min(2.2, Math.max(.5, (time - last) / 16.67)); last = time
      if (time >= nextLaunch && rockets.length < 3) { launch(); nextLaunch = time + 650 + Math.random() * 1500 }
      ctx.clearRect(0, 0, innerWidth, innerHeight)
      for (let i = rockets.length - 1; i >= 0; i -= 1) { const rocket = rockets[i]; rocket.trail.push({ x: rocket.x, y: rocket.y }); if (rocket.trail.length > 13) rocket.trail.shift(); rocket.x += rocket.vx * dt; rocket.y += rocket.vy * dt; const distance = Math.hypot(rocket.targetX - rocket.x, rocket.targetY - rocket.y); drawTrail(rocket.trail, '#f4e9d8', .41, 1.2); ctx.shadowBlur = 7; ctx.shadowColor = rocket.color; ctx.fillStyle = rocket.color; ctx.beginPath(); ctx.arc(rocket.x, rocket.y, 1.35, 0, Math.PI * 2); ctx.fill(); ctx.shadowBlur = 0; if (distance < 10) { burst(rocket); rockets.splice(i, 1) } }
      for (let i = sparks.length - 1; i >= 0; i -= 1) { const spark = sparks[i]; spark.age += 16.67 * dt; spark.vx *= Math.pow(spark.drag, dt); spark.vy = spark.vy * Math.pow(spark.drag, dt) + spark.gravity * dt; spark.x += spark.vx * dt; spark.y += spark.vy * dt; spark.trail.push({ x: spark.x, y: spark.y }); if (spark.trail.length > 5) spark.trail.shift(); const fade = Math.max(0, 1 - spark.age / spark.life); drawTrail(spark.trail, spark.color, fade * spark.alpha * .84, Math.max(.5, spark.size * .78)); ctx.shadowBlur = 5; ctx.shadowColor = spark.color; ctx.fillStyle = `${spark.color}${Math.round(fade * spark.alpha * 255).toString(16).padStart(2, '0')}`; ctx.beginPath(); ctx.arc(spark.x, spark.y, spark.size, 0, Math.PI * 2); ctx.fill(); ctx.shadowBlur = 0; if (spark.age >= spark.life) sparks.splice(i, 1) }
      frame = requestAnimationFrame(draw)
    }
    resize(); addEventListener('resize', resize); addEventListener('click', launchAtPointer); frame = requestAnimationFrame(draw)
    return () => { cancelAnimationFrame(frame); removeEventListener('resize', resize); removeEventListener('click', launchAtPointer); rockets.length = 0; sparks.length = 0 }
  }, [active])
  return <canvas ref={ref} className="fireworks" aria-hidden="true" />
}

export default function Page() {
  const [states, setStates] = useState<StrokeState[]>(groups.map(() => 'pending'))
  const [balloonDrawn, setBalloonDrawn] = useState<boolean[]>([false, false, false, false])
  const [balloonBusy, setBalloonBusy] = useState<boolean[]>([false, false, false, false])
  const [balloonFloating, setBalloonFloating] = useState<boolean[]>([false, false, false, false])
  const [open, setOpen] = useState(false); const [drawing, setDrawing] = useState(true); const [pen, setPen] = useState<{ x: number; y: number } | null>(null); const [penVisible, setPenVisible] = useState(true)
  const drawingRef = useRef<SVGSVGElement | null>(null)
  const geometries = useRef<Geometry[]>([]); const raf = useRef<number | undefined>(undefined); const balloonRaf = useRef<number | undefined>(undefined); const runId = useRef(0)
  const balloonGroups = useRef<(SVGGElement | null)[]>([])
  const activeBalloonDrawings = useRef(0)
  const balloonDrawnRef = useRef<boolean[]>([false, false, false, false])
  const balloonBusyRef = useRef<boolean[]>([false, false, false, false])
  const redrawQueue = useRef<number[]>([])
  const redrawJobs = useRef(new Map<number, () => void>())
  const redrawActive = useRef(false)
  const redrawFrame = useRef<number | undefined>(undefined)
  const redrawFadeTimer = useRef<number | undefined>(undefined)
  const balloonPhase = useRef<Array<'idle' | 'floating' | 'waiting' | 'drawing'>>(['idle', 'idle', 'idle', 'idle'])
  const scheduleRedraw = useRef<() => void>(() => {})
  const balloonGeometries = useRef<Geometry[][]>([[], [], [], []])
  const balloonStrings = useRef<(Geometry | null)[]>([])
  const balloonStartedAt = useRef<number[]>([0, 0, 0, 0])
  const balloonSwayBlendAt = useRef<number[]>([0, 0, 0, 0])
  const register = (element: Geometry | null) => { if (element && !geometries.current.includes(element)) geometries.current.push(element) }
  const registerBalloonGroup = (element: SVGGElement | null, index: number) => { balloonGroups.current[index] = element; if (element) balloonGeometries.current[index] = Array.from(element.querySelectorAll<Geometry>('[data-stroke]')) }
  const registerBalloonString = (element: Geometry | null, index: number) => { balloonStrings.current[index] = element; register(element) }
  useEffect(() => { balloonDrawnRef.current = balloonDrawn }, [balloonDrawn])
  useEffect(() => { balloonBusyRef.current = balloonBusy }, [balloonBusy])
  const replay = useCallback(() => {
    runId.current += 1; const id = runId.current; if (raf.current) cancelAnimationFrame(raf.current); setOpen(false); setPen(null); setPenVisible(true); redrawQueue.current = []; redrawJobs.current.clear(); redrawActive.current = false; if (redrawFrame.current) cancelAnimationFrame(redrawFrame.current); if (redrawFadeTimer.current) cancelAnimationFrame(redrawFadeTimer.current); redrawFrame.current = undefined; redrawFadeTimer.current = undefined; balloonPhase.current = ['idle', 'idle', 'idle', 'idle']; setDrawing(true); setStates(groups.map(() => 'pending')); balloonDrawnRef.current = [false, false, false, false]; balloonBusyRef.current = [false, false, false, false]; setBalloonDrawn([false, false, false, false]); setBalloonBusy([false, false, false, false]); setBalloonFloating([false, false, false, false]); balloonStartedAt.current = [0, 0, 0, 0]; balloonSwayBlendAt.current = [0, 0, 0, 0]
    const groupOrder = new Map(groups.map((group, index) => [group, index]))
    const ordered = geometries.current
      .filter((element) => getGeometryLength(element) !== null)
      .sort((a, b) => (groupOrder.get((a.dataset.group || '') as typeof groups[number]) ?? 99) - (groupOrder.get((b.dataset.group || '') as typeof groups[number]) ?? 99))
    const lengths = ordered.map((element) => getGeometryLength(element) ?? 1)
    const gap = 24
    const available = 30000
    const minimumStrokeDuration = 24
    const lengthBudget = Math.max(1, available - gap * Math.max(0, ordered.length - 1) - minimumStrokeDuration * ordered.length)
    const pixelsPerMillisecond = lengths.reduce((sum, length) => sum + length, 0) / lengthBudget
    ordered.forEach((element, pathIndex) => {
      const length = lengths[pathIndex]
      element.style.strokeDasharray = `${length}`
      element.style.strokeDashoffset = `${length}`
      element.style.opacity = '0'
    })
    let index = 0; let started = 0; let currentGroup = ''
    const draw = (now: number) => {
      if (id !== runId.current) return
      const element = ordered[index]
      if (!element) { setDrawing(false); setPen(null); setPenVisible(false); return }
      if (element.dataset.group !== currentGroup) {
        currentGroup = element.dataset.group || ''
        const groupIndex = groups.indexOf(currentGroup as typeof groups[number])
        setStates((s) => s.map((v, i) => i === groupIndex ? 'drawing' : v))
        started = now + (index ? gap : 0)
      }
      const length = lengths[index]
      const duration = Math.max(minimumStrokeDuration, length / pixelsPerMillisecond)
      const progress = Math.min(1, Math.max(0, (now - started) / duration))
      element.style.opacity = '1'
      element.style.strokeDashoffset = `${length * (1 - progress)}`
      const point = element.getPointAtLength(length * progress)
      const svg = drawingRef.current
      const elementMatrix = element.getScreenCTM()
      const svgMatrix = svg?.getScreenCTM()
      if (svg && elementMatrix && svgMatrix) {
        const screenPoint = new DOMPoint(point.x, point.y).matrixTransform(elementMatrix)
        const svgPoint = screenPoint.matrixTransform(svgMatrix.inverse())
        setPen({ x: svgPoint.x, y: svgPoint.y })
      } else {
        setPen({ x: point.x, y: point.y })
      }
      if (progress >= 1) {
        element.style.strokeDashoffset = '0'
        const balloonIndex = balloonStrings.current.indexOf(element)
        if (balloonIndex >= 0) { const completedAt = performance.now(); balloonStartedAt.current[balloonIndex] = completedAt; balloonSwayBlendAt.current[balloonIndex] = completedAt; setBalloonDrawn((drawn) => drawn[balloonIndex] ? drawn : drawn.map((value, index) => index === balloonIndex ? true : value)) }
        const finishedGroup = element.dataset.group
        index += 1
        if (ordered[index]?.dataset.group !== finishedGroup) {
          const groupIndex = groups.indexOf(finishedGroup as typeof groups[number])
          setStates((s) => s.map((v, i) => i === groupIndex ? 'complete' : v))
        }
        if (index >= ordered.length) {
          const groupIndex = groups.indexOf(finishedGroup as typeof groups[number])
          setStates((s) => s.map((v, i) => i === groupIndex ? 'complete' : v))
        }
        started = now + gap
      }
      raf.current = requestAnimationFrame(draw)
    }
    raf.current = requestAnimationFrame(draw)
  }, [])
  useEffect(() => {
    let frame = 0
    let cancelled = false
    const start = () => { if (!cancelled) frame = requestAnimationFrame(replay) }
    if ('fonts' in document) document.fonts.ready.then(start)
    else start()
    return () => { cancelled = true; cancelAnimationFrame(frame); if (raf.current) cancelAnimationFrame(raf.current) }
  }, [replay])
  const completed = states.length === groups.length && states.every((state) => state === 'complete')
  scheduleRedraw.current = () => {
    if (redrawActive.current) return
    const next = redrawQueue.current.shift()
    if (next === undefined) return
    const job = redrawJobs.current.get(next)
    redrawJobs.current.delete(next)
    if (!job) { balloonPhase.current[next] = 'idle'; scheduleRedraw.current(); return }
    redrawActive.current = true
    job()
  }
  const clickBalloon = useCallback((index: number) => {
    if (!balloonDrawnRef.current[index] || balloonBusyRef.current[index] || balloonPhase.current[index] !== 'idle') return
    const group = balloonGroups.current[index]; const paths = balloonGeometries.current[index]
    if (!group || !paths.length) return
    const bounds = group.getBoundingClientRect(); const sizeFactor = Math.max(.72, Math.min(1.35, bounds.height / 180)); const drift = (index % 2 === 0 ? 1 : -1) * (12 + Math.random() * 12); const exitDistance = -(bounds.top + bounds.height + 32); const flightDuration = 1500 + sizeFactor * 320 + Math.random() * 220
    balloonPhase.current[index] = 'floating'; balloonBusyRef.current[index] = true; setBalloonBusy((busy) => busy.map((value, i) => i === index ? true : value)); setBalloonFloating((floating) => floating.map((value, i) => i === index ? true : value))
    const startedAt = performance.now(); const tugDuration = 150; const startTransform = group.getAttribute('transform') || ''
    const animateFlight = (now: number) => {
      const elapsed = now - startedAt
      if (elapsed < tugDuration) {
        const tug = Math.sin((elapsed / tugDuration) * Math.PI) * 5
        group.style.transform = `translate(0px, ${tug}px) scale(1.035, .965)`
        requestAnimationFrame(animateFlight); return
      }
      const progress = Math.min(1, (elapsed - tugDuration) / flightDuration); const eased = progress * progress * (.9 + .1 * progress); const sway = Math.sin(progress * Math.PI * 2.2) * drift; const wobble = Math.sin(progress * Math.PI * 7 + index) * 1.8; const tilt = Math.atan2(exitDistance * .08, drift) * 0.35 + wobble
      group.style.transform = `translate(${sway}px, ${exitDistance * eased}px) rotate(${tilt}deg)`
      if (progress < 1) { requestAnimationFrame(animateFlight); return }
      setBalloonFloating((floating) => floating.map((value, i) => i === index ? false : value)); balloonPhase.current[index] = 'waiting'; balloonStartedAt.current[index] = 0; balloonSwayBlendAt.current[index] = 0
      paths.forEach((path) => { const length = getGeometryLength(path) ?? 1; path.style.opacity = '0'; path.style.strokeDasharray = `${length}`; path.style.strokeDashoffset = `${length}` })
      let pathIndex = 0; let started = 0
      const drawBalloon = (now: number) => {
        const path = paths[pathIndex]
        if (!path) { const swayStart = performance.now(); balloonStartedAt.current[index] = swayStart; balloonSwayBlendAt.current[index] = swayStart; activeBalloonDrawings.current = Math.max(0, activeBalloonDrawings.current - 1); if (activeBalloonDrawings.current === 0) { setPen(null); setPenVisible(false); balloonPhase.current[index] = 'idle'; balloonBusyRef.current[index] = false; const fadeStarted = now; const releaseAfterFade = (fadeNow: number) => { if (fadeNow - fadeStarted < 140) { redrawFadeTimer.current = requestAnimationFrame(releaseAfterFade); return } redrawFadeTimer.current = undefined; redrawActive.current = false; scheduleRedraw.current() }; redrawFadeTimer.current = requestAnimationFrame(releaseAfterFade) }; setBalloonDrawn((drawn) => drawn.map((value, i) => i === index ? true : value)); setBalloonBusy((busy) => busy.map((value, i) => i === index ? false : value)); return }
        const length = getGeometryLength(path) ?? 1; const progress = Math.min(1, Math.max(0, (now - started) / Math.max(260, length * 3.2)))
        path.style.opacity = '1'; path.style.strokeDashoffset = `${length * (1 - progress)}`
        const point = path.getPointAtLength(length * progress)
        const svg = drawingRef.current; const elementMatrix = path.getScreenCTM(); const svgMatrix = svg?.getScreenCTM()
        if (svg && elementMatrix && svgMatrix) { const screenPoint = new DOMPoint(point.x, point.y).matrixTransform(elementMatrix); const svgPoint = screenPoint.matrixTransform(svgMatrix.inverse()); setPen({ x: svgPoint.x, y: svgPoint.y }) } else { setPen({ x: point.x, y: point.y }) }
        if (progress >= 1) { path.style.strokeDashoffset = '0'; pathIndex += 1; started = now + 18 }
        redrawFrame.current = requestAnimationFrame(drawBalloon)
      }
      redrawJobs.current.set(index, () => { if (!redrawActive.current) return; balloonPhase.current[index] = 'drawing'; group.style.transform = ''; group.setAttribute('transform', 'translate(0 0)'); paths.forEach((path) => { const length = getGeometryLength(path) ?? 1; path.style.opacity = '0'; path.style.strokeDasharray = `${length}`; path.style.strokeDashoffset = `${length}` }); activeBalloonDrawings.current = 1; setPenVisible(true); redrawFrame.current = requestAnimationFrame((now) => { started = now; drawBalloon(now) }) })
      if (!redrawQueue.current.includes(index)) redrawQueue.current.push(index)
      scheduleRedraw.current()
    }
    requestAnimationFrame(animateFlight)
  }, [])
  useEffect(() => {
    if (!balloonDrawn.some(Boolean)) return
    const animateBalloons = (now: number) => {
      const elapsedFor = (index: number) => balloonStartedAt.current[index] ? (now - balloonStartedAt.current[index]) / 1000 : 0
      const blendFor = (index: number) => { const elapsed = balloonSwayBlendAt.current[index] ? (now - balloonSwayBlendAt.current[index]) / 1000 : 0; const t = Math.min(1, elapsed / .7); return t * t * (3 - 2 * t) }
      const motion = [
        { phase: 0, speed: 0.92, sway: 8, lift: 14 },
        { phase: 1.8, speed: 0.72, sway: 13, lift: 19 },
        { phase: 3.1, speed: 1.12, sway: 6, lift: 10 },
        { phase: 4.6, speed: 0.84, sway: 10, lift: 16 },
      ]
      motion.forEach((balloon, index) => {
if (!balloonDrawn[index] || balloonPhase.current[index] !== 'idle') return
        const wave = elapsedFor(index) * balloon.speed + balloon.phase
        const blend = blendFor(index)
        const x = Math.sin(wave) * balloon.sway * blend
        const y = Math.sin(wave * 1.35) * balloon.lift * blend
        const string = balloonStrings.current[index]
        if (string) {
          const bend = Math.sin(wave - 0.55) * 9 * blend
          const delayedBend = Math.sin(wave * 0.92 - 0.9) * 4 * blend
          const start = index === 0 ? [130, 236] : index === 1 ? [560, 288] : index === 2 ? [108, 346] : [598, 388]
          const endY = index === 0 ? 292 : index === 1 ? 354 : index === 2 ? 388 : 438
          string.setAttribute('d', `M${start[0]} ${start[1]} C ${start[0] + bend * 0.45} ${start[1] + 16}, ${start[0] + delayedBend} ${start[1] + 34}, ${start[0] + bend} ${endY}`)
        }
        const group = balloonGroups.current[index]
        // Move the body, knot, and its already-drawn string as one SVG unit.
        // This keeps the attachment point identical in both drawing and idle motion.
        if (group) group.setAttribute('transform', `translate(${x} ${y})`)
      })
      balloonRaf.current = requestAnimationFrame(animateBalloons)
    }
    balloonRaf.current = requestAnimationFrame(animateBalloons)
    return () => { if (balloonRaf.current) cancelAnimationFrame(balloonRaf.current) }
  }, [balloonDrawn, balloonBusy.length])
  const line = (group: string, d: string, className = '', children?: ReactNode, ref = register) => <path ref={ref} data-stroke data-group={group} className={className} d={d}>{children}</path>
  return <main className="gift-page">
    <Fireworks active={states[6] === 'complete'} />
    <header className="intro"><p className="eyebrow">A little line of magic</p><h1>For Bảo Ngọc</h1></header>
    <section className="scene" aria-label="Bức tranh bánh sinh nhật đang đ��ợc vẽ">
      <ShootingStars />
      <svg ref={drawingRef} className="drawing" viewBox="0 0 700 600" role="img" aria-label="Bức tranh bánh sinh nhật"><defs><filter id="soft-glow" x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur stdDeviation="2.8" result="blur" /><feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge></filter><filter id="flame-glow" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="3" result="blur" /><feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge></filter></defs>
        {line('plate', 'M130 505c12 25 429 25 440 0')}{line('plate', 'M130 505c40-30 400-30 440 0')}
        {line('layers', 'M178 420v62c38 26 306 26 344 0v-62')}{line('layers', 'M178 420c24 29 320 29 344 0')}{line('layers', 'M205 345v75c35 24 255 24 290 0v-75')}{line('layers', rimArc(middleRim))}{line('layers', 'M237 277v68c29 21 197 21 226 0v-68')}{line('layers', rimArc(upperRim))}
        {line('cream', upperFrosting, 'cream-line')}{line('cream', middleFrosting, 'cream-line')}
        {line('berries', 'M275 270c-10-19 5-32 17-15 8-20 27-9 19 11')}{line('berries', 'M394 270c-10-19 5-32 17-15 8-20 27-9 19 11')}{line('berries', 'M298 236c-8-23 15-31 20-11 8-22 29-8 18 12')}
        {line('candles', 'M276 277V225M289 277V225M276 225h13M274 267c5 5 10 5 16 0', 'candle-blue')}{line('candles', 'M282.5 225v-9', 'wick')}
        {line('candles', 'M282.5 216c-7-10-1-19 5-27 3 9 11 14 7 23-2 5-7 8-12 4Z', 'flame flame-one', <animate attributeName="d" dur="1.35s" repeatCount="indefinite" values="M282.5 216c-7-10-1-19 5-27 3 9 11 14 7 23-2 5-7 8-12 4Z;M282.5 216c-2-13 6-18 10-28 7 10 6 18 1 25-3 5-7 6-11 3Z;M282.5 216c-8-8-5-18 3-27 1 10 10 13 8 22-1 5-6 8-11 5Z;M282.5 216c-7-10-1-19 5-27 3 9 11 14 7 23-2 5-7 8-12 4Z" />)}
        {line('candles', 'M402 277V225M415 277V225M402 225h13M400 267c5 5 10 5 16 0', 'candle-lavender')}{line('candles', 'M408.5 225v-9', 'wick')}
        {line('candles', 'M408.5 216c-5-9 1-17 9-25 1 9 8 14 5 22-3 6-8 7-14 3Z', 'flame flame-two', <animate attributeName="d" dur="1.8s" begin=".25s" repeatCount="indefinite" values="M408.5 216c-5-9 1-17 9-25 1 9 8 14 5 22-3 6-8 7-14 3Z;M408.5 216c-1-12 7-18 12-25 4 11 2 18-4 24-3 4-6 5-8 1Z;M408.5 216c-7-8-3-17 5-26 2 9 10 15 6 23-3 5-7 7-11 3Z;M408.5 216c-5-9 1-17 9-25 1 9 8 14 5 22-3 6-8 7-14 3Z" />)}
        <g className={`balloon balloon-one ${balloonBusy[0] ? 'balloon-busy' : ''} ${balloonFloating[0] ? 'balloon-floating' : ''}`} ref={(element) => registerBalloonGroup(element, 0)} onClick={() => clickBalloon(0)} onKeyDown={(event) => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); clickBalloon(0) } }} role="button" tabIndex={balloonDrawn[0] && !balloonBusy[0] ? 0 : -1} aria-label="Redraw balloon one">{line('bubbles', 'M130 220c-14-2-23-15-21-30 2-17 15-29 31-29 17 0 29 12 30 29 1 15-8 28-22 30-18 3-18 3-18 0Z', 'balloon-body')}{line('bubbles', 'M130 220l-5 9 5 7 5-7-5-9Z', 'balloon-knot')}{line('bubbles', 'M130 236 C 133 252, 126 270, 130 292', 'balloon-string', undefined, (element) => registerBalloonString(element, 0))}<ellipse className="balloon-hit" cx="130" cy="184" rx="32" ry="62" /><path className="balloon-string-hit" d="M130 226 C 133 252, 126 270, 130 300" /></g>
        <g className={`balloon balloon-two ${balloonBusy[1] ? 'balloon-busy' : ''} ${balloonFloating[1] ? 'balloon-floating' : ''}`} ref={(element) => registerBalloonGroup(element, 1)} onClick={() => clickBalloon(1)} onKeyDown={(event) => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); clickBalloon(1) } }} role="button" tabIndex={balloonDrawn[1] && !balloonBusy[1] ? 0 : -1} aria-label="Redraw balloon two">{line('bubbles', 'M560 270c-19-3-31-18-29-39 2-22 20-37 41-37 22 0 39 15 40 37 2 20-11 36-30 39-22 4-22 4-22 0Z', 'balloon-body')}{line('bubbles', 'M560 270l-6 10 6 8 6-8-6-10Z', 'balloon-knot')}{line('bubbles', 'M560 288 C 565 307, 552 328, 560 354', 'balloon-string', undefined, (element) => registerBalloonString(element, 1))}<ellipse className="balloon-hit" cx="560" cy="231" rx="43" ry="76" /><path className="balloon-string-hit" d="M560 278 C 565 307, 552 328, 560 364" /></g>
        <g className={`balloon balloon-three ${balloonBusy[2] ? 'balloon-busy' : ''} ${balloonFloating[2] ? 'balloon-floating' : ''}`} ref={(element) => registerBalloonGroup(element, 2)} onClick={() => clickBalloon(2)} onKeyDown={(event) => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); clickBalloon(2) } }} role="button" tabIndex={balloonDrawn[2] && !balloonBusy[2] ? 0 : -1} aria-label="Redraw balloon three">{line('bubbles', 'M108 335c-8-1-13-8-12-17 1-10 8-17 18-17 9 0 16 7 17 17 1 9-5 16-13 17-10 2-10 2-10 0Z', 'balloon-body')}{line('bubbles', 'M108 335l-3 6 3 5 3-5-3-6Z', 'balloon-knot')}{line('bubbles', 'M108 346 C 111 359, 105 371, 108 388', 'balloon-string', undefined, (element) => registerBalloonString(element, 2))}<ellipse className="balloon-hit" cx="108" cy="310" rx="20" ry="35" /><path className="balloon-string-hit" d="M108 340 C 111 359, 105 371, 108 396" /></g>
        <g className={`balloon balloon-four ${balloonBusy[3] ? 'balloon-busy' : ''} ${balloonFloating[3] ? 'balloon-floating' : ''}`} ref={(element) => registerBalloonGroup(element, 3)} onClick={() => clickBalloon(3)} onKeyDown={(event) => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); clickBalloon(3) } }} role="button" tabIndex={balloonDrawn[3] && !balloonBusy[3] ? 0 : -1} aria-label="Redraw balloon four">{line('bubbles', 'M598 375c-10-2-17-10-16-21 1-12 10-20 22-20 12 0 21 8 22 20 1 11-6 19-17 21-12 2-12 2-12 0Z', 'balloon-body')}{line('bubbles', 'M598 375l-4 7 4 6 4-6-4-7Z', 'balloon-knot')}{line('bubbles', 'M598 388 C 602 402, 594 418, 598 438', 'balloon-string', undefined, (element) => registerBalloonString(element, 3))}<ellipse className="balloon-hit" cx="598" cy="354" rx="26" ry="42" /><path className="balloon-string-hit" d="M598 382 C 602 402, 594 418, 598 446" /></g>
        {line('fireworks', 'M105 180l3 9 9 3-9 3-3 9-3-9-9-3 9-3Z')}
        <g className={`envelope ${completed ? 'envelope-ready' : ''}`} onClick={() => completed && setOpen(true)} onKeyDown={(event) => { if (completed && (event.key === 'Enter' || event.key === ' ')) { event.preventDefault(); setOpen(true) } }} role="button" tabIndex={completed ? 0 : -1} aria-disabled={!completed} aria-label="Mở lá thư">{line('envelope', 'M245 535h210v42H245z')}{line('envelope', 'm245 535 105 29 105-29', 'envelope-flap')}{line('envelope', 'M245 577l77-31M455 577l-77-31')}{<circle cx="350" cy="558" r="7" />}<rect className="envelope-hit" x="238" y="528" width="224" height="58" rx="4" /></g>
        {penVisible && pen && <circle className="pen-tip" cx={pen.x} cy={pen.y} r="3" />}
      </svg>
          {open && <div className="letter" role="dialog" aria-label="Lá thư chúc mừng"><button className="close" onClick={() => setOpen(false)} aria-label="Đóng thư">×</button><p className="letter-kicker">gửi Bảo Ngọc,</p><svg className="handwriting" viewBox="0 0 360 260" role="img" aria-label={message}><text x="180" y="25" textAnchor="middle"><tspan x="180" dy="0">Chúc người bạn thiên tài super cute</tspan><tspan x="180" dy="31">siêu cấp tốt bụng tuổi mới luôn đầy</tspan><tspan x="180" dy="31">năng lượng nhaa, giữ vững phong độ</tspan><tspan x="180" dy="31">và ngủ cười khà khà thật nhiềuuu.</tspan><tspan x="180" dy="31">Hơn hết là nhớ ăn uống thật đầy đủ</tspan><tspan x="180" dy="31">nhaaaaaaaa 💖💖</tspan></text></svg><p className="signature">— người bạn cùng học</p></div>}
    </section>
    <nav className="controls" aria-label="Điều khiển"><button onClick={replay}>Replay Drawing</button></nav><p className="status" aria-live="polite">{drawing ? 'the pen is still wandering…' : 'all lines are in place'}</p>
  </main>
}
