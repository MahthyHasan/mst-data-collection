import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/authOptions';
import { dbConnect } from '@/lib/db';
import AdlAssessment from '@/models/AdlAssessment';
import { calculateADL } from '@/lib/assessmentHelpers';
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

    const { totalScore, classification, severityBand } = calculateADL(items);

    const adlAssessment = new AdlAssessment({
      patientId: new mongoose.Types.ObjectId(patientId),
      campId: new mongoose.Types.ObjectId(campId),
      recordedBy: new mongoose.Types.ObjectId(session.user.id),
      stationLabel: stationLabel || undefined,
      ...items,
      totalScore,
      classification,
      severityBand,
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

    const adlAssessment = await AdlAssessment.findOne({
      patientId: new mongoose.Types.ObjectId(patientId),
      campId: new mongoose.Types.ObjectId(campId),
    }).populate('recordedBy', 'username');

    if (!adlAssessment) {
      return NextResponse.json(null, { status: 200 });
    }

    return NextResponse.json(adlAssessment);
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

    const adlAssessment = await AdlAssessment.findOne({
      patientId: new mongoose.Types.ObjectId(patientId),
      campId: new mongoose.Types.ObjectId(campId),
    });

    if (!adlAssessment) {
      return NextResponse.json({ error: 'Assessment not found' }, { status: 404 });
    }

    const oldValues = adlAssessment.toObject();

    const {
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

    if (stationLabel !== undefined) adlAssessment.stationLabel = stationLabel || undefined;
    if (feeding !== undefined) adlAssessment.feeding = parseInt(feeding || 0);
    if (bathing !== undefined) adlAssessment.bathing = parseInt(bathing || 0);
    if (grooming !== undefined) adlAssessment.grooming = parseInt(grooming || 0);
    if (dressing !== undefined) adlAssessment.dressing = parseInt(dressing || 0);
    if (bowelBladder !== undefined) adlAssessment.bowelBladder = parseInt(bowelBladder || 0);
    if (toiletUse !== undefined) adlAssessment.toiletUse = parseInt(toiletUse || 0);
    if (transfers !== undefined) adlAssessment.transfers = parseInt(transfers || 0);
    if (mobility !== undefined) adlAssessment.mobility = parseInt(mobility || 0);
    if (stairsMobility !== undefined) adlAssessment.stairsMobility = parseInt(stairsMobility || 0);

    const items = {
      feeding: adlAssessment.feeding,
      bathing: adlAssessment.bathing,
      grooming: adlAssessment.grooming,
      dressing: adlAssessment.dressing,
      bowelBladder: adlAssessment.bowelBladder,
      toiletUse: adlAssessment.toiletUse,
      transfers: adlAssessment.transfers,
      mobility: adlAssessment.mobility,
      stairsMobility: adlAssessment.stairsMobility,
    };

    const { totalScore, classification, severityBand } = calculateADL(items);
    adlAssessment.totalScore = totalScore;
    adlAssessment.classification = classification;
    adlAssessment.severityBand = severityBand;

    adlAssessment.recordedBy = new mongoose.Types.ObjectId(session.user.id);
    await adlAssessment.save();

    const newValues = adlAssessment.toObject();
    const { oldDiff, newDiff, changedFields } = getDiff(oldValues, newValues);

    const ipAddress = req.headers.get('x-forwarded-for') || '127.0.0.1';
    await logAudit({
      userId: session.user.id,
      username: session.user.name,
      role: session.user.role,
      entityType: 'AdlAssessment',
      entityId: adlAssessment._id.toString(),
      action: 'UPDATE',
      ipAddress,
      oldValues: oldDiff,
      newValues: newDiff,
      changedFields,
    });

    return NextResponse.json(adlAssessment);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
