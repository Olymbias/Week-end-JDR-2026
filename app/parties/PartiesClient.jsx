'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

export default function PartiesClient() {
  const [parties, setParties] = useState([])
  const [loading, setLoading] = useState(true)
  const [filtre, setFiltre] = useState('toutes')

  useEffect()
    async function chargerParties() {
      const { data } = await supabase
        .from('parties')
        .select('*')
        .order('code')
      setParties(data || [])
      setLoading(false)
    }
    async function chargerParties() {
  const { data } = await supabase
    .from('parties')
    .select('*')
    .eq('visible', true)
    .order('creneau')
  setParties(data || [])
  setLoading(false)
}

  const partiesFiltrees = parties.filter(p => {
    if (filtre === 'novices') return p.adapte_novices
    if (filtre === 'places') return p.places_restantes > 0
    return true
  })

  if (loading) return <main style={styles.main}><p>Chargement...</p></main>

  return (
    <main style={styles.main}>
      <h1 style={styles.titre}>🎲 Week-end JDR 2026</h1>
      <p style={styles.soustitre}>{parties.length} parties au programme</p>
      <div style={styles.filtres}>
        <button style={filtre === 'toutes' ? styles.filtrActif : styles.filtre} onClick={() => setFiltre('toutes')}>Toutes</button>
        <button style={filtre === 'novices' ? styles.filtrActif : styles.filtre} onClick={() => setFiltre('novices')}>Novices bienvenus</button>
        <button style={filtre === 'places' ? styles.filtrActif : styles.filtre} onClick={() => setFiltre('places')}>Places disponibles</button>
      </div>
      <div style={styles.grille}>
        {partiesFiltrees.map(partie => (
          <div key={partie.id} style={styles.carte}>
            <div style={styles.carteHeader}>
              <span style={styles.code}>{partie.code}</span>
              {partie.adapte_novices && <span style={styles.badge}>Novices bienvenus</span>}
            </div>
            <h2 style={styles.nomPartie}>{partie.nom}</h2>
            {partie.systeme && <p style={styles.systeme}>{partie.systeme}</p>}
            <p style={styles.mj}>🎭 {partie.mj_nom}</p>
            {partie.duree && <p style={styles.info}>⏱ {partie.duree}</p>}
            {partie.creneau && <p style={styles.info}>📅 {partie.creneau}</p>}
            {partie.trigger_warning && <p style={styles.tw}>⚠️ {partie.trigger_warning}</p>}
            <div style={styles.places}>
              <span style={partie.places_restantes > 0 ? styles.placesOk : styles.placesFull}>
                {partie.places_restantes > 0 ? `${partie.places_restantes} place(s)` : 'Complet'}
              </span>
            </div>
          </div>
        ))}
      </div>
    </main>
  )
}

const styles = {
  main: { maxWidth: '1100px', margin: '0 auto', padding: '20px', fontFamily: 'sans-serif' },
  titre: { textAlign: 'center', fontSize: '2rem', marginBottom: '5px' },
  soustitre: { textAlign: 'center', color: '#666', marginBottom: '20px' },
  filtres: { display: 'flex', gap: '10px', marginBottom: '25px', flexWrap: 'wrap' },
  filtre: { padding: '8px 16px', borderRadius: '20px', border: '2px solid #ccc', background: 'white', cursor: 'pointer' },
  filtrActif: { padding: '8px 16px', borderRadius: '20px', border: '2px solid #4f46e5', background: '#4f46e5', color: 'white', cursor: 'pointer' },
  grille: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px' },
  carte: { border: '1px solid #e5e7eb', borderRadius: '12px', padding: '20px', background: 'white', boxShadow: '0 2px 8px rgba(0,0,0,0.07)' },
  carteHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' },
  code: { fontSize: '0.8rem', color: '#9ca3af', fontWeight: 'bold' },
  badge: { fontSize: '0.75rem', background: '#d1fae5', color: '#065f46', padding: '3px 8px', borderRadius: '10px' },
  nomPartie: { fontSize: '1.1rem', fontWeight: 'bold', margin: '0 0 5px 0' },
  systeme: { color: '#6b7280', fontSize: '0.9rem', margin: '0 0 8px 0', fontStyle: 'italic' },
  mj: { margin: '4px 0', fontSize: '0.9rem' },
  info: { margin: '4px 0', fontSize: '0.9rem', color: '#4b5563' },
  tw: { margin: '8px 0', fontSize: '0.8rem', color: '#b45309', background: '#fef3c7', padding: '6px', borderRadius: '6px' },
  places: { marginTop: '12px' },
  placesOk: { background: '#d1fae5', color: '#065f46', padding: '4px 10px', borderRadius: '10px', fontSize: '0.85rem' },
  placesFull: { background: '#fee2e2', color: '#991b1b', padding: '4px 10px', borderRadius: '10px', fontSize: '0.85rem' },
}