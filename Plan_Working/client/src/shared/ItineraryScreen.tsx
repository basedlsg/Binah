import React from 'react'

type Itinerary = {
  id: string
  title: string
  planDate: string
  city: string
  venues: { name: string; time: string; address: string; categories: string[] }[]
}

export default function ItineraryScreen({ itinerary }: { itinerary: Itinerary }) {
  return (
    <div style={{ marginTop: '48px' }}>
      <h2 style={{ 
        fontFamily: 'Rozha One, serif', 
        fontWeight: 400,
        fontSize: '32px',
        margin: '0 0 32px 0',
        color: '#1f2937',
        textAlign: 'center'
      }}>{itinerary.title}</h2>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        {itinerary.venues.map((v, idx) => (
          <div key={idx} style={{ 
            backgroundColor: 'white',
            border: '1px solid #e2e8f0',
            borderRadius: '12px',
            padding: '24px',
            boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)'
          }}>
            <div style={{ 
              fontFamily: 'Poppins, sans-serif',
              fontWeight: 600,
              fontSize: '18px',
              color: '#1f2937',
              marginBottom: '8px'
            }}>{v.time} — {v.name}</div>
            <div style={{ 
              fontFamily: 'Poppins, sans-serif',
              color: '#6b7280',
              fontSize: '14px',
              marginBottom: '12px'
            }}>{v.address}</div>
            {v.categories?.length > 0 && (
              <div style={{ 
                marginTop: '12px',
                fontSize: '12px',
                color: '#2563eb',
                fontWeight: 500,
                fontFamily: 'Poppins, sans-serif'
              }}>{v.categories.join(' • ')}</div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

