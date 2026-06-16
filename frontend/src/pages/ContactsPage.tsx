import { useState, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { z } from 'zod'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'

import {
  useContacts,
  useCreateContact,
  useDeleteContact,
} from '../api/contacts'
import apiClient from '../api/client'
import type { PaginatedResponse } from '../types'
import type { Company } from '../types'
import Modal from '../components/ui/Modal'
import Badge from '../components/ui/Badge'
import Pagination from '../components/ui/Pagination'
import SearchInput from '../components/ui/SearchInput'
import { formatRelativeTime } from '../utils/format'

// ---------------------------------------------------------------------------
// Create contact form schema
// ---------------------------------------------------------------------------

const createContactSchema = z.object({
  first_name: z.string().min(1, 'First name is required'),
  last_name: z.string().min(1, 'Last name is required'),
  company_id: z.string().optional().nullable(),
  email: z.string().email('Invalid email').optional().or(z.literal('')),
  phone: z.string().optional().nullable(),
  title: z.string().optional().nullable(),
  is_decision_maker: z.boolean().default(false),
})

type CreateContactForm = z.infer<typeof createContactSchema>

// ---------------------------------------------------------------------------
// Skeleton row
// ---------------------------------------------------------------------------

function SkeletonRow() {
  return (
    <tr>
      {Array.from({ length: 8 }).map((_, i) => (
        <td key={i} className="px-4 py-3">
          <div className="h-4 bg-gray-200 rounded animate-pulse" />
        </td>
      ))}
    </tr>
  )
}

// ---------------------------------------------------------------------------
// Create Contact Modal
// ---------------------------------------------------------------------------

interface CreateContactModalProps {
  isOpen: boolean
  onClose: () => void
  companies: Company[]
}

function CreateContactModal({
  isOpen,
  onClose,
  companies,
}: CreateContactModalProps) {
  const createContact = useCreateContact()

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<CreateContactForm>({
    resolver: zodResolver(createContactSchema),
    defaultValues: { is_decision_maker: false },
  })

  const onSubmit = async (data: CreateContactForm) => {
    await createContact.mutateAsync({
      first_name: data.first_name,
      last_name: data.last_name,
      company_id: data.company_id || null,
      email: data.email || null,
      phone: data.phone || null,
      title: data.title || null,
      is_decision_maker: data.is_decision_maker,
    })
    reset()
    onClose()
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="New Contact" size="md">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              First Name <span className="text-red-500">*</span>
            </label>
            <input
              {...register('first_name')}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Jane"
            />
            {errors.first_name && (
              <p className="mt-1 text-xs text-red-500">
                {errors.first_name.message}
              </p>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Last Name <span className="text-red-500">*</span>
            </label>
            <input
              {...register('last_name')}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Smith"
            />
            {errors.last_name && (
              <p className="mt-1 text-xs text-red-500">
                {errors.last_name.message}
              </p>
            )}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Company
          </label>
          <select
            {...register('company_id')}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">— No company —</option>
            {companies.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Email
          </label>
          <input
            {...register('email')}
            type="email"
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="jane@example.com"
          />
          {errors.email && (
            <p className="mt-1 text-xs text-red-500">{errors.email.message}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Phone
          </label>
          <input
            {...register('phone')}
            type="tel"
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="+1 555 000 0000"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Title
          </label>
          <input
            {...register('title')}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="VP of Engineering"
          />
        </div>

        <div className="flex items-center gap-2">
          <input
            {...register('is_decision_maker')}
            type="checkbox"
            id="is_decision_maker"
            className="h-4 w-4 text-blue-600 border-gray-300 rounded"
          />
          <label
            htmlFor="is_decision_maker"
            className="text-sm text-gray-700"
          >
            Decision Maker
          </label>
        </div>

        <div className="flex justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            {isSubmitting ? 'Creating...' : 'Create Contact'}
          </button>
        </div>
      </form>
    </Modal>
  )
}

// ---------------------------------------------------------------------------
// Main page
// ---------------------------------------------------------------------------

export default function ContactsPage() {
  const [searchTerm, setSearchTerm] = useState('')
  const [companyFilter, setCompanyFilter] = useState('')
  const [decisionMakerOnly, setDecisionMakerOnly] = useState(false)
  const [page, setPage] = useState(1)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [showCreate, setShowCreate] = useState(false)

  // Fetch contacts
  const { data, isLoading, isError } = useContacts({
    q: searchTerm || undefined,
    company_id: companyFilter || undefined,
    is_decision_maker: decisionMakerOnly || undefined,
    page,
    per_page: 20,
  })

  // Fetch companies for filter / create form
  const { data: companiesData } = useQuery({
    queryKey: ['companies', 'list', { per_page: 100 }],
    queryFn: async () => {
      const { data: res } = await apiClient.get<PaginatedResponse<Company>>(
        '/v1/companies',
        { params: { per_page: 100 } },
      )
      return res
    },
    staleTime: 1000 * 60 * 5,
  })

  const companies = companiesData?.data ?? []
  const contacts = data?.data ?? []
  const totalPages = data?.meta?.total_pages ?? 1

  const deleteContact = useDeleteContact()

  // Search handler (stable ref for SearchInput)
  const handleSearch = useCallback((v: string) => {
    setSearchTerm(v)
    setPage(1)
  }, [])

  // Bulk selection helpers
  const allSelected =
    contacts.length > 0 && contacts.every((c) => selectedIds.has(c.id))

  const toggleAll = () => {
    if (allSelected) {
      setSelectedIds(new Set())
    } else {
      setSelectedIds(new Set(contacts.map((c) => c.id)))
    }
  }

  const toggleOne = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const handleDeleteSelected = async () => {
    if (!window.confirm(`Delete ${selectedIds.size} contact(s)?`)) return
    await Promise.all([...selectedIds].map((id) => deleteContact.mutateAsync(id)))
    setSelectedIds(new Set())
  }

  const handleDeleteOne = async (id: string) => {
    if (!window.confirm('Delete this contact?')) return
    await deleteContact.mutateAsync(id)
    setSelectedIds((prev) => {
      const next = new Set(prev)
      next.delete(id)
      return next
    })
  }

  return (
    <div className="space-y-4">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-gray-900">Contacts</h1>
        <button
          onClick={() => setShowCreate(true)}
          className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
        >
          <span className="text-lg leading-none">+</span> New Contact
        </button>
      </div>

      {/* Filter row */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="w-64">
          <SearchInput
            value={searchTerm}
            onChange={handleSearch}
            placeholder="Search contacts..."
          />
        </div>

        <select
          value={companyFilter}
          onChange={(e) => {
            setCompanyFilter(e.target.value)
            setPage(1)
          }}
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">All Companies</option>
          {companies.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>

        <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
          <input
            type="checkbox"
            checked={decisionMakerOnly}
            onChange={(e) => {
              setDecisionMakerOnly(e.target.checked)
              setPage(1)
            }}
            className="h-4 w-4 text-blue-600 border-gray-300 rounded"
          />
          Decision Makers Only
        </label>
      </div>

      {/* Bulk toolbar */}
      {selectedIds.size > 0 && (
        <div className="flex items-center gap-4 px-4 py-2 bg-blue-50 border border-blue-200 rounded-lg">
          <span className="text-sm text-blue-700 font-medium">
            {selectedIds.size} selected
          </span>
          <button
            onClick={handleDeleteSelected}
            className="text-sm text-red-600 hover:text-red-800 font-medium"
          >
            Delete Selected
          </button>
        </div>
      )}

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        {isError ? (
          <div className="p-8 text-center text-red-500">
            Failed to load contacts. Please try again.
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-4 py-3 w-10">
                  <input
                    type="checkbox"
                    checked={allSelected}
                    onChange={toggleAll}
                    className="h-4 w-4 text-blue-600 border-gray-300 rounded"
                    aria-label="Select all"
                  />
                </th>
                <th className="px-4 py-3 text-left font-medium text-gray-600">
                  Name
                </th>
                <th className="px-4 py-3 text-left font-medium text-gray-600">
                  Company
                </th>
                <th className="px-4 py-3 text-left font-medium text-gray-600">
                  Title
                </th>
                <th className="px-4 py-3 text-left font-medium text-gray-600">
                  Email
                </th>
                <th className="px-4 py-3 text-left font-medium text-gray-600">
                  DM
                </th>
                <th className="px-4 py-3 text-left font-medium text-gray-600">
                  Last Activity
                </th>
                <th className="px-4 py-3 w-16" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {isLoading ? (
                <>
                  <SkeletonRow />
                  <SkeletonRow />
                  <SkeletonRow />
                </>
              ) : contacts.length === 0 ? (
                <tr>
                  <td
                    colSpan={8}
                    className="px-4 py-12 text-center text-gray-400"
                  >
                    No contacts found.
                  </td>
                </tr>
              ) : (
                contacts.map((contact) => (
                  <tr
                    key={contact.id}
                    className="hover:bg-gray-50 transition-colors"
                  >
                    <td className="px-4 py-3">
                      <input
                        type="checkbox"
                        checked={selectedIds.has(contact.id)}
                        onChange={() => toggleOne(contact.id)}
                        className="h-4 w-4 text-blue-600 border-gray-300 rounded"
                        aria-label={`Select ${contact.first_name} ${contact.last_name}`}
                      />
                    </td>
                    <td className="px-4 py-3">
                      <Link
                        to={`/contacts/${contact.id}`}
                        className="font-medium text-blue-700 hover:underline"
                      >
                        {contact.first_name} {contact.last_name}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-gray-700">
                      {contact.company_name ?? '—'}
                    </td>
                    <td className="px-4 py-3 text-gray-600">
                      {contact.title ?? '—'}
                    </td>
                    <td className="px-4 py-3">
                      {contact.email ? (
                        <a
                          href={`mailto:${contact.email}`}
                          className="text-blue-600 hover:underline"
                        >
                          {contact.email}
                        </a>
                      ) : (
                        <span className="text-gray-400">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {contact.is_decision_maker ? (
                        <Badge label="DM" variant="green" />
                      ) : null}
                    </td>
                    <td className="px-4 py-3 text-gray-500">
                      {contact.last_activity_date
                        ? formatRelativeTime(contact.last_activity_date)
                        : 'Never'}
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => handleDeleteOne(contact.id)}
                        className="text-gray-400 hover:text-red-600 transition-colors"
                        aria-label="Delete contact"
                      >
                        🗑
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        )}
      </div>

      {/* Pagination */}
      <Pagination
        page={page}
        totalPages={totalPages}
        onPageChange={setPage}
      />

      {/* Create Contact Modal */}
      <CreateContactModal
        isOpen={showCreate}
        onClose={() => setShowCreate(false)}
        companies={companies}
      />
    </div>
  )
}
