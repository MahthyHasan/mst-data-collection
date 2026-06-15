import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/authOptions';
import { dbConnect } from '@/lib/db';
import GdsAssessment from '@/models/GdsAssessment';
import { calculateGDS } from '@/lib/assessmentHelpers';
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

    const { patientId, campId, responses, stationLabel } = body;

    if (!patientId || !campId || !responses || !Array.isArray(responses) || responses.length !== 15) {
      return NextResponse.json({ error: 'Responses array of length 15 is required' }, { status: 400 });
    }

    const { score, classification } = calculateGDS(responses);

    const gdsAssessment = new GdsAssessment({
      patientId: new mongoose.Types.ObjectId(patientId),
      campId: new mongoose.Types.ObjectId(campId),
      recordedBy: new mongoose.Types.ObjectId(session.user.id),
      stationLabel: stationLabel || undefined,
      responses,
      totalScore: score,
      classification,
    });

    await gdsAssessment.save();

    const ipAddress = req.headers.get('x-forwarded-for') || '127.0.0.1';
    await logAudit({
      userId: session.user.id,
      username: session.user.name,
      role: session.user.role,
      entityType: 'GdsAssessment',
      entityId: gdsAssessment._id.toString(),
      action: 'CREATE',
      ipAddress,
      newValues: gdsAssessment.toObject(),
    });

    return NextResponse.json(gdsAssessment, { status: 201 });
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

    const gdsAssessment = await GdsAssessment.findOne({
      patientId: new mongoose.Types.ObjectId(patientId),
      campId: new mongoose.Types.ObjectId(campId),
    }).populate('recordedBy', 'username');

    if (!gdsAssessment) {
      return NextResponse.json(null, { status: 200 });
    }

    return NextResponse.json(gdsAssessment);
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

    const gdsAssessment = await GdsAssessment.findOne({
      patientId: new mongoose.Types.ObjectId(patientId),
      campId: new mongoose.Types.ObjectId(campId),
    });

    if (!gdsAssessment) {
      return NextResponse.json({ error: 'Assessment not found' }, { status: 404 });
    }

    const oldValues = gdsAssessment.toObject();

    const { responses, stationLabel } = body;

    if (stationLabel !== undefined) gdsAssessment.stationLabel = stationLabel || undefined;
    if (responses !== undefined) {
      if (!Array.isArray(responses) || responses.length !== 15) {
        return NextResponse.json({ error: 'Responses array of length 15 is required' }, { status: 400 });
      }
      gdsAssessment.responses = responses;
      const { score, classification } = calculateGDS(responses);
      gdsAssessment.totalScore = score;
      gdsAssessment.classification = classification;
    }

    gdsAssessment.recordedBy = new mongoose.Types.ObjectId(session.user.id);
    await gdsAssessment.save();

    const newValues = gdsAssessment.toObject();
    const { oldDiff, newDiff, changedFields } = getDiff(oldValues, newValues);

    const ipAddress = req.headers.get('x-forwarded-for') || '127.0.0.1';
    await logAudit({
      userId: session.user.id,
      username: session.user.name,
      role: session.user.role,
      entityType: 'GdsAssessment',
      entityId: gdsAssessment._id.toString(),
      action: 'UPDATE',
      ipAddress,
      oldValues: oldDiff,
      newValues: newDiff,
      changedFields,
    });

    return NextResponse.json(gdsAssessment);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
