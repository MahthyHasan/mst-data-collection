'use client';

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import DashboardLayout from '@/components/DashboardLayout';
import { useParams, useRouter } from 'next/navigation';
import {
  User,
  Phone,
  Heart,
  Activity,
  FileText,
  ShieldAlert,
  Brain,
  Frown,
  ActivityIcon,
  Plus,
  Loader2,
  Download,
  ClipboardList,
  ChevronRight,
  Calendar,
  Layers,
  MapPin,
  Sparkles,
  ArrowLeft,
  X,
  AlertCircle,
} from 'lucide-react';
import { toast } from 'sonner';
import { generatePatientPDF } from '@/utils/reports';

export default function PatientDetailPage() {
  const params = useParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const patientId = params.id as string;

  // Modals state
  const [activeModal, setActiveModal] = useState<
    'checkup' | 'fall' | 'gds' | 'minicog' | 'adl' | 'iadl' | null
  >(null);

  // Fetch patient details and assessment history
  const { data, isLoading, isError } = useQuery({
    queryKey: ['patient', patientId],
    queryFn: async () => {
      const res = await fetch(`/api/patients/${patientId}`);
      if (!res.ok) throw new Error('Failed to load patient profile');
      return res.json();
    },
  });

  // Checkup state
  const [height, setHeight] = useState('');
  const [weight, setWeight] = useState('');
  const [waist, setWaist] = useState('');
  const [bpSystolic, setBpSystolic] = useState('');
  const [bpDiastolic, setBpDiastolic] = useState('');
  const [rbs, setRbs] = useState('');
  const [visionNotes, setVisionNotes] = useState('');
  const [hearingNotes, setHearingNotes] = useState('');

  // Fall Risk state
  const [fallAge, setFallAge] = useState(false);
  const [fallHistory, setFallHistory] = useState(false);
  const [fallMedsCount, setFallMedsCount] = useState(false);
  const [fallPsychoactive, setFallPsychoactive] = useState(false);
  const [fallGait, setFallGait] = useState(false);
  const [fallDevice, setFallDevice] = useState(false);
  const [fallBalance, setFallBalance] = useState(false);
  const [fallVision, setFallVision] = useState(false);

  // GDS state (15 questions: true = yes, false = no)
  const [gdsAnswers, setGdsAnswers] = useState<boolean[]>(new Array(15).fill(false));

  const gdsQuestions = [
    'Are you basically satisfied with your life?', // No = 1 point
    'Have you dropped many of your activities and interests?', // Yes = 1 point
    'Do you feel that your life is empty?', // Yes = 1 point
    'Do you often get bored?', // Yes = 1 point
    'Are you in good spirits most of the time?', // No = 1 point
    'Are you afraid that something bad is going to happen to you?', // Yes = 1 point
    'Do you feel happy most of the time?', // No = 1 point
    'Do you often feel helpless?', // Yes = 1 point
    'Do you prefer to stay at home, rather than going out and doing new things?', // Yes = 1 point
    'Do you feel you have more problems with memory than most?', // Yes = 1 point
    'Do you think it is wonderful to be alive now?', // No = 1 point
    'Do you feel pretty worthless the way you are now?', // Yes = 1 point
    'Do you feel full of energy?', // No = 1 point
    'Do you feel that your situation is hopeless?', // Yes = 1 point
    'Do you think that most people are better off than you are?', // Yes = 1 point
  ];

  // Mini-Cog state
  const [recallScore, setRecallScore] = useState('');
  const [clockDrawingScore, setClockDrawingScore] = useState('');

  // ADL State (Barthel Index)
  const [adlFeeding, setAdlFeeding] = useState('10');
  const [adlBathing, setAdlBathing] = useState('5');
  const [adlGrooming, setAdlGrooming] = useState('5');
  const [adlDressing, setAdlDressing] = useState('10');
  const [adlBowel, setAdlBowel] = useState('10');
  const [adlBladder, setAdlBladder] = useState('10');
  const [adlToilet, setAdlToilet] = useState('10');
  const [adlTransfers, setAdlTransfers] = useState('15');
  const [adlMobility, setAdlMobility] = useState('15');
  const [adlStairs, setAdlStairs] = useState('10');

  // IADL State (Lawton Index)
  const [iadlPhone, setIadlPhone] = useState('1');
  const [iadlShopping, setIadlShopping] = useState('1');
  const [iadlFoodPrep, setIadlFoodPrep] = useState('1');
  const [iadlHousekeeping, setIadlHousekeeping] = useState('1');
  const [iadlLaundry, setIadlLaundry] = useState('1');
  const [iadlTransport, setIadlTransport] = useState('1');
  const [iadlMedications, setIadlMedications] = useState('1');
  const [iadlFinances, setIadlFinances] = useState('1');

  // Mutation helpers
  const assessmentMutation = useMutation({
    mutationFn: async ({ endpoint, payload }: { endpoint: string; payload: any }) => {
      const res = await fetch(`/api/assessments/${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          patientId,
          campId: data.patient.campId?._id || data.patient.campId,
          ...payload,
        }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to submit assessment');
      }
      return res.json();
    },
    onSuccess: () => {
      toast.success('Geriatric assessment logged successfully.');
      queryClient.invalidateQueries({ queryKey: ['patient', patientId] });
      setActiveModal(null);
      resetModalFields();
    },
    onError: (err: any) => {
      toast.error(err.message);
    },
  });

  const resetModalFields = () => {
    setHeight('');
    setWeight('');
    setWaist('');
    setBpSystolic('');
    setBpDiastolic('');
    setRbs('');
    setVisionNotes('');
    setHearingNotes('');
    setFallAge(false);
    setFallHistory(false);
    setFallMedsCount(false);
    setFallPsychoactive(false);
    setFallGait(false);
    setFallDevice(false);
    setFallBalance(false);
    setFallVision(false);
    setGdsAnswers(new Array(15).fill(false));
    setRecallScore('');
    setClockDrawingScore('');
  };

  const handleAssessmentSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    let endpoint = '';
    let payload: any = {};

    if (activeModal === 'checkup') {
      endpoint = 'checkup';
      payload = {
        height,
        weight,
        waistCircumference: waist,
        bloodPressureSystolic: bpSystolic,
        bloodPressureDiastolic: bpDiastolic,
        randomBloodSugar: rbs,
        visionAssessmentNotes: visionNotes,
        hearingAssessmentNotes: hearingNotes,
      };
    } else if (activeModal === 'fall') {
      endpoint = 'fall';
      payload = {
        age65OrOlder: fallAge,
        fallHistory6Months: fallHistory,
        takingFourOrMoreMedications: fallMedsCount,
        psychoactiveMedications: fallPsychoactive,
        abnormalGait: fallGait,
        usesAssistiveDevice: fallDevice,
        impairedBalance: fallBalance,
        visionImpairment: fallVision,
      };
    } else if (activeModal === 'gds') {
      endpoint = 'gds';
      payload = { responses: gdsAnswers };
    } else if (activeModal === 'minicog') {
      endpoint = 'minicog';
      payload = {
        recallScore,
        clockDrawingScore,
      };
    } else if (activeModal === 'adl') {
      endpoint = 'adl';
      payload = {
        feeding: adlFeeding,
        bathing: adlBathing,
        grooming: adlGrooming,
        dressing: adlDressing,
        bowelBladder: adlBowel,
        toiletUse: adlToilet,
        transfers: adlTransfers,
        mobility: adlMobility,
        stairsMobility: adlStairs,
      };
    } else if (activeModal === 'iadl') {
      endpoint = 'iadl';
      payload = {
        phone: iadlPhone,
        shopping: iadlShopping,
        foodPrep: iadlFoodPrep,
        housekeeping: iadlHousekeeping,
        laundry: iadlLaundry,
        transport: iadlTransport,
        medications: iadlMedications,
        finances: iadlFinances,
      };
    }

    assessmentMutation.mutate({ endpoint, payload });
  };

  const handleToggleGdsAnswer = (idx: number) => {
    const updated = [...gdsAnswers];
    updated[idx] = !updated[idx];
    setGdsAnswers(updated);
  };

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex h-64 items-center justify-center">
          <Loader2 className="h-8 w-8 text-teal-600 animate-spin" />
        </div>
      </DashboardLayout>
    );
  }

  if (isError || !data || !data.patient) {
    return (
      <DashboardLayout>
        <div className="text-center py-12 space-y-4">
          <AlertCircle className="h-10 w-10 text-red-500 mx-auto" />
          <h2 className="text-lg font-bold text-slate-800 dark:text-white">Failed to load Patient Profile</h2>
          <button
            onClick={() => router.push('/patients')}
            className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-sm"
          >
            Back to directory
          </button>
        </div>
      </DashboardLayout>
    );
  }

  const { patient, checkups, fallAssessments, gdsAssessments, minicogAssessments, adlAssessments, iadlAssessments } = data;

  return (
    <DashboardLayout>
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4">
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.push('/patients')}
            className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400 rounded-xl"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div>
            <h1 className="text-3xl font-extrabold text-slate-800 dark:text-white tracking-tight flex items-center gap-2">
              {patient.fullName}
              <span className="text-sm font-semibold px-2.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500">
                {patient.gender} • {patient.age} yrs
              </span>
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Assigned center: {patient.campId?.center || 'N/A'} • NIC: {patient.nic}
            </p>
          </div>
        </div>
        <button
          onClick={() => generatePatientPDF(data)}
          className="flex items-center gap-2 bg-white hover:bg-slate-50 dark:bg-slate-900 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 shadow-sm cursor-pointer"
        >
          <Download className="h-4.5 w-4.5" />
          Generate Health PDF
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Demographics Profile */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm space-y-6">
            <h2 className="text-base font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
              <User className="h-4.5 w-4.5 text-teal-600" />
              Patient Information
            </h2>

            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-slate-400">Date of Birth</span>
                <span className="font-semibold text-slate-800 dark:text-slate-200">
                  {new Date(patient.dob).toLocaleDateString()}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Marital Status</span>
                <span className="font-semibold text-slate-800 dark:text-slate-200">
                  {patient.maritalStatus}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Phone Number</span>
                <span className="font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-1">
                  <Phone className="h-3.5 w-3.5 text-slate-450" />
                  {patient.contactNumber}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Walk Independently</span>
                <span className={`font-semibold ${patient.walkIndependently ? 'text-emerald-600' : 'text-amber-600'}`}>
                  {patient.walkIndependently ? 'Yes' : 'Needs Assist'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">History of Falls</span>
                <span className={`font-semibold ${patient.historyOfFalls ? 'text-red-500' : 'text-slate-500'}`}>
                  {patient.historyOfFalls ? 'Yes, in 6 Months' : 'No'}
                </span>
              </div>
            </div>

            <div className="border-t border-slate-150 dark:border-slate-850 pt-4 space-y-4">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                Lifestyle Habits
              </h3>
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="bg-slate-50 dark:bg-slate-850 p-2.5 rounded-xl">
                  <span className="text-slate-400 block mb-0.5">Smoking</span>
                  <strong className="text-slate-700 dark:text-slate-350">{patient.smokingHistory}</strong>
                </div>
                <div className="bg-slate-50 dark:bg-slate-850 p-2.5 rounded-xl">
                  <span className="text-slate-400 block mb-0.5">Alcohol</span>
                  <strong className="text-slate-700 dark:text-slate-350">{patient.alcoholUse}</strong>
                </div>
                <div className="bg-slate-50 dark:bg-slate-850 p-2.5 rounded-xl">
                  <span className="text-slate-400 block mb-0.5">Exercise</span>
                  <strong className="text-slate-700 dark:text-slate-350">{patient.exerciseHabits}</strong>
                </div>
                <div className="bg-slate-50 dark:bg-slate-850 p-2.5 rounded-xl">
                  <span className="text-slate-400 block mb-0.5">Diet</span>
                  <strong className="text-slate-700 dark:text-slate-350">{patient.dietaryHabits}</strong>
                </div>
              </div>
            </div>

            <div className="border-t border-slate-150 dark:border-slate-850 pt-4 space-y-4">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                Social support
              </h3>
              {patient.livesAlone ? (
                <div className="bg-amber-50 dark:bg-amber-950/20 text-amber-700 dark:text-amber-400 border border-amber-200/50 dark:border-amber-900/40 p-3 rounded-2xl text-xs font-semibold">
                  Patient lives alone (High social vulnerability).
                </div>
              ) : (
                <div className="bg-slate-50 dark:bg-slate-850 p-3.5 border border-slate-100 dark:border-slate-800 rounded-2xl text-xs space-y-1">
                  <p className="text-slate-500">Caregiver Name</p>
                  <p className="font-bold text-slate-800 dark:text-white mb-2">{patient.caregiverName} ({patient.caregiverRelation})</p>
                  <p className="text-slate-500">Caregiver Phone</p>
                  <p className="font-bold text-slate-850 dark:text-slate-300">{patient.caregiverContact}</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Assessment Timelines */}
        <div className="lg:col-span-2 space-y-6">
          {/* Assessment Triggers Dashboard */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm space-y-4">
            <h2 className="text-base font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
              <ClipboardList className="h-4.5 w-4.5 text-teal-600" />
              Perform Geriatric Assessments
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              <button
                onClick={() => setActiveModal('checkup')}
                className="flex flex-col items-start gap-2 bg-slate-50/50 hover:bg-teal-50 dark:bg-slate-850 dark:hover:bg-teal-950/20 p-4 border border-slate-200 dark:border-slate-800 rounded-2xl text-left transition-all duration-200 cursor-pointer"
              >
                <ActivityIcon className="h-5 w-5 text-teal-600" />
                <span className="font-bold text-xs text-slate-800 dark:text-white">Medical Check-up</span>
              </button>
              <button
                onClick={() => setActiveModal('fall')}
                className="flex flex-col items-start gap-2 bg-slate-50/50 hover:bg-teal-50 dark:bg-slate-850 dark:hover:bg-teal-950/20 p-4 border border-slate-200 dark:border-slate-800 rounded-2xl text-left transition-all duration-200 cursor-pointer"
              >
                <ShieldAlert className="h-5 w-5 text-rose-600" />
                <span className="font-bold text-xs text-slate-800 dark:text-white">Fall Risk Scale</span>
              </button>
              <button
                onClick={() => setActiveModal('gds')}
                className="flex flex-col items-start gap-2 bg-slate-50/50 hover:bg-teal-50 dark:bg-slate-850 dark:hover:bg-teal-950/20 p-4 border border-slate-200 dark:border-slate-800 rounded-2xl text-left transition-all duration-200 cursor-pointer"
              >
                <Frown className="h-5 w-5 text-amber-600" />
                <span className="font-bold text-xs text-slate-800 dark:text-white">GDS-15 Depression</span>
              </button>
              <button
                onClick={() => setActiveModal('minicog')}
                className="flex flex-col items-start gap-2 bg-slate-50/50 hover:bg-teal-50 dark:bg-slate-850 dark:hover:bg-teal-950/20 p-4 border border-slate-200 dark:border-slate-800 rounded-2xl text-left transition-all duration-200 cursor-pointer"
              >
                <Brain className="h-5 w-5 text-purple-600" />
                <span className="font-bold text-xs text-slate-800 dark:text-white">Mini-Cog Screen</span>
              </button>
              <button
                onClick={() => setActiveModal('adl')}
                className="flex flex-col items-start gap-2 bg-slate-50/50 hover:bg-teal-50 dark:bg-slate-850 dark:hover:bg-teal-950/20 p-4 border border-slate-200 dark:border-slate-800 rounded-2xl text-left transition-all duration-200 cursor-pointer"
              >
                <ClipboardList className="h-5 w-5 text-sky-600" />
                <span className="font-bold text-xs text-slate-800 dark:text-white">Barthel ADL Index</span>
              </button>
              <button
                onClick={() => setActiveModal('iadl')}
                className="flex flex-col items-start gap-2 bg-slate-50/50 hover:bg-teal-50 dark:bg-slate-850 dark:hover:bg-teal-950/20 p-4 border border-slate-200 dark:border-slate-800 rounded-2xl text-left transition-all duration-200 cursor-pointer"
              >
                <Layers className="h-5 w-5 text-indigo-600" />
                <span className="font-bold text-xs text-slate-800 dark:text-white">Lawton IADL Scale</span>
              </button>
            </div>
          </div>

          {/* Assessment Histories */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm space-y-6">
            <h2 className="text-base font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
              <ClipboardList className="h-4.5 w-4.5 text-teal-600" />
              Clinical History & Scoring Timeline
            </h2>

            {/* Checkups */}
            <div className="space-y-3">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Checkups</h3>
              {checkups.length === 0 ? (
                <p className="text-xs text-slate-400 italic">No checkups logged.</p>
              ) : (
                <div className="space-y-2">
                  {checkups.map((c: any) => (
                    <div key={c._id} className="bg-slate-50 dark:bg-slate-850 border border-slate-150 dark:border-slate-800 p-4 rounded-2xl flex justify-between items-center text-xs">
                      <div>
                        <p className="font-bold text-slate-800 dark:text-white">
                          BMI: {c.bmi} ({c.bmiClassification})
                        </p>
                        <p className="text-slate-500">
                          BP: {c.bloodPressureSystolic}/{c.bloodPressureDiastolic} mmHg • RBS: {c.randomBloodSugar} mg/dL
                        </p>
                      </div>
                      <span className="text-slate-400">{new Date(c.createdAt).toLocaleDateString()}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Fall Risk Assessments */}
            <div className="space-y-3">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Fall Risk</h3>
              {fallAssessments.length === 0 ? (
                <p className="text-xs text-slate-400 italic">No fall risk screenings logged.</p>
              ) : (
                <div className="space-y-2">
                  {fallAssessments.map((f: any) => (
                    <div key={f._id} className="bg-slate-50 dark:bg-slate-850 border border-slate-150 dark:border-slate-800 p-4 rounded-2xl flex justify-between items-center text-xs">
                      <div>
                        <p className="font-bold text-slate-800 dark:text-white">
                          Risk Level: {f.riskClassification} (Score: {f.riskScore}/8)
                        </p>
                      </div>
                      <span className="text-slate-400">{new Date(f.createdAt).toLocaleDateString()}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* GDS-15 Assessments */}
            <div className="space-y-3">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">GDS-15 Depression Scale</h3>
              {gdsAssessments.length === 0 ? (
                <p className="text-xs text-slate-400 italic">No GDS screenings logged.</p>
              ) : (
                <div className="space-y-2">
                  {gdsAssessments.map((g: any) => (
                    <div key={g._id} className="bg-slate-50 dark:bg-slate-850 border border-slate-150 dark:border-slate-800 p-4 rounded-2xl flex justify-between items-center text-xs">
                      <div>
                        <p className="font-bold text-slate-800 dark:text-white">
                          Classification: {g.classification} (Score: {g.totalScore}/15)
                        </p>
                      </div>
                      <span className="text-slate-400">{new Date(g.createdAt).toLocaleDateString()}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Mini-Cog Assessments */}
            <div className="space-y-3">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Mini-Cog Mental Screen</h3>
              {minicogAssessments.length === 0 ? (
                <p className="text-xs text-slate-400 italic">No Mini-Cog screenings logged.</p>
              ) : (
                <div className="space-y-2">
                  {minicogAssessments.map((m: any) => (
                    <div key={m._id} className="bg-slate-50 dark:bg-slate-850 border border-slate-150 dark:border-slate-800 p-4 rounded-2xl flex justify-between items-center text-xs">
                      <div>
                        <p className="font-bold text-slate-800 dark:text-white">
                          Outcome: {m.outcome} (Score: {m.totalScore}/5)
                        </p>
                        <p className="text-slate-500">
                          Recall: {m.recallScore}/3 • Clock: {m.clockDrawingScore}/2
                        </p>
                      </div>
                      <span className="text-slate-400">{new Date(m.createdAt).toLocaleDateString()}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* ADL Assessments */}
            <div className="space-y-3">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Barthel ADL Index</h3>
              {adlAssessments.length === 0 ? (
                <p className="text-xs text-slate-400 italic">No ADL assessments logged.</p>
              ) : (
                <div className="space-y-2">
                  {adlAssessments.map((a: any) => (
                    <div key={a._id} className="bg-slate-50 dark:bg-slate-850 border border-slate-150 dark:border-slate-800 p-4 rounded-2xl flex justify-between items-center text-xs">
                      <div>
                        <p className="font-bold text-slate-800 dark:text-white">
                          Status: {a.classification} (Score: {a.totalScore}/100)
                        </p>
                      </div>
                      <span className="text-slate-400">{new Date(a.createdAt).toLocaleDateString()}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* IADL Assessments */}
            <div className="space-y-3">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Lawton IADL Index</h3>
              {iadlAssessments.length === 0 ? (
                <p className="text-xs text-slate-400 italic">No IADL assessments logged.</p>
              ) : (
                <div className="space-y-2">
                  {iadlAssessments.map((i: any) => (
                    <div key={i._id} className="bg-slate-50 dark:bg-slate-850 border border-slate-150 dark:border-slate-800 p-4 rounded-2xl flex justify-between items-center text-xs">
                      <div>
                        <p className="font-bold text-slate-800 dark:text-white">
                          Status: {i.classification} (Score: {i.totalScore}/8)
                        </p>
                      </div>
                      <span className="text-slate-400">{new Date(i.createdAt).toLocaleDateString()}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Assessment Forms Modals */}
      {activeModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-lg shadow-2xl animate-in zoom-in-95 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800">
              <h2 className="text-lg font-bold text-slate-800 dark:text-white capitalize">
                New {activeModal === 'checkup' ? 'Medical Check-up' : activeModal === 'fall' ? 'Fall Risk Evaluation' : activeModal === 'gds' ? 'GDS-15 Depression Scale' : activeModal === 'minicog' ? 'Mini-Cog Cognitive Screen' : activeModal === 'adl' ? 'Barthel ADL Assessment' : 'Lawton IADL Assessment'}
              </h2>
              <button
                onClick={() => {
                  setActiveModal(null);
                  resetModalFields();
                }}
                className="p-1 rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleAssessmentSubmit} className="p-6 space-y-4">
              {activeModal === 'checkup' && (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">
                        Height (meters) *
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        required
                        value={height}
                        onChange={(e) => setHeight(e.target.value)}
                        placeholder="e.g. 1.65"
                        className="block w-full px-3 py-2 bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/20"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">
                        Weight (kg) *
                      </label>
                      <input
                        type="number"
                        step="0.1"
                        required
                        value={weight}
                        onChange={(e) => setWeight(e.target.value)}
                        placeholder="e.g. 62.5"
                        className="block w-full px-3 py-2 bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/20"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">
                        Waist Circumference (cm)
                      </label>
                      <input
                        type="number"
                        value={waist}
                        onChange={(e) => setWaist(e.target.value)}
                        placeholder="e.g. 88"
                        className="block w-full px-3 py-2 bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/20"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">
                        Random Blood Sugar (mg/dL)
                      </label>
                      <input
                        type="number"
                        value={rbs}
                        onChange={(e) => setRbs(e.target.value)}
                        placeholder="e.g. 110"
                        className="block w-full px-3 py-2 bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/20"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">
                        BP Systolic (mmHg)
                      </label>
                      <input
                        type="number"
                        value={bpSystolic}
                        onChange={(e) => setBpSystolic(e.target.value)}
                        placeholder="e.g. 120"
                        className="block w-full px-3 py-2 bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/20"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">
                        BP Diastolic (mmHg)
                      </label>
                      <input
                        type="number"
                        value={bpDiastolic}
                        onChange={(e) => setBpDiastolic(e.target.value)}
                        placeholder="e.g. 80"
                        className="block w-full px-3 py-2 bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/20"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">
                      Vision Assessment Notes
                    </label>
                    <textarea
                      rows={2}
                      value={visionNotes}
                      onChange={(e) => setVisionNotes(e.target.value)}
                      placeholder="e.g. Complains of blurry vision in left eye..."
                      className="block w-full px-3 py-2 bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/20"
                    ></textarea>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">
                      Hearing Assessment Notes
                    </label>
                    <textarea
                      rows={2}
                      value={hearingNotes}
                      onChange={(e) => setHearingNotes(e.target.value)}
                      placeholder="e.g. Needs louder speaking tones..."
                      className="block w-full px-3 py-2 bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/20"
                    ></textarea>
                  </div>
                </div>
              )}

              {activeModal === 'fall' && (
                <div className="space-y-3">
                  <span className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                    Check all risk factors that apply to the patient:
                  </span>
                  <label className="flex items-center gap-3 bg-slate-50 dark:bg-slate-850 p-3.5 border border-slate-150 rounded-2xl cursor-pointer">
                    <input
                      type="checkbox"
                      checked={fallAge}
                      onChange={(e) => setFallAge(e.target.checked)}
                      className="rounded text-teal-650 h-5 w-5"
                    />
                    <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">Is the patient 65 years or older?</span>
                  </label>
                  <label className="flex items-center gap-3 bg-slate-50 dark:bg-slate-850 p-3.5 border border-slate-150 rounded-2xl cursor-pointer">
                    <input
                      type="checkbox"
                      checked={fallHistory}
                      onChange={(e) => setFallHistory(e.target.checked)}
                      className="rounded text-teal-650 h-5 w-5"
                    />
                    <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">Has a history of falls in past 6 months?</span>
                  </label>
                  <label className="flex items-center gap-3 bg-slate-50 dark:bg-slate-850 p-3.5 border border-slate-150 rounded-2xl cursor-pointer">
                    <input
                      type="checkbox"
                      checked={fallMedsCount}
                      onChange={(e) => setFallMedsCount(e.target.checked)}
                      className="rounded text-teal-650 h-5 w-5"
                    />
                    <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">Currently taking 4 or more medications?</span>
                  </label>
                  <label className="flex items-center gap-3 bg-slate-50 dark:bg-slate-850 p-3.5 border border-slate-150 rounded-2xl cursor-pointer">
                    <input
                      type="checkbox"
                      checked={fallPsychoactive}
                      onChange={(e) => setFallPsychoactive(e.target.checked)}
                      className="rounded text-teal-650 h-5 w-5"
                    />
                    <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">Taking psychoactive meds (sedatives, etc.)?</span>
                  </label>
                  <label className="flex items-center gap-3 bg-slate-50 dark:bg-slate-850 p-3.5 border border-slate-150 rounded-2xl cursor-pointer">
                    <input
                      type="checkbox"
                      checked={fallGait}
                      onChange={(e) => setFallGait(e.target.checked)}
                      className="rounded text-teal-650 h-5 w-5"
                    />
                    <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">Presents an abnormal gait or shuffling walk?</span>
                  </label>
                  <label className="flex items-center gap-3 bg-slate-50 dark:bg-slate-850 p-3.5 border border-slate-150 rounded-2xl cursor-pointer">
                    <input
                      type="checkbox"
                      checked={fallDevice}
                      onChange={(e) => setFallDevice(e.target.checked)}
                      className="rounded text-teal-650 h-5 w-5"
                    />
                    <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">Uses an assistive device (cane, walker, frame)?</span>
                  </label>
                  <label className="flex items-center gap-3 bg-slate-50 dark:bg-slate-850 p-3.5 border border-slate-150 rounded-2xl cursor-pointer">
                    <input
                      type="checkbox"
                      checked={fallBalance}
                      onChange={(e) => setFallBalance(e.target.checked)}
                      className="rounded text-teal-650 h-5 w-5"
                    />
                    <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">Presents impaired balance or instability?</span>
                  </label>
                  <label className="flex items-center gap-3 bg-slate-50 dark:bg-slate-850 p-3.5 border border-slate-150 rounded-2xl cursor-pointer">
                    <input
                      type="checkbox"
                      checked={fallVision}
                      onChange={(e) => setFallVision(e.target.checked)}
                      className="rounded text-teal-650 h-5 w-5"
                    />
                    <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">Suffers from severe vision impairment?</span>
                  </label>
                </div>
              )}

              {activeModal === 'gds' && (
                <div className="space-y-4 max-h-[50vh] overflow-y-auto pr-1">
                  {gdsQuestions.map((q, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-850 border border-slate-150 rounded-2xl gap-4"
                    >
                      <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                        {idx + 1}. {q}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleToggleGdsAnswer(idx)}
                        className={`px-3 py-1 rounded-lg text-xs font-bold border transition-colors cursor-pointer ${
                          gdsAnswers[idx]
                            ? 'bg-teal-655 border-teal-600 text-white'
                            : 'bg-white border-slate-200 text-slate-650 dark:bg-slate-900'
                        }`}
                      >
                        {gdsAnswers[idx] ? 'YES' : 'NO'}
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {activeModal === 'minicog' && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">
                      3-Word Recall Score (0–3) *
                    </label>
                    <select
                      required
                      value={recallScore}
                      onChange={(e) => setRecallScore(e.target.value)}
                      className="block w-full px-3 py-2 bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/20"
                    >
                      <option value="">Select Score</option>
                      <option value="0">0 Words Recalled</option>
                      <option value="1">1 Word Recalled</option>
                      <option value="2">2 Words Recalled</option>
                      <option value="3">3 Words Recalled</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">
                      Clock Drawing Test Score *
                    </label>
                    <select
                      required
                      value={clockDrawingScore}
                      onChange={(e) => setClockDrawingScore(e.target.value)}
                      className="block w-full px-3 py-2 bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/20"
                    >
                      <option value="">Select Clock Score</option>
                      <option value="2">Normal Clock (2 points)</option>
                      <option value="0">Abnormal Clock (0 points)</option>
                    </select>
                  </div>
                </div>
              )}

              {activeModal === 'adl' && (
                <div className="space-y-4 max-h-[50vh] overflow-y-auto pr-1">
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Feeding</label>
                    <select value={adlFeeding} onChange={(e) => setAdlFeeding(e.target.value)} className="w-full text-xs p-2 rounded-xl bg-slate-50 border">
                      <option value="10">Independent (10 points)</option>
                      <option value="5">Needs help (5 points)</option>
                      <option value="0">Unable (0 points)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Bathing</label>
                    <select value={adlBathing} onChange={(e) => setAdlBathing(e.target.value)} className="w-full text-xs p-2 rounded-xl bg-slate-50 border">
                      <option value="5">Independent (5 points)</option>
                      <option value="0">Dependent (0 points)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Grooming</label>
                    <select value={adlGrooming} onChange={(e) => setAdlGrooming(e.target.value)} className="w-full text-xs p-2 rounded-xl bg-slate-50 border">
                      <option value="5">Independent (5 points)</option>
                      <option value="0">Needs help (0 points)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Dressing</label>
                    <select value={adlDressing} onChange={(e) => setAdlDressing(e.target.value)} className="w-full text-xs p-2 rounded-xl bg-slate-50 border">
                      <option value="10">Independent (10 points)</option>
                      <option value="5">Needs help (5 points)</option>
                      <option value="0">Dependent (0 points)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Bowel Control</label>
                    <select value={adlBowel} onChange={(e) => setAdlBowel(e.target.value)} className="w-full text-xs p-2 rounded-xl bg-slate-50 border">
                      <option value="10">Continent / Independent (10 points)</option>
                      <option value="5">Occasional accident (5 points)</option>
                      <option value="0">Incontinent (0 points)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Bladder Control</label>
                    <select value={adlBladder} onChange={(e) => setAdlBladder(e.target.value)} className="w-full text-xs p-2 rounded-xl bg-slate-50 border">
                      <option value="10">Continent (10 points)</option>
                      <option value="5">Occasional accident (5 points)</option>
                      <option value="0">Incontinent (0 points)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Toilet Use</label>
                    <select value={adlToilet} onChange={(e) => setAdlToilet(e.target.value)} className="w-full text-xs p-2 rounded-xl bg-slate-50 border">
                      <option value="10">Independent (10 points)</option>
                      <option value="5">Needs help (5 points)</option>
                      <option value="0">Dependent (0 points)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Transfers (Bed to Chair)</label>
                    <select value={adlTransfers} onChange={(e) => setAdlTransfers(e.target.value)} className="w-full text-xs p-2 rounded-xl bg-slate-50 border">
                      <option value="15">Independent (15 points)</option>
                      <option value="10">Minimal assistance (10 points)</option>
                      <option value="5">Major assistance (5 points)</option>
                      <option value="0">Unable (0 points)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Mobility (on flat surfaces)</label>
                    <select value={adlMobility} onChange={(e) => setAdlMobility(e.target.value)} className="w-full text-xs p-2 rounded-xl bg-slate-50 border">
                      <option value="15">Independent (15 points)</option>
                      <option value="10">Walks with help (10 points)</option>
                      <option value="5">Wheelchair independent (5 points)</option>
                      <option value="0">Immobile (0 points)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Stairs</label>
                    <select value={adlStairs} onChange={(e) => setAdlStairs(e.target.value)} className="w-full text-xs p-2 rounded-xl bg-slate-50 border">
                      <option value="10">Independent (10 points)</option>
                      <option value="5">Needs help (5 points)</option>
                      <option value="0">Unable (0 points)</option>
                    </select>
                  </div>
                </div>
              )}

              {activeModal === 'iadl' && (
                <div className="space-y-4 max-h-[50vh] overflow-y-auto pr-1">
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Ability to Use Telephone</label>
                    <select value={iadlPhone} onChange={(e) => setIadlPhone(e.target.value)} className="w-full text-xs p-2 rounded-xl bg-slate-50 border">
                      <option value="1">Independent (1 point)</option>
                      <option value="0">Needs helper / unable (0 points)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Shopping</label>
                    <select value={iadlShopping} onChange={(e) => setIadlShopping(e.target.value)} className="w-full text-xs p-2 rounded-xl bg-slate-50 border">
                      <option value="1">Independent (1 point)</option>
                      <option value="0">Needs assistance (0 points)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-550 uppercase mb-1">Food Preparation</label>
                    <select value={iadlFoodPrep} onChange={(e) => setIadlFoodPrep(e.target.value)} className="w-full text-xs p-2 rounded-xl bg-slate-50 border">
                      <option value="1">Independent (1 point)</option>
                      <option value="0">Needs helper / unable (0 points)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-550 uppercase mb-1">Housekeeping</label>
                    <select value={iadlHousekeeping} onChange={(e) => setIadlHousekeeping(e.target.value)} className="w-full text-xs p-2 rounded-xl bg-slate-50 border">
                      <option value="1">Independent / light tasks (1 point)</option>
                      <option value="0">Needs help / unable (0 points)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-550 uppercase mb-1">Laundry</label>
                    <select value={iadlLaundry} onChange={(e) => setIadlLaundry(e.target.value)} className="w-full text-xs p-2 rounded-xl bg-slate-50 border">
                      <option value="1">Independent (1 point)</option>
                      <option value="0">Needs helper / unable (0 points)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-555 uppercase mb-1">Mode of Transportation</label>
                    <select value={iadlTransport} onChange={(e) => setIadlTransport(e.target.value)} className="w-full text-xs p-2 rounded-xl bg-slate-50 border">
                      <option value="1">Independent (1 point)</option>
                      <option value="0">Needs assistance / unable (0 points)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-555 uppercase mb-1">Responsibility for Own Medications</label>
                    <select value={iadlMedications} onChange={(e) => setIadlMedications(e.target.value)} className="w-full text-xs p-2 rounded-xl bg-slate-50 border">
                      <option value="1">Takes meds independently (1 point)</option>
                      <option value="0">Needs prep / assistance (0 points)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-555 uppercase mb-1">Ability to Handle Finances</label>
                    <select value={iadlFinances} onChange={(e) => setIadlFinances(e.target.value)} className="w-full text-xs p-2 rounded-xl bg-slate-50 border">
                      <option value="1">Manages budget / bills (1 point)</option>
                      <option value="0">Needs helper / unable (0 points)</option>
                    </select>
                  </div>
                </div>
              )}

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => {
                    setActiveModal(null);
                    resetModalFields();
                  }}
                  className="px-4 py-2.5 hover:bg-slate-50 dark:hover:bg-slate-800/50 text-slate-600 dark:text-slate-400 text-sm font-semibold rounded-xl transition-all duration-200 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={assessmentMutation.isPending}
                  className="bg-teal-600 hover:bg-teal-700 text-white font-semibold rounded-xl text-sm px-5 py-2.5 transition-all duration-200 shadow-md shadow-teal-500/10 cursor-pointer"
                >
                  {assessmentMutation.isPending ? 'Logging...' : 'Save Assessment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
