'use client'

import { useEffect, useState } from 'react'
import styles from './FlowerScene.module.css'

type FlowerSceneProps = { play: boolean }

const leaves = [1, 2, 3, 4, 5, 6]
const lights = [1, 2, 3, 4, 5, 6, 7, 8]
const frontLeaves = [1, 2, 3, 4, 5, 6, 7, 8]
const grassLeaves = [1, 2, 3, 4, 5, 6, 7, 8]

function Flower({ variant }: { variant: 1 | 2 | 3 }) {
  const flowerLeaves = variant === 1 ? leaves.slice(0, 4) : leaves.slice(0, 4)
  return <div className={`${styles.flower} ${styles[`flower${variant}`]}`}>
    <div className={`${styles.flowerLeafs} ${styles[`flowerLeafs${variant}`]}`}>
      {flowerLeaves.map((leaf) => <div key={leaf} className={`${styles.flowerLeaf} ${styles[`flowerLeaf${leaf}`]}`} />)}
      <div className={styles.whiteCircle} />
      {lights.map((light) => <div key={light} className={`${styles.flowerLight} ${styles[`flowerLight${light}`]}`} />)}
    </div>
    <div className={styles.flowerLine}>
      {leaves.slice(0, variant === 1 ? 6 : 4).map((leaf) => <div key={leaf} className={`${styles.lineLeaf} ${styles[`lineLeaf${leaf}`]}`} />)}
    </div>
  </div>
}

function Grass({ secondary = false }: { secondary?: boolean }) {
  return <div className={styles.growingGrass}><div className={`${styles.grass} ${secondary ? styles.grassTwo : styles.grassOne}`}>
    <div className={styles.grassTop} /><div className={styles.grassBottom} />
    {grassLeaves.map((leaf) => <div key={leaf} className={`${styles.grassLeaf} ${styles[`grassLeaf${leaf}`]}`} />)}
    <div className={styles.grassOverlay} />
  </div></div>
}

export function FlowerScene({ play }: FlowerSceneProps) {
  const [released, setReleased] = useState(false)
  useEffect(() => {
    if (!play) { setReleased(false); return }
    const timer = window.setTimeout(() => setReleased(true), 300)
    return () => window.clearTimeout(timer)
  }, [play])

  return <div className={`${styles.flowerScene} ${!released ? styles.notLoaded : ''}`} aria-hidden="true">
    <div className={styles.flowers}>
      <Flower variant={1} /><Flower variant={2} /><Flower variant={3} />
      <div className={`${styles.longStem} ${styles.growAns}`}><div className={styles.longStemTop} /><div className={styles.longStemBottom} /></div>
      <Grass /><Grass secondary />
      <div className={`${styles.sideGrowth} ${styles.sideGrowthOne}`}><div className={styles.sideLeaf} /></div>
      <div className={`${styles.sideGrowth} ${styles.sideGrowthTwo}`}><div className={styles.sideLeaf} /></div>
      <div className={`${styles.frontGrowth} ${styles.growAns}`}>
        <div className={styles.frontLine}>{frontLeaves.map((leaf) => <div key={leaf} className={`${styles.frontLeafWrap} ${styles[`frontLeafWrap${leaf}`]}`}><div className={styles.frontLeaf} /></div>)}</div>
      </div>
      {Array.from({ length: 8 }, (_, index) => <div key={index} className={`${styles.longGrass} ${styles[`longGrass${index}`]}`}><div className={styles.longGrassLeaf} /></div>)}
    </div>
  </div>
}

export default FlowerScene
