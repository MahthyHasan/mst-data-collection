import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/authOptions';
import { dbConnect } from '@/lib/db';
import Patient from '@/models/Patient';
import MedicalCheckup from '@/models/MedicalCheckup';
import FallAssessment from '@/models/FallAssessment';
import GdsAssessment from '@/models/GdsAssessment';
import MinicogAssessment from '@/models/MinicogAssessment';
import AdlAssessment from '@/models/AdlAssessment';
import IadlAssessment from '@/models/IadlAssessment';
import { logAudit } from '@/lib/audit';

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    await dbConnect();
    const patient = await Patient.findById(id).populate('campId', 'name center code district mohArea');
    if (!patient) {
      return NextResponse.json({ error: 'Patient not found' }, { status: 404 });
    }

    // Load recent assessments
    const checkups = await MedicalCheckup.find({ patientId: id }).sort({ createdAt: -1 });
    const fallAssessments = await FallAssessment.find({ patientId: id }).sort({ createdAt: -1 });
    const gdsAssessments = await GdsAssessment.find({ patientId: id }).sort({ createdAt: -1 });
    const minicogAssessments = await MinicogAssessment.find({ patientId: id }).sort({ createdAt: -1 });
    const adlAssessments = await AdlAssessment.find({ patientId: id }).sort({ createdAt: -1 });
    const iadlAssessments = await IadlAssessment.find({ patientId: id }).sort({ createdAt: -1 });

    return NextResponse.json({
      patient,
      checkups,
      fallAssessments,
      gdsAssessments,
      minicogAssessments,
      adlAssessments,
      iadlAssessments,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    await dbConnect();
    const body = await req.json();
    const patient = await Patient.findById(id);
    if (!patient || patient.isDeleted) {
      return NextResponse.json({ error: 'Patient not found' }, { status: 404 });
    }

    // Check NIC uniqueness if NIC is changing
    if (body.nic && body.nic !== patient.nic) {
      const existing = await Patient.findOne({ nic: body.nic, isDeleted: false });
      if (existing) {
        return NextResponse.json(
          { error: 'A patient with this National ID Number (NIC) is already registered and active.' },
          { status: 400 }
        );
      }
    }

    const oldValues = patient.toObject();

    // Field list to update
    const updatableFields = [
      'fullName', 'age', 'dob', 'gender', 'nic', 'maritalStatus', 'contactNumber', 'campId',
      'urinaryIncontinence', 'constipation', 'freeTextIssues', 'allergies', 'medicalConditions',
      'customMedicalConditions', 'surgeries', 'medications', 'visionProblems', 'hearingProblems',
      'walkIndependently', 'walkingAids', 'needsAssistanceWith', 'historyOfFalls', 'functionalNotes',
      'memoryProblems', 'dementiaDiagnosis', 'alzheimersDiagnosis', 'depressionSymptoms', 'anxietySymptoms',
      'cognitiveNotes', 'smokingHistory', 'alcoholUse', 'exerciseHabits', 'dietaryHabits', 'livesAlone',
      'livesWithFamily', 'caregiverMaintained', 'caregiverName', 'caregiverContact', 'socialNotes'
    ];

    const changedFields: string[] = [];
    updatableFields.forEach((field) => {
      if (body[field] !== undefined) {
        if (JSON.stringify(patient.get(field)) !== JSON.stringify(body[field])) {
          changedFields.push(field);
          patient.set(field, body[field]);
        }
      }
    });

    if (changedFields.length > 0) {
      await patient.save();
      const ipAddress = req.headers.get('x-forwarded-for') || '127.0.0.1';
      await logAudit({
        userId: session.user.id,
        username: session.user.name,
        role: session.user.role,
        entityType: 'Patient',
        entityId: patient._id.toString(),
        action: 'UPDATE',
        ipAddress,
        oldValues,
        newValues: patient.toObject(),
        changedFields,
      });
    }

    return NextResponse.json(patient);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Employees cannot delete records
    if (session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { id } = await params;
    await dbConnect();
    const patient = await Patient.findById(id);
    if (!patient || patient.isDeleted) {
      return NextResponse.json({ error: 'Patient not found' }, { status: 404 });
    }

    patient.isDeleted = true;
    await patient.save();

    const ipAddress = req.headers.get('x-forwarded-for') || '127.0.0.1';
    await logAudit({
      userId: session.user.id,
      username: session.user.name,
      role: session.user.role,
      entityType: 'Patient',
      entityId: patient._id.toString(),
      action: 'DELETE',
      ipAddress,
      oldValues: { fullName: patient.fullName, nic: patient.nic, isDeleted: false },
      newValues: { fullName: patient.fullName, nic: patient.nic, isDeleted: true },
      changedFields: ['isDeleted'],
    });

    return NextResponse.json({ message: 'Patient soft deleted successfully' });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { id } = await params;
    await dbConnect();
    const patient = await Patient.findById(id);
    if (!patient) {
      return NextResponse.json({ error: 'Patient not found' }, { status: 404 });
    }

    const body = await req.json();
    const action = body.action;

    if (action === 'restore') {
      // Check if nic is already in use by another active patient
      const conflict = await Patient.findOne({ nic: patient.nic, isDeleted: false });
      if (conflict) {
        return NextResponse.json(
          { error: 'Cannot restore. An active patient with the same National ID Number (NIC) already exists.' },
          { status: 400 }
        );
      }

      patient.isDeleted = false;
      await patient.save();

      const ipAddress = req.headers.get('x-forwarded-for') || '127.0.0.1';
      await logAudit({
        userId: session.user.id,
        username: session.user.name,
        role: session.user.role,
        entityType: 'Patient',
        entityId: patient._id.toString(),
        action: 'RESTORE',
        ipAddress,
        oldValues: { fullName: patient.fullName, nic: patient.nic, isDeleted: true },
        newValues: { fullName: patient.fullName, nic: patient.nic, isDeleted: false },
        changedFields: ['isDeleted'],
      });

      return NextResponse.json({ message: 'Patient restored successfully' });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
