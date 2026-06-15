import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/authOptions';
import { dbConnect } from '@/lib/db';
import Patient from '@/models/Patient';

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const nic = searchParams.get('nic')?.trim().toUpperCase();

    if (!nic) {
      return NextResponse.json({ error: 'NIC is required' }, { status: 400 });
    }

    await dbConnect();
    const patient = await Patient.findOne({ nic, isDeleted: false }).select('_id fullName nic');

    if (!patient) {
      return NextResponse.json({ error: 'No patient found with this NIC' }, { status: 404 });
    }

    return NextResponse.json({
      id: patient._id.toString(),
      fullName: patient.fullName,
      nic: patient.nic,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
