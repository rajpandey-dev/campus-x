import { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import Button from '../../components/ui/Button'
import { useApp } from '../../store/AppContext'
const SLIDES = [
  ['Meet your campus', 'Everyone worth knowing, one tap away.'],
  ['Find your people', 'Study buddies, skill swaps, and your kind of crowd.'],
  ['Do more together', 'Hangouts, events, games, and easy expense splits.'],
  ['Your campus, your space', 'Make your profile look like you.'],
]
export default function Onboarding() {
  const { dispatch } = useApp()
  const [i, setI] = useState(0)
  const last = i === SLIDES.length - 1
  const finish = () => dispatch({ type: 'stage', value: 'login' })
  return (
    <div className="mx-auto flex min-h-screen max-w-md flex-col justify-between p-6">
      <button onClick={finish} className="min-h-[44px] self-end text-cream/60">Skip</button>
      <AnimatePresence mode="wait">
        <motion.div key={i} initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }} transition={{ duration: 0.25 }}>
          <h2 className="text-4xl font-extrabold text-gold">{SLIDES[i][0]}</h2>
          <p className="mt-3 text-lg text-cream/80">{SLIDES[i][1]}</p>
        </motion.div>
      </AnimatePresence>
      <div className="space-y-4">
        <div className="flex justify-center gap-2">{SLIDES.map((_, n) => <span key={n} className={`h-2 rounded-full transition-all ${n === i ? 'w-6 bg-gold' : 'w-2 bg-cream/20'}`} />)}</div>
        <Button className="w-full" onClick={last ? finish : () => setI(i + 1)}>{last ? 'Get Started' : 'Next'}</Button>
      </div>
    </div>
  )
}
