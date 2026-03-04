export interface PersonPhoto {
  id: string
  person_id: string
  storage_path: string
  caption: string | null
  is_profile: boolean
  focus_x: number
  focus_y: number
  uploaded_at: string
}

export interface PersonDocument {
  id: string
  person_id: string
  title: string
  storage_path: string
  document_type: 'funeral_program' | 'birth_certificate' | 'marriage_certificate' | 'obituary' | 'other'
  uploaded_at: string
}

export interface PersonNote {
  id: string
  person_id: string
  content: string
  created_at: string
  updated_at: string
}

export interface Tag {
  id: string
  name: string
  description: string | null
}

export interface PersonTag {
  person_id: string
  tag_id: string
  tag?: Tag
}

export interface RelationshipNote {
  id: string
  relationship_id: string
  content: string
  created_at: string
  updated_at: string
}

export interface TimelineEvent {
  id: string
  date: string | null
  year: string | null
  title: string
  description: string
  type: 'birth' | 'relationship' | 'child' | 'death' | 'document'
}
