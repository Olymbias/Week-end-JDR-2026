export const dynamic = 'force-dynamic'
import InscriptionClient from './InscriptionClient'

export default function Page({ searchParams }) {
  return <InscriptionClient token={searchParams.token} />
}