import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth';
import SessionProvider from '@/components/SessionProvider';

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();

  if (!session) {
    redirect('/login');
  }

  return <SessionProvider>{children}</SessionProvider>;
}
