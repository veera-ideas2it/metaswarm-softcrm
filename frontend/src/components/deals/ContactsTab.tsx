import { useState } from 'react'
import toast from 'react-hot-toast'
import { Link2, X, Search, Loader2, BadgeCheck } from 'lucide-react'
import type { ContactResponse } from '../../types'
import client from '../../api/client'
import { useUpdateDeal } from '../../api/deals'

interface ContactsTabProps {
  dealId: string
  contacts: ContactResponse[]
}

// ---------------------------------------------------------------------------
// Link Contact modal
// ---------------------------------------------------------------------------

interface LinkContactModalProps {
  dealId: string
  onClose: () => void
  onLinked: () => void
}

function LinkContactModal({ dealId, onClose, onLinked }: LinkContactModalProps) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<ContactResponse[]>([])
  const [searching, setSearching] = useState(false)
  const [linking, setLinking] = useState<string | null>(null)

  const updateDeal = useUpdateDeal(dealId)

  async function search(q: string) {
    setQuery(q)
    if (!q.trim()) {
      setResults([])
      return
    }
    setSearching(true)
    try {
      const { data } = await client.get<{ data: ContactResponse[] }>('/v1/contacts', {
        params: { q },
      })
      setResults(data.data ?? [])
    } catch {
      setResults([])
    } finally {
      setSearching(false)
    }
  }

  async function handleLink(contact: ContactResponse) {
    setLinking(contact.id)
    try {
      await updateDeal.mutateAsync({ primary_contact_id: contact.id })
      toast.success(`${contact.first_name} ${contact.last_name} set as primary contact`)
      onLinked()
      onClose()
    } catch {
      toast.error('Failed to link contact')
    } finally {
      setLinking(null)
    }
  }

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/40 z-50" onClick={onClose} />

      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-xl shadow-2xl w-full max-w-md flex flex-col overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200">
            <h3 className="text-base font-semibold text-gray-900">Link Contact</h3>
            <button
              type="button"
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Search */}
          <div className="px-5 py-3 border-b border-gray-100">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                value={query}
                onChange={(e) => search(e.target.value)}
                placeholder="Search contacts by name..."
                autoFocus
                className="w-full pl-9 pr-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Results */}
          <div className="max-h-72 overflow-y-auto">
            {searching ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-5 h-5 text-blue-500 animate-spin" />
              </div>
            ) : results.length === 0 && query ? (
              <p className="text-center text-sm text-gray-400 py-8">No contacts found</p>
            ) : results.length === 0 ? (
              <p className="text-center text-sm text-gray-400 py-8">
                Start typing to search contacts
              </p>
            ) : (
              <ul className="divide-y divide-gray-100">
                {results.map((c) => (
                  <li key={c.id} className="flex items-center gap-3 px-5 py-3">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {c.first_name} {c.last_name}
                      </p>
                      {c.title && (
                        <p className="text-xs text-gray-500 truncate">{c.title}</p>
                      )}
                      {c.email && (
                        <p className="text-xs text-gray-400 truncate">{c.email}</p>
                      )}
                    </div>
                    <button
                      type="button"
                      disabled={linking === c.id}
                      onClick={() => handleLink(c)}
                      className="flex-shrink-0 inline-flex items-center gap-1 px-3 py-1 text-xs font-medium text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-md disabled:opacity-50 transition-colors"
                    >
                      {linking === c.id ? (
                        <Loader2 className="w-3 h-3 animate-spin" />
                      ) : (
                        <Link2 className="w-3 h-3" />
                      )}
                      Link
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>
    </>
  )
}

// ---------------------------------------------------------------------------
// ContactsTab
// ---------------------------------------------------------------------------

export default function ContactsTab({ dealId, contacts }: ContactsTabProps) {
  const [showModal, setShowModal] = useState(false)

  return (
    <div className="py-4">
      {/* Header row */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-gray-700">
          Contacts ({contacts.length})
        </h3>
        <button
          type="button"
          onClick={() => setShowModal(true)}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-blue-700 bg-blue-50 border border-blue-200 rounded-md hover:bg-blue-100 transition-colors"
        >
          <Link2 className="w-3.5 h-3.5" />
          Link Contact
        </button>
      </div>

      {/* Contacts list */}
      {contacts.length === 0 ? (
        <div className="text-center py-10 text-gray-400">
          <p className="text-sm">No contacts linked to this deal.</p>
          <p className="text-xs mt-1">Use the button above to link a primary contact.</p>
        </div>
      ) : (
        <ul className="divide-y divide-gray-100">
          {contacts.map((c) => (
            <li key={c.id} className="flex items-center gap-4 py-3">
              {/* Avatar */}
              <div className="w-9 h-9 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 text-sm font-semibold flex-shrink-0">
                {c.first_name[0]}{c.last_name[0]}
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {c.first_name} {c.last_name}
                  </p>
                  {c.is_decision_maker && (
                    <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-xs font-medium bg-green-50 text-green-700 border border-green-200">
                      <BadgeCheck className="w-3 h-3" />
                      Decision Maker
                    </span>
                  )}
                </div>
                {c.title && (
                  <p className="text-xs text-gray-500 truncate">{c.title}</p>
                )}
                {c.email && (
                  <a
                    href={`mailto:${c.email}`}
                    className="text-xs text-blue-600 hover:underline truncate block"
                  >
                    {c.email}
                  </a>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}

      {/* Link Contact modal */}
      {showModal && (
        <LinkContactModal
          dealId={dealId}
          onClose={() => setShowModal(false)}
          onLinked={() => setShowModal(false)}
        />
      )}
    </div>
  )
}
