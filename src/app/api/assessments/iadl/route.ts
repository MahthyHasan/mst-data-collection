import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/authOptions';
import { dbConnect } from '@/lib/db';
import IadlAssessment from '@/models/IadlAssessment';
import { calculateIADL } from '@/lib/assessmentHelpers';
import { logAudit } from '@/lib/audit';
import mongoose from 'mongoose';

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();
    const body = await req.json();

    const {
      patientId,
      campId,
      phone,
      shopping,
      foodPrep,
      housekeeping,
      laundry,
      transport,
      medications,
      finances,
      stationLabel,
    } = body;

    if (!patientId || !campId) {
      return NextResponse.json({ error: 'Missing patient ID or camp ID' }, { status: 400 });
    }

    const items = {
      phone: parseInt(phone || 0),
      shopping: parseInt(shopping || 0),
      foodPrep: parseInt(foodPrep || 0),
      housekeeping: parseInt(housekeeping || 0),
      laundry: parseInt(laundry || 0),
      transport: parseInt(transport || 0),
      medications: parseInt(medications || 0),
      finances: parseInt(finances || 0),
    };

    const { totalScore, classification } = calculateIADL(items);

    const iadlAssessment = new IadlAssessment({
      patientId: new mongoose.Types.ObjectId(patientId),
      campId: new mongoose.Types.ObjectId(campId),
      recordedBy: new mongoose.Types.ObjectId(session.user.id),
      stationLabel: stationLabel || undefined,
      ...items,
      totalScore,
      classification,
    });

    await iadlAssessment.save();

    const ipAddress = req.headers.get('x-forwarded-for') || '127.0.0.1';
    await logAudit({
      userId: session.user.id,
      username: session.user.name,
      role: session.user.role,
      entityType: 'IadlAssessment',
      entityId: iadlAssessment._id.toString(),
      action: 'CREATE',
      ipAddress,
      newValues: iadlAssessment.toObject(),
    });

    return NextResponse.json(iadlAssessment, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
