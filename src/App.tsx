import { useCallback, useState } from 'react'
import { Header } from './components/layout/Header'
import { Intro } from './sections/Intro'
import { Hero } from './sections/Hero'
import { ServicesIntro } from './sections/ServicesIntro'
import { ServicesGrid } from './sections/ServicesGrid'
import { Approach } from './sections/Approach'
import { Work } from './sections/Work'
import { AiVideoStory } from './sections/AiVideoStory'
import { WorkMedia } from './sections/WorkMedia'
import { Products } from './sections/Products'
import { ProductSystem } from './sections/ProductSystem'
import { Contact } from './sections/Contact'

export default function App() {
  const [locked, setLocked] = useState(false)
  const [handoff, setHandoff] = useState(false)
  const [introDone, setIntroDone] = useState(false)
  const onLock = useCallback(() => setLocked(true), [])
  const onHandoff = useCallback(() => setHandoff(true), [])
  const onDone = useCallback(() => setIntroDone(true), [])

  return (
    <>
      <a className="skip-link" href="#home">
        Skip to content
      </a>
      {!introDone && <Intro onLock={onLock} onHandoff={onHandoff} onDone={onDone} />}
      <Header locked={locked} ready={handoff} />
      <main>
        <Hero start={handoff} />
        <ServicesIntro />
        <ServicesGrid />
        <Approach />
        <Work />
        <AiVideoStory />
        <WorkMedia />
        <Products />
        <ProductSystem />
        <Contact />
      </main>
    </>
  )
}
