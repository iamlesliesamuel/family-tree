export function getPublicStorageUrl(bucket: string, storagePath: string | null | undefined): string | null {
  const base = process.env.NEXT_PUBLIC_SUPABASE_URL?.replace(/\/$/, '')
  if (!base || !storagePath) return null

  const encodedPath = storagePath
    .split('/')
    .map((segment) => encodeURIComponent(segment))
    .join('/')

  return `${base}/storage/v1/object/public/${bucket}/${encodedPath}`
}

export function getPersonPhotoUrl(storagePath: string | null | undefined): string | null {
  return getPublicStorageUrl('person-photos', storagePath)
}
