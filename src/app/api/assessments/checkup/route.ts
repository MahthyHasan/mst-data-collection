import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/authOptions';
import { dbConnect } from '@/lib/db';
import MedicalCheckup from '@/models/MedicalCheckup';
import { calculateBMI } from '@/lib/assessmentHelpers';
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

    const { patientId, campId, height, weight, waistCircumference, bloodPressureSystolic, bloodPressureDiastolic, randomBloodSugar, visionAssessmentNotes, hearingAssessmentNotes, stationLabel } = body;

    if (!patientId || !campId || !height || !weight) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const { bmi, classification } = calculateBMI(parseFloat(weight), parseFloat(height));

    const checkup = new MedicalCheckup({
      patientId: new mongoose.Types.ObjectId(patientId),
      campId: new mongoose.Types.ObjectId(campId),
      recordedBy: new mongoose.Types.ObjectId(session.user.id),
      stationLabel: stationLabel || undefined,
      height: parseFloat(height),
      weight: parseFloat(weight),
      waistCircumference: parseFloat(waistCircumference || 0),
      bloodPressureSystolic: parseInt(bloodPressureSystolic || 0),
      bloodPressureDiastolic: parseInt(bloodPressureDiastolic || 0),
      randomBloodSugar: parseFloat(randomBloodSugar || 0),
      visionAssessmentNotes,
      hearingAssessmentNotes,
      bmi,
      bmiClassification: classification,
    });

    await checkup.save();

    const ipAddress = req.headers.get('x-forwarded-for') || '127.0.0.1';
    await logAudit({
      userId: session.user.id,
      username: session.user.name,
      role: session.user.role,
      entityType: 'MedicalCheckup',
      entityId: checkup._id.toString(),
      action: 'CREATE',
      ipAddress,
      newValues: checkup.toObject(),
    });

    return NextResponse.json(checkup, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
