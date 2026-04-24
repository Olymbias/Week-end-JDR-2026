export const dynamic = 'force-dynamic'
import AdminClient from './AdminClient'

export default async function Page({ searchParams }) {
  const params = await searchParams
  const cle = params?.cle

  if (cle !== 'jdr2026admin') {
    return (
      <main style={{ textAlign: 'center', padding: '50px', fontFamily: 'sans-serif' }}>
        <h1>Accès refusé</h1>
        <p>Vous n'êtes pas autorisé à accéder à cette page.</p>
      </main>
    )
  }

  return <AdminClient />
}