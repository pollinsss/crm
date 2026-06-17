import type { ChangeEvent } from 'react'

interface SelectOption {
  value: string
  label: string
}

interface SelectProps {
  value: string
  onChange: (value: string) => void
  options: SelectOption[]
  placeholder?: string
  className?: string
}

export default function Select({
  value,
  onChange,
  options,
  placeholder = 'Все',
  className = '',
}: SelectProps) {
  const handleChange = (e: ChangeEvent<HTMLSelectElement>) => {
    onChange(e.target.value)
  }

  return (
    <select
      value={value}
      onChange={handleChange}
      className={`block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm bg-white focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary ${className}`}
    >
      <option value="">{placeholder}</option>
      {options.map((opt) => (
        <option key={opt.value} value={opt.value}>
          {opt.label}
        </option>
      ))}
    </select>
  )
}