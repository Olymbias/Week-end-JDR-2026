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
  const [limite, setLimite] = useState(0)
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

      const cleConfig = p.role === 'orga' ? 'limite_orga' : p.role === 'mj' ? 'limite_mj' : p.role === 'prioritaire' ? 'limite_prioritaire' : 'limite_joueur'
      const { data: config } = await supabase
        .from('configuration')
        .select('valeur')
        .eq('cle', cleConfig)
        .single()
      setLimite(config ? parseInt(config.valeur) : 0)

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

  useEffect(() => {
    const channel = supabase
      .channel('parties-updates')
      .on('postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'parties' },
        (payload) => {
          console.log('Realtime reçu:', payload.new.places_restantes)
          setParties(prev => prev.map(p =>
            p.id === payload.new.id ? { ...p, places_restantes: payload.new.places_restantes } : p
          ))
        }
      )
      .subscribe()

    return () => supabase.removeChannel(channel)
  }, [])

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
      setMessage('Inscription réussie !')
    }
  }

  async function desinscrire(partieId) {
    setMessage('')
    const partieActuelle = parties.find(p => p.id === partieId)
    const { error } = await supabase
      .from('inscriptions')
      .delete()
      .eq('participant_id', participant.id)
      .eq('partie_id', partieId)

    if (error) {
      setMessage('Erreur lors de la désinscription')
    } else {
      await supabase
        .from('parties')
        .update({ places_restantes: partieActuelle.places_restantes + 1 })
        .eq('id', partieId)

      setInscriptions(inscriptions.filter(id => id !== partieId))
      setMessage('Désinscription effectuée.')
    }
  }

  if (loading) return <main style={styles.main}><p>Chargement...</p></main>
  if (!token || !participant) return (
    <main style={styles.main}>
      <h1 style={styles.titre}>Week-end JDR 2026</h1>
      <p style={styles.erreur}>Lien invalide. Contacte l'organisateur.</p>
    </main>
  )

  const mesParties = parties.filter(p => inscriptions.includes(p.id))

  return (
    <main style={styles.main}>
      <h1 style={styles.titre}>Week-end JDR 2026</h1>
      <p style={styles.bienvenue}>Bonjour <strong>{participant.nom}</strong> !</p>
      <p style={styles.compteur}>{inscriptions.length} partie(s) réservée(s)</p>

      {message && (
        <p style={message.includes('réussie') || message.includes('effectuée') ? styles.succes : styles.erreur}>
          {message}
        </p>
      )}

      {mesParties.length > 0 && (
        <div style={styles.recap}>
          <h2 style={styles.recapTitre}>Mes réservations</h2>
          {mesParties.map(p => (
            <div key={p.id} style={styles.recapLigne}>
              <div>
                <strong>{p.nom}</strong>
                <span style={styles.recapInfo}> — {p.mj_nom} — {p.creneau}</span>
              </div>
              <button style={styles.btnDesinscrire} onClick={() => desinscrire(p.id)}>
                Annuler
              </button>
            </div>
          ))}
        </div>
      )}

      <h2 style={styles.titreListe}>Toutes les parties</h2>
      <div style={styles.grille}>
        {parties.map(partie => {
          const dejainscrit = inscriptions.includes(partie.id)
          const plein = partie.places_restantes <= 0
          const limitAtteinte = inscriptions.length >= limite
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
              <p style={styles.mj}>{partie.mj_nom}</p>
              {partie.creneau && <p style={styles.info}>{partie.creneau}</p>}
              {partie.trigger_warning && <p style={styles.tw}>TW : {partie.trigger_warning}</p>}
              <div style={styles.placesRow}>
                <span style={plein ? styles.placesFull : styles.placesOk}>
                  {plein ? 'Complet' : `${partie.places_restantes} place(s)`}
                </span>
              </div>
              <button
                style={dejainscrit ? styles.btnInscrit : plein || limitAtteinte ? styles.btnPlein : styles.btn}
                disabled={dejainscrit || plein || limitAtteinte}
                onClick={() => inscrire(partie.id)}
              >
                {dejainscrit ? '✓ Inscrit(e)' : plein ? 'Complet' : limitAtteinte ? 'Limite atteinte' : 'Réserver'}
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
  recap: { background: '#f3f4f6', borderRadius: '12px', padding: '20px', marginBottom: '30px' },
  recapTitre: { fontSize: '1.1rem', fontWeight: 'bold', marginBottom: '12px', color: '#2E4057' },
  recapLigne: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: '1px solid #e5e7eb' },
  recapInfo: { color: '#6b7280', fontSize: '0.9rem' },
  btnDesinscrire: { padding: '6px 14px', background: '#fee2e2', color: '#991b1b', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 'bold' },
  titreListe: { fontSize: '1.3rem', fontWeight: 'bold', marginBottom: '20px', color: '#2E4057' },
  grille: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20