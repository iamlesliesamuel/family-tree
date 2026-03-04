# Phase 2 Setup (Media + Story Layer)

## 1) Run SQL migration

Apply the migration in Supabase SQL editor:

- `supabase/migrations/20260303_phase2_media_story_layer.sql`

This creates:
- `person_photos`
- `person_documents`
- `person_notes`
- `tags`
- `person_tags`
- `relationship_notes`

And storage buckets:
- `person-photos` (public)
- `family-documents` (private)

## 2) Environment variables

Set these in `.env.local` and Vercel project settings:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY` (needed for document signed URL generation in API route)

## 3) Storage paths used by app

- Photos: `person-photos/{person_id}/{photo_id}.{ext}`
- Documents: `family-documents/{person_id}/{document_id}.{ext}`

## 4) Run app

```bash
npm install
npm run dev
```

Open a person page and use new tabs:
- Profile
- Tree
- Photos
- Timeline
- Notes
- Documents
- Tags

## 5) Notes on permissions

Migration policies are configured for:
- Public read on public genealogy/story metadata
- Authenticated writes for media metadata, notes, tags, and storage uploads
- Private document bucket with signed URL access via API
