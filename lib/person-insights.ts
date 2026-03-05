import type { PersonProfile } from './types'

export interface MissingItem {
  key: string
  label: string
  tab?: 'profile'
}

export interface PersonInsights {
  missing: MissingItem[]
  completeness: number
}

export async function getPersonInsights(profile: PersonProfile): Promise<PersonInsights> {
  const hasParents = profile.parents.length > 0
  const hasProfilePhoto = Boolean(profile.person.profile_photo_path)

  const checks = [
    { ok: Boolean(profile.person.birth_date), missing: { key: 'birth_date', label: 'Birth date is missing', tab: 'profile' as const } },
    { ok: hasParents, missing: { key: 'parents', label: 'Parent name is missing', tab: 'profile' as const } },
    { ok: hasProfilePhoto, missing: { key: 'profile_photo', label: 'Profile photo is missing', tab: 'profile' as const } },
  ]

  const present = checks.filter((c) => c.ok).length
  const completeness = Math.round((present / checks.length) * 100)
  const missing = checks.filter((c) => !c.ok).map((c) => c.missing)

  return { missing, completeness }
}
