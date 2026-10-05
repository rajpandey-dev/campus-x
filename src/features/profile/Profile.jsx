import { BadgeCheck } from 'lucide-react'
import { useApp } from '../../store/AppContext'
export default function Profile() {
  const { state, dispatch } = useApp()
  const u = state.user
  return (
    <div className="space-y-5">
      <div className="card flex items-center gap-4">
        <div className="grid h-20 w-20 place-items-center rounded-full border-2 border-gold bg-maroon text-3xl font-extrabold">{u.name[0]}</div>
        <div>
          <p className="flex items-center gap-1 text-xl font-extrabold">{u.name} <BadgeCheck size={18} className="text-gold" /></p>
          <p className="text-sm text-cream/60">{u.course}, {u.college}, {u.year}</p>
          {!state.presenceHidden && <p className="mt-1 text-xs text-gold">Active Now</p>}
        </div>
      </div>
      <p className="text-cream/80">{u.bio}</p>
      <div className="flex flex-wrap gap-2">{u.tags.map(t => <span key={t} className="rounded-full border border-gold/20 px-3 py-1 text-sm">{t}</span>)}</div>
      <div className="card"><p className="font-semibold text-gold">{u.xp} XP</p><div className="mt-2 flex flex-wrap gap-2">{u.badges.map(b => <span key={b} className="rounded-full bg-gold/15 px-3 py-1 text-sm text-gold">{b}</span>)}</div></div>
      <label className="flex min-h-[44px] items-center justify-between"><span>Hide presence</span>
        <input type="checkbox" checked={state.presenceHidden} onChange={() => dispatch({ type: 'togglePresence' })} className="h-5 w-5 accent-[#C79A55]" /></label>
    </div>
  )
}
