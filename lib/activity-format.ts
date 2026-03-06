type ActivityRow = {
  entity_type?: unknown
  action?: unknown
  field_name?: unknown
  description?: unknown
  old_value?: unknown
  new_value?: unknown
}

function toTitle(value: string) {
  return value
    .split('_')
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
}

function toBoolString(value: unknown) {
  if (typeof value !== 'string') return null
  if (value === 'true') return true
  if (value === 'false') return false
  return null
}

export function formatActivityDescription(row: ActivityRow, personName: string | null) {
  const entityType = typeof row.entity_type === 'string' ? row.entity_type : ''
  const action = typeof row.action === 'string' ? row.action : ''
  const field = typeof row.field_name === 'string' ? row.field_name : ''

  let base: string | null = null

  if (entityType === 'person_photos' && action === 'upload') base = 'Added photo'
  else if (entityType === 'person_documents' && action === 'upload') base = 'Added document'
  else if (entityType === 'person_photos' && action === 'update' && field === 'is_profile') {
    const isProfile = toBoolString(row.new_value)
    base = isProfile === true ? 'Set profile photo' : 'Updated profile photo selection'
  } else if (entityType === 'person_photos' && action === 'update' && (field === 'focus_x' || field === 'focus_y')) {
    base = 'Adjusted profile photo framing'
  } else if (entityType === 'person_photos' && action === 'update' && field === 'caption') {
    base = 'Updated photo caption'
  } else if (action === 'update' && field) {
    base = `Updated ${toTitle(field)}`
  } else if (action === 'archive') {
    base = 'Archived record'
  } else if (action === 'restore') {
    base = 'Restored record'
  } else if (action === 'create') {
    base = 'Created record'
  } else if (action === 'upload') {
    base = 'Uploaded media'
  }

  if (!base) {
    base = typeof row.description === 'string' && row.description.trim() ? row.description : 'Updated record'
  }

  return personName ? `${base} for ${personName}` : base
}
