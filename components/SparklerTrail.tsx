'use client'

import { useEffect, useRef } from 'react'

type Spark = { x: number; y: number; born: number; size: number; color: string; dx: number; dy: number }

export default function SparklerTrail({ enabled }: { enabled: boolean }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    const context = canvas?.getContext('2d')
    if (!canvas || !context) return

    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)')
    const sparks: Spark[] = []
    let frame = 0
    let pointer: { x: number; y: number } | null = null
    let highlighted: SVGElement | null = null
    let active = enabled

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
      if (!active) return
      pointer = { x: event.clientX, y: event.clientY }
      const line = nearestLine(pointer.x, pointer.y)
      if (reducedMotion.matches) return
      const color = line ? getComputedStyle(line).stroke : '#f8f4ed'
      sparks.push({ x: pointer.x, y: pointer.y, born: performance.now(), size: 1 + Math.random() * 1.4, color, dx: (Math.random() - .5) * 20, dy: (Math.random() - .5) * 20 })
    }
    const press = (event: PointerEvent) => { if (!active) return; event.preventDefault(); move(event); document.documentElement.classList.add('sparkler-pressed') }
    const release = () => document.documentElement.classList.remove('sparkler-pressed')

    const draw = (now: number) => {
      context.clearRect(0, 0, window.innerWidth, window.innerHeight)
      if (active && pointer) {
        if (reducedMotion.matches) {
          context.globalAlpha = .5; context.fillStyle = '#f8f4ed'; context.shadowColor = '#f8f4ed'; context.shadowBlur = 5; context.beginPath(); context.arc(pointer.x, pointer.y, 1.5, 0, Math.PI * 2); context.fill()
        } else {
          for (let index = sparks.length - 1; index >= 0; index -= 1) {
            const spark = sparks[index]; const progress = (now - spark.born) / 800
            if (progress >= 1) { sparks.splice(index, 1); continue }
            const fade = 1 - progress
            context.globalAlpha = fade * .9; context.fillStyle = spark.color; context.shadowColor = spark.color; context.shadowBlur = 7 * fade; context.beginPath(); context.arc(spark.x + spark.dx * progress, spark.y + spark.dy * progress + 12 * progress * progress, spark.size * fade, 0, Math.PI * 2); context.fill()
          }
        }
      }
      context.globalAlpha = 1; context.shadowBlur = 0; frame = requestAnimationFrame(draw)
    }

    const enable = () => { active = true; resize() }
    const fallback = window.setTimeout(() => { if (enabled) enable() }, 1800)
    resize(); window.addEventListener('resize', resize); window.addEventListener('pointerdown', press, { passive: false }); window.addEventListener('pointermove', move, { passive: true }); window.addEventListener('pointerup', release); window.addEventListener('pointercancel', release); frame = requestAnimationFrame(draw)
    return () => { window.clearTimeout(fallback); cancelAnimationFrame(frame); window.removeEventListener('resize', resize); window.removeEventListener('pointerdown', press); window.removeEventListener('pointermove', move); window.removeEventListener('pointerup', release); window.removeEventListener('pointercancel', release); document.documentElement.classList.remove('sparkler-pressed'); highlighted?.classList.remove('sparkler-near'); sparks.length = 0 }
  }, [enabled])

  return <canvas ref={canvasRef} className="sparkler-trail" aria-hidden="true" />
}
