const styles = {
  primary: 'bg-gradient-to-r from-maroon to-wine text-cream',
  gold: 'bg-gold text-surface',
  ghost: 'border border-gold/30 text-cream',
}
export default function Button({ variant = 'primary', className = '', ...p }) {
  return <button {...p} className={`tap min-h-[44px] rounded-full px-5 font-semibold ${styles[variant]} ${className}`} />
}
