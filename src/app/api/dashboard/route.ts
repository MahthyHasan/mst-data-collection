import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/authOptions';
import { dbConnect } from '@/lib/db';
import Patient from '@/models/Patient';
import Camp from '@/models/Camp';
import User from '@/models/User';
import MedicalCheckup from '@/models/MedicalCheckup';
import FallAssessment from '@/models/FallAssessment';
import GdsAssessment from '@/models/GdsAssessment';
import MinicogAssessment from '@/models/MinicogAssessment';
import AdlAssessment from '@/models/AdlAssessment';
import IadlAssessment from '@/models/IadlAssessment';
import mongoose from 'mongoose';

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();
    const { searchParams } = new URL(req.url);

    // Apply dashboard filters
    const campId = searchParams.get('campId');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const gender = searchParams.get('gender');
    const ageGroup = searchParams.get('ageGroup');

    // Base query for patients
    const patientQuery: any = { isDeleted: false };

    if (campId) {
      patientQuery.campId = new mongoose.Types.ObjectId(campId);
    }
    if (gender) {
      patientQuery.gender = gender;
    }
    if (startDate || endDate) {
      patientQuery.createdAt = {};
      if (startDate) patientQuery.createdAt.$gte = new Date(startDate);
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        patientQuery.createdAt.$lte = end;
      }
    }
    if (ageGroup) {
      if (ageGroup === '60-69') {
        patientQuery.age = { $gte: 60, $lte: 69 };
      } else if (ageGroup === '70-79') {
        patientQuery.age = { $gte: 70, $lte: 79 };
      } else if (ageGroup === '80+') {
        patientQuery.age = { $gte: 80 };
      }
    }

    // Get matching patients IDs for filtering checkups & assessments
    const matchedPatients = await Patient.find(patientQuery).select('_id age gender maritalStatus fullName campId registeredBy createdAt');
    const patientIds = matchedPatients.map((p) => p._id);

    // Basic Stats Queries
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const totalPatientsCount = matchedPatients.length;

    const todayRegsCount = matchedPatients.filter((p) => {
      const regDate = new Date(p.createdAt);
      return regDate >= today;
    }).length;

    // Camps and Employees counts are system-wide, but we can query them
    const totalCampsCount = await Camp.countDocuments({ isDeleted: false });
    const activeEmployeesCount = await User.countDocuments({ role: 'employee', isEnabled: true, isDeleted: false });

    // Assessment query filters (matching matched patient IDs)
    const assessmentQuery = { patientId: { $in: patientIds } };

    // Fetch latest checkups/assessments per patient in JS memory or simple queries
    const fallHighRiskCount = await FallAssessment.countDocuments({
      ...assessmentQuery,
      riskClassification: 'High Risk',
    });

    const depressionCasesCount = await GdsAssessment.countDocuments({
      ...assessmentQuery,
      classification: { $in: ['Moderate Depression', 'Severe Depression'] },
    });

    const cognitiveImpairmentCount = await MinicogAssessment.countDocuments({
      ...assessmentQuery,
      outcome: 'Possible Cognitive Impairment',
    });

    // 1. Demographics Distributions
    const genderDist: Record<string, number> = { Male: 0, Female: 0, Other: 0 };
    const ageDist: Record<string, number> = { '60-69': 0, '70-79': 0, '80+': 0, Under60: 0 };
    const maritalDist: Record<string, number> = {};

    matchedPatients.forEach((p) => {
      // Gender
      if (genderDist[p.gender] !== undefined) genderDist[p.gender]++;
      else genderDist.Other++;

      // Age
      if (p.age < 60) ageDist.Under60++;
      else if (p.age <= 69) ageDist['60-69']++;
      else if (p.age <= 79) ageDist['70-79']++;
      else ageDist['80+']++;

      // Marital
      maritalDist[p.maritalStatus] = (maritalDist[p.maritalStatus] || 0) + 1;
    });

    // 2. Clinical Stats
    // Diabetes / Hypertension prevalence (from Patient history)
    let diabetesCount = 0;
    let hypertensionCount = 0;
    let asthmaCount = 0;
    let heartCount = 0;

    // Let's retrieve all matching patient records' health conditions
    const fullMatchedPatients = await Patient.find(patientQuery).select('medicalConditions');
    fullMatchedPatients.forEach((p) => {
      if (p.medicalConditions.includes('Diabetes')) diabetesCount++;
      if (p.medicalConditions.includes('Hypertension')) hypertensionCount++;
      if (p.medicalConditions.includes('Asthma')) asthmaCount++;
      if (p.medicalConditions.includes('Heart Disease')) heartCount++;
    });

    // BMI categories (Latest checkup per patient)
    const bmiCounts = { Underweight: 0, Normal: 0, Overweight: 0, Obese: 0 };
    const checkups = await MedicalCheckup.find(assessmentQuery).select('bmiClassification');
    checkups.forEach((c) => {
      if (bmiCounts[c.bmiClassification] !== undefined) {
        bmiCounts[c.bmiClassification]++;
      }
    });

    // Vision / Hearing problems count
    let cataractCount = 0;
    let glaucomaCount = 0;
    let blurredVisionCount = 0;

    let hearingMildCount = 0;
    let hearingModCount = 0;
    let hearingSevCount = 0;
    let hearingAidCount = 0;

    const patientSenses = await Patient.find(patientQuery).select('visionProblems hearingProblems');
    patientSenses.forEach((p) => {
      if (p.visionProblems === 'Cataract') cataractCount++;
      if (p.visionProblems === 'Glaucoma') glaucomaCount++;
      if (p.visionProblems === 'Blurred Vision') blurredVisionCount++;

      if (p.hearingProblems === 'Mild') hearingMildCount++;
      if (p.hearingProblems === 'Moderate') hearingModCount++;
      if (p.hearingProblems === 'Severe') hearingSevCount++;
      if (p.hearingProblems === 'Hearing Aid User') hearingAidCount++;
    });

    // 3. Risk Assessments
    const fallCounts = { 'Low Risk': 0, 'Moderate Risk': 0, 'High Risk': 0 };
    const falls = await FallAssessment.find(assessmentQuery).select('riskClassification');
    falls.forEach((f) => {
      if (fallCounts[f.riskClassification] !== undefined) {
        fallCounts[f.riskClassification]++;
      }
    });

    const gdsCounts = { Normal: 0, 'Mild Depression': 0, 'Moderate Depression': 0, 'Severe Depression': 0 };
    const gdss = await GdsAssessment.find(assessmentQuery).select('classification');
    gdss.forEach((g) => {
      if (gdsCounts[g.classification] !== undefined) {
        gdsCounts[g.classification]++;
      }
    });

    const minicogCounts = { 'Normal Screening': 0, 'Possible Cognitive Impairment': 0 };
    const minicogs = await MinicogAssessment.find(assessmentQuery).select('outcome');
    minicogs.forEach((m) => {
      if (minicogCounts[m.outcome] !== undefined) {
        minicogCounts[m.outcome]++;
      }
    });

    const adlCounts = { 'Total Dependence': 0, 'Severe Dependence': 0, 'Moderate Dependence': 0, 'Slight Dependence': 0, Independent: 0 };
    const adls = await AdlAssessment.find(assessmentQuery).select('classification');
    adls.forEach((a) => {
      if (adlCounts[a.classification] !== undefined) {
        adlCounts[a.classification]++;
      }
    });

    const iadlCounts = { 'Functional Impairment': 0, Independent: 0 };
    const iadls = await IadlAssessment.find(assessmentQuery).select('classification');
    iadls.forEach((i) => {
      if (iadlCounts[i.classification] !== undefined) {
        iadlCounts[i.classification]++;
      }
    });

    // 4. Operational Charts
    // Registrations by camp
    const camps = await Camp.find({ isDeleted: false }).select('_id name');
    const campRegsMap: Record<string, { name: string, count: number }> = {};
    camps.forEach((c) => {
      campRegsMap[c._id.toString()] = { name: c.name, count: 0 };
    });

    matchedPatients.forEach((p) => {
      const cid = p.campId.toString();
      if (campRegsMap[cid]) {
        campRegsMap[cid].count++;
      }
    });

    const registrationsByCamp = Object.values(campRegsMap).filter((item) => item.count > 0);

    // Registrations over time (last 7 days / monthly groups)
    // Group registrations by date
    const regsOverTimeMap: Record<string, number> = {};
    matchedPatients.forEach((p) => {
      const dateStr = new Date(p.createdAt).toISOString().split('T')[0];
      regsOverTimeMap[dateStr] = (regsOverTimeMap[dateStr] || 0) + 1;
    });

    const registrationsOverTime = Object.entries(regsOverTimeMap)
      .map(([date, count]) => ({ date, count }))
      .sort((a, b) => a.date.localeCompare(b.date))
      .slice(-15); // limit to last 15 days of registrations

    // Employee activity (Registrations by staff)
    const staff = await User.find({ isDeleted: false }).select('_id username');
    const staffMap: Record<string, { username: string, count: number }> = {};
    staff.forEach((s) => {
      staffMap[s._id.toString()] = { username: s.username, count: 0 };
    });

    matchedPatients.forEach((p) => {
      const uid = p.registeredBy?.toString();
      if (uid && staffMap[uid]) {
        staffMap[uid].count++;
      }
    });

    const employeeActivity = Object.values(staffMap).filter((item) => item.count > 0);

    // 5. Section breakdown by stationLabel
    const sectionBreakdownMap: Record<string, {
      stationLabel: string;
      patientsAssessed: number;
      assessments: Record<string, number>;
      totalAssessments: number;
      completionRate: number;
    }> = {};

    const patientsPerStation: Record<string, Set<string>> = {};

    const ensureSection = (label: string) => {
      if (!sectionBreakdownMap[label]) {
        sectionBreakdownMap[label] = {
          stationLabel: label,
          patientsAssessed: 0,
          assessments: { checkup: 0, fall: 0, gds: 0, minicog: 0, adl: 0, iadl: 0 },
          totalAssessments: 0,
          completionRate: 0,
        };
        patientsPerStation[label] = new Set();
      }
      return sectionBreakdownMap[label];
    };

    const assessmentCollections = [
      { find: () => MedicalCheckup.find(assessmentQuery).select('stationLabel patientId'), key: 'checkup' },
      { find: () => FallAssessment.find(assessmentQuery).select('stationLabel patientId'), key: 'fall' },
      { find: () => GdsAssessment.find(assessmentQuery).select('stationLabel patientId'), key: 'gds' },
      { find: () => MinicogAssessment.find(assessmentQuery).select('stationLabel patientId'), key: 'minicog' },
      { find: () => AdlAssessment.find(assessmentQuery).select('stationLabel patientId'), key: 'adl' },
      { find: () => IadlAssessment.find(assessmentQuery).select('stationLabel patientId'), key: 'iadl' },
    ];

    for (const { find, key } of assessmentCollections) {
      const records = await find();
      records.forEach((record: { stationLabel?: string; patientId: { toString: () => string } }) => {
        const label = record.stationLabel || 'Unassigned';
        const section = ensureSection(label);
        section.assessments[key]++;
        section.totalAssessments++;
        patientsPerStation[label].add(record.patientId.toString());
      });
    }

    const sectionBreakdown = Object.values(sectionBreakdownMap).map((section) => {
      const patientCount = patientsPerStation[section.stationLabel]?.size || 0;
      return {
        ...section,
        patientsAssessed: patientCount,
        registrations: patientCount,
        completionRate: totalPatientsCount > 0
          ? Math.round((patientCount / totalPatientsCount) * 100)
          : 0,
      };
    });

    return NextResponse.json({
      summary: {
        totalPatients: totalPatientsCount,
        todayRegistrations: todayRegsCount,
        totalCamps: totalCampsCount,
        activeEmployees: activeEmployeesCount,
        highFallRiskPatients: fallHighRiskCount,
        possibleDepressionCases: depressionCasesCount,
        cognitiveImpairmentCases: cognitiveImpairmentCount,
      },
      demographics: {
        gender: Object.entries(genderDist).map(([name, value]) => ({ name, value })),
        age: Object.entries(ageDist).map(([name, value]) => ({ name, value })),
        maritalStatus: Object.entries(maritalDist).map(([name, value]) => ({ name, value })),
      },
      clinical: {
        prevalence: [
          { name: 'Diabetes', value: diabetesCount },
          { name: 'Hypertension', value: hypertensionCount },
          { name: 'Asthma', value: asthmaCount },
          { name: 'Heart Disease', value: heartCount },
        ],
        bmi: Object.entries(bmiCounts).map(([name, value]) => ({ name, value })),
        vision: [
          { name: 'Cataract', value: cataractCount },
          { name: 'Glaucoma', value: glaucomaCount },
          { name: 'Blurred Vision', value: blurredVisionCount },
        ],
        hearing: [
          { name: 'Mild Loss', value: hearingMildCount },
          { name: 'Moderate Loss', value: hearingModCount },
          { name: 'Severe Loss', value: hearingSevCount },
          { name: 'Hearing Aid User', value: hearingAidCount },
        ],
      },
      risk: {
        fallRisk: Object.entries(fallCounts).map(([name, value]) => ({ name, value })),
        gds: Object.entries(gdsCounts).map(([name, value]) => ({ name, value })),
        minicog: Object.entries(minicogCounts).map(([name, value]) => ({ name, value })),
        adl: Object.entries(adlCounts).map(([name, value]) => ({ name, value })),
        iadl: Object.entries(iadlCounts).map(([name, value]) => ({ name, value })),
      },
      operational: {
        registrationsByCamp,
        registrationsOverTime,
        employeeActivity,
      },
      sectionBreakdown,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
