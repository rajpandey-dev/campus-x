import { useState } from 'react'
import Chip from '../../components/ui/Chip'
import Skeleton from '../../components/ui/Skeleton'
import { matches } from '../../data/mock'
const CATS = ['Study Buddy', 'Skill Swap', 'Events', 'Resale', 'Find Items']
const TOPICS = ['#Java', '#Calculus', '#UI Design']
export default function Discover() {
  const [cat, setCat] = useState(CATS[0])
  const [topic, setTopic] = useState(null)
  const list = topic === '#UI Design' ? [] : matches
  return (
    <div className="space-y-5">
      <h2 className="text-2xl font-extrabold">Discover</h2>
      <div className="flex gap-2 overflow-x-auto">{CATS.map(c => <Chip key={c} active={c === cat} onClick={() => setCat(c)}>{c}</Chip>)}</div>
      {cat === 'Study Buddy' ? (<>
        <div className="flex gap-2">{TOPICS.map(t => <Chip key={t} active={t === topic} onClick={() => setTopic(t === topic ? null : t)}>{t}</Chip>)}</div>
        {list.length ? list.map(m => (
          <div key={m.id} className="card"><p className="font-semibold">{m.name} <span className="text-gold">{m.score}%</span></p><p className="text-sm text-cream/60">{m.common}</p></div>
        )) : <p>No study buddies in sight! Try picking another tag.</p>}
      </>) : <div className="space-y-3"><Skeleton /><Skeleton /><p className="text-sm text-cream/50">{cat} is next on the build list.</p></div>}
    </div>
  )
}
