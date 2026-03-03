import { RelationshipGroup } from './RelationshipGroup'
import { PersonCard } from './PersonCard'
import {
  getDisplayName,
  getYear,
  formatDate,
  type PersonProfile,
} from '@/lib/types'

interface ProfileViewProps {
  profile: PersonProfile
}

export function ProfileView({ profile }: ProfileViewProps) {
  const { person, parents, partnerGroups } = profile
  const birthYear   = getYear(person.birth_date)
  const deathYear   = getYear(person.death_date)
  const hasPartners = partnerGroups.length > 0
  const hasParents  = parents.length > 0
  const initials    = [person.first_name[0], person.last_name[0]].join('').toUpperCase()

  const lifespan =
    birthYear && deathYear ? `${birthYear} – ${deathYear}` :
    birthYear              ? `b. ${birthYear}` :
    deathYear              ? `d. ${deathYear}` : null

  return (
    <div className="flex flex-col gap-7 animate-fade-in">

      {/* ── Dossier Hero ─────────────────────────────────────────────────── */}
      <div className={`rounded-xl border overflow-hidden
        border-zinc-200 shadow-[0_4px_32px_-8px_rgba(0,0,0,0.08)]
        dark:border-zinc-700/50 dark:shadow-[0_4px_32px_-8px_rgba(0,0,0,0.5)]`}>

        {/* Header band */}
        <div className="bg-gradient-to-b from-zinc-100 to-zinc-50 dark:from-zinc-800 dark:to-zinc-900 px-6 pt-7 pb-5">
          <div className="flex items-start gap-5">

            {/* Archival monogram badge */}
            <div className={`w-16 h-20 flex-shrink-0 flex flex-col items-center justify-center
              rounded-lg border
              bg-white border-zinc-200/60
              shadow-[0_1px_4px_rgba(0,0,0,0.06),inset_0_1px_0_rgba(255,255,255,0.9)]
              dark:bg-zinc-900/80 dark:border-zinc-700/60
              dark:shadow-[inset_0_1px_0_rgba(212,176,70,0.07)]`}>
              <span className="text-amber-600/60 dark:text-amber-500/50 text-[9px] tracking-[0.18em] uppercase mb-1">
                Record
              </span>
              <span className="font-serif text-2xl font-bold text-zinc-700 dark:text-zinc-200 leading-none">
                {initials}
              </span>
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <h1 className="font-serif text-3xl font-semibold text-zinc-900 dark:text-zinc-50 leading-tight text-balance">
                    {getDisplayName(person)}
                  </h1>
                  {person.maiden_name && (
                    <p className="font-serif text-base italic text-zinc-500 mt-0.5">
                      née {person.maiden_name}
                    </p>
                  )}
                  {lifespan && (
                    <p className="text-zinc-500 text-sm mt-1.5 tabular-nums tracking-wider font-light">
                      {lifespan}
                    </p>
                  )}
                </div>

                {/* Edit placeholder */}
                <button
                  disabled
                  className={`flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-lg
                    text-xs font-medium cursor-not-allowed select-none mt-1
                    text-zinc-400 border border-zinc-200
                    dark:text-zinc-700 dark:border-zinc-700/40`}
                  title="Edit — coming soon"
                >
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round"
                      d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                  </svg>
                  Edit
                </button>
              </div>
            </div>
          </div>

          {/* Ornamental divider rule */}
          <div className="mt-5 flex items-center gap-3">
            <div className="flex-1 h-px bg-gradient-to-r from-transparent to-zinc-300/60 dark:to-zinc-700/50" />
            <ArchiveDiamond />
            <div className="flex-1 h-px bg-gradient-to-l from-transparent to-zinc-300/60 dark:to-zinc-700/50" />
          </div>
        </div>

        {/* Vitals band */}
        {(person.birth_date || person.death_date || person.birth_place || person.gender) && (
          <div className={`px-6 py-4 border-t flex flex-wrap gap-x-6 gap-y-2
            bg-zinc-50/80 border-zinc-200/40
            dark:bg-zinc-900/60 dark:border-zinc-700/30`}>
            {person.birth_date && (
              <Vital icon="birth" label={`Born ${formatDate(person.birth_date) ?? birthYear}`} />
            )}
            {person.death_date && (
              <Vital icon="death" label={`Died ${formatDate(person.death_date) ?? deathYear}`} />
            )}
            {person.birth_place && <Vital icon="place" label={person.birth_place} />}
            {person.gender      && <Vital icon="gender" label={person.gender} />}
          </div>
        )}

        {/* Notes */}
        {person.notes && (
          <div className={`px-6 py-4 border-t
            border-zinc-200/40 bg-zinc-50/50
            dark:border-zinc-700/30 dark:bg-zinc-900/30`}>
            <p className="text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed whitespace-pre-line font-light">
              {person.notes}
            </p>
          </div>
        )}
      </div>

      {/* ── Parents ──────────────────────────────────────────────────────── */}
      {hasParents && (
        <Section title="Parents">
          <div className="flex flex-col gap-2">
            {parents.map(({ person: parent, is_adopted }) => (
              <div key={parent.id} className="relative">
                <PersonCard person={parent} variant="default" />
                {is_adopted && (
                  <span className="absolute top-2 right-10 text-xs px-1.5 py-0.5 rounded-md
                    bg-amber-500/10 text-amber-600 dark:text-amber-500/80 border border-amber-500/20 font-medium">
                    Adoptive
                  </span>
                )}
              </div>
            ))}
          </div>
        </Section>
      )}

      {/* ── Relationships & children ──────────────────────────────────────── */}
      {hasPartners && (
        <Section title="Relationships">
          <div className="flex flex-col gap-3">
            {partnerGroups.map((group, i) => (
              <RelationshipGroup key={i} group={group} index={i} />
            ))}
          </div>
        </Section>
      )}

      {/* Empty state */}
      {!hasPartners && !hasParents && (
        <div className="flex flex-col items-center justify-center py-14 text-center
          rounded-xl border border-dashed border-zinc-300/60 dark:border-zinc-700/40">
          <p className="font-serif text-lg italic text-zinc-400 dark:text-zinc-600">No relationships recorded yet</p>
          <p className="text-zinc-400 dark:text-zinc-700 text-xs mt-1">Family connections will appear here once added</p>
        </div>
      )}
    </div>
  )
}

