import * as XLSX from 'xlsx';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

// Type declarations for jsPDF custom autotable support
declare module 'jspdf' {
  interface jsPDF {
    autoTable: typeof autoTable;
  }
}

export function exportPatientsToExcel(patients: any[], fileName: string = 'patients-export.xlsx') {
  const data = patients.map((p) => ({
    'Full Name': p.fullName,
    'Age': p.age,
    'Date of Birth': p.dob ? new Date(p.dob).toLocaleDateString() : '',
    'Gender': p.gender,
    'NIC': p.nic,
    'Marital Status': p.maritalStatus,
    'Contact Number': p.contactNumber,
    'Camp': p.campInfo?.name || p.campId?.name || 'N/A',
    'Urinary Incontinence': p.urinaryIncontinence ? 'Yes' : 'No',
    'Constipation': p.constipation ? 'Yes' : 'No',
    'Allergies': p.allergies?.map((a: any) => `${a.type}: ${a.description}`).join('; ') || '',
    'Medical Conditions': p.medicalConditions?.join(', ') || '',
    'Vision Problems': p.visionProblems,
    'Hearing Problems': p.hearingProblems,
    'Walk Independently': p.walkIndependently ? 'Yes' : 'No',
    'History of Falls': p.historyOfFalls ? 'Yes' : 'No',
    'Lives Alone': p.livesAlone ? 'Yes' : 'No',
    'Caregiver Name': p.caregiverName || 'N/A',
    'Latest BMI': p.latestCheckup?.bmi || 'N/A',
    'BMI Classification': p.latestCheckup?.bmiClassification || 'N/A',
    'Blood Pressure': p.latestCheckup ? `${p.latestCheckup.bloodPressureSystolic}/${p.latestCheckup.bloodPressureDiastolic}` : 'N/A',
    'Random Blood Sugar (mg/dL)': p.latestCheckup?.randomBloodSugar || 'N/A',
    'Fall Risk Score': p.latestFall?.riskScore !== undefined ? p.latestFall.riskScore : 'N/A',
    'Fall Risk Category': p.latestFall?.riskClassification || 'N/A',
    'GDS Score': p.latestGds?.totalScore !== undefined ? p.latestGds.totalScore : 'N/A',
    'GDS Category': p.latestGds?.classification || 'N/A',
    'Mini-Cog Score': p.latestMinicog?.totalScore !== undefined ? p.latestMinicog.totalScore : 'N/A',
    'Mini-Cog Outcome': p.latestMinicog?.outcome || 'N/A',
    'ADL Score': p.latestAdl?.totalScore !== undefined ? p.latestAdl.totalScore : 'N/A',
    'ADL Classification': p.latestAdl?.classification || 'N/A',
    'IADL Score': p.latestIadl?.totalScore !== undefined ? p.latestIadl.totalScore : 'N/A',
    'IADL Classification': p.latestIadl?.classification || 'N/A',
  }));

  const worksheet = XLSX.utils.json_to_sheet(data);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Patients');
  XLSX.writeFile(workbook, fileName);

  // Send export audit log
  fetch('/api/audit-logs/export', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ format: 'Excel', type: 'Patient Export', count: patients.length }),
  }).catch(console.error);
}

