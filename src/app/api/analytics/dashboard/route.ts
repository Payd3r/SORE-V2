import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { getCoupleAnalytics } from '@/lib/analytics-service';
import { UserRole } from '@/lib/roles';

export async function GET(req: Request) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { coupleId } = session.user;

  if (!coupleId) {
    return NextResponse.json({ error: 'User is not part of a couple' }, { status: 400 });
  }

  try {
    const analyticsData = await getCoupleAnalytics(coupleId);
    return NextResponse.json(analyticsData);
  } catch (error) {
    console.error('Error fetching couple analytics:', error);
    if (error instanceof Error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json({ error: 'An unknown error occurred' }, { status: 500 });
  }
} 