const styles = {
  primary:
    'bg-campus-black text-white hover:bg-campus-dark',

  gold:
    'bg-campus-yellow text-campus-black hover:brightness-95',

  ghost:
    'border border-campus-border bg-white text-campus-black hover:bg-campus-gray',
}

export default function Button({
  variant = 'primary',
  className = '',
  ...p
}) {
  return (
    <button
      {...p}
      className={`
        tap
        min-h-[44px]
        rounded-full
        px-5
        font-semibold
        transition-all
        duration-200
        active:scale-95
        disabled:cursor-not-allowed
        disabled:opacity-50
        ${styles[variant]}
        ${className}
      `}
    />
  )
}