export const dynamic = 'force-dynamic'
import InscriptionClient from './InscriptionClient'

export default async function Page({ searchParams }) {
  const params = await searchParams
  return <InscriptionClient token={params?.token} />
}