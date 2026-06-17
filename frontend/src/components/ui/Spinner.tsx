interface SpinnerProps {
  size?: 'sm' | 'md' | 'lg'
}

export default function Spinner({ size = 'md' }: SpinnerProps) {
  const sizeClass = {
    sm: 'h-4 w-4 border-2',
    md: 'h-8 w-8 border-2',
    lg: 'h-12 w-12 border-3',
  }[size]

  return (
    <div className="flex items-center justify-center p-4">
      <div
        className={`${sizeClass} animate-spin rounded-full border-gray-300 border-t-primary`}
      />
    </div>
  )
}