import { useParams } from 'react-router-dom'

export default function ContactProfilePage() {
  const { id } = useParams<{ id: string }>()
  return (
    <div>
      <h1 className="text-2xl font-semibold text-gray-900">Contact</h1>
      <p className="mt-2 text-gray-500">Contact {id} profile coming soon.</p>
    </div>
  )
}
