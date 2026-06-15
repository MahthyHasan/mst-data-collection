import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/authOptions';
import { dbConnect } from '@/lib/db';
import AdlAssessment from '@/models/AdlAssessment';
import { calculateADL } from '@/lib/assessmentHelpers';
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
      feeding,
      bathing,
      grooming,
      dressing,
      bowelBladder,
      toiletUse,
      transfers,
      mobility,
      stairsMobility,
      stationLabel,
    } = body;

    if (!patientId || !campId) {
      return NextResponse.json({ error: 'Missing patient ID or camp ID' }, { status: 400 });
    }

    const items = {
      feeding: parseInt(feeding || 0),
      bathing: parseInt(bathing || 0),
      grooming: parseInt(grooming || 0),
      dressing: parseInt(dressing || 0),
      bowelBladder: parseInt(bowelBladder || 0),
      toiletUse: parseInt(toiletUse || 0),
      transfers: parseInt(transfers || 0),
      mobility: parseInt(mobility || 0),
      stairsMobility: parseInt(stairsMobility || 0),
    };

    const { totalScore, classification } = calculateADL(items);

    const adlAssessment = new AdlAssessment({
      patientId: new mongoose.Types.ObjectId(patientId),
      campId: new mongoose.Types.ObjectId(campId),
      recordedBy: new mongoose.Types.ObjectId(session.user.id),
      stationLabel: stationLabel || undefined,
      ...items,
      totalScore,
      classification,
    });

    await adlAssessment.save();

    const ipAddress = req.headers.get('x-forwarded-for') || '127.0.0.1';
    await logAudit({
      userId: session.user.id,
      username: session.user.name,
      role: session.user.role,
      entityType: 'AdlAssessment',
      entityId: adlAssessment._id.toString(),
      action: 'CREATE',
      ipAddress,
      newValues: adlAssessment.toObject(),
    });

    return NextResponse.json(adlAssessment, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
