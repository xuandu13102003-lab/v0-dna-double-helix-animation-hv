'use client'

import { useImperativeHandle, useRef, type Ref } from 'react'
import { TITLE_HEIGHT, TITLE_LETTERS, TITLE_TEXT, TITLE_WIDTH } from '@/lib/title-glyphs'

type WriteOptions = { isCurrent: () => boolean; frameRef: { current: number | undefined }; onDone: () => void }
export type TitleController = { write: (options: WriteOptions) => void }

const WRITE_DURATION = 4200
const TRAVEL_DURATION = 120
const GLOW_HOLD = 450

type Segment = { kind: 'letter'; index: number; length: number; duration: number } | { kind: 'travel'; from: DOMPoint; to: DOMPoint; duration: number }

export function TitleWriting({ controllerRef }: { controllerRef: Ref<TitleController> }) {
  const svgRef = useRef<SVGSVGElement | null>(null)
  const letterRefs = useRef<(SVGPathElement | null)[]>([])
  const penRef = useRef<SVGCircleElement | null>(null)
  const glowTimers = useRef(new Map<number, number>())

  useImperativeHandle(controllerRef, () => ({
    write({ isCurrent, frameRef, onDone }) {
      const svg = svgRef.current
      const pen = penRef.current
      const letters = letterRefs.current.filter((letter): letter is SVGPathElement => Boolean(letter))
      if (!svg || !pen || !letters.length) { onDone(); return }
      svg.classList.remove('title-written')
      letters.forEach((letter) => { letter.classList.remove('letter-filled', 'letter-glow'); letter.style.strokeDashoffset = '1' })
      pen.style.opacity = '0'

      if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
        letters.forEach((letter) => { letter.style.strokeDashoffset = '0'; letter.classList.add('letter-filled') })
        svg.classList.add('title-written')
        onDone()
        return
      }

      const lengths = letters.map((letter) => letter.getTotalLength())
      const pixelsPerMillisecond = lengths.reduce((sum, length) => sum + length, 0) / (WRITE_DURATION - TRAVEL_DURATION * (letters.length - 1))
      const segments: Segment[] = []
      letters.forEach((letter, index) => {
        if (index > 0) segments.push({ kind: 'travel', from: letters[index - 1].getPointAtLength(lengths[index - 1]), to: letter.getPointAtLength(0), duration: TRAVEL_DURATION })
        segments.push({ kind: 'letter', index, length: lengths[index], duration: lengths[index] / pixelsPerMillisecond })
      })
      const totalDuration = segments.reduce((sum, segment) => sum + segment.duration, 0)
      let startedAt: number | undefined
      let filledCount = 0

      const movePen = (x: number, y: number) => { pen.setAttribute('cx', `${x}`); pen.setAttribute('cy', `${y}`) }
      const frame = (now: number) => {
        if (!isCurrent()) return
        startedAt ??= now
        const progress = Math.min(1, (now - startedAt) / totalDuration)
        let elapsed = progress * totalDuration
        for (const segment of segments) {
          const local = segment.duration ? Math.min(1, Math.max(0, elapsed / segment.duration)) : 1
          if (segment.kind === 'letter') {
            const letter = letters[segment.index]
            letter.style.strokeDashoffset = `${1 - local}`
            if (local >= 1 && segment.index >= filledCount) { letter.classList.add('letter-filled'); filledCount = segment.index + 1 }
            if (elapsed <= segment.duration) { const point = letter.getPointAtLength(segment.length * local); movePen(point.x, point.y) }
          } else if (elapsed > 0 && elapsed <= segment.duration) {
            movePen(segment.from.x + (segment.to.x - segment.from.x) * local, segment.from.y + (segment.to.y - segment.from.y) * local)
          }
          elapsed -= segment.duration
          if (elapsed < 0) break
        }
        pen.style.opacity = progress > 0 && progress < 1 ? '1' : '0'
        if (progress < 1) { frameRef.current = requestAnimationFrame(frame); return }
        letters.forEach((letter) => { letter.style.strokeDashoffset = '0'; letter.classList.add('letter-filled') })
        svg.classList.add('title-written')
        onDone()
      }
      frameRef.current = requestAnimationFrame(frame)
    },
  }), [])

  const glow = (index: number) => {
    const svg = svgRef.current
    const letter = letterRefs.current[index]
    if (!svg?.classList.contains('title-written') || !letter) return
    letter.classList.add('letter-glow')
    window.clearTimeout(glowTimers.current.get(index))
    glowTimers.current.set(index, window.setTimeout(() => letter.classList.remove('letter-glow'), GLOW_HOLD))
  }

  return (
    <svg ref={svgRef} className="title-writing" viewBox={`0 0 ${TITLE_WIDTH} ${TITLE_HEIGHT}`} role="img" aria-label={TITLE_TEXT}>
      <title>{TITLE_TEXT}</title>
      {TITLE_LETTERS.map((letter, index) => (
        <path key={index} ref={(element) => { letterRefs.current[index] = element }} className="title-letter" d={letter.d} pathLength={1} onPointerEnter={() => glow(index)} />
      ))}
      <circle ref={penRef} className="pen-tip title-pen" r="3.5" cx="0" cy="0" style={{ opacity: 0 }} />
    </svg>
  )
}
