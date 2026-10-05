import { Bell, Search } from 'lucide-react'
import { useApp } from '../../store/AppContext'
import { events, matches } from '../../data/mock'
import Button from '../../components/ui/Button'
export default function Home() {
  const { state, toast } = useApp()
  return (
    <div className="space-y-6">
      <header className="flex items-center justify-between">
        <h2 className="text-2xl font-extrabold">What's good, {state.user.name}?</h2>
        <button aria-label="Notifications" className="tap grid h-11 w-11 place-items-center rounded-full border border-gold/20"><Bell size={20} /></button>
      </header>
      <button className="tap flex min-h-[44px] w-full items-center gap-2 rounded-full border border-gold/20 px-4 text-cream/60"><Search size={18} />Search students, events, items</button>
      <section className="space-y-3">
        <h3 className="font-semibold text-gold">Matches for CS101</h3>
        <div className="grid gap-3 sm:grid-cols-2">{matches.map(m => (
          <div key={m.id} className="card flex items-center justify-between gap-2">
            <div><p className="font-semibold">{m.name}</p><p className="text-sm text-cream/60">{m.common}</p></div>
            <Button variant="gold" onClick={() => toast('Request sent')}>{m.score}% Connect</Button>
          </div>))}</div>
      </section>
      <section className="space-y-3">
        <h3 className="font-semibold text-gold">Upcoming events</h3>
        <div className="grid gap-3 sm:grid-cols-2">{events.map(e => (
          <div key={e.id} className="card"><p className="font-semibold">{e.title}</p><p className="text-sm text-cream/60">{e.when} at {e.venue}</p><p className="mt-2 text-xs text-gold">{e.going} going</p></div>))}</div>
      </section>
    </div>
  )
}
