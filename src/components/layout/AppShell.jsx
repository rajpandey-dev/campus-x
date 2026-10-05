import { Plus } from 'lucide-react'
import { useApp } from '../../store/AppContext'
import { NAV } from './NavItems'
import CreateSheet from './CreateSheet'

function NavButton({ item, active, onClick, vertical }) {
  const { Icon, label } = item
  return (
    <button aria-label={label} onClick={onClick}
      className={`tap flex min-h-[44px] min-w-[44px] items-center gap-3 rounded-2xl px-3 ${vertical ? 'w-full' : 'flex-col text-xs'} ${active ? 'text-gold' : 'text-cream/60'}`}>
      <Icon size={22} /><span>{label}</span>
    </button>
  )
}

export default function AppShell({ children }) {
  const { state, dispatch } = useApp()
  const go = id => dispatch({ type: 'tab', value: id })
  const openCreate = () => dispatch({ type: 'createOpen', value: true })
  const half = NAV.length / 2
  return (
    <div className="mx-auto flex min-h-screen max-w-6xl">
      <aside className="sticky top-0 hidden h-screen w-56 flex-col gap-2 border-r border-gold/10 p-4 md:flex">
        <h1 className="mb-4 text-2xl font-extrabold text-gold">CampusX</h1>
        {NAV.map(n => <NavButton key={n.id} item={n} vertical active={state.tab === n.id} onClick={() => go(n.id)} />)}
        <button onClick={openCreate} className="tap mt-2 min-h-[44px] rounded-full bg-gradient-to-r from-maroon to-wine font-semibold">+ Create</button>
      </aside>

      <main className="min-w-0 flex-1 px-4 pb-28 pt-6 md:pb-8">{children}</main>

      <nav className="fixed inset-x-0 bottom-0 z-40 flex items-center justify-around border-t border-gold/10 bg-surface/95 px-2 py-2 md:hidden">
        {NAV.slice(0, half).map(n => <NavButton key={n.id} item={n} active={state.tab === n.id} onClick={() => go(n.id)} />)}
        <button aria-label="Create" onClick={openCreate} className="tap -mt-8 grid h-14 w-14 place-items-center rounded-full bg-gradient-to-br from-gold to-wine text-surface shadow-glow"><Plus size={28} /></button>
        {NAV.slice(half).map(n => <NavButton key={n.id} item={n} active={state.tab === n.id} onClick={() => go(n.id)} />)}
      </nav>

      <CreateSheet />
      <div className="fixed left-1/2 top-4 z-[60] -translate-x-1/2 space-y-2" role="status">
        {state.toasts.map(t => <div key={t.id} className="rounded-full bg-gold px-4 py-2 text-sm font-semibold text-surface">{t.message}</div>)}
      </div>
    </div>
  )
}
