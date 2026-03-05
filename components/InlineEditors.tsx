'use client'

import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import type { PartnerGroup, Person, PersonSummary } from '@/lib/types'
import { ProfilePhotoQuickUpload } from './ProfilePhotoQuickUpload'

type PersonForm = {
  first_name: string
  middle_name: string
  last_name: string
  maiden_name: string
  birth_date: string
  death_date: string
  birth_place: string
  gender: string
  notes: string
}

type SchemaFlags = {
  supportsBirthPlace: boolean
  supportsGender: boolean
}

function getSchemaFlags(person: Person): SchemaFlags {
  const record = person as unknown as Record<string, unknown>
  return {
    supportsBirthPlace: Object.prototype.hasOwnProperty.call(record, 'birth_place'),
    supportsGender: Object.prototype.hasOwnProperty.call(record, 'gender'),
  }
}

function toForm(person: Person): PersonForm {
  return {
    first_name: person.first_name ?? '',
    middle_name: person.middle_name ?? '',
    last_name: person.last_name ?? '',
    maiden_name: person.maiden_name ?? '',
    birth_date: person.birth_date ?? '',
    death_date: person.death_date ?? '',
    birth_place: person.birth_place ?? '',
    gender: person.gender ?? '',
    notes: person.notes ?? '',
  }
}

function emptyForm(lastName = ''): PersonForm {
  return {
    first_name: '',
    middle_name: '',
    last_name: lastName,
    maiden_name: '',
    birth_date: '',
    death_date: '',
    birth_place: '',
    gender: '',
    notes: '',
  }
}

async function apiJson<T>(url: string, options: RequestInit): Promise<T> {
  const res = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers ?? {}),
    },
  })

  const body = await res.json().catch(() => ({} as Record<string, unknown>))
  if (!res.ok) {
    const msg = typeof body?.error === 'string' ? body.error : 'Request failed'
    throw new Error(msg)
  }

  return body as T
}

async function createPerson(form: PersonForm): Promise<string> {
  const data = await apiJson<{ person: Person }>('/api/people', {
    method: 'POST',
    body: JSON.stringify(form),
  })
  return data.person.id
}

function personLabel(person: PersonSummary): string {
  return `${person.first_name} ${person.last_name}${person.maiden_name ? ` (${person.maiden_name})` : ''}`
}

function EditorToggle({
  label,
  open,
  onClick,
}: {
  label: string
  open: boolean
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`px-3 py-1.5 rounded-md text-xs font-medium border transition-colors ${open
        ? 'bg-zinc-200 border-zinc-300 text-zinc-800 dark:bg-zinc-700 dark:border-zinc-600 dark:text-zinc-100'
        : 'bg-white border-zinc-300 text-zinc-700 hover:bg-zinc-100 dark:bg-zinc-900 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800'
      }`}
    >
      {label}
    </button>
  )
}

function PersonFields({
  form,
  setForm,
  flags,
  compact = false,
}: {
  form: PersonForm
  setForm: (next: PersonForm) => void
  flags: SchemaFlags
  compact?: boolean
}) {
  return (
    <div className={`grid gap-2 ${compact ? 'grid-cols-1 sm:grid-cols-2' : 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3'}`}>
      <input required value={form.first_name} onChange={(e) => setForm({ ...form, first_name: e.target.value })} placeholder="First name" className="rounded-md border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-2 py-1.5 text-sm" />
      <input value={form.middle_name} onChange={(e) => setForm({ ...form, middle_name: e.target.value })} placeholder="Middle name" className="rounded-md border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-2 py-1.5 text-sm" />
      <input required value={form.last_name} onChange={(e) => setForm({ ...form, last_name: e.target.value })} placeholder="Last name" className="rounded-md border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-2 py-1.5 text-sm" />
      <input value={form.maiden_name} onChange={(e) => setForm({ ...form, maiden_name: e.target.value })} placeholder="Maiden name" className="rounded-md border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-2 py-1.5 text-sm" />
      <label className="text-xs text-zinc-500 flex flex-col gap-1">
        Birth date
        <input type="date" value={form.birth_date} onChange={(e) => setForm({ ...form, birth_date: e.target.value })} className="rounded-md border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-2 py-1.5 text-sm" />
      </label>
      <label className="text-xs text-zinc-500 flex flex-col gap-1">
        Death date
        <input type="date" value={form.death_date} onChange={(e) => setForm({ ...form, death_date: e.target.value })} className="rounded-md border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-2 py-1.5 text-sm" />
      </label>
      {flags.supportsBirthPlace && (
        <input value={form.birth_place} onChange={(e) => setForm({ ...form, birth_place: e.target.value })} placeholder="Birth place" className="rounded-md border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-2 py-1.5 text-sm" />
      )}
      {flags.supportsGender && (
        <input value={form.gender} onChange={(e) => setForm({ ...form, gender: e.target.value })} placeholder="Gender" className="rounded-md border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-2 py-1.5 text-sm" />
      )}
      <textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} placeholder="Notes" className="rounded-md border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-2 py-1.5 text-sm min-h-16 sm:col-span-2" />
    </div>
  )
}

