import { useParams } from 'react-router-dom'

export default function DealDetailPage() {
  const { id } = useParams<{ id: string }>()
  return (
    <div>
      <h1 className="text-2xl font-semibold text-gray-900">Deal</h1>
      <p className="mt-2 text-gray-500">Deal {id} detail coming soon.</p>
    </div>
  )
}
