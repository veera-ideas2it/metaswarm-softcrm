import type { ReactNode } from 'react'

interface KPICardProps {
  icon: ReactNode
  label: string
  value: string
  subValue?: string
}

export default function KPICard({ icon, label, value, subValue }: KPICardProps) {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 flex items-start gap-4">
      <div className="flex-shrink-0 w-12 h-12 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-600">
        {icon}
      </div>
      <div className="min-w-0">
        <p className="text-sm font-medium text-gray-500 truncate">{label}</p>
        <p className="mt-1 text-2xl font-semibold text-gray-900 truncate">{value}</p>
        {subValue && (
          <p className="mt-0.5 text-xs text-gray-400 truncate">{subValue}</p>
        )}
      </div>
    </div>
  )
}
