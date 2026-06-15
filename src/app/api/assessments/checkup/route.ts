import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/authOptions';
import { dbConnect } from '@/lib/db';
import MedicalCheckup from '@/models/MedicalCheckup';
import { calculateBMI } from '@/lib/assessmentHelpers';
import { logAudit } from '@/lib/audit';
import mongoose from 'mongoose';
import { getDiff } from '@/lib/utils';


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

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();
    const { searchParams } = new URL(req.url);
    const patientId = searchParams.get('patientId');
    const campId = searchParams.get('campId');

    if (!patientId || !campId) {
      return NextResponse.json({ error: 'Missing patientId or campId' }, { status: 400 });
    }

    const checkup = await MedicalCheckup.findOne({
      patientId: new mongoose.Types.ObjectId(patientId),
      campId: new mongoose.Types.ObjectId(campId)
    }).populate('recordedBy', 'username');

    if (!checkup) {
      return NextResponse.json(null, { status: 200 });
    }

    return NextResponse.json(checkup);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();
    const body = await req.json();
    const { patientId, campId } = body;

    if (!patientId || !campId) {
      return NextResponse.json({ error: 'Missing patient ID or camp ID' }, { status: 400 });
    }

    const checkup = await MedicalCheckup.findOne({
      patientId: new mongoose.Types.ObjectId(patientId),
      campId: new mongoose.Types.ObjectId(campId)
    });

    if (!checkup) {
      return NextResponse.json({ error: 'Assessment not found' }, { status: 404 });
    }

    const oldValues = checkup.toObject();

    const {
      height,
      weight,
      waistCircumference,
      bloodPressureSystolic,
      bloodPressureDiastolic,
      randomBloodSugar,
      visionAssessmentNotes,
      hearingAssessmentNotes,
      stationLabel,
    } = body;

    if (height !== undefined) checkup.height = parseFloat(height);
    if (weight !== undefined) checkup.weight = parseFloat(weight);
    if (waistCircumference !== undefined) checkup.waistCircumference = parseFloat(waistCircumference || 0);
    if (bloodPressureSystolic !== undefined) checkup.bloodPressureSystolic = parseInt(bloodPressureSystolic || 0);
    if (bloodPressureDiastolic !== undefined) checkup.bloodPressureDiastolic = parseInt(bloodPressureDiastolic || 0);
    if (randomBloodSugar !== undefined) checkup.randomBloodSugar = parseFloat(randomBloodSugar || 0);
    if (visionAssessmentNotes !== undefined) checkup.visionAssessmentNotes = visionAssessmentNotes;
    if (hearingAssessmentNotes !== undefined) checkup.hearingAssessmentNotes = hearingAssessmentNotes;
    if (stationLabel !== undefined) checkup.stationLabel = stationLabel || undefined;

    if (height !== undefined || weight !== undefined) {
      const { bmi, classification } = calculateBMI(checkup.weight, checkup.height);
      checkup.bmi = bmi;
      checkup.bmiClassification = classification;
    }

    checkup.recordedBy = new mongoose.Types.ObjectId(session.user.id);
    await checkup.save();

    const newValues = checkup.toObject();
    const { oldDiff, newDiff, changedFields } = getDiff(oldValues, newValues);

    const ipAddress = req.headers.get('x-forwarded-for') || '127.0.0.1';
    await logAudit({
      userId: session.user.id,
      username: session.user.name,
      role: session.user.role,
      entityType: 'MedicalCheckup',
      entityId: checkup._id.toString(),
      action: 'UPDATE',
      ipAddress,
      oldValues: oldDiff,
      newValues: newDiff,
      changedFields,
    });

    return NextResponse.json(checkup);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

