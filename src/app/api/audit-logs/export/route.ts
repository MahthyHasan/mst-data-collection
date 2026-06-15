import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/authOptions';
import { dbConnect } from '@/lib/db';
import { logAudit } from '@/lib/audit';

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();
    const body = await req.json();
    const { format, type, count, patientId, campId } = body;

    const ipAddress = req.headers.get('x-forwarded-for') || '127.0.0.1';

    await logAudit({
      userId: session.user.id,
      username: session.user.name,
      role: session.user.role,
      entityType: 'Export',
      entityId: patientId || campId || undefined,
      action: 'UPDATE', // Export falls under change or read-out access log
      ipAddress,
      newValues: { format, type, recordCount: count },
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
