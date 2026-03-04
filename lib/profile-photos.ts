import { supabase } from './supabase'
import type { Person } from './types'

interface ProfilePhotoRow {
  person_id: string
  storage_path: string
  uploaded_at: string
}

export async function getProfilePhotoPathMap(personIds: string[]): Promise<Map<string, string>> {
  const ids = Array.from(new Set(personIds.filter(Boolean)))
  if (ids.length === 0) return new Map()

  const { data, error } = await supabase
    .from('person_photos')
    .select('person_id, storage_path, uploaded_at')
    .in('person_id', ids)
    .eq('is_profile', true)
    .order('uploaded_at', { ascending: false })

  if (error) {
    // If migration wasn't applied yet, avoid breaking existing pages.
    if (error.message.toLowerCase().includes('is_profile')) return new Map()
    throw new Error(`getProfilePhotoPathMap: ${error.message}`)
  }

  const map = new Map<string, string>()
  ;((data ?? []) as ProfilePhotoRow[]).forEach((row) => {
    if (!map.has(row.person_id)) {
      map.set(row.person_id, row.storage_path)
    }
  })

  return map
}

export async function attachProfilePhotos(people: Person[]): Promise<Person[]> {
  if (people.length === 0) return people

  const map = await getProfilePhotoPathMap(people.map((p) => p.id))
  return people.map((person) => ({
    ...person,
    profile_photo_path: map.get(person.id) ?? null,
  }))
}
