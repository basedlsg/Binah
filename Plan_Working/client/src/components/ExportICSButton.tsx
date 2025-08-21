import React from 'react'
import { generateICS } from '../lib/ics'

export default function ExportICSButton({ itinerary }: { itinerary: any }) {
  const onClick = () => {
    const content = generateICS(itinerary)
    const blob = new Blob([content], { type: 'text/calendar;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${(itinerary?.title || 'plan').replace(/\s+/g, '_')}.ics`
    a.click()
    URL.revokeObjectURL(url)
  }
  return (
    <button 
      onClick={onClick}
      style={{
        backgroundColor: '#2563eb',
        color: 'white',
        border: 'none',
        borderRadius: '8px',
        padding: '12px 24px',
        fontSize: '14px',
        fontWeight: 600,
        cursor: 'pointer',
        transition: 'background-color 0.2s',
        fontFamily: 'Poppins, sans-serif'
      }}
      onMouseEnter={(e) => {
        (e.target as HTMLButtonElement).style.backgroundColor = '#1d4ed8';
      }}
      onMouseLeave={(e) => {
        (e.target as HTMLButtonElement).style.backgroundColor = '#2563eb';
      }}
    >
      Export to Calendar (.ics)
    </button>
  )
}

