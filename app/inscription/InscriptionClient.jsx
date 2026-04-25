'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

export default function InscriptionClient({ token }) {
  const [participant, setParticipant] = useState(null)
  const [parties, setParties] = useState([])
  const [inscriptions, setInscriptions] = useState([])
  const [loading, setLoading] = useState(true)
  const [message, setMessage] = useState('')

  useEffect(() => {
    if (!token) { setLoading(false); return }
    async function charger() {
      const { data: p } = await supabase
        .from('participants')
        .select('*')
        .eq('token', token)
        .single()
      if (!p) { setLoading(false); return }
      setParticipant(p)

      const { data: parts } = await supabase
  .from('parties')
  .select('*')
  .eq('visible', true)
  .order('ordre')
setParties(parts || [])

      const { data: ins } = await supabase
        .from('inscriptions')
        .select('partie_id')
        .eq('participant_id', p.id)
      setInscriptions(ins?.map(i => i.partie_id) || [])
      setLoading(false)
    }
    charger()
  }, [token])

  async function inscrire(partieId) {
    setMessage('')
    const { data, error } = await supabase.rpc('inscrire_participant', {
      p_participant_id: participant.id,
      p_partie_id: partieId
    })
    if (error || !data.ok) {
      setMessage(data?.erreur || 'Erreur lors de l\'inscription')
    } else {
      setInscriptions([...inscriptions, partieId])
      setParties(parties.map(p =>
        p.id === partieId ? { ...p, places_restantes: p.places_restantes - 1 } : p
      ))
      setMessage('Inscription réussie !')
    }
  }

  if (loading) return <main style={styles.main}><p>Chargement...</p></main>
  if (!token || !participant) return (
    <main style={styles.main}>
      <h1 style={styles.titre}> Week-end JDR 2026</h1>
      <p style={styles.erreur}>Lien invalide. Contacte l'organisateur.</p>
    </main>
  )

  return (
    <main style={styles.main}>
      <h1 style={styles.titre}> Week-end JDR 2026</h1>
      <p style={styles.bienvenue}>Bonjour <strong>{participant.nom}</strong> !</p>
      <p style={styles.compteur}>
        {inscriptions.length}/3 parties réservées
      </p>
      {message && (
        <p style={message.includes('réussie') ? styles.succes : styles.erreur}>
          {message}
        </p>
      )}
      <div style={styles.grille}>
        {parties.map(partie => {
          const dejainscrit = inscriptions.includes(partie.id)
          const plein = partie.places_restantes <= 0
          return (
            <div key={partie.id} style={{
              ...styles.carte,
              opacity: plein && !dejainscrit ? 0.6 : 1,
              borderColor: dejainscrit ? '#4f46e5' : '#e5e7eb'
            }}>
              <div style={styles.carteHeader}>
                <span style={styles.code}>{partie.code}</span>
                {partie.adapte_novices && <span style={styles.badge}>Novices bienvenus</span>}
              </div>
              <h2 style={styles.nomPartie}>{partie.nom}</h2>
              {partie.systeme && <p style={styles.systeme}>{partie.systeme}</p>}
              <p style={styles.mj}> {partie.mj_nom}</p>
              {partie.creneau && <p style={styles.info}> {partie.creneau}</p>}
              {partie.trigger_warning && <p style={styles.tw}>⚠️ {partie.trigger_warning}</p>}
              <div style={styles.placesRow}>
                <span style={plein ? styles.placesFull : styles.placesOk}>
                  {plein ? 'Complet' : `${partie.places_restantes} place(s)`}
                </span>
              </div>
              <button
                style={dejainscrit ? styles.btnInscrit : plein ? styles.btnPlein : styles.btn}
                disabled={dejainscrit || plein || inscriptions.length >= 3}
                onClick={() => inscrire(partie.id)}
              >
                {dejainscrit ? '✓ Inscrit(e)' : plein ? 'Complet' : 'Réserver'}
              </button>
            </div>
          )
        })}
      </div>
    </main>
  )
}

const styles = {
  main: { maxWidth: '1100px', margin: '0 auto', padding: '20px', fontFamily: 'sans-serif' },
  titre: { textAlign: 'center', fontSize: '2rem', marginBottom: '5px' },
  bienvenue: { textAlign: 'center', fontSize: '1.1rem', marginBottom: '5px' },
  compteur: { textAlign: 'center', fontSize: '1rem', color: '#4f46e5', fontWeight: 'bold', marginBottom: '15px' },
  succes: { textAlign: 'center', color: '#065f46', background: '#d1fae5', padding: '10px', borderRadius: '8px', marginBottom: '15px' },
  erreur: { textAlign: 'center', color: '#991b1b', background: '#fee2e2', padding: '10px', borderRadius: '8px', marginBottom: '15px' },
  grille: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px' },
  carte: { border: '2px solid #e5e7eb', borderRadius: '12px', padding: '20px', background: 'white', boxShadow: '0 2px 8px rgba(0,0,0,0.07)' },
  carteHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' },
  code: { fontSize: '0.8rem', color: '#9ca3af', fontWeight: 'bold' },
  badge: { fontSize: '0.75rem', background: '#d1fae5', color: '#065f46', padding: '3px 8px', borderRadius: '10px' },
  nomPartie: { fontSize: '1.1rem', fontWeight: 'bold', margin: '0 0 5px 0' },
  systeme: { color: '#6b7280', fontSize: '0.9rem', margin: '0 0 8px 0', fontStyle: 'italic' },
  mj: { margin: '4px 0', fontSize: '0.9rem' },
  info: { margin: '4px 0', fontSize: '0.9rem', color: '#4b5563' },
  tw: { margin: '8px 0', fontSize: '0.8rem', color: '#b45309', background: '#fef3c7', padding: '6px', borderRadius: '6px' },
  placesRow: { marginTop: '12px', marginBottom: '10px' },
  placesOk: { background: '#d1fae5', color: '#065f46', padding: '4px 10px', borderRadius: '10px', fontSize: '0.85rem' },
  placesFull: { background: '#fee2e2', color: '#991b1b', padding: '4px 10px', borderRadius: '10px', fontSize: '0.85rem' },
  btn: { width: '100%', padding: '10px', background: '#4f46e5', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', marginTop: '5px' },
  btnInscrit: { width: '100%', padding: '10px', background: '#d1fae5', color: '#065f46', border: 'none', borderRadius: '8px', cursor: 'default', fontWeight: 'bold', marginTop: '5px' },
  btnPlein: { width: '100%', padding: '10px', background: '#e5e7eb', color: '#9ca3af', border: 'none', borderRadius: '8px', cursor: 'default', fontWeight: 'bold', marginTop: '5px' },
}