'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

export default function AdminClient() {
  const [parties, setParties] = useState([])
  const [participants, setParticipants] = useState([])
  const [inscriptions, setInscriptions] = useState([])
  const [loading, setLoading] = useState(true)
  const [onglet, setOnglet] = useState('parties')

  useEffect(() => {
    async function charger() {
      const [{ data: parts }, { data: parts2 }, { data: ins }] = await Promise.all([
        supabase.from('parties').select('*').order('ordre'),
        supabase.from('participants').select('*').order('nom'),
        supabase.from('inscriptions').select('*, participants(nom, email), parties(code, nom)')
      ])
      setParties(parts || [])
      setParticipants(parts2 || [])
      setInscriptions(ins || [])
      setLoading(false)
    }
    charger()
  }, [])

  function exportCSV() {
    const lignes = [
      ['Participant', 'Email', 'Partie', 'Code'],
      ...inscriptions.map(i => [
        i.participants?.nom,
        i.participants?.email,
        i.parties?.nom,
        i.parties?.code
      ])
    ]
    const csv = lignes.map(l => l.join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'inscriptions.csv'
    a.click()
  }

  if (loading) return <main style={s.main}><p>Chargement...</p></main>

  return (
    <main style={s.main}>
      <h1 style={s.titre}>Admin — Week-end JDR 2026</h1>

      <div style={s.stats}>
        <div style={s.stat}><strong>{parties.length}</strong><span>Parties</span></div>
        <div style={s.stat}><strong>{participants.length}</strong><span>Participants</span></div>
        <div style={s.stat}><strong>{inscriptions.length}</strong><span>Inscriptions</span></div>
        <div style={s.stat}>
          <strong>{participants.filter(p => {
            const nb = inscriptions.filter(i => i.participants?.email === p.email).length
            return nb >= 3
          }).length}</strong>
          <span>Complets (3/3)</span>
        </div>
      </div>

      <div style={s.onglets}>
        <button style={onglet === 'parties' ? s.ongletActif : s.onglet} onClick={() => setOnglet('parties')}>Parties</button>
        <button style={onglet === 'participants' ? s.ongletActif : s.onglet} onClick={() => setOnglet('participants')}>Participants</button>
        <button style={onglet === 'inscriptions' ? s.ongletActif : s.onglet} onClick={() => setOnglet('inscriptions')}>Inscriptions</button>
        <button style={onglet === 'details' ? s.ongletActif : s.onglet} onClick={() => setOnglet('details')}>Parties détaillées</button>
      </div>

      <button style={s.export} onClick={exportCSV}>Exporter CSV</button>

      {onglet === 'parties' && (
        <table style={s.table}>
          <thead>
            <tr>
              {['Code', 'Nom', 'MJ', 'Places total', 'Places restantes', 'Créneau'].map(h => (
                <th key={h} style={s.th}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {parties.map(p => (
              <tr key={p.id}>
                <td style={s.td}>{p.code}</td>
                <td style={s.td}>{p.nom}</td>
                <td style={s.td}>{p.mj_nom}</td>
                <td style={s.td}>{p.places_total}</td>
                <td style={{...s.td, color: p.places_restantes <= 0 ? '#991b1b' : '#065f46', fontWeight: 'bold'}}>{p.places_restantes}</td>
                <td style={s.td}>{p.creneau || '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {onglet === 'participants' && (
        <table style={s.table}>
          <thead>
            <tr>
              {['Nom', 'Email', 'Rôle', 'Inscriptions', 'Lien'].map(h => (
                <th key={h} style={s.th}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {participants.map(p => {
              const nb = inscriptions.filter(i => i.participants?.email === p.email).length
              return (
                <tr key={p.id}>
                  <td style={s.td}>{p.nom}</td>
                  <td style={s.td}>{p.email}</td>
                  <td style={s.td}>{p.role}</td>
                  <td style={{...s.td, color: nb >= 3 ? '#065f46' : '#b45309', fontWeight: 'bold'}}>{nb}</td>
                  <td style={s.td}>
                    <a href={`/inscription?token=${p.token}`} target="_blank" style={s.lien}>Voir</a>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      )}

      {onglet === 'inscriptions' && (
        <table style={s.table}>
          <thead>
            <tr>
              {['Participant', 'Email', 'Partie', 'Code'].map(h => (
                <th key={h} style={s.th}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {inscriptions.map(i => (
              <tr key={i.id}>
                <td style={s.td}>{i.participants?.nom}</td>
                <td style={s.td}>{i.participants?.email}</td>
                <td style={s.td}>{i.parties?.nom}</td>
                <td style={s.td}>{i.parties?.code}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {onglet === 'details' && (
        <div>
          {parties.map(p => {
            const inscrits = inscriptions.filter(i => i.parties?.code === p.code)
            return (
              <div key={p.id} style={{ marginBottom: '20px', border: '1px solid #e5e7eb', borderRadius: '12px', padding: '15px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <h3 style={{ margin: 0 }}>{p.code} — {p.nom}</h3>
                  <span style={{ color: inscrits.length >= p.places_total ? '#991b1b' : '#065f46', fontWeight: 'bold' }}>
                    {inscrits.length}/{p.places_total}
                  </span>
                </div>
                <p style={{ color: '#6b7280', fontSize: '0.9rem', margin: '5px 0' }}>{p.mj_nom} — {p.creneau}</p>
                {inscrits.length === 0
                  ? <p style={{ color: '#9ca3af', fontSize: '0.9rem' }}>Aucun inscrit</p>
                  : <ul style={{ margin: '8px 0', paddingLeft: '20px' }}>
                      {inscrits.map(i => (
                        <li key={i.id} style={{ fontSize: '0.9rem' }}>{i.participants?.nom}</li>
                      ))}
                    </ul>
                }
              </div>
            )
          })}
        </div>
      )}
    </main>
  )
}

const s = {
  main: { maxWidth: '1200px', margin: '0 auto', padding: '20px', fontFamily: 'sans-serif' },
  titre: { fontSize: '1.8rem', marginBottom: '20px' },
  stats: { display: 'flex', gap: '15px', marginBottom: '25px', flexWrap: 'wrap' },
  stat: { background: '#f3f4f6', borderRadius: '12px', padding: '15px 25px', textAlign: 'center', display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '0.9rem', color: '#6b7280' },
  onglets: { display: 'flex', gap: '10px', marginBottom: '15px', flexWrap: 'wrap' },
  onglet: { padding: '8px 20px', borderRadius: '20px', border: '2px solid #ccc', background: 'white', cursor: 'pointer' },
  ongletActif: { padding: '8px 20px', borderRadius: '20px', border: '2px solid #4f46e5', background: '#4f46e5', color: 'white', cursor: 'pointer' },
  export: { padding: '8px 20px', background: '#065f46', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', marginBottom: '15px' },
  table: { width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' },
  th: { background: '#f3f4f6', padding: '10px', textAlign: 'left', borderBottom: '2px solid #e5e7eb' },
  td: { padding: '10px', borderBottom: '1px solid #e5e7eb' },
  lien: { color: '#4f46e5', textDecoration: 'none', fontWeight: 'bold' },
}