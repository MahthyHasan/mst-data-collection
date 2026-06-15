'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useSession } from 'next-auth/react';
import DashboardLayout from '@/components/DashboardLayout';
import AssessmentStatusBar from '@/components/AssessmentStatusBar';
import { getStationContext } from '@/lib/stationContext';
import { AssessmentModule, MODULE_LABELS } from '@/lib/schemas';
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
  const { data: session } = useSession();
  const patientId = params.id as string;
  const stationContext = getStationContext();
  const isAdmin = session?.user?.role === 'admin';

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

  // Existing assessment (fetched when modal opens)
  const [existingAssessment, setExistingAssessment] = useState<any>(null);
  const [fetchingExisting, setFetchingExisting] = useState(false);

  // Full FRAT Part 1
  const [fratRecentFalls, setFratRecentFalls] = useState('');
  const [fratMedications, setFratMedications] = useState('');
  const [fratPsychological, setFratPsychological] = useState('');
  const [fratCogStatus, setFratCogStatus] = useState('');
  const [fratFuncChange, setFratFuncChange] = useState(false);
  const [fratDizziness, setFratDizziness] = useState(false);

  // FRAT Part 2 checklist
  const [p2Vision, setP2Vision] = useState(false);
  const [p2Mobility, setP2Mobility] = useState(false);
  const [p2Transfers, setP2Transfers] = useState(false);
  const [p2Behaviours, setP2Behaviours] = useState(false);
  const [p2AdlRisk, setP2AdlRisk] = useState(false);
  const [p2Equipment, setP2Equipment] = useState(false);
  const [p2Footwear, setP2Footwear] = useState(false);
  const [p2Environmental, setP2Environmental] = useState(false);
  const [p2Nutrition, setP2Nutrition] = useState(false);
  const [p2Continence, setP2Continence] = useState(false);
  const [p2OtherRisk, setP2OtherRisk] = useState('');

  // Fall history rows (up to 3)
  const [fallHistoryRows, setFallHistoryRows] = useState<{timeAgo:string;mechanism:string;location:string}[]>([{timeAgo:'',mechanism:'',location:''}]);

  // Action plan rows
  const [actionPlanRows, setActionPlanRows] = useState<{problem:string;interventionStrategy:string;referral:string}[]>([{problem:'',interventionStrategy:'',referral:''}]);
  const [plannedReviewDate, setPlannedReviewDate] = useState('');

  // Computed: BMI for conditional waist display
  const currentBmi = useMemo(() => {
    const h = parseFloat(height);
    const w = parseFloat(weight);
    if (!h || !w || h <= 0) return 0;
    return w / (h * h);
  }, [height, weight]);
  const showWaist = currentBmi > 25;

  // Computed: FRAT total + risk
  const fratTotal = useMemo(() => {
    const v = [fratRecentFalls, fratMedications, fratPsychological, fratCogStatus];
    if (v.some(x => x === '')) return null;
    return v.reduce((s, x) => s + parseInt(x), 0);
  }, [fratRecentFalls, fratMedications, fratPsychological, fratCogStatus]);
  const fratRisk = useMemo(() => {
    if (fratTotal === null) return null;
    if (fratTotal <= 11) return 'low';
    if (fratTotal <= 15) return 'medium';
    return 'high';
  }, [fratTotal]);

  // Computed: ADL running score + severity band
  const adlRunningScore = useMemo(() => {
    return [adlFeeding,adlBathing,adlGrooming,adlDressing,adlBowel,adlBladder,adlToilet,adlTransfers,adlMobility,adlStairs].reduce((s,v)=>s+parseInt(v||'0'),0);
  }, [adlFeeding,adlBathing,adlGrooming,adlDressing,adlBowel,adlBladder,adlToilet,adlTransfers,adlMobility,adlStairs]);
  const adlBandLabel = useMemo(() => {
    if (adlRunningScore <= 20) return 'Total dependence';
    if (adlRunningScore <= 60) return 'Severe dependence';
    if (adlRunningScore <= 90) return 'Moderate dependence';
    if (adlRunningScore <= 99) return 'Slight dependence';
    return 'Independent';
  }, [adlRunningScore]);

  // Fetch existing assessment when a modal opens
  useEffect(() => {
    if (!activeModal || !data) return;
    const campId = data.patient.campId?._id || data.patient.campId;
    setFetchingExisting(true);
    setExistingAssessment(null);
    fetch(`/api/assessments/${activeModal}?patientId=${patientId}&campId=${campId}`)
      .then(r => r.json())
      .then(existing => {
        if (!existing) { setFetchingExisting(false); return; }
        setExistingAssessment(existing);
        if (activeModal === 'checkup') {
          setHeight(existing.height?.toString() || '');
          setWeight(existing.weight?.toString() || '');
          setWaist(existing.waistCircumference?.toString() || '');
          setBpSystolic(existing.bloodPressureSystolic?.toString() || '');
          setBpDiastolic(existing.bloodPressureDiastolic?.toString() || '');
          setRbs(existing.randomBloodSugar?.toString() || '');
          setVisionNotes(existing.visionAssessmentNotes || '');
          setHearingNotes(existing.hearingAssessmentNotes || '');
        } else if (activeModal === 'fall') {
          const p1 = existing.part1 || {};
          setFratRecentFalls(p1.recentFalls?.toString() || '');
          setFratMedications(p1.medications?.toString() || '');
          setFratPsychological(p1.psychological?.toString() || '');
          setFratCogStatus(p1.cognitiveStatus?.toString() || '');
          setFratFuncChange(p1.automaticHighRisk?.functionalStatusChange || false);
          setFratDizziness(p1.automaticHighRisk?.dizzinessPosturalHypotension || false);
          const p2 = existing.part2Checklist || {};
          setP2Vision(!!p2.vision); setP2Mobility(!!p2.mobility); setP2Transfers(!!p2.transfers);
          setP2Behaviours(!!p2.behaviours); setP2AdlRisk(!!p2.adlRiskBehaviours); setP2Equipment(!!p2.unsafeEquipmentUse);
          setP2Footwear(!!p2.unsafeFootwear); setP2Environmental(!!p2.environmentalDifficulties);
          setP2Nutrition(!!p2.nutrition); setP2Continence(!!p2.continence); setP2OtherRisk(p2.otherRisk || '');
          if (existing.fallHistory?.length) setFallHistoryRows(existing.fallHistory.map((r:any)=>({timeAgo:r.timeAgo||'',mechanism:r.mechanism||'',location:r.location||''})));
          if (existing.actionPlan?.length) setActionPlanRows(existing.actionPlan.map((r:any)=>({problem:r.problem||'',interventionStrategy:r.interventionStrategy||'',referral:r.referral||''})));
          setPlannedReviewDate(existing.plannedReviewDate ? new Date(existing.plannedReviewDate).toISOString().split('T')[0] : '');
          // legacy
          setFallAge(!!existing.age65OrOlder); setFallHistory(!!existing.fallHistory6Months);
          setFallMedsCount(!!existing.takingFourOrMoreMedications); setFallPsychoactive(!!existing.psychoactiveMedications);
          setFallGait(!!existing.abnormalGait); setFallDevice(!!existing.usesAssistiveDevice);
          setFallBalance(!!existing.impairedBalance); setFallVision(!!existing.visionImpairment);
        } else if (activeModal === 'gds') {
          if (existing.responses?.length === 15) setGdsAnswers(existing.responses);
        } else if (activeModal === 'minicog') {
          setRecallScore(existing.recallScore?.toString() || '');
          setClockDrawingScore(existing.clockDrawingScore?.toString() || '');
        } else if (activeModal === 'adl') {
          setAdlFeeding(existing.feeding?.toString() || '10');
          setAdlBathing(existing.bathing?.toString() || '5');
          setAdlGrooming(existing.grooming?.toString() || '5');
          setAdlDressing(existing.dressing?.toString() || '10');
          setAdlBowel(existing.bowelBladder?.toString() || '10');
          setAdlBladder('10');
          setAdlToilet(existing.toiletUse?.toString() || '10');
          setAdlTransfers(existing.transfers?.toString() || '15');
          setAdlMobility(existing.mobility?.toString() || '15');
          setAdlStairs(existing.stairsMobility?.toString() || '10');
        } else if (activeModal === 'iadl') {
          setIadlPhone(existing.phone?.toString() || '1');
          setIadlShopping(existing.shopping?.toString() || '1');
          setIadlFoodPrep(existing.foodPrep?.toString() || '1');
          setIadlHousekeeping(existing.housekeeping?.toString() || '1');
          setIadlLaundry(existing.laundry?.toString() || '1');
          setIadlTransport(existing.transport?.toString() || '1');
          setIadlMedications(existing.medications?.toString() || '1');
          setIadlFinances(existing.finances?.toString() || '1');
        }
      })
      .catch(() => {})
      .finally(() => setFetchingExisting(false));
  }, [activeModal]);

  // Mutation helpers
  const assessmentMutation = useMutation({
    mutationFn: async ({ endpoint, payload }: { endpoint: string; payload: any }) => {
      const method = existingAssessment ? 'PATCH' : 'POST';
      const campId = data.patient.campId?._id || data.patient.campId;
      const res = await fetch(`/api/assessments/${endpoint}`, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          patientId,
          campId,
          stationLabel: stationContext?.label,
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
      toast.success(existingAssessment ? 'Assessment updated successfully.' : 'Geriatric assessment logged successfully.');
      queryClient.invalidateQueries({ queryKey: ['patient', patientId] });
      setActiveModal(null);
      resetModalFields();
    },
    onError: (err: any) => {
      toast.error(err.message);
    },
  });

  const resetModalFields = () => {
    setHeight(''); setWeight(''); setWaist(''); setBpSystolic(''); setBpDiastolic(''); setRbs('');
    setVisionNotes(''); setHearingNotes('');
    setFallAge(false); setFallHistory(false); setFallMedsCount(false); setFallPsychoactive(false);
    setFallGait(false); setFallDevice(false); setFallBalance(false); setFallVision(false);
    setGdsAnswers(new Array(15).fill(false));
    setRecallScore(''); setClockDrawingScore('');
    setFratRecentFalls(''); setFratMedications(''); setFratPsychological(''); setFratCogStatus('');
    setFratFuncChange(false); setFratDizziness(false);
    setP2Vision(false); setP2Mobility(false); setP2Transfers(false); setP2Behaviours(false);
    setP2AdlRisk(false); setP2Equipment(false); setP2Footwear(false); setP2Environmental(false);
    setP2Nutrition(false); setP2Continence(false); setP2OtherRisk('');
    setFallHistoryRows([{timeAgo:'',mechanism:'',location:''}]);
    setActionPlanRows([{problem:'',interventionStrategy:'',referral:''}]);
    setPlannedReviewDate('');
    setExistingAssessment(null);
  };

  const handleAssessmentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    let endpoint = '';
    let payload: any = {};

    if (activeModal === 'checkup') {
      endpoint = 'checkup';
      payload = {
        height, weight,
        waistCircumference: showWaist ? waist : '',
        bloodPressureSystolic: bpSystolic, bloodPressureDiastolic: bpDiastolic,
        randomBloodSugar: rbs, visionAssessmentNotes: visionNotes, hearingAssessmentNotes: hearingNotes,
      };
    } else if (activeModal === 'fall') {
      endpoint = 'fall';
      const part1 = fratTotal !== null ? {
        recentFalls: parseInt(fratRecentFalls), medications: parseInt(fratMedications),
        psychological: parseInt(fratPsychological), cognitiveStatus: parseInt(fratCogStatus),
        totalScore: fratTotal, riskLevel: fratRisk,
        automaticHighRisk: { functionalStatusChange: fratFuncChange, dizzinessPosturalHypotension: fratDizziness },
      } : undefined;
      payload = {
        age65OrOlder: fallAge, fallHistory6Months: fallHistory,
        takingFourOrMoreMedications: fallMedsCount, psychoactiveMedications: fallPsychoactive,
        abnormalGait: fallGait, usesAssistiveDevice: fallDevice, impairedBalance: fallBalance, visionImpairment: fallVision,
        part1,
        part2Checklist: {
          vision: p2Vision, mobility: p2Mobility, transfers: p2Transfers, behaviours: p2Behaviours,
          adlRiskBehaviours: p2AdlRisk, unsafeEquipmentUse: p2Equipment, unsafeFootwear: p2Footwear,
          environmentalDifficulties: p2Environmental, nutrition: p2Nutrition, continence: p2Continence,
          otherRisk: p2OtherRisk || undefined,
        },
        fallHistory: fallHistoryRows.filter(r => r.timeAgo || r.mechanism || r.location),
        actionPlan: actionPlanRows.filter(r => r.problem || r.interventionStrategy || r.referral),
        plannedReviewDate: plannedReviewDate || undefined,
      };
    } else if (activeModal === 'gds') {
      endpoint = 'gds';
      payload = { responses: gdsAnswers };
    } else if (activeModal === 'minicog') {
      endpoint = 'minicog';
      payload = { recallScore, clockDrawingScore };
    } else if (activeModal === 'adl') {
      endpoint = 'adl';
      payload = { feeding: adlFeeding, bathing: adlBathing, grooming: adlGrooming, dressing: adlDressing,
        bowelBladder: adlBowel, toiletUse: adlToilet, transfers: adlTransfers, mobility: adlMobility, stairsMobility: adlStairs };
    } else if (activeModal === 'iadl') {
      endpoint = 'iadl';
      payload = { phone: iadlPhone, shopping: iadlShopping, foodPrep: iadlFoodPrep,
        housekeeping: iadlHousekeeping, laundry: iadlLaundry, transport: iadlTransport,
        medications: iadlMedications, finances: iadlFinances };
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

  const { patient, checkups, fallAssessments, gdsAssessments, minicogAssessments, adlAssessments, iadlAssessments, assessmentStatus } = data;

  const allowedModules: AssessmentModule[] | null = isAdmin
    ? null
    : stationContext?.modules?.length
      ? (stationContext.modules as AssessmentModule[])
      : null;

  const isModuleVisible = (module: AssessmentModule) =>
    !allowedModules || allowedModules.includes(module);

  const assessmentButtons: {
    module: AssessmentModule;
    modal: 'checkup' | 'fall' | 'gds' | 'minicog' | 'adl' | 'iadl';
    icon: React.ComponentType<{ className?: string }>;
    color: string;
  }[] = [
    { module: 'checkup', modal: 'checkup', icon: ActivityIcon, color: 'text-teal-600' },
    { module: 'fall', modal: 'fall', icon: ShieldAlert, color: 'text-rose-600' },
    { module: 'gds', modal: 'gds', icon: Frown, color: 'text-amber-600' },
    { module: 'minicog', modal: 'minicog', icon: Brain, color: 'text-purple-600' },
    { module: 'adl', modal: 'adl', icon: ClipboardList, color: 'text-sky-600' },
    { module: 'iadl', modal: 'iadl', icon: Layers, color: 'text-indigo-600' },
  ];

  const defaultStatus: Record<AssessmentModule, boolean> = {
    checkup: false,
    fall: false,
    gds: false,
    minicog: false,
    adl: false,
    iadl: false,
  };

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

      <AssessmentStatusBar status={assessmentStatus || defaultStatus} />

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
              {stationContext && !isAdmin && (
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-teal-50 dark:bg-teal-950/30 text-teal-600 dark:text-teal-400">
                  {stationContext.label}
                </span>
              )}
            </h2>
            {!isAdmin && !stationContext && (
              <p className="text-xs text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/20 border border-amber-200/50 dark:border-amber-900/40 rounded-xl px-3 py-2">
                Select your section in the sidebar to see only your assigned assessment modules.
              </p>
            )}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {assessmentButtons.filter((btn) => isModuleVisible(btn.module)).map((btn) => (
                <button
                  key={btn.module}
                  onClick={() => setActiveModal(btn.modal)}
                  className="flex flex-col items-start gap-2 bg-slate-50/50 hover:bg-teal-50 dark:bg-slate-850 dark:hover:bg-teal-950/20 p-4 border border-slate-200 dark:border-slate-800 rounded-2xl text-left transition-all duration-200 cursor-pointer"
                >
                  <btn.icon className={`h-5 w-5 ${btn.color}`} />
                  <span className="font-bold text-xs text-slate-800 dark:text-white">{MODULE_LABELS[btn.module]}</span>
                </button>
              ))}
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
              <div>
                <h2 className="text-lg font-bold text-slate-800 dark:text-white">
                  {existingAssessment ? 'Update' : 'New'} {activeModal === 'checkup' ? 'Medical Check-up' : activeModal === 'fall' ? 'Fall Risk (FRAT)' : activeModal === 'gds' ? 'GDS-15 Depression Scale' : activeModal === 'minicog' ? 'Mini-Cog Cognitive Screen' : activeModal === 'adl' ? 'Barthel ADL Assessment' : 'Lawton IADL Assessment'}
                </h2>
                {existingAssessment && (
                  <p className="text-xs text-amber-600 dark:text-amber-400 mt-0.5">
                    Last saved: {new Date(existingAssessment.updatedAt).toLocaleString()} by {existingAssessment.recordedBy?.username || 'staff'}
                  </p>
                )}
              </div>
              <button onClick={() => { setActiveModal(null); resetModalFields(); }} className="p-1 rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800">
                <X className="h-5 w-5" />
              </button>
            </div>

            {fetchingExisting && <div className="px-6 py-2 text-xs text-slate-400 animate-pulse">Loading saved data…</div>}
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
                      {showWaist && (
                      <>
                        <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">
                          Waist Circumference (cm) <span className="text-amber-500 font-normal normal-case">(BMI &gt; 25 — required)</span>
                        </label>
                        <input
                          type="number"
                          value={waist}
                          onChange={(e) => setWaist(e.target.value)}
                          placeholder="e.g. 88"
                          className="block w-full px-3 py-2 bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/20"
                        />
                      </>
                    )}
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
                <div className="space-y-5 max-h-[60vh] overflow-y-auto pr-1">
                  {/* Part 1 */}
                  <div className="space-y-3">
                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Part 1 — FRAT Subscales</h4>
                    {[
                      { label:'Recent Falls', state:fratRecentFalls, set:setFratRecentFalls, opts:[{v:'2',l:'None in 12 mo'},{v:'4',l:'1+ between 3–12 mo'},{v:'6',l:'1+ in last 3 mo'},{v:'8',l:'1+ in last 3 mo (inpatient)'}] },
                      { label:'Medications', state:fratMedications, set:setFratMedications, opts:[{v:'1',l:'None'},{v:'2',l:'One'},{v:'3',l:'Two'},{v:'4',l:'More than two'}] },
                      { label:'Psychological', state:fratPsychological, set:setFratPsychological, opts:[{v:'1',l:'None'},{v:'2',l:'Mildly affected'},{v:'3',l:'Moderately affected'},{v:'4',l:'Severely affected'}] },
                      { label:'Cognitive Status (AMTS)', state:fratCogStatus, set:setFratCogStatus, opts:[{v:'1',l:'9–10 Intact'},{v:'2',l:'7–8 Mild'},{v:'3',l:'5–6 Moderate'},{v:'4',l:'≤4 Severe'}] },
                    ].map(({label,state,set,opts}) => (
                      <div key={label}>
                        <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">{label}</label>
                        <select value={state} onChange={e=>set(e.target.value)} className="w-full text-xs p-2 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700">
                          <option value="">Select…</option>
                          {opts.map(o=><option key={o.v} value={o.v}>{o.l} ({o.v} pts)</option>)}
                        </select>
                      </div>
                    ))}
                    {fratTotal !== null && (
                      <div className={`p-2 rounded-xl text-xs font-bold text-center border ${fratRisk==='high'?'bg-red-50 text-red-700 border-red-200':fratRisk==='medium'?'bg-amber-50 text-amber-700 border-amber-200':'bg-green-50 text-green-700 border-green-200'}`}>
                        Total: {fratTotal} / 20 — {fratRisk==='high'?'HIGH RISK':fratRisk==='medium'?'MEDIUM RISK':'LOW RISK'}
                      </div>
                    )}
                    <div className="space-y-1.5 pt-1">
                      {[{state:fratFuncChange,set:setFratFuncChange,label:'Automatic High Risk: Functional status change'},{state:fratDizziness,set:setFratDizziness,label:'Automatic High Risk: Dizziness / postural hypotension'}].map(({state,set,label})=>(
                        <label key={label} className="flex items-center gap-2.5 text-xs text-slate-700 dark:text-slate-300 cursor-pointer">
                          <input type="checkbox" checked={state} onChange={e=>set(e.target.checked)} className="rounded h-4 w-4" />{label}
                        </label>
                      ))}
                    </div>
                  </div>
                  {/* Part 2 */}
                  <div className="space-y-2 border-t border-slate-100 dark:border-slate-800 pt-4">
                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Part 2 — Risk Factor Checklist</h4>
                    {[
                      {state:p2Vision,set:setP2Vision,label:'Vision problems'},{state:p2Mobility,set:setP2Mobility,label:'Mobility difficulties'},
                      {state:p2Transfers,set:setP2Transfers,label:'Transfer difficulties'},{state:p2Behaviours,set:setP2Behaviours,label:'Behavioural factors'},
                      {state:p2AdlRisk,set:setP2AdlRisk,label:'ADL risk behaviours'},{state:p2Equipment,set:setP2Equipment,label:'Unsafe equipment use'},
                      {state:p2Footwear,set:setP2Footwear,label:'Unsafe footwear'},{state:p2Environmental,set:setP2Environmental,label:'Environmental difficulties'},
                      {state:p2Nutrition,set:setP2Nutrition,label:'Nutrition concerns'},{state:p2Continence,set:setP2Continence,label:'Continence issues'},
                    ].map(({state,set,label})=>(
                      <label key={label} className="flex items-center gap-2.5 text-xs text-slate-700 dark:text-slate-300 cursor-pointer p-2 bg-slate-50 dark:bg-slate-800/40 rounded-xl">
                        <input type="checkbox" checked={state} onChange={e=>set(e.target.checked)} className="rounded h-4 w-4" />{label}
                      </label>
                    ))}
                    <input value={p2OtherRisk} onChange={e=>setP2OtherRisk(e.target.value)} placeholder="Other risk (free text)" className="w-full text-xs p-2 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700" />
                  </div>
                  {/* Fall History */}
                  <div className="border-t border-slate-100 dark:border-slate-800 pt-4 space-y-2">
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Fall History (up to 3 episodes)</h4>
                      <button type="button" disabled={fallHistoryRows.length>=3} onClick={()=>setFallHistoryRows([...fallHistoryRows,{timeAgo:'',mechanism:'',location:''}])} className="text-xs px-2 py-1 bg-teal-50 text-teal-700 rounded-lg disabled:opacity-40 cursor-pointer">+ Add</button>
                    </div>
                    {fallHistoryRows.map((row,i)=>(
                      <div key={i} className="grid grid-cols-3 gap-2">
                        <input value={row.timeAgo} onChange={e=>{const r=[...fallHistoryRows];r[i]={...r[i],timeAgo:e.target.value};setFallHistoryRows(r);}} placeholder="Time ago" className="text-xs p-1.5 rounded-lg bg-slate-50 border border-slate-200" />
                        <select value={row.mechanism} onChange={e=>{const r=[...fallHistoryRows];r[i]={...r[i],mechanism:e.target.value};setFallHistoryRows(r);}} className="text-xs p-1.5 rounded-lg bg-slate-50 border border-slate-200">
                          <option value="">Mechanism</option>
                          {['trip','slip','lost_balance','collapse','legs_gave_way','dizziness','unknown'].map(v=><option key={v} value={v}>{v.replace(/_/g,' ')}</option>)}
                        </select>
                        <input value={row.location} onChange={e=>{const r=[...fallHistoryRows];r[i]={...r[i],location:e.target.value};setFallHistoryRows(r);}} placeholder="Location" className="text-xs p-1.5 rounded-lg bg-slate-50 border border-slate-200" />
                      </div>
                    ))}
                  </div>
                  {/* Action Plan */}
                  <div className="border-t border-slate-100 dark:border-slate-800 pt-4 space-y-2">
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Part 3 — Action Plan</h4>
                      <button type="button" onClick={()=>setActionPlanRows([...actionPlanRows,{problem:'',interventionStrategy:'',referral:''}])} className="text-xs px-2 py-1 bg-teal-50 text-teal-700 rounded-lg cursor-pointer">+ Add</button>
                    </div>
                    {actionPlanRows.map((row,i)=>(
                      <div key={i} className="grid grid-cols-3 gap-2">
                        <input value={row.problem} onChange={e=>{const r=[...actionPlanRows];r[i]={...r[i],problem:e.target.value};setActionPlanRows(r);}} placeholder="Problem" className="text-xs p-1.5 rounded-lg bg-slate-50 border border-slate-200" />
                        <input value={row.interventionStrategy} onChange={e=>{const r=[...actionPlanRows];r[i]={...r[i],interventionStrategy:e.target.value};setActionPlanRows(r);}} placeholder="Intervention" className="text-xs p-1.5 rounded-lg bg-slate-50 border border-slate-200" />
                        <input value={row.referral} onChange={e=>{const r=[...actionPlanRows];r[i]={...r[i],referral:e.target.value};setActionPlanRows(r);}} placeholder="Referral" className="text-xs p-1.5 rounded-lg bg-slate-50 border border-slate-200" />
                      </div>
                    ))}
                    <div>
                      <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Planned Review Date</label>
                      <input type="date" value={plannedReviewDate} onChange={e=>setPlannedReviewDate(e.target.value)} className="text-xs p-2 rounded-xl bg-slate-50 border border-slate-200 w-full" />
                    </div>
                  </div>
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
                  <div className={`p-2.5 rounded-xl text-xs font-bold text-center border ${adlRunningScore<=20?'bg-red-50 text-red-700 border-red-200':adlRunningScore<=60?'bg-orange-50 text-orange-700 border-orange-200':adlRunningScore<=90?'bg-amber-50 text-amber-700 border-amber-200':adlRunningScore<=99?'bg-blue-50 text-blue-700 border-blue-200':'bg-green-50 text-green-700 border-green-200'}`}>
                    Score: {adlRunningScore} / 100 — {adlBandLabel}
                  </div>
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
                  {patient.gender?.toLowerCase() === 'male' && (
                    <p className="text-xs bg-sky-50 dark:bg-sky-950/20 text-sky-700 dark:text-sky-400 border border-sky-200/50 rounded-xl px-3 py-2">
                      Gender-adjusted scoring (Male): Food Prep, Housekeeping and Laundry are excluded. Max score: 5.
                    </p>
                  )}
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
                  {patient.gender?.toLowerCase() !== 'male' && (
                    <>
                      <div>
                        <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Food Preparation</label>
                        <select value={iadlFoodPrep} onChange={(e) => setIadlFoodPrep(e.target.value)} className="w-full text-xs p-2 rounded-xl bg-slate-50 border">
                          <option value="1">Independent (1 point)</option>
                          <option value="0">Needs helper / unable (0 points)</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Housekeeping</label>
                        <select value={iadlHousekeeping} onChange={(e) => setIadlHousekeeping(e.target.value)} className="w-full text-xs p-2 rounded-xl bg-slate-50 border">
                          <option value="1">Independent / light tasks (1 point)</option>
                          <option value="0">Needs help / unable (0 points)</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Laundry</label>
                        <select value={iadlLaundry} onChange={(e) => setIadlLaundry(e.target.value)} className="w-full text-xs p-2 rounded-xl bg-slate-50 border">
                          <option value="1">Independent (1 point)</option>
                          <option value="0">Needs helper / unable (0 points)</option>
                        </select>
                      </div>
                    </>
                  )}
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
