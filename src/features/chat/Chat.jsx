import { useState } from 'react'
import { Gamepad2, Send } from 'lucide-react'
import { chats } from '../../data/mock'
import { useApp } from '../../store/AppContext'
export default function Chat() {
  const { state, dispatch, toast } = useApp()
  const [active, setActive] = useState(chats[0])
  const [msgs, setMsgs] = useState([{ me: false, text: 'Quiz battle later? 😏' }])
  const draft = state.drafts[active.id] || ''
  const setDraft = value => dispatch({ type: 'draft', key: active.id, value })
  const send = () => {
    if (!draft.trim()) return
    setMsgs([...msgs, { me: true, text: draft }])
    setDraft('')
  }
  return (
    <div className="grid h-[calc(100vh-9rem)] gap-4 md:h-[calc(100vh-4rem)] md:grid-cols-[18rem_1fr]">
      <ul className="space-y-2 overflow-y-auto">
        {chats.map(c => (
          <li key={c.id}><button onClick={() => setActive(c)} className={`tap card w-full text-left ${active.id === c.id ? '!border-gold/50' : ''}`}>
            <div className="flex justify-between"><span className="font-semibold">{c.name}</span><span className="text-xs text-cream/50">{c.time}</span></div>
            <p className="truncate text-sm text-cream/60">{c.last}</p>
          </button></li>))}
      </ul>
      <section className="flex min-h-0 flex-col rounded-3xl border border-gold/15">
        <header className="flex items-center justify-between border-b border-gold/10 p-4"><b>{active.name}</b>
          <button aria-label="Play game" onClick={() => toast('Game picker coming soon')} className="tap grid h-11 w-11 place-items-center rounded-full text-gold"><Gamepad2 /></button></header>
        <div className="flex-1 space-y-2 overflow-y-auto p-4">{msgs.map((m, i) => (
          <p key={i} className={`w-fit max-w-[75%] rounded-2xl px-4 py-2 ${m.me ? 'ml-auto bg-maroon' : 'bg-[#3a2420]'}`}>{m.text}</p>))}</div>
        <div className="flex gap-2 p-3">
          <input aria-label="Message" value={draft} onChange={e => setDraft(e.target.value)} onKeyDown={e => e.key === 'Enter' && send()} placeholder="Message" className="min-h-[44px] flex-1 rounded-full border border-gold/20 bg-transparent px-4 outline-none focus:border-gold" />
          <button aria-label="Send" onClick={send} className="tap grid h-11 w-11 place-items-center rounded-full bg-wine"><Send size={18} /></button>
        </div>
      </section>
    </div>
  )
}
