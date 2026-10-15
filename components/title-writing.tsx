'use client'

import { useEffect, useRef, useState } from 'react'
import { titleGlyphs } from '@/lib/title-glyphs'

const pixelsPerMillisecond = 0.32
const minimumGlyphDuration = 260
const glyphGap = 40

export function TitleWriting({ runKey = 0 }: { runKey?: number }) {
  const paths = useRef<(SVGPathElement | null)[]>([])
  const [pen, setPen] = useState<{ x: number; y: number } | null>(null)

  useEffect(() => {
    const elements = paths.current.filter((path): path is SVGPathElement => Boolean(path))
    const lengths = elements.map((path) => path.getTotalLength())
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    elements.forEach((path, index) => {
      path.style.strokeDasharray = `${lengths[index]}`
      path.style.strokeDashoffset = reduceMotion ? '0' : `${lengths[index]}`
      path.classList.toggle('glyph-filled', reduceMotion)
    })
    if (reduceMotion) return

    let frame = 0
    let index = 0
    let started = 0
    const write = (now: number) => {
      const path = elements[index]
      if (!path) { setPen(null); return }
      if (!started) started = now
      const length = lengths[index]
      const duration = Math.max(minimumGlyphDuration, length / pixelsPerMillisecond)
      const progress = Math.min(1, Math.max(0, (now - started) / duration))
      path.style.strokeDashoffset = `${length * (1 - progress)}`
      const point = path.getPointAtLength(length * progress)
      setPen({ x: point.x, y: point.y })
      if (progress >= 1) {
        path.classList.add('glyph-filled')
        index += 1
        started = now + glyphGap
      }
      frame = requestAnimationFrame(write)
    }
    const delay = window.setTimeout(() => { frame = requestAnimationFrame(write) }, 300)
    return () => { window.clearTimeout(delay); cancelAnimationFrame(frame) }
  }, [runKey])

  return (
    <svg className="title-writing" viewBox="0 0 320 72" aria-hidden="true">
      {titleGlyphs.map((d, index) => (
        <path key={index} ref={(element) => { paths.current[index] = element }} className="title-glyph" d={d} />
      ))}
      {pen && <circle className="pen-tip" cx={pen.x} cy={pen.y} r="2" />}
    </svg>
  )
}
