import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/authOptions';
import { dbConnect } from '@/lib/db';
import AuthLog from '@/models/AuthLog';

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    await dbConnect();
    const { searchParams } = new URL(req.url);

    const username = searchParams.get('username') || '';
    const success = searchParams.get('success') || '';
    const startDate = searchParams.get('startDate') || '';
    const endDate = searchParams.get('endDate') || '';

    const query: any = {};

    if (username) {
      query.username = { $regex: username, $options: 'i' };
    }

    if (success) {
      query.success = success === 'true';
    }

    if (startDate || endDate) {
      query.loginTimestamp = {};
      if (startDate) {
        query.loginTimestamp.$gte = new Date(startDate);
      }
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        query.loginTimestamp.$lte = end;
      }
    }

    const logs = await AuthLog.find(query).sort({ loginTimestamp: -1 }).limit(200);
    return NextResponse.json(logs);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
