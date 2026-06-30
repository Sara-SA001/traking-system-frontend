import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

export default async function DashboardRedirectPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get('tracking_token')?.value;
  const role = cookieStore.get('tracking_role')?.value;

  if (!token) {
    redirect('/login');
  }

  redirect(role === 'ADMIN' ? '/admin' : role === 'TEACHER' ? '/teacher' : '/login');
}
