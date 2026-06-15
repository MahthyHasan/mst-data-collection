import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/authOptions';
import { dbConnect } from '@/lib/db';
import User from '@/models/User';
import bcrypt from 'bcrypt';
import { logAudit } from '@/lib/audit';

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const { id } = await params;
    await dbConnect();
    const body = await req.json();
    const user = await User.findById(id);
    if (!user || user.isDeleted) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const oldValues = { username: user.username, role: user.role, isEnabled: user.isEnabled };
    const changedFields: string[] = [];

    if (body.role && body.role !== user.role) {
      user.role = body.role;
      changedFields.push('role');
    }

    if (body.isEnabled !== undefined && body.isEnabled !== user.isEnabled) {
      user.isEnabled = body.isEnabled;
      changedFields.push('isEnabled');
    }

    if (body.password) {
      user.password = await bcrypt.hash(body.password, 10);
      changedFields.push('password');
    }

    if (changedFields.length > 0) {
      await user.save();

      const ipAddress = req.headers.get('x-forwarded-for') || '127.0.0.1';
      await logAudit({
        userId: session.user.id,
        username: session.user.name,
        role: session.user.role,
        entityType: 'User',
        entityId: user._id.toString(),
        action: 'UPDATE',
        ipAddress,
        oldValues,
        newValues: { username: user.username, role: user.role, isEnabled: user.isEnabled },
        changedFields,
      });
    }

    const userResponse = user.toObject();
    delete userResponse.password;

    return NextResponse.json(userResponse);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const { id } = await params;
    if (session.user.id === id) {
      return NextResponse.json({ error: 'Cannot delete your own administrator account.' }, { status: 400 });
    }

    await dbConnect();
    const user = await User.findById(id);
    if (!user || user.isDeleted) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    user.isDeleted = true;
    await user.save();

    const ipAddress = req.headers.get('x-forwarded-for') || '127.0.0.1';
    await logAudit({
      userId: session.user.id,
      username: session.user.name,
      role: session.user.role,
      entityType: 'User',
      entityId: user._id.toString(),
      action: 'DELETE',
      ipAddress,
      oldValues: { username: user.username, isDeleted: false },
      newValues: { username: user.username, isDeleted: true },
      changedFields: ['isDeleted'],
    });

    return NextResponse.json({ message: 'User soft deleted successfully' });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
