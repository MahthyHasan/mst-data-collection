import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/authOptions';
import { dbConnect } from '@/lib/db';
import FallAssessment from '@/models/FallAssessment';
import { calculateFallRisk } from '@/lib/assessmentHelpers';
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
      stationLabel,
      part1,
      part2Checklist,
      fallHistory,
      actionPlan,
      plannedReviewDate,
    } = body;

    if (!patientId || !campId) {
      return NextResponse.json({ error: 'Missing patient ID or camp ID' }, { status: 400 });
    }

    let finalRiskScore = 0;
    let finalRiskClassification: 'Low Risk' | 'Moderate Risk' | 'High Risk' = 'Low Risk';

    if (part1) {
      finalRiskScore = part1.totalScore;
      finalRiskClassification =
        part1.riskLevel === 'high'
          ? 'High Risk'
          : part1.riskLevel === 'medium'
          ? 'Moderate Risk'
          : 'Low Risk';
    } else {
      // Legacy computation
      const answers = {
        age65OrOlder: !!body.age65OrOlder,
        fallHistory6Months: !!body.fallHistory6Months,
        takingFourOrMoreMedications: !!body.takingFourOrMoreMedications,
        psychoactiveMedications: !!body.psychoactiveMedications,
        abnormalGait: !!body.abnormalGait,
        usesAssistiveDevice: !!body.usesAssistiveDevice,
        impairedBalance: !!body.impairedBalance,
        visionImpairment: !!body.visionImpairment,
      };
      const { score, classification } = calculateFallRisk(answers);
      finalRiskScore = score;
      finalRiskClassification = classification;
    }

    const fallAssessment = new FallAssessment({
      patientId: new mongoose.Types.ObjectId(patientId),
      campId: new mongoose.Types.ObjectId(campId),
      recordedBy: new mongoose.Types.ObjectId(session.user.id),
      stationLabel: stationLabel || undefined,
      
      // Legacy fields
      age65OrOlder: body.age65OrOlder || false,
      fallHistory6Months: body.fallHistory6Months || false,
      takingFourOrMoreMedications: body.takingFourOrMoreMedications || false,
      psychoactiveMedications: body.psychoactiveMedications || false,
      abnormalGait: body.abnormalGait || false,
      usesAssistiveDevice: body.usesAssistiveDevice || false,
      impairedBalance: body.impairedBalance || false,
      visionImpairment: body.visionImpairment || false,
      riskScore: finalRiskScore,
      riskClassification: finalRiskClassification,

      // FRAT fields
      part1: part1 || undefined,
      part2Checklist: part2Checklist || undefined,
      fallHistory: fallHistory || undefined,
      actionPlan: actionPlan || undefined,
      plannedReviewDate: plannedReviewDate ? new Date(plannedReviewDate) : undefined,
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

    const fallAssessment = await FallAssessment.findOne({
      patientId: new mongoose.Types.ObjectId(patientId),
      campId: new mongoose.Types.ObjectId(campId),
    }).populate('recordedBy', 'username');

    if (!fallAssessment) {
      return NextResponse.json(null, { status: 200 });
    }

    return NextResponse.json(fallAssessment);
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

    const fallAssessment = await FallAssessment.findOne({
      patientId: new mongoose.Types.ObjectId(patientId),
      campId: new mongoose.Types.ObjectId(campId),
    });

    if (!fallAssessment) {
      return NextResponse.json({ error: 'Assessment not found' }, { status: 404 });
    }

    const oldValues = fallAssessment.toObject();

    const {
      stationLabel,
      part1,
      part2Checklist,
      fallHistory,
      actionPlan,
      plannedReviewDate,
    } = body;

    if (stationLabel !== undefined) fallAssessment.stationLabel = stationLabel || undefined;
    if (part1 !== undefined) fallAssessment.part1 = part1 || undefined;
    if (part2Checklist !== undefined) fallAssessment.part2Checklist = part2Checklist || undefined;
    if (fallHistory !== undefined) fallAssessment.fallHistory = fallHistory || undefined;
    if (actionPlan !== undefined) fallAssessment.actionPlan = actionPlan || undefined;
    if (plannedReviewDate !== undefined) {
      fallAssessment.plannedReviewDate = plannedReviewDate ? new Date(plannedReviewDate) : undefined;
    }

    // Recalculate legacy fields
    if (part1) {
      fallAssessment.riskScore = part1.totalScore;
      fallAssessment.riskClassification =
        part1.riskLevel === 'high'
          ? 'High Risk'
          : part1.riskLevel === 'medium'
          ? 'Moderate Risk'
          : 'Low Risk';
    } else {
      // Keep legacy fields consistent if updated
      const legacyKeys = [
        'age65OrOlder',
        'fallHistory6Months',
        'takingFourOrMoreMedications',
        'psychoactiveMedications',
        'abnormalGait',
        'usesAssistiveDevice',
        'impairedBalance',
        'visionImpairment',
      ];
      legacyKeys.forEach((key) => {
        if (body[key] !== undefined) {
          (fallAssessment as any)[key] = body[key];
        }
      });
      const answers = {
        age65OrOlder: !!fallAssessment.age65OrOlder,
        fallHistory6Months: !!fallAssessment.fallHistory6Months,
        takingFourOrMoreMedications: !!fallAssessment.takingFourOrMoreMedications,
        psychoactiveMedications: !!fallAssessment.psychoactiveMedications,
        abnormalGait: !!fallAssessment.abnormalGait,
        usesAssistiveDevice: !!fallAssessment.usesAssistiveDevice,
        impairedBalance: !!fallAssessment.impairedBalance,
        visionImpairment: !!fallAssessment.visionImpairment,
      };
      const { score, classification } = calculateFallRisk(answers);
      fallAssessment.riskScore = score;
      fallAssessment.riskClassification = classification;
    }

    fallAssessment.recordedBy = new mongoose.Types.ObjectId(session.user.id);
    await fallAssessment.save();

    const newValues = fallAssessment.toObject();
    const { oldDiff, newDiff, changedFields } = getDiff(oldValues, newValues);

    const ipAddress = req.headers.get('x-forwarded-for') || '127.0.0.1';
    await logAudit({
      userId: session.user.id,
      username: session.user.name,
      role: session.user.role,
      entityType: 'FallAssessment',
      entityId: fallAssessment._id.toString(),
      action: 'UPDATE',
      ipAddress,
      oldValues: oldDiff,
      newValues: newDiff,
      changedFields,
    });

    return NextResponse.json(fallAssessment);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