export function DetailsEditorInline({ person }: { person: Person }) {
  const router = useRouter()
  const flags = useMemo(() => getSchemaFlags(person), [person])
  const [open, setOpen] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [form, setForm] = useState<PersonForm>(toForm(person))

  return (
    <div className="flex flex-col gap-2">
      <EditorToggle label="Edit" open={open} onClick={() => { setError(null); setOpen((v) => !v) }} />
      {open && (
        <form
          className="rounded-lg border border-zinc-200 dark:border-zinc-700 p-3 bg-zinc-50/80 dark:bg-zinc-900/50"
          onSubmit={async (e) => {
            e.preventDefault()
            setError(null)
            setSubmitting(true)
            try {
              await apiJson(`/api/people/${person.id}`, { method: 'PATCH', body: JSON.stringify(form) })
              setOpen(false)
              router.refresh()
            } catch (err) {
              setError(err instanceof Error ? err.message : 'Could not update details')
            } finally {
              setSubmitting(false)
            }
          }}
        >
          <div className="mb-2">
            <ProfilePhotoQuickUpload personId={person.id} />
          </div>
          <PersonFields form={form} setForm={setForm} flags={flags} />
          {error && <p className="text-xs text-red-600 dark:text-red-400 mt-2">{error}</p>}
          <div className="mt-2 flex items-center gap-2">
            <button type="submit" disabled={submitting} className="px-3 py-1.5 rounded-md text-xs font-medium bg-amber-500 text-zinc-950 hover:bg-amber-400 disabled:opacity-60">Save</button>
            <button
              type="button"
              onClick={() => {
                setForm(toForm(person))
                setError(null)
                setOpen(false)
              }}
              className="px-3 py-1.5 rounded-md text-xs font-medium border border-zinc-300 dark:border-zinc-700"
            >
              Cancel
            </button>
          </div>
        </form>
      )}
    </div>
  )
}

export function AddParentInline({ person, allPeople }: { person: Person; allPeople: PersonSummary[] }) {
  const router = useRouter()
  const flags = useMemo(() => getSchemaFlags(person), [person])
  const options = allPeople.filter((p) => p.id !== person.id)
  const [open, setOpen] = useState(false)
  const [mode, setMode] = useState<'existing' | 'new'>('existing')
  const [existingId, setExistingId] = useState('')
  const [isAdopted, setIsAdopted] = useState(false)
  const [form, setForm] = useState<PersonForm>(emptyForm(person.last_name))
  const [error, setError] = useState<string | null>(null)

  return (
    <div className="flex flex-col gap-2">
      <EditorToggle label="Add Parent" open={open} onClick={() => { setError(null); setOpen((v) => !v) }} />
      {open && (
        <form
          className="rounded-lg border border-zinc-200 dark:border-zinc-700 p-3 bg-zinc-50/80 dark:bg-zinc-900/50 flex flex-col gap-2"
          onSubmit={async (e) => {
            e.preventDefault()
            setError(null)
            try {
              let parentId = existingId
              if (mode === 'new') parentId = await createPerson(form)
              if (!parentId) throw new Error('Select or create a parent first')
              await apiJson('/api/parent-child', {
                method: 'POST',
                body: JSON.stringify({ parent_id: parentId, child_id: person.id, is_adopted: isAdopted }),
              })
              setOpen(false)
              router.refresh()
            } catch (err) {
              setError(err instanceof Error ? err.message : 'Could not add parent')
            }
          }}
        >
          <ModeSwitch mode={mode} onChange={setMode} />
          {mode === 'existing' ? (
            <select value={existingId} onChange={(e) => setExistingId(e.target.value)} className="rounded-md border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-2 py-1.5 text-sm">
              <option value="">Select person...</option>
              {options.map((p) => <option key={p.id} value={p.id}>{personLabel(p)}</option>)}
            </select>
          ) : (
            <PersonFields form={form} setForm={setForm} flags={flags} compact />
          )}
          <label className="text-xs flex items-center gap-2 text-zinc-600 dark:text-zinc-400">
            <input type="checkbox" checked={isAdopted} onChange={(e) => setIsAdopted(e.target.checked)} />
            Adoptive parent
          </label>
          {error && <p className="text-xs text-red-600 dark:text-red-400">{error}</p>}
          <button type="submit" className="self-start px-3 py-1.5 rounded-md text-xs font-medium border border-zinc-300 dark:border-zinc-700">Save parent</button>
        </form>
      )}
    </div>
  )
}

