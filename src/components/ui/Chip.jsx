export default function Chip({
  children,
  active = false,
  className = '',
  ...props
}) {
  return (
    <button
      {...props}
      className={`
        inline-flex
        min-h-[36px]
        items-center
        justify-center
        rounded-full
        px-4
        text-sm
        font-semibold
        transition-all
        duration-200
        active:scale-95

        ${
          active
            ? 'bg-campus-black text-campus-white'
            : 'border border-campus-border bg-white text-campus-black hover:bg-campus-gray'
        }

        ${className}
      `}
    >
      {children}
    </button>
  )
}