// app/profil/page.tsx – Weiterleitung zur Dashboard-Profilseite
import { redirect } from 'next/navigation'

export default function ProfilRedirectPage() {
  redirect('/dashboard/profil')
}
