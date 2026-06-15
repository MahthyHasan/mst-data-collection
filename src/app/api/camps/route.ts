import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/authOptions';
import { dbConnect } from '@/lib/db';
import Camp from '@/models/Camp';
import { logAudit } from '@/lib/audit';
import { campSectionsSchema } from '@/lib/schemas';

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();
    const { searchParams } = new URL(req.url);
    const search = searchParams.get('search') || '';
    const status = searchParams.get('status') || '';
    
    const query: any = { isDeleted: false };
    
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { code: { $regex: search, $options: 'i' } },
        { center: { $regex: search, $options: 'i' } },
        { district: { $regex: search, $options: 'i' } },
      ];
    }
    
    if (status) {
      query.status = status;
    }

    const camps = await Camp.find(query).sort({ campDate: -1 });
    return NextResponse.json(camps);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    await dbConnect();
    const body = await req.json();

    if (body.sections) {
      const parsed = campSectionsSchema.safeParse(body.sections);
      if (!parsed.success) {
        return NextResponse.json({ error: 'Invalid sections configuration' }, { status: 400 });
      }
    }
    
    // Check if camp code already exists
    const existing = await Camp.findOne({ code: body.code, isDeleted: false });
    if (existing) {
      return NextResponse.json({ error: 'Camp code already exists' }, { status: 400 });
    }

    const camp = new Camp({
      ...body,
      isDeleted: false,
    });
    await camp.save();

    // Log audit
    const ipAddress = req.headers.get('x-forwarded-for') || '127.0.0.1';
    await logAudit({
      userId: session.user.id,
      username: session.user.name,
      role: session.user.role,
      entityType: 'Camp',
      entityId: camp._id.toString(),
      action: 'CREATE',
      ipAddress,
      newValues: camp.toObject(),
    });

    return NextResponse.json(camp, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