export function AddPartnerInline({ person, allPeople }: { person: Person; allPeople: PersonSummary[] }) {
  const router = useRouter()
  const flags = useMemo(() => getSchemaFlags(person), [person])
  const options = allPeople.filter((p) => p.id !== person.id)
  const [open, setOpen] = useState(false)
  const [mode, setMode] = useState<'existing' | 'new'>('existing')
  const [existingId, setExistingId] = useState('')
  const [form, setForm] = useState<PersonForm>(emptyForm(person.last_name))
  const [relationshipType, setRelationshipType] = useState('partner')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [notes, setNotes] = useState('')
  const [error, setError] = useState<string | null>(null)

  return (
    <div className="flex flex-col gap-2">
      <EditorToggle label="Add Partner" open={open} onClick={() => { setError(null); setOpen((v) => !v) }} />
      {open && (
        <form
          className="rounded-lg border border-zinc-200 dark:border-zinc-700 p-3 bg-zinc-50/80 dark:bg-zinc-900/50 flex flex-col gap-2"
          onSubmit={async (e) => {
            e.preventDefault()
            setError(null)
            try {
              let partnerId = existingId
              if (mode === 'new') partnerId = await createPerson(form)
              if (!partnerId) throw new Error('Select or create a partner first')
              await apiJson('/api/relationships', {
                method: 'POST',
                body: JSON.stringify({
                  person1_id: person.id,
                  person2_id: partnerId,
                  relationship_type: relationshipType,
                  start_date: startDate,
                  end_date: endDate,
                  notes,
                }),
              })
              setOpen(false)
              router.refresh()
            } catch (err) {
              setError(err instanceof Error ? err.message : 'Could not add partner')
            }
          }}
        >
          <ModeSwitch mode={mode} onChange={setMode} />
          {mode === 'existing' ? (
            <select value={existingId} onChange={(e) => setExistingId(e.target.value)} className="rounded-md border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-2 py-1.5 text-sm">
              <option value="">Select person...</option>
              {options.map((p) => <option key={p.id} value={p.id}>{personLabel(p)}</option>)}
            </select>
          ) : (
            <PersonFields form={form} setForm={setForm} flags={flags} compact />
          )}
          <input value={relationshipType} onChange={(e) => setRelationshipType(e.target.value)} placeholder="Relationship type" className="rounded-md border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-2 py-1.5 text-sm" />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <label className="text-xs text-zinc-500">Start date<input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="mt-1 w-full rounded-md border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-2 py-1.5 text-sm" /></label>
            <label className="text-xs text-zinc-500">End date<input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="mt-1 w-full rounded-md border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-2 py-1.5 text-sm" /></label>
          </div>
          <textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Notes" className="rounded-md border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-2 py-1.5 text-sm min-h-14" />
          {error && <p className="text-xs text-red-600 dark:text-red-400">{error}</p>}
          <button type="submit" className="self-start px-3 py-1.5 rounded-md text-xs font-medium border border-zinc-300 dark:border-zinc-700">Save relationship</button>
        </form>
      )}
    </div>
  )
}