export function generatePatientPDF(data: {
  patient: any;
  checkups: any[];
  fallAssessments: any[];
  gdsAssessments: any[];
  minicogAssessments: any[];
  adlAssessments: any[];
  iadlAssessments: any[];
}) {
  const { patient, checkups, fallAssessments, gdsAssessments, minicogAssessments, adlAssessments, iadlAssessments } = data;
  const doc = new jsPDF();

  // Color Palette
  const primaryColor: [number, number, number] = [13, 148, 136]; // Teal-600
  const darkText: [number, number, number] = [31, 41, 55]; // Gray-800

  // Title
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(22);
  doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.text('Medical Camp for Elderly - 2026', 14, 20);

  doc.setFontSize(14);
  doc.setTextColor(darkText[0], darkText[1], darkText[2]);
  doc.text('Comprehensive Patient Health & Assessment Report', 14, 28);

  // Divider
  doc.setDrawColor(229, 231, 235);
  doc.line(14, 32, 196, 32);

  // Section: Personal Info
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('1. Patient Demographics & Info', 14, 39);

  const personalData = [
    ['Full Name', patient.fullName, 'NIC / National ID', patient.nic],
    ['Age / DOB', `${patient.age} years / ${new Date(patient.dob).toLocaleDateString()}`, 'Gender', patient.gender],
    ['Contact Number', patient.contactNumber, 'Marital Status', patient.maritalStatus],
    ['Camp Center', patient.campId?.center || 'N/A', 'MOH Area / District', `${patient.campId?.mohArea || 'N/A'} / ${patient.campId?.district || 'N/A'}`],
  ];

  autoTable(doc, {
    startY: 42,
    head: [],
    body: personalData,
    theme: 'plain',
    styles: { fontSize: 10, cellPadding: 2 },
    columnStyles: {
      0: { fontStyle: 'bold', cellWidth: 35 },
      1: { cellWidth: 60 },
      2: { fontStyle: 'bold', cellWidth: 35 },
      3: { cellWidth: 60 },
    },
  });

  // Section: Health Issues & Lifestyle
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  const nextY = (doc as any).lastAutoTable.finalY + 10;
  doc.text('2. Health Conditions & Lifestyle Profile', 14, nextY);

  const allergiesStr = patient.allergies?.map((a: any) => `${a.type}: ${a.description}`).join(', ') || 'None';
  const conditionsStr = patient.medicalConditions?.join(', ') || 'None';
  const medicationsStr = patient.medications?.map((m: any) => `${m.name} (${m.dosage} - ${m.frequency})`).join('\n') || 'None';

  const healthData = [
    ['Urinary Incontinence', patient.urinaryIncontinence ? 'Yes' : 'No', 'Constipation', patient.constipation ? 'Yes' : 'No'],
    ['Allergies', allergiesStr, 'Medical Conditions', conditionsStr],
    ['Vision Problems', patient.visionProblems, 'Hearing Problems', patient.hearingProblems],
    ['Smoking History', patient.smokingHistory, 'Alcohol Use', patient.alcoholUse],
    ['Current Medications', medicationsStr, 'Exercise/Dietary', `${patient.exerciseHabits || 'None'} / ${patient.dietaryHabits || 'None'}`],
  ];

  autoTable(doc, {
    startY: nextY + 3,
    head: [],
    body: healthData,
    theme: 'grid',
    styles: { fontSize: 9, cellPadding: 3 },
    columnStyles: {
      0: { fontStyle: 'bold', cellWidth: 40, fillColor: [249, 250, 251] },
      1: { cellWidth: 55 },
      2: { fontStyle: 'bold', cellWidth: 40, fillColor: [249, 250, 251] },
      3: { cellWidth: 55 },
    },
  });

  // Section: Clinical Screening & Geriatric Assessments
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  const nextY2 = (doc as any).lastAutoTable.finalY + 10;
  doc.text('3. Clinical Screenings & Assessments (Latest Results)', 14, nextY2);

  const checkup = checkups[0];
  const fall = fallAssessments[0];
  const gds = gdsAssessments[0];
  const minicog = minicogAssessments[0];
  const adl = adlAssessments[0];
  const iadl = iadlAssessments[0];

  const assessmentData = [
    [
      'Medical Check-up',
      checkup
        ? `BMI: ${checkup.bmi} (${checkup.bmiClassification})\nBP: ${checkup.bloodPressureSystolic}/${checkup.bloodPressureDiastolic} mmHg\nRBS: ${checkup.randomBloodSugar} mg/dL\nHeight: ${checkup.height}m / Weight: ${checkup.weight}kg`
        : 'Not Checked',
    ],
    [
      'Fall Risk (Geriatric)',
      fall ? `Score: ${fall.riskScore}/8\nRisk Level: ${fall.riskClassification}` : 'Not Assessed',
    ],
    [
      'Depression Scale (GDS-15)',
      gds ? `Score: ${gds.totalScore}/15\nClassification: ${gds.classification}` : 'Not Assessed',
    ],
    [
      'Cognitive Screen (Mini-Cog)',
      minicog
        ? `Recall Score: ${minicog.recallScore}/3\nClock Drawing: ${minicog.clockDrawingScore}/2\nTotal Score: ${minicog.totalScore}/5\nOutcome: ${minicog.outcome}`
        : 'Not Assessed',
    ],
    [
      'Basic ADL (Barthel Index)',
      adl ? `Score: ${adl.totalScore}/100\nClassification: ${adl.classification}` : 'Not Assessed',
    ],
    [
      'Instrumental ADL (Lawton)',
      iadl ? `Score: ${iadl.totalScore}/8\nClassification: ${iadl.classification}` : 'Not Assessed',
    ],
  ];

  autoTable(doc, {
    startY: nextY2 + 3,
    head: [['Assessment Type', 'Latest Scoring and Medical Interpretation']],
    body: assessmentData,
    theme: 'striped',
    headStyles: { fillColor: primaryColor, textColor: [255, 255, 255] },
    styles: { fontSize: 9, cellPadding: 3 },
    columnStyles: {
      0: { fontStyle: 'bold', cellWidth: 50 },
      1: { cellWidth: 140 },
    },
  });

  // Footer
  const pageCount = (doc as any).internal.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(156, 163, 175);
    doc.text(`Report generated on: ${new Date().toLocaleString()} | Page ${i} of ${pageCount}`, 14, 287);
    doc.text('CONFIDENTIAL MEDICAL RECORD', 150, 287);
  }

  doc.save(`${patient.fullName.replace(/\s+/g, '_')}_health_report.pdf`);

  // Log audit export
  fetch('/api/audit-logs/export', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ format: 'PDF', type: 'Patient Health Report', patientId: patient._id }),
  }).catch(console.error);
}