// ─── Sub-components ────────────────────────────────────────────────────────────

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="flex items-center gap-3 mb-3">
        <div className="flex-1 h-px bg-zinc-200 dark:bg-zinc-700/40" />
        <div className="flex items-center gap-2 flex-shrink-0">
          <ArchiveDiamond small />
          <h2 className="font-serif text-sm italic tracking-wide text-zinc-400 dark:text-zinc-500">{title}</h2>
          <ArchiveDiamond small />
        </div>
        <div className="flex-1 h-px bg-zinc-200 dark:bg-zinc-700/40" />
      </div>
      {children}
    </div>
  )
}

function ArchiveDiamond({ small }: { small?: boolean }) {
  const sz = small ? 5 : 6
  return (
    <svg width={sz} height={sz} viewBox="0 0 8 8"
      className="text-amber-600/30 flex-shrink-0" fill="currentColor">
      <polygon points="4,0 8,4 4,8 0,4" />
    </svg>
  )
}

function Vital({ icon, label }: { icon: string; label: string }) {
  return (
    <div className="flex items-center gap-1.5 text-xs text-zinc-600 dark:text-zinc-400">
      <VitalIcon type={icon} />
      <span>{label}</span>
    </div>
  )
}

function VitalIcon({ type }: { type: string }) {
  const cls = 'w-3 h-3 text-zinc-400 dark:text-zinc-600 flex-shrink-0'
  if (type === 'birth') return (
    <svg className={cls} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  )
  if (type === 'death') return (
    <svg className={cls} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
    </svg>
  )
  if (type === 'place') return (
    <svg className={cls} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  )
  if (type === 'gender') return (
    <svg className={cls} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0z" />
    </svg>
  )
  return null
}
