'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

export default function Parties() {
  const [parties, setParties] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function chargerParties() {
      const { data } = await supabase
        .from('parties')
        .select('*')
        .order('code')
      setParties(data || [])
      setLoading(false)
    }
    chargerParties()
  }, [])

  if (loading) return <p>Chargement...</p>

  return (
    <main>
      <h1>Les parties de la convention</h1>
      <p>{parties.length} parties disponibles</p>
      {parties.map(partie => (
        <div key={partie.id}>
          <h2>{partie.nom}</h2>
          <p>MJ : {partie.mj_nom}</p>
          <p>Places restantes : {partie.places_restantes}</p>
        </div>
      ))}
    </main>
  )
}