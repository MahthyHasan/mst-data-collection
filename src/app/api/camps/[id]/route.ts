import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/authOptions';
import { dbConnect } from '@/lib/db';
import Camp from '@/models/Camp';
import { logAudit } from '@/lib/audit';

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    await dbConnect();
    const camp = await Camp.findById(id);
    if (!camp || camp.isDeleted) {
      return NextResponse.json({ error: 'Camp not found' }, { status: 404 });
    }

    return NextResponse.json(camp);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { id } = await params;
    await dbConnect();
    const body = await req.json();
    const camp = await Camp.findById(id);
    if (!camp || camp.isDeleted) {
      return NextResponse.json({ error: 'Camp not found' }, { status: 404 });
    }

    const oldValues = camp.toObject();
    
    // Check code unique if code is changing
    if (body.code && body.code !== camp.code) {
      const existing = await Camp.findOne({ code: body.code, isDeleted: false });
      if (existing) {
        return NextResponse.json({ error: 'Camp code already exists' }, { status: 400 });
      }
    }

    // Update fields
    const allowedFields = [
      'name',
      'code',
      'center',
      'district',
      'mohArea',
      'address',
      'campDate',
      'organizedBy',
      'status',
      'notes',
    ];
    
    const changedFields: string[] = [];
    allowedFields.forEach((field) => {
      if (body[field] !== undefined) {
        if (JSON.stringify(camp.get(field)) !== JSON.stringify(body[field])) {
          changedFields.push(field);
          camp.set(field, body[field]);
        }
      }
    });

    if (changedFields.length > 0) {
      await camp.save();
      const ipAddress = req.headers.get('x-forwarded-for') || '127.0.0.1';
      await logAudit({
        userId: session.user.id,
        username: session.user.name,
        role: session.user.role,
        entityType: 'Camp',
        entityId: camp._id.toString(),
        action: 'UPDATE',
        ipAddress,
        oldValues,
        newValues: camp.toObject(),
        changedFields,
      });
    }

    return NextResponse.json(camp);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { id } = await params;
    await dbConnect();
    const camp = await Camp.findById(id);
    if (!camp || camp.isDeleted) {
      return NextResponse.json({ error: 'Camp not found' }, { status: 404 });
    }

    camp.isDeleted = true;
    await camp.save();

    const ipAddress = req.headers.get('x-forwarded-for') || '127.0.0.1';
    await logAudit({
      userId: session.user.id,
      username: session.user.name,
      role: session.user.role,
      entityType: 'Camp',
      entityId: camp._id.toString(),
      action: 'DELETE',
      ipAddress,
      oldValues: { name: camp.name, code: camp.code, isDeleted: false },
      newValues: { name: camp.name, code: camp.code, isDeleted: true },
      changedFields: ['isDeleted'],
    });

    return NextResponse.json({ message: 'Camp soft deleted successfully' });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { id } = await params;
    await dbConnect();
    const camp = await Camp.findById(id);
    if (!camp) {
      return NextResponse.json({ error: 'Camp not found' }, { status: 404 });
    }

    const body = await req.json();
    const action = body.action; // e.g. "restore"

    if (action === 'restore') {
      camp.isDeleted = false;
      await camp.save();

      const ipAddress = req.headers.get('x-forwarded-for') || '127.0.0.1';
      await logAudit({
        userId: session.user.id,
        username: session.user.name,
        role: session.user.role,
        entityType: 'Camp',
        entityId: camp._id.toString(),
        action: 'RESTORE',
        ipAddress,
        oldValues: { name: camp.name, code: camp.code, isDeleted: true },
        newValues: { name: camp.name, code: camp.code, isDeleted: false },
        changedFields: ['isDeleted'],
      });

      return NextResponse.json({ message: 'Camp restored successfully' });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
