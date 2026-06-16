import { useParams } from 'react-router-dom'

export default function CompanyProfilePage() {
  const { id } = useParams<{ id: string }>()
  return (
    <div>
      <h1 className="text-2xl font-semibold text-gray-900">Company</h1>
      <p className="mt-2 text-gray-500">Company {id} profile coming soon.</p>
    </div>
  )
}
