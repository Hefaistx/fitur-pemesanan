import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';
import { complaints } from '@/lib/schema';
import { eq } from 'drizzle-orm';

export async function GET(_: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const [row] = await db
    .select()
    .from(complaints)
    .where(eq(complaints.id, Number(params.id)))
    .limit(1);

  if (!row) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  if (row.userId !== Number(session.user.id))
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  return NextResponse.json(row);
}
