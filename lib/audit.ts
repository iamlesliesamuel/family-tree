import { getSupabaseAdmin } from './supabase-admin'

export type AuditEntityType =
  | 'people'
  | 'relationships'
  | 'parent_child'
  | 'person_photos'
  | 'person_documents'
  | 'person_notes'
  | 'relationship_notes'

export type AuditAction =
  | 'create'
  | 'update'
  | 'archive'
  | 'restore'
  | 'upload'
  | 'delete'

interface AuditEntry {
  entity_type: AuditEntityType
  entity_id: string
  person_id?: string | null
  action: AuditAction
  field_name?: string | null
  old_value?: string | null
  new_value?: string | null
  meta?: Record<string, unknown> | null
  edited_by?: string | null
}

export async function logAudit(entry: AuditEntry): Promise<void> {
  try {
    const admin = getSupabaseAdmin()
    await admin.from('edit_history').insert({
      ...entry,
      person_id: entry.person_id ?? null,
      field_name: entry.field_name ?? null,
      old_value: entry.old_value ?? null,
      new_value: entry.new_value ?? null,
      meta: entry.meta ?? null,
      edited_by: entry.edited_by ?? null,
    })
  } catch {
    // Keep mutation flow resilient even if audit logging fails.
  }
}

export async function logFieldDiffs(options: {
  entityType: AuditEntityType
  entityId: string
  personId?: string | null
  before: Record<string, unknown>
  after: Record<string, unknown>
  editedBy?: string | null
  meta?: Record<string, unknown> | null
  fields?: string[]
}) {
  const keys = options.fields ?? Array.from(new Set([...Object.keys(options.before), ...Object.keys(options.after)]))
  const writes = keys
    .filter((field) => JSON.stringify(options.before[field] ?? null) !== JSON.stringify(options.after[field] ?? null))
    .map((field) =>
      logAudit({
        entity_type: options.entityType,
        entity_id: options.entityId,
        person_id: options.personId ?? null,
        action: 'update',
        field_name: field,
        old_value: stringify(options.before[field]),
        new_value: stringify(options.after[field]),
        edited_by: options.editedBy ?? null,
        meta: options.meta ?? null,
      })
    )

  await Promise.all(writes)
}

function stringify(value: unknown): string | null {
  if (value === null || value === undefined) return null
  if (typeof value === 'string') return value
  if (typeof value === 'number' || typeof value === 'boolean') return String(value)
  try {
    return JSON.stringify(value)
  } catch {
    return null
  }
}
