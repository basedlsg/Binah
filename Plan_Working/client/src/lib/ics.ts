export function generateICS(itinerary: {
  title: string
  planDate: string
  venues: { name: string; time: string; address: string }[]
}) {
  const { title, planDate, venues } = itinerary
  const lines: string[] = []
  lines.push('BEGIN:VCALENDAR')
  lines.push('VERSION:2.0')
  lines.push('PRODID:-//Plan//EN')
  venues.forEach((v, idx) => {
    const dt = `${planDate}T${v.time.replace(':', '')}00`
    lines.push('BEGIN:VEVENT')
    lines.push(`UID:${Date.now()}-${idx}@plan`)
    lines.push(`DTSTAMP:${dt}Z`)
    lines.push(`DTSTART:${dt}Z`)
    lines.push(`SUMMARY:${escapeText(v.name)}`)
    lines.push(`LOCATION:${escapeText(v.address)}`)
    lines.push('END:VEVENT')
  })
  lines.push('END:VCALENDAR')
  return lines.join('\r\n')
}

function escapeText(s: string) {
  return s.replace(/\\/g, '\\\\').replace(/\n/g, '\\n').replace(/,|;/g, ' ')
}

