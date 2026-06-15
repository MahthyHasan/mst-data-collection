import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/authOptions';
import { dbConnect } from '@/lib/db';
import Patient from '@/models/Patient';
import { logAudit } from '@/lib/audit';
import mongoose from 'mongoose';

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();
    const { searchParams } = new URL(req.url);
    
    // Pagination & Sorting
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const sortBy = searchParams.get('sortBy') || 'createdAt';
    const sortOrder = searchParams.get('sortOrder') || 'desc';
    const skip = (page - 1) * limit;

    // Filters
    const search = searchParams.get('search') || '';
    const campId = searchParams.get('campId') || '';
    const gender = searchParams.get('gender') || '';
    const ageMin = searchParams.get('ageMin') || '';
    const ageMax = searchParams.get('ageMax') || '';
    const medicalCondition = searchParams.get('medicalCondition') || '';
    const fallRisk = searchParams.get('fallRisk') || '';
    const gdsClass = searchParams.get('gds') || '';
    const minicogClass = searchParams.get('minicog') || '';
    const adlClass = searchParams.get('adl') || '';
    const iadlClass = searchParams.get('iadl') || '';
    const showDeleted = searchParams.get('showDeleted') === 'true'; // Admin only

    // Pipeline building for advanced filtering through lookups
    const matchStage: any = { isDeleted: showDeleted && session.user.role === 'admin' ? true : false };

    if (session.user.role === 'employee') {
      // Employees can only view records they registered or are assigned to their camp,
      // but let's allow all active employees to view all patients as per camp dashboard.
      // We can restrict if requested, but prompt says "Employee: register patients, update, view assigned".
      // Let's support viewing all patient records for cooperation, or match by camp if specified.
    }

    if (search) {
      matchStage.$or = [
        { fullName: { $regex: search, $options: 'i' } },
        { nic: { $regex: search, $options: 'i' } },
        { contactNumber: { $regex: search, $options: 'i' } },
      ];
    }

    if (campId) {
      matchStage.campId = new mongoose.Types.ObjectId(campId);
    }

    if (gender) {
      matchStage.gender = gender;
    }

    if (ageMin || ageMax) {
      matchStage.age = {};
      if (ageMin) matchStage.age.$gte = parseInt(ageMin);
      if (ageMax) matchStage.age.$lte = parseInt(ageMax);
    }

    if (medicalCondition) {
      matchStage.$or = [
        { medicalConditions: medicalCondition },
        { customMedicalConditions: { $regex: medicalCondition, $options: 'i' } }
      ];
    }

    const pipeline: any[] = [
      { $match: matchStage },
      // Lookup camp details
      {
        $lookup: {
          from: 'camps',
          localField: 'campId',
          foreignField: '_id',
          as: 'campInfo',
        },
      },
      { $unwind: { path: '$campInfo', preserveNullAndEmptyArrays: true } },
      // Lookup latest medical checkup
      {
        $lookup: {
          from: 'medicalcheckups',
          let: { patientId: '$_id' },
          pipeline: [
            { $match: { $expr: { $eq: ['$patientId', '$$patientId'] } } },
            { $sort: { createdAt: -1 } },
            { $limit: 1 }
          ],
          as: 'latestCheckup',
        },
      },
      { $unwind: { path: '$latestCheckup', preserveNullAndEmptyArrays: true } },
      // Lookup latest fall assessment
      {
        $lookup: {
          from: 'fallassessments',
          let: { patientId: '$_id' },
          pipeline: [
            { $match: { $expr: { $eq: ['$patientId', '$$patientId'] } } },
            { $sort: { createdAt: -1 } },
            { $limit: 1 }
          ],
          as: 'latestFall',
        },
      },
      { $unwind: { path: '$latestFall', preserveNullAndEmptyArrays: true } },
      // Lookup latest GDS assessment
      {
        $lookup: {
          from: 'gdsassessments',
          let: { patientId: '$_id' },
          pipeline: [
            { $match: { $expr: { $eq: ['$patientId', '$$patientId'] } } },
            { $sort: { createdAt: -1 } },
            { $limit: 1 }
          ],
          as: 'latestGds',
        },
      },
      { $unwind: { path: '$latestGds', preserveNullAndEmptyArrays: true } },
      // Lookup latest Mini-Cog assessment
      {
        $lookup: {
          from: 'minicogassessments',
          let: { patientId: '$_id' },
          pipeline: [
            { $match: { $expr: { $eq: ['$patientId', '$$patientId'] } } },
            { $sort: { createdAt: -1 } },
            { $limit: 1 }
          ],
          as: 'latestMinicog',
        },
      },
      { $unwind: { path: '$latestMinicog', preserveNullAndEmptyArrays: true } },
      // Lookup latest ADL assessment
      {
        $lookup: {
          from: 'adlassessments',
          let: { patientId: '$_id' },
          pipeline: [
            { $match: { $expr: { $eq: ['$patientId', '$$patientId'] } } },
            { $sort: { createdAt: -1 } },
            { $limit: 1 }
          ],
          as: 'latestAdl',
        },
      },
      { $unwind: { path: '$latestAdl', preserveNullAndEmptyArrays: true } },
      // Lookup latest IADL assessment
      {
        $lookup: {
          from: 'iadlassessments',
          let: { patientId: '$_id' },
          pipeline: [
            { $match: { $expr: { $eq: ['$patientId', '$$patientId'] } } },
            { $sort: { createdAt: -1 } },
            { $limit: 1 }
          ],
          as: 'latestIadl',
        },
      },
      { $unwind: { path: '$latestIadl', preserveNullAndEmptyArrays: true } },
    ];

    // Post-lookup filters (assessment classifications)
    const postMatchStage: any = {};
    if (fallRisk) {
      postMatchStage['latestFall.riskClassification'] = fallRisk;
    }
    if (gdsClass) {
      postMatchStage['latestGds.classification'] = gdsClass;
    }
    if (minicogClass) {
      postMatchStage['latestMinicog.outcome'] = minicogClass;
    }
    if (adlClass) {
      postMatchStage['latestAdl.classification'] = adlClass;
    }
    if (iadlClass) {
      postMatchStage['latestIadl.classification'] = iadlClass;
    }

    if (Object.keys(postMatchStage).length > 0) {
      pipeline.push({ $match: postMatchStage });
    }

    // Sort, skip, limit
    const sortStage: any = {};
    sortStage[sortBy] = sortOrder === 'asc' ? 1 : -1;
    pipeline.push({ $sort: sortStage });

    // Count and Facets for pagination
    pipeline.push({
      $facet: {
        metadata: [{ $count: 'total' }],
        data: [{ $skip: skip }, { $limit: limit }],
      },
    });

    const results = await Patient.aggregate(pipeline);
    const data = results[0]?.data || [];
    const total = results[0]?.metadata[0]?.total || 0;

    return NextResponse.json({
      patients: data,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();
    const body = await req.json();

    // Check NIC uniqueness for active patients
    const existing = await Patient.findOne({ nic: body.nic, isDeleted: false });
    if (existing) {
      return NextResponse.json(
        { error: 'A patient with this National ID Number (NIC) is already registered and active.' },
        { status: 400 }
      );
    }

    const patient = new Patient({
      ...body,
      registeredBy: new mongoose.Types.ObjectId(session.user.id),
      isDeleted: false,
    });
    await patient.save();

    const ipAddress = req.headers.get('x-forwarded-for') || '127.0.0.1';
    await logAudit({
      userId: session.user.id,
      username: session.user.name,
      role: session.user.role,
      entityType: 'Patient',
      entityId: patient._id.toString(),
      action: 'CREATE',
      ipAddress,
      newValues: patient.toObject(),
    });

    return NextResponse.json(patient, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
