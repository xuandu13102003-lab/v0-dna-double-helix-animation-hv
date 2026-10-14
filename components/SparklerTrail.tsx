'use client'

import { useEffect, useRef } from 'react'

type TrailPoint = { x: number; y: number; time: number; color: string }

export default function SparklerTrail({ enabled }: { enabled: boolean }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    const context = canvas?.getContext('2d')
    if (!canvas || !context) return

    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)')
    const points: TrailPoint[] = []
    let frame = 0
    let pressed = false
    let active = enabled
    let highlighted: SVGElement | null = null

    const resize = () => {
      const ratio = Math.min(window.devicePixelRatio || 1, 2)
      canvas.width = Math.max(1, Math.floor(window.innerWidth * ratio))
      canvas.height = Math.max(1, Math.floor(window.innerHeight * ratio))
      canvas.style.width = `${window.innerWidth}px`
      canvas.style.height = `${window.innerHeight}px`
      context.setTransform(ratio, 0, 0, ratio, 0, 0)
    }

    const nearestLine = (x: number, y: number) => {
      let nearest: SVGElement | null = null
      let distance = 42
      document.querySelectorAll<SVGElement>('.drawing [data-stroke]').forEach((line) => {
        const rect = line.getBoundingClientRect()
        const nextDistance = Math.hypot(Math.max(rect.left - x, 0, x - rect.right), Math.max(rect.top - y, 0, y - rect.bottom))
        if (nextDistance < distance) { distance = nextDistance; nearest = line }
      })
      if (highlighted !== nearest) {
        highlighted?.classList.remove('sparkler-near')
        nearest?.classList.add('sparkler-near')
        highlighted = nearest
      }
      return nearest
    }

    const move = (event: PointerEvent) => {
      if (!active || !pressed) return
      event.preventDefault()
      const line = nearestLine(event.clientX, event.clientY)
      const color = line ? getComputedStyle(line).stroke : '#f8f4ed'
      points.push({ x: event.clientX, y: event.clientY, time: performance.now(), color })
      if (points.length > 90) points.splice(0, points.length - 90)
    }

    const press = (event: PointerEvent) => {
      if (!active) return
      pressed = true
      event.preventDefault()
      document.documentElement.classList.add('sparkler-pressed')
      points.push({ x: event.clientX, y: event.clientY, time: performance.now(), color: '#f8f4ed' })
    }

    const release = () => {
      pressed = false
      document.documentElement.classList.remove('sparkler-pressed')
      highlighted?.classList.remove('sparkler-near')
      highlighted = null
    }

    const draw = (now: number) => {
      context.clearRect(0, 0, window.innerWidth, window.innerHeight)
      const lifetime = 1500
      while (points.length && now - points[0].time > lifetime) points.shift()
      if (active && pressed && points.length) {
        if (reducedMotion.matches) {
          const point = points[points.length - 1]
          context.globalAlpha = .7; context.fillStyle = '#fffdf8'; context.shadowColor = '#fffdf8'; context.shadowBlur = 8
          context.beginPath(); context.arc(point.x, point.y, 2, 0, Math.PI * 2); context.fill()
        } else if (points.length > 1) {
          for (let index = 1; index < points.length; index += 1) {
            const previous = points[index - 1]
            const point = points[index]
            const fade = Math.max(0, 1 - (now - point.time) / lifetime)
            const width = 1.5 + fade * 7
            context.globalAlpha = fade * .18; context.strokeStyle = point.color; context.lineWidth = width * 3.5; context.shadowColor = point.color; context.shadowBlur = 18 * fade; context.lineCap = 'round'; context.lineJoin = 'round'
            context.beginPath(); context.moveTo(previous.x, previous.y); context.lineTo(point.x, point.y); context.stroke()
            context.globalAlpha = fade * .8; context.lineWidth = width; context.shadowBlur = 7 * fade
            context.beginPath(); context.moveTo(previous.x, previous.y); context.lineTo(point.x, point.y); context.stroke()
            context.globalAlpha = fade * .9; context.strokeStyle = '#fffdf8'; context.lineWidth = Math.max(1, width * .28); context.shadowColor = '#ffffff'; context.shadowBlur = 5 * fade
            context.beginPath(); context.moveTo(previous.x, previous.y); context.lineTo(point.x, point.y); context.stroke()
          }
        }
      }
      context.globalAlpha = 1; context.shadowBlur = 0; frame = requestAnimationFrame(draw)
    }

    const enable = () => { active = enabled; if (active) resize() }
    const fallback = window.setTimeout(enable, 1800)
    resize(); window.addEventListener('resize', resize); window.addEventListener('pointerdown', press, { passive: false }); window.addEventListener('pointermove', move, { passive: false }); window.addEventListener('pointerup', release); window.addEventListener('pointercancel', release); frame = requestAnimationFrame(draw)
    return () => { window.clearTimeout(fallback); cancelAnimationFrame(frame); window.removeEventListener('resize', resize); window.removeEventListener('pointerdown', press); window.removeEventListener('pointermove', move); window.removeEventListener('pointerup', release); window.removeEventListener('pointercancel', release); document.documentElement.classList.remove('sparkler-pressed'); highlighted?.classList.remove('sparkler-near'); points.length = 0 }
  }, [enabled])

  return <canvas ref={canvasRef} className="sparkler-trail" aria-hidden="true" />
}
