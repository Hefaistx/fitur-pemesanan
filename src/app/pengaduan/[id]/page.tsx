import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { redirect, notFound } from 'next/navigation';
import { db } from '@/lib/db';
import { complaints } from '@/lib/schema';
import { eq } from 'drizzle-orm';
import PengaduanDetailClient from './PengaduanDetailClient';

export const dynamic = 'force-dynamic';

export default async function PengaduanDetailPage({ params, searchParams }: {
  params: { id: string };
  searchParams: { baru?: string };
}) {
  const session = await getServerSession(authOptions);
  if (!session) redirect('/auth/login');

  const [complaint] = await db
    .select()
    .from(complaints)
    .where(eq(complaints.id, Number(params.id)))
    .limit(1);

  if (!complaint) notFound();
  if (complaint.userId !== Number(session.user.id)) redirect('/pengaduan');

  return <PengaduanDetailClient complaint={complaint} isNew={searchParams.baru === '1'} />;
}
