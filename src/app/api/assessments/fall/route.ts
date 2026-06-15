import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/authOptions';
import { dbConnect } from '@/lib/db';
import FallAssessment from '@/models/FallAssessment';
import { calculateFallRisk } from '@/lib/assessmentHelpers';
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
      age65OrOlder,
      fallHistory6Months,
      takingFourOrMoreMedications,
      psychoactiveMedications,
      abnormalGait,
      usesAssistiveDevice,
      impairedBalance,
      visionImpairment,
      stationLabel,
    } = body;

    if (!patientId || !campId) {
      return NextResponse.json({ error: 'Missing patient ID or camp ID' }, { status: 400 });
    }

    const answers = {
      age65OrOlder: !!age65OrOlder,
      fallHistory6Months: !!fallHistory6Months,
      takingFourOrMoreMedications: !!takingFourOrMoreMedications,
      psychoactiveMedications: !!psychoactiveMedications,
      abnormalGait: !!abnormalGait,
      usesAssistiveDevice: !!usesAssistiveDevice,
      impairedBalance: !!impairedBalance,
      visionImpairment: !!visionImpairment,
    };

    const { score, classification } = calculateFallRisk(answers);

    const fallAssessment = new FallAssessment({
      patientId: new mongoose.Types.ObjectId(patientId),
      campId: new mongoose.Types.ObjectId(campId),
      recordedBy: new mongoose.Types.ObjectId(session.user.id),
      stationLabel: stationLabel || undefined,
      ...answers,
      riskScore: score,
      riskClassification: classification,
    });

    await fallAssessment.save();

    const ipAddress = req.headers.get('x-forwarded-for') || '127.0.0.1';
    await logAudit({
      userId: session.user.id,
      username: session.user.name,
      role: session.user.role,
      entityType: 'FallAssessment',
      entityId: fallAssessment._id.toString(),
      action: 'CREATE',
      ipAddress,
      newValues: fallAssessment.toObject(),
    });

    return NextResponse.json(fallAssessment, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