export function AddChildInline({ person, allPeople }: { person: Person; allPeople: PersonSummary[] }) {
  const router = useRouter()
  const flags = useMemo(() => getSchemaFlags(person), [person])
  const options = allPeople.filter((p) => p.id !== person.id)
  const [open, setOpen] = useState(false)
  const [mode, setMode] = useState<'existing' | 'new'>('new')
  const [existingId, setExistingId] = useState('')
  const [form, setForm] = useState<PersonForm>(emptyForm(person.last_name))
  const [otherParentId, setOtherParentId] = useState('')
  const [isAdopted, setIsAdopted] = useState(false)
  const [linkPartner, setLinkPartner] = useState(true)
  const [error, setError] = useState<string | null>(null)

  return (
    <div className="flex flex-col gap-2">
      <EditorToggle label="Add Child" open={open} onClick={() => { setError(null); setOpen((v) => !v) }} />
      {open && (
        <form
          className="rounded-lg border border-zinc-200 dark:border-zinc-700 p-3 bg-zinc-50/80 dark:bg-zinc-900/50 flex flex-col gap-2"
          onSubmit={async (e) => {
            e.preventDefault()
            setError(null)
            try {
              let childId = existingId
              if (mode === 'new') childId = await createPerson(form)
              if (!childId) throw new Error('Select or create a child first')

              await apiJson('/api/parent-child', {
                method: 'POST',
                body: JSON.stringify({ parent_id: person.id, child_id: childId, is_adopted: isAdopted }),
              })

              if (otherParentId) {
                await apiJson('/api/parent-child', {
                  method: 'POST',
                  body: JSON.stringify({ parent_id: otherParentId, child_id: childId, is_adopted: false }),
                })

                if (linkPartner) {
                  await apiJson('/api/relationships', {
                    method: 'POST',
                    body: JSON.stringify({ person1_id: person.id, person2_id: otherParentId, relationship_type: 'partner' }),
                  })
                }
              }

              setOpen(false)
              router.refresh()
            } catch (err) {
              setError(err instanceof Error ? err.message : 'Could not add child')
            }
          }}
        >
          <ModeSwitch mode={mode} onChange={setMode} />
          {mode === 'existing' ? (
            <select value={existingId} onChange={(e) => setExistingId(e.target.value)} className="rounded-md border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-2 py-1.5 text-sm">
              <option value="">Select child...</option>
              {options.map((p) => <option key={p.id} value={p.id}>{personLabel(p)}</option>)}
            </select>
          ) : (
            <PersonFields form={form} setForm={setForm} flags={flags} compact />
          )}
          <select value={otherParentId} onChange={(e) => setOtherParentId(e.target.value)} className="rounded-md border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-2 py-1.5 text-sm">
            <option value="">Other parent unknown</option>
            {options.map((p) => <option key={p.id} value={p.id}>{personLabel(p)}</option>)}
          </select>
          <label className="text-xs flex items-center gap-2 text-zinc-600 dark:text-zinc-400">
            <input type="checkbox" checked={isAdopted} onChange={(e) => setIsAdopted(e.target.checked)} />
            Adoptive parent (for current person)
          </label>
          <label className="text-xs flex items-center gap-2 text-zinc-600 dark:text-zinc-400">
            <input type="checkbox" checked={linkPartner} onChange={(e) => setLinkPartner(e.target.checked)} disabled={!otherParentId} />
            Create partner relationship with selected other parent
          </label>
          {error && <p className="text-xs text-red-600 dark:text-red-400">{error}</p>}
          <button type="submit" className="self-start px-3 py-1.5 rounded-md text-xs font-medium border border-zinc-300 dark:border-zinc-700">Save child link</button>
        </form>
      )}
    </div>
  )
}

