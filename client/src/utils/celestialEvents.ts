import {
  SearchMoonQuarter,
  NextMoonQuarter,
  SearchLunarEclipse,
} from 'astronomy-engine'

/**
 * Computed upcoming celestial events for the Zenith events panel.
 *
 * Moon phases and lunar eclipses are computed precisely via astronomy-engine.
 * Meteor showers are sourced from a static annual table (their peak dates are
 * effectively fixed year to year). Events the platform cannot compute (specific
 * conjunction windows, regional solar-eclipse paths) are deferred to the AI
 * assistant's web search via the panel's "Ask the AI" action.
 */

export type CelestialEventKind = 'moon-phase' | 'meteor-shower' | 'eclipse'

export interface CelestialEvent {
  kind: CelestialEventKind
  title: string
  date: Date
  description: string
  icon: string
}

const MOON_QUARTER_NAMES = ['New Moon', 'First Quarter', 'Full Moon', 'Last Quarter']
const MOON_QUARTER_ICONS = ['🌑', '🌓', '🌕', '🌗']

interface ShowerDef {
  name: string
  month: number // 1-12
  day: number
  description: string
}

// Major annual meteor showers (peak night, approximate).
const METEOR_SHOWERS: ShowerDef[] = [
  { name: 'Quadrantids', month: 1, day: 3, description: 'Up to 120 meteors/hr; sharp peak from the constellation Boötes.' },
  { name: 'Lyrids', month: 4, day: 22, description: 'Fast, bright meteors radiating from Lyra; ~18/hr.' },
  { name: 'Eta Aquariids', month: 5, day: 6, description: 'Debris from Halley\'s Comet; best from the tropics, ~40/hr.' },
  { name: 'Perseids', month: 8, day: 12, description: 'The year\'s most popular shower; up to 100 bright meteors/hr.' },
  { name: 'Orionids', month: 10, day: 21, description: 'Also from Halley\'s Comet; swift meteors, ~20/hr.' },
  { name: 'Leonids', month: 11, day: 17, description: 'Fast meteors from Leo; occasional storms, ~15/hr.' },
  { name: 'Geminids', month: 12, day: 14, description: 'Reliable, multicoloured meteors; up to 120/hr at peak.' },
  { name: 'Ursids', month: 12, day: 22, description: 'Minor December shower from Ursa Minor; ~10/hr.' },
]

function nextOccurrence(month: number, day: number, from: Date): Date {
  const year = from.getUTCFullYear()
  let d = new Date(Date.UTC(year, month - 1, day, 6, 0, 0))
  if (d.getTime() < from.getTime()) {
    d = new Date(Date.UTC(year + 1, month - 1, day, 6, 0, 0))
  }
  return d
}

/**
 * Compute notable upcoming sky events within `windowDays` of now.
 * The next lunar eclipse is always included even if beyond the window.
 */
export function computeUpcomingEvents(from: Date = new Date(), windowDays = 45): CelestialEvent[] {
  const events: CelestialEvent[] = []
  const horizon = new Date(from.getTime() + windowDays * 86_400_000)

  // Moon phases — iterate quarters across the window.
  try {
    let mq = SearchMoonQuarter(from)
    for (let i = 0; i < 8; i++) {
      const date = mq.time.date
      if (date.getTime() > horizon.getTime()) break
      events.push({
        kind: 'moon-phase',
        title: MOON_QUARTER_NAMES[mq.quarter],
        date,
        description: `The Moon reaches its ${MOON_QUARTER_NAMES[mq.quarter].toLowerCase()} phase.`,
        icon: MOON_QUARTER_ICONS[mq.quarter],
      })
      mq = NextMoonQuarter(mq)
    }
  } catch {
    /* skip moon phases on failure */
  }

  // Meteor showers within the window.
  for (const shower of METEOR_SHOWERS) {
    const date = nextOccurrence(shower.month, shower.day, from)
    if (date.getTime() <= horizon.getTime()) {
      events.push({
        kind: 'meteor-shower',
        title: `${shower.name} Meteor Shower`,
        date,
        description: shower.description,
        icon: '☄️',
      })
    }
  }

  // Next lunar eclipse (always include the next one).
  try {
    const ecl = SearchLunarEclipse(from)
    events.push({
      kind: 'eclipse',
      title: `${eclipseKindLabel(String(ecl.kind))} Lunar Eclipse`,
      date: ecl.peak.date,
      description: `A ${String(ecl.kind).toLowerCase()} lunar eclipse, ${Math.round((ecl.obscuration ?? 0) * 100)}% obscuration at peak.`,
      icon: '🌘',
    })
  } catch {
    /* skip eclipse on failure */
  }

  return events.sort((a, b) => a.date.getTime() - b.date.getTime())
}

function eclipseKindLabel(kind: string): string {
  const k = kind.toLowerCase()
  if (k === 'total') return 'Total'
  if (k === 'partial') return 'Partial'
  if (k === 'penumbral') return 'Penumbral'
  return kind
}