export function generateCampSummaryPDF(camp: any, stats: any) {
  const doc = new jsPDF();
  const primaryColor: [number, number, number] = [13, 148, 136];
  const darkText: [number, number, number] = [31, 41, 55];

  // Title
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(22);
  doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.text('Medical Camp for Elderly - 2026', 14, 20);

  doc.setFontSize(14);
  doc.setTextColor(darkText[0], darkText[1], darkText[2]);
  doc.text('Camp Summary Report', 14, 28);

  doc.setDrawColor(229, 231, 235);
  doc.line(14, 32, 196, 32);

  // Camp Info
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('Camp Details', 14, 39);

  const campDetails = [
    ['Camp Name', camp.name, 'Camp Code', camp.code],
    ['Camp Center', camp.center, 'District / MOH Area', `${camp.district} / ${camp.mohArea}`],
    ['Date', new Date(camp.campDate).toLocaleDateString(), 'Status', camp.status],
    ['Organized By', camp.organizedBy, 'Total Registered Patients', stats.totalPatients || 0],
  ];

  autoTable(doc, {
    startY: 42,
    head: [],
    body: campDetails,
    theme: 'plain',
    styles: { fontSize: 10, cellPadding: 2 },
    columnStyles: {
      0: { fontStyle: 'bold', cellWidth: 35 },
      1: { cellWidth: 60 },
      2: { fontStyle: 'bold', cellWidth: 35 },
      3: { cellWidth: 60 },
    },
  });

  // Clinical Summaries
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  const nextY = (doc as any).lastAutoTable.finalY + 10;
  doc.text('Clinical Summaries & Risk Indicators', 14, nextY);

  const summaryData = [
    ['High Fall Risk Cases', `${stats.highFallRisk || 0} patients`],
    ['Possible Depression Cases', `${stats.depressionCases || 0} patients`],
    ['Cognitive Impairment Cases', `${stats.cognitiveImpairment || 0} patients`],
    ['Normal BMI Cases', `${stats.normalBmi || 0} patients`],
    ['Overweight/Obese Cases', `${stats.overweightOrObese || 0} patients`],
  ];

  autoTable(doc, {
    startY: nextY + 3,
    head: [['Clinical Measure / Risk Type', 'Patient Count']],
    body: summaryData,
    theme: 'striped',
    headStyles: { fillColor: primaryColor, textColor: [255, 255, 255] },
    styles: { fontSize: 10, cellPadding: 3 },
  });

  // Footer
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(156, 163, 175);
  doc.text(`Report generated on: ${new Date().toLocaleString()}`, 14, 287);

  doc.save(`${camp.code}_summary_report.pdf`);

  // Log audit export
  fetch('/api/audit-logs/export', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ format: 'PDF', type: 'Camp Summary Report', campId: camp._id }),
  }).catch(console.error);
}
