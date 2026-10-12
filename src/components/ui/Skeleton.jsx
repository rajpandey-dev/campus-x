export default function Skeleton({
  className = '',
}) {
  return (
    <div
      className={`
        animate-pulse
        rounded-campus
        bg-campus-gray
        ${className}
      `}
    />
  )
}