import { supabase } from './supabase'
import type { Person } from './types'

interface ProfilePhotoRow {
  person_id: string
  storage_path: string
  focus_x: number | null
  focus_y: number | null
  uploaded_at: string
}

export interface ProfilePhotoMeta {
  storage_path: string
  focus_x: number
  focus_y: number
}

export async function getProfilePhotoPathMap(personIds: string[]): Promise<Map<string, ProfilePhotoMeta>> {
  const ids = Array.from(new Set(personIds.filter(Boolean)))
  if (ids.length === 0) return new Map()

  const { data, error } = await supabase
    .from('person_photos')
    .select('person_id, storage_path, focus_x, focus_y, uploaded_at')
    .in('person_id', ids)
    .eq('is_profile', true)
    .order('uploaded_at', { ascending: false })

  if (error) {
    // If migration wasn't applied yet, avoid breaking existing pages.
    const message = error.message.toLowerCase()
    if (message.includes('is_profile') || message.includes('focus_x') || message.includes('focus_y')) {
      return new Map()
    }
    throw new Error(`getProfilePhotoPathMap: ${error.message}`)
  }

  const map = new Map<string, ProfilePhotoMeta>()
  ;((data ?? []) as ProfilePhotoRow[]).forEach((row) => {
    if (!map.has(row.person_id)) {
      map.set(row.person_id, {
        storage_path: row.storage_path,
        focus_x: typeof row.focus_x === 'number' ? row.focus_x : 50,
        focus_y: typeof row.focus_y === 'number' ? row.focus_y : 50,
      })
    }
  })

  return map
}

export async function attachProfilePhotos(people: Person[]): Promise<Person[]> {
  if (people.length === 0) return people

  const map = await getProfilePhotoPathMap(people.map((p) => p.id))
  return people.map((person) => ({
    ...person,
    profile_photo_path: map.get(person.id)?.storage_path ?? null,
    profile_photo_focus_x: map.get(person.id)?.focus_x ?? 50,
    profile_photo_focus_y: map.get(person.id)?.focus_y ?? 50,
  }))
}
