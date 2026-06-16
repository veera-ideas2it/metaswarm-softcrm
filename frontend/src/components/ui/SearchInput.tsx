import { useState, useEffect } from 'react'

interface SearchInputProps {
  value: string
  onChange: (v: string) => void
  placeholder?: string
  debounceMs?: number
}

export default function SearchInput({
  value,
  onChange,
  placeholder = 'Search...',
  debounceMs = 300,
}: SearchInputProps) {
  const [localValue, setLocalValue] = useState(value)

  // Sync external value changes (e.g., reset)
  useEffect(() => {
    setLocalValue(value)
  }, [value])

  // Debounce upward propagation
  useEffect(() => {
    const timer = setTimeout(() => {
      onChange(localValue)
    }, debounceMs)
    return () => clearTimeout(timer)
  }, [localValue, debounceMs, onChange])

  return (
    <div className="relative flex items-center">
      {/* Search icon */}
      <svg
        className="absolute left-3 h-4 w-4 text-gray-400 pointer-events-none"
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={2}
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z"
        />
      </svg>

      <input
        type="text"
        value={localValue}
        onChange={(e) => setLocalValue(e.target.value)}
        placeholder={placeholder}
        className="w-full pl-9 pr-8 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
      />

      {/* Clear button */}
      {localValue && (
        <button
          type="button"
          onClick={() => {
            setLocalValue('')
            onChange('')
          }}
          className="absolute right-2 text-gray-400 hover:text-gray-600 transition-colors"
          aria-label="Clear search"
        >
          &times;
        </button>
      )}
    </div>
  )
}
