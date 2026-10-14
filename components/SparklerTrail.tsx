'use client'

import { useEffect, useRef } from 'react'

type Spark = { x: number; y: number; born: number; size: number; color: string; dx: number; dy: number }

export default function SparklerTrail({ enabled }: { enabled: boolean }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    if (!enabled || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    const canvas = canvasRef.current
    const context = canvas?.getContext('2d')
    if (!canvas || !context) return
    const sparks: Spark[] = []
    let frame = 0
    let last = 0
    let pointer: { x: number; y: number } | null = null
    let lastPointer: { x: number; y: number } | null = null
    let highlighted: SVGElement | null = null

    const resize = () => {
      const ratio = Math.min(window.devicePixelRatio || 1, 2)
      canvas.width = window.innerWidth * ratio
      canvas.height = window.innerHeight * ratio
      canvas.style.width = `${window.innerWidth}px`
      canvas.style.height = `${window.innerHeight}px`
      context.setTransform(ratio, 0, 0, ratio, 0, 0)
    }
    const nearestLine = (x: number, y: number) => {
      let nearest: SVGElement | null = null
      let distance = 42
      document.querySelectorAll<SVGElement>('.drawing [data-stroke]').forEach((line) => {
        const rect = line.getBoundingClientRect()
        const dx = Math.max(rect.left - x, 0, x - rect.right)
        const dy = Math.max(rect.top - y, 0, y - rect.bottom)
        const nextDistance = Math.hypot(dx, dy)
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
      pointer = { x: event.clientX, y: event.clientY }
      const line = nearestLine(event.clientX, event.clientY)
      const color = line ? getComputedStyle(line).stroke : '#f8f4ed'
      const previous = lastPointer || pointer
      const distance = Math.hypot(pointer.x - previous.x, pointer.y - previous.y)
      const count = Math.min(4, Math.max(1, Math.ceil(distance / 10)))
      for (let index = 0; index < count; index += 1) sparks.push({ x: pointer.x, y: pointer.y, born: performance.now(), size: 1 + Math.random() * 1.4, color, dx: (Math.random() - .5) * 20, dy: (Math.random() - .5) * 20 })
      lastPointer = pointer
    }
    const draw = (now: number) => {
      const dt = Math.min(32, now - (last || now)); last = now
      context.clearRect(0, 0, window.innerWidth, window.innerHeight)
      for (let index = sparks.length - 1; index >= 0; index -= 1) {
        const spark = sparks[index]; const age = now - spark.born; const progress = age / 800
        if (progress >= 1) { sparks.splice(index, 1); continue }
        const fade = 1 - progress; const x = spark.x + spark.dx * progress; const y = spark.y + spark.dy * progress + 12 * progress * progress
        context.globalAlpha = fade * .9; context.fillStyle = spark.color; context.shadowColor = spark.color; context.shadowBlur = 7 * fade; context.beginPath(); context.arc(x, y, spark.size * fade, 0, Math.PI * 2); context.fill()
      }
      context.globalAlpha = 1; context.shadowBlur = 0; frame = requestAnimationFrame(draw)
    }
    resize(); addEventListener('resize', resize); addEventListener('pointermove', move, { passive: true }); frame = requestAnimationFrame(draw)
    return () => { cancelAnimationFrame(frame); removeEventListener('resize', resize); removeEventListener('pointermove', move); highlighted?.classList.remove('sparkler-near'); sparks.length = 0 }
  }, [enabled])

  return <canvas ref={canvasRef} className="sparkler-trail" aria-hidden="true" />
}
