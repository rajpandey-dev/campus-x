export default function Chip({ active, children, ...p }) {
  return <button {...p} className={`tap min-h-[36px] shrink-0 rounded-full border px-3 text-sm ${active ? 'border-gold bg-gold/15 text-gold' : 'border-gold/20 text-cream/80'}`}>{children}</button>
}
