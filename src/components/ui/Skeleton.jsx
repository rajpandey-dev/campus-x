export default function Skeleton({ className = 'h-24' }) {
  return <div className={`animate-pulse rounded-3xl bg-maroon/20 ${className}`} aria-hidden="true" />
}