export function EditRelationshipInline({ partnerGroups }: { partnerGroups: PartnerGroup[] }) {
  const router = useRouter()
  const rows = partnerGroups.filter((g) => g.relationship)
  const [open, setOpen] = useState(false)
  const [selectedId, setSelectedId] = useState('')
  const [type, setType] = useState('partner')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [notes, setNotes] = useState('')
  const [archived, setArchived] = useState(false)
  const [error, setError] = useState<string | null>(null)

  if (rows.length === 0) return null

  return (
    <div className="flex flex-col gap-2">
      <EditorToggle label="Edit Relationship" open={open} onClick={() => { setError(null); setOpen((v) => !v) }} />
      {open && (
        <form
          className="rounded-lg border border-zinc-200 dark:border-zinc-700 p-3 bg-zinc-50/80 dark:bg-zinc-900/50 flex flex-col gap-2"
          onSubmit={async (e) => {
            e.preventDefault()
            setError(null)
            try {
              if (!selectedId) throw new Error('Select a relationship first')
              await apiJson(`/api/relationships/${selectedId}`, {
                method: 'PATCH',
                body: JSON.stringify({ relationship_type: type, start_date: startDate, end_date: endDate, notes, archived }),
              })
              setOpen(false)
              router.refresh()
            } catch (err) {
              setError(err instanceof Error ? err.message : 'Could not update relationship')
            }
          }}
        >
          <select
            value={selectedId}
            onChange={(e) => {
              const id = e.target.value
              setSelectedId(id)
              const row = rows.find((r) => r.relationship?.id === id)
              if (!row?.relationship) return
              setType(row.relationship.relationship_type ?? 'partner')
              setStartDate(row.relationship.start_date ?? '')
              setEndDate(row.relationship.end_date ?? '')
              setNotes(row.relationship.notes ?? '')
              setArchived(Boolean((row.relationship as unknown as { archived_at?: string | null }).archived_at))
            }}
            className="rounded-md border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-2 py-1.5 text-sm"
          >
            <option value="">Select relationship...</option>
            {rows.map((row) => {
              if (!row.relationship) return null
              const name = row.partner ? `${row.partner.first_name} ${row.partner.last_name}` : 'Unknown partner'
              return <option key={row.relationship.id} value={row.relationship.id}>{name} ({row.relationship.relationship_type})</option>
            })}
          </select>
          <input value={type} onChange={(e) => setType(e.target.value)} placeholder="Relationship type" className="rounded-md border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-2 py-1.5 text-sm" />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <label className="text-xs text-zinc-500">Start date<input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="mt-1 w-full rounded-md border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-2 py-1.5 text-sm" /></label>
            <label className="text-xs text-zinc-500">End date<input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="mt-1 w-full rounded-md border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-2 py-1.5 text-sm" /></label>
          </div>
          <textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Notes" className="rounded-md border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-2 py-1.5 text-sm min-h-14" />
          <label className="text-xs flex items-center gap-2 text-zinc-600 dark:text-zinc-400">
            <input type="checkbox" checked={archived} onChange={(e) => setArchived(e.target.checked)} />
            Archived
          </label>
          {error && <p className="text-xs text-red-600 dark:text-red-400">{error}</p>}
          <div className="flex items-center gap-2">
            <button type="submit" className="self-start px-3 py-1.5 rounded-md text-xs font-medium border border-zinc-300 dark:border-zinc-700">Save relationship</button>
            {selectedId && (
              <button
                type="button"
                onClick={async () => {
                  setError(null)
                  try {
                    await apiJson(`/api/relationships/${selectedId}`, {
                      method: 'DELETE',
                      body: JSON.stringify({ restore: archived }),
                    })
                    setOpen(false)
                    router.refresh()
                  } catch (err) {
                    setError(err instanceof Error ? err.message : 'Could not change archive status')
                  }
                }}
                className="self-start px-3 py-1.5 rounded-md text-xs font-medium border border-zinc-300 dark:border-zinc-700"
              >
                {archived ? 'Restore relationship' : 'Archive relationship'}
              </button>
            )}
          </div>
        </form>
      )}
    </div>
  )
}

function ModeSwitch({
  mode,
  onChange,
}: {
  mode: 'existing' | 'new'
  onChange: (mode: 'existing' | 'new') => void
}) {
  return (
    <div className="inline-flex rounded-md overflow-hidden border border-zinc-300 dark:border-zinc-700 self-start">
      <button type="button" onClick={() => onChange('existing')} className={`px-2.5 py-1 text-xs ${mode === 'existing' ? 'bg-zinc-200 dark:bg-zinc-700' : 'bg-transparent'}`}>
        Existing
      </button>
      <button type="button" onClick={() => onChange('new')} className={`px-2.5 py-1 text-xs border-l border-zinc-300 dark:border-zinc-700 ${mode === 'new' ? 'bg-zinc-200 dark:bg-zinc-700' : 'bg-transparent'}`}>
        New
      </button>
    </div>
  )
}
