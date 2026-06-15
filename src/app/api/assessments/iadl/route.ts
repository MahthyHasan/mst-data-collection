import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/authOptions';
import { dbConnect } from '@/lib/db';
import IadlAssessment from '@/models/IadlAssessment';
import Patient from '@/models/Patient';
import { calculateIADL } from '@/lib/assessmentHelpers';
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

    // Look up patient gender
    const patientDoc = await Patient.findById(patientId);
    if (!patientDoc) {
      return NextResponse.json({ error: 'Patient not found' }, { status: 404 });
    }

    const patientGender = patientDoc.gender || 'Female';
    const isMale = patientGender.toLowerCase() === 'male';

    const items = {
      phone: parseInt(phone || 0),
      shopping: parseInt(shopping || 0),
      foodPrep: isMale ? 0 : parseInt(foodPrep || 0),
      housekeeping: isMale ? 0 : parseInt(housekeeping || 0),
      laundry: isMale ? 0 : parseInt(laundry || 0),
      transport: parseInt(transport || 0),
      medications: parseInt(medications || 0),
      finances: parseInt(finances || 0),
    };

    const { totalScore, rawScore, maxScore, impaired, classification } = calculateIADL(items, patientGender);

    const iadlAssessment = new IadlAssessment({
      patientId: new mongoose.Types.ObjectId(patientId),
      campId: new mongoose.Types.ObjectId(campId),
      recordedBy: new mongoose.Types.ObjectId(session.user.id),
      stationLabel: stationLabel || undefined,
      ...items,
      totalScore,
      rawScore,
      maxScore,
      gender: patientGender,
      impaired,
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

    const iadlAssessment = await IadlAssessment.findOne({
      patientId: new mongoose.Types.ObjectId(patientId),
      campId: new mongoose.Types.ObjectId(campId),
    }).populate('recordedBy', 'username');

    if (!iadlAssessment) {
      return NextResponse.json(null, { status: 200 });
    }

    return NextResponse.json(iadlAssessment);
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

    const iadlAssessment = await IadlAssessment.findOne({
      patientId: new mongoose.Types.ObjectId(patientId),
      campId: new mongoose.Types.ObjectId(campId),
    });

    if (!iadlAssessment) {
      return NextResponse.json({ error: 'Assessment not found' }, { status: 404 });
    }

    const patientDoc = await Patient.findById(patientId);
    if (!patientDoc) {
      return NextResponse.json({ error: 'Patient not found' }, { status: 404 });
    }

    const patientGender = patientDoc.gender || 'Female';
    const isMale = patientGender.toLowerCase() === 'male';

    const oldValues = iadlAssessment.toObject();

    const {
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

    if (stationLabel !== undefined) iadlAssessment.stationLabel = stationLabel || undefined;
    if (phone !== undefined) iadlAssessment.phone = parseInt(phone || 0);
    if (shopping !== undefined) iadlAssessment.shopping = parseInt(shopping || 0);
    if (foodPrep !== undefined) iadlAssessment.foodPrep = isMale ? 0 : parseInt(foodPrep || 0);
    if (housekeeping !== undefined) iadlAssessment.housekeeping = isMale ? 0 : parseInt(housekeeping || 0);
    if (laundry !== undefined) iadlAssessment.laundry = isMale ? 0 : parseInt(laundry || 0);
    if (transport !== undefined) iadlAssessment.transport = parseInt(transport || 0);
    if (medications !== undefined) iadlAssessment.medications = parseInt(medications || 0);
    if (finances !== undefined) iadlAssessment.finances = parseInt(finances || 0);

    const items = {
      phone: iadlAssessment.phone,
      shopping: iadlAssessment.shopping,
      foodPrep: iadlAssessment.foodPrep,
      housekeeping: iadlAssessment.housekeeping,
      laundry: iadlAssessment.laundry,
      transport: iadlAssessment.transport,
      medications: iadlAssessment.medications,
      finances: iadlAssessment.finances,
    };

    const { totalScore, rawScore, maxScore, impaired, classification } = calculateIADL(items, patientGender);
    iadlAssessment.totalScore = totalScore;
    iadlAssessment.rawScore = rawScore;
    iadlAssessment.maxScore = maxScore;
    iadlAssessment.gender = patientGender;
    iadlAssessment.impaired = impaired;
    iadlAssessment.classification = classification;

    iadlAssessment.recordedBy = new mongoose.Types.ObjectId(session.user.id);
    await iadlAssessment.save();

    const newValues = iadlAssessment.toObject();
    const { oldDiff, newDiff, changedFields } = getDiff(oldValues, newValues);

    const ipAddress = req.headers.get('x-forwarded-for') || '127.0.0.1';
    await logAudit({
      userId: session.user.id,
      username: session.user.name,
      role: session.user.role,
      entityType: 'IadlAssessment',
      entityId: iadlAssessment._id.toString(),
      action: 'UPDATE',
      ipAddress,
      oldValues: oldDiff,
      newValues: newDiff,
      changedFields,
    });

    return NextResponse.json(iadlAssessment);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
