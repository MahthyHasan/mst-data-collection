import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/authOptions';
import { dbConnect } from '@/lib/db';
import MinicogAssessment from '@/models/MinicogAssessment';
import { calculateMinicog } from '@/lib/assessmentHelpers';
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

    const { patientId, campId, recallScore, clockDrawingScore, stationLabel } = body;

    if (patientId === undefined || campId === undefined || recallScore === undefined || clockDrawingScore === undefined) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const recScore = parseInt(recallScore);
    const clkScore = parseInt(clockDrawingScore);

    const { totalScore, outcome } = calculateMinicog(recScore, clkScore);

    const minicogAssessment = new MinicogAssessment({
      patientId: new mongoose.Types.ObjectId(patientId),
      campId: new mongoose.Types.ObjectId(campId),
      recordedBy: new mongoose.Types.ObjectId(session.user.id),
      stationLabel: stationLabel || undefined,
      recallScore: recScore,
      clockDrawingScore: clkScore,
      totalScore,
      outcome,
    });

    await minicogAssessment.save();

    const ipAddress = req.headers.get('x-forwarded-for') || '127.0.0.1';
    await logAudit({
      userId: session.user.id,
      username: session.user.name,
      role: session.user.role,
      entityType: 'MinicogAssessment',
      entityId: minicogAssessment._id.toString(),
      action: 'CREATE',
      ipAddress,
      newValues: minicogAssessment.toObject(),
    });

    return NextResponse.json(minicogAssessment, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
