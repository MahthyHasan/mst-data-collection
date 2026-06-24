'use client';

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/router';
import Link from 'next/link';
import DashboardLayout from '@/components/DashboardLayout';
import {
  Users,
  Search,
  Filter,
  Plus,
  ArrowRight,
  ArrowLeft,
  Check,
  Download,
  AlertCircle,
  Eye,
  Trash2,
  CheckCircle2,
  FolderOpen,
} from 'lucide-react';
import { toast } from 'sonner';
import { exportPatientsToExcel } from '@/utils/reports';

export default function PatientsPage() {
  const queryClient = useQueryClient();
  const [view, setView] = useState<'list' | 'register'>('list');
  const [step, setStep] = useState(1);
  const [isExporting, setIsExporting] = useState(false);

  // Search & Filter state
  const [search, setSearch] = useState('');
  const [campId, setCampId] = useState('');
  const [gender, setGender] = useState('');
  const [ageRange, setAgeRange] = useState('');
  const [condition, setCondition] = useState('');

  const clearFilters = () => {
    setSearch('');
    setCampId('');
    setGender('');
    setAgeRange('');
    setCondition('');
  };

  const handleExport = async () => {
    setIsExporting(true);
    try {
      const params = new URLSearchParams();
      // Apply whatever filters are currently active
      if (search) params.append('search', search);
      if (campId) params.append('campId', campId);
      if (gender) params.append('gender', gender);
      if (ageRange) params.append('ageRange', ageRange);
      if (condition) params.append('condition', condition);
      // Fetch ALL records — no pagination cap
      params.append('limit', '10000');
      params.append('page', '1');

      const res = await fetch(`/api/patients?${params.toString()}`);
      if (!res.ok) throw new Error('Failed to fetch patients for export');
      const data = await res.json();
      const allPatients = data.patients || [];

      if (allPatients.length === 0) {
        toast.error('No patients to export.');
        return;
      }

      exportPatientsToExcel(allPatients);
      toast.success(`Exported ${allPatients.length} patient records to Excel.`);
    } catch (err: any) {
      toast.error(err.message || 'Export failed.');
    } finally {
      setIsExporting(false);
    }
  };

  // Demographics (Step 1)
  const [fullName, setFullName] = useState('');
  const [dob, setDob] = useState('');
  const [age, setAge] = useState('');
  const [patientGender, setPatientGender] = useState('');
  const [nic, setNic] = useState('');
  const [maritalStatus, setMaritalStatus] = useState('');
  const [contactNumber, setContactNumber] = useState('');
  const [selectedCampId, setSelectedCampId] = useState('');

  // Senses & Habits (Step 2)
  const [urinaryIncontinence, setUrinaryIncontinence] = useState(false);
  const [constipation, setConstipation] = useState(false);
  const [visionProblems, setVisionProblems] = useState('Normal');
  const [hearingProblems, setHearingProblems] = useState('Normal');
  const [walkIndependently, setWalkIndependently] = useState(true);
  const [historyOfFalls, setHistoryOfFalls] = useState(false);
  const [smokingHistory, setSmokingHistory] = useState('Never');
  const [alcoholUse, setAlcoholUse] = useState('Never');
  const [exerciseHabits, setExerciseHabits] = useState('Sedentary');
  const [dietaryHabits, setDietaryHabits] = useState('Mixed');

  // Medical conditions (Step 3)
  const [selectedConditions, setSelectedConditions] = useState<string[]>([]);
  const [allergies, setAllergies] = useState<{ type: string; description: string }[]>([]);
  const [newAllergyType, setNewAllergyType] = useState('Drug');
  const [newAllergyDesc, setNewAllergyDesc] = useState('');
  const [medications, setMedications] = useState<{ name: string; dosage: string; frequency: string }[]>([]);
  const [newMedName, setNewMedName] = useState('');
  const [newMedDosage, setNewMedDosage] = useState('');
  const [newMedFreq, setNewMedFreq] = useState('');
  const [surgeries, setSurgeries] = useState<{ description: string; date: string }[]>([]);
  const [newSurgDesc, setNewSurgDesc] = useState('');
  const [newSurgDate, setNewSurgDate] = useState('');

  // Social & Caregiver (Step 4)
  const [livesAlone, setLivesAlone] = useState(false);
  const [caregiverName, setCaregiverName] = useState('');
  const [caregiverContact, setCaregiverContact] = useState('');
  const [caregiverRelation, setCaregiverRelation] = useState('');
  const [caregiverAddress, setCaregiverAddress] = useState('');

  // Task 2.1 — Current health issues
  const [currentHealthOther, setCurrentHealthOther] = useState('');
  // Task 2.2 — Lifestyle
  const [betelChewing, setBetelChewing] = useState(false);
  // Task 2.3 — Living status
  const [livingStatus, setLivingStatus] = useState('');
  const [livingStatusOther, setLivingStatusOther] = useState('');
  // Task 2.4 — Social
  const [independenceLevel, setIndependenceLevel] = useState('');
  const [outsideVisitFrequency, setOutsideVisitFrequency] = useState('');
  // Task 2.5 — Spiritual
  const [spiritualReligion, setSpiritualReligion] = useState('');
  const [spiritualAttachment, setSpiritualAttachment] = useState('');
  // Task 2.6 — Financial
  const [monthlyIncomeBracket, setMonthlyIncomeBracket] = useState('');
  const [incomeSources, setIncomeSources] = useState<string[]>([]);
  // Task 2.7 — Vision structured
  const [visionUsesSpectacles, setVisionUsesSpectacles] = useState(false);
  const [visionDmHtn, setVisionDmHtn] = useState(false);
  const [visionCataractDone, setVisionCataractDone] = useState(false);
  const [visionNotAttended, setVisionNotAttended] = useState(false);
  const [visionSnellenRight, setVisionSnellenRight] = useState('');
  const [visionSnellenLeft, setVisionSnellenLeft] = useState('');
  // Task 2.8 — Hearing structured
  const [hearingUsesAid, setHearingUsesAid] = useState(false);
  const [hearingWhisperTest, setHearingWhisperTest] = useState('');

  // Calculate age from DOB
  const handleDobChange = (val: string) => {
    setDob(val);
    if (val) {
      const birth = new Date(val);
      const diff = Date.now() - birth.getTime();
      const ageDate = new Date(diff);
      const calculatedAge = Math.abs(ageDate.getUTCFullYear() - 1970);
      setAge(calculatedAge.toString());
    }
  };

  // Fetch camps for drop downs
  const { data: camps = [] } = useQuery({
    queryKey: ['camps-list'],
    queryFn: async () => {
      const res = await fetch('/api/camps');
      if (!res.ok) throw new Error('Failed to fetch camps');
      return res.json();
    },
  });

  // Fetch patients list
  const { data: patients = [], isLoading } = useQuery({
    queryKey: ['patients', search, campId, gender, ageRange, condition],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (search) params.append('search', search);
      if (campId) params.append('campId', campId);
      if (gender) params.append('gender', gender);
      if (ageRange) params.append('ageRange', ageRange);
      if (condition) params.append('condition', condition);

      const res = await fetch(`/api/patients?${params.toString()}`);
      if (!res.ok) throw new Error('Failed to fetch patients');
      const data = await res.json();
      return data.patients || [];
    },
  });

  // Create Patient mutation
  const createPatientMutation = useMutation({
    mutationFn: async (patientData: any) => {
      const res = await fetch('/api/patients', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(patientData),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to register patient');
      }
      return res.json();
    },
    onSuccess: () => {
      toast.success('Patient registered successfully!');
      queryClient.invalidateQueries({ queryKey: ['patients'] });
      resetForm();
      setView('list');
    },
    onError: (err: any) => {
      toast.error(err.message);
    },
  });

  const resetForm = () => {
    setStep(1);
    setFullName('');
    setDob('');
    setAge('');
    setPatientGender('');
    setNic('');
    setMaritalStatus('');
    setContactNumber('');
    setSelectedCampId('');
    setUrinaryIncontinence(false);
    setConstipation(false);
    setVisionProblems('Normal');
    setHearingProblems('Normal');
    setWalkIndependently(true);
    setHistoryOfFalls(false);
    setSmokingHistory('Never');
    setAlcoholUse('Never');
    setExerciseHabits('Sedentary');
    setDietaryHabits('Mixed');
    setSelectedConditions([]);
    setAllergies([]);
    setMedications([]);
    setSurgeries([]);
    setLivesAlone(false);
    setCaregiverName('');
    setCaregiverContact('');
    setCaregiverRelation('');
    setCaregiverAddress('');
    setCurrentHealthOther('');
    setBetelChewing(false);
    setLivingStatus(''); setLivingStatusOther('');
    setIndependenceLevel(''); setOutsideVisitFrequency('');
    setSpiritualReligion(''); setSpiritualAttachment('');
    setMonthlyIncomeBracket(''); setIncomeSources([]);
    setVisionUsesSpectacles(false); setVisionDmHtn(false); setVisionCataractDone(false); setVisionNotAttended(false);
    setVisionSnellenRight(''); setVisionSnellenLeft('');
    setHearingUsesAid(false); setHearingWhisperTest('');
  };

  const handleAddAllergy = () => {
    if (!newAllergyDesc) return;
    setAllergies([...allergies, { type: newAllergyType, description: newAllergyDesc }]);
    setNewAllergyDesc('');
  };

  const handleRemoveAllergy = (idx: number) => {
    setAllergies(allergies.filter((_, i) => i !== idx));
  };

  const handleAddMedication = () => {
    if (!newMedName || !newMedDosage || !newMedFreq) return;
    setMedications([...medications, { name: newMedName, dosage: newMedDosage, frequency: newMedFreq }]);
    setNewMedName('');
    setNewMedDosage('');
    setNewMedFreq('');
  };

  const handleRemoveMedication = (idx: number) => {
    setMedications(medications.filter((_, i) => i !== idx));
  };

  const handleAddSurgery = () => {
    if (!newSurgDesc || !newSurgDate) return;
    setSurgeries([...surgeries, { description: newSurgDesc, date: newSurgDate }]);
    setNewSurgDesc('');
    setNewSurgDate('');
  };

  const handleRemoveSurgery = (idx: number) => {
    setSurgeries(surgeries.filter((_, i) => i !== idx));
  };

  const toggleCondition = (cond: string) => {
    if (selectedConditions.includes(cond)) {
      setSelectedConditions(selectedConditions.filter((c) => c !== cond));
    } else {
      setSelectedConditions([...selectedConditions, cond]);
    }
  };

  const handleRegister = () => {
    const payload = {
      fullName, dob: new Date(dob), age: parseInt(age), gender: patientGender, nic, maritalStatus, contactNumber, campId: selectedCampId,
      urinaryIncontinence, constipation,
      currentHealthIssues: { urinaryIncontinence, constipation, other: currentHealthOther || undefined },
      visionProblems, hearingProblems,
      walkIndependently, historyOfFalls,
      smokingHistory, alcoholUse, betelChewing, exerciseHabits, dietaryHabits,
      medicalConditions: selectedConditions, allergies, medications,
      surgeries: surgeries.map((s) => ({ event: s.description, date: s.date, notes: s.description })),
      livesAlone: livingStatus === 'alone' || livesAlone,
      caregiverName: livesAlone ? undefined : caregiverName,
      caregiverContact: livesAlone ? undefined : caregiverContact,
      caregiverRelation: livesAlone ? undefined : caregiverRelation,
      caregiverAddress: livesAlone ? undefined : caregiverAddress,
      livingStatus: livingStatus || undefined, livingStatusOther: livingStatus === 'other' ? livingStatusOther : undefined,
      independenceLevel: independenceLevel || undefined,
      outsideVisitFrequency: outsideVisitFrequency || undefined,
      spiritual: (spiritualReligion || spiritualAttachment) ? { religion: spiritualReligion || undefined, attachment: spiritualAttachment || undefined } : undefined,
      financial: (monthlyIncomeBracket || incomeSources.length) ? { monthlyIncomeBracket: monthlyIncomeBracket || undefined, incomeSource: incomeSources } : undefined,
      vision: { usesSpectacles: visionUsesSpectacles, dmHtnComplicated: visionDmHtn, cataractDone: visionCataractDone, notAttended: visionNotAttended, snellenRight: visionSnellenRight || undefined, snellenLeft: visionSnellenLeft || undefined },
      hearing: { usesHearingAid: hearingUsesAid, whisperTestResult: hearingWhisperTest || undefined },
    };
    createPatientMutation.mutate(payload);
  };

  return (
    <DashboardLayout>
      {view === 'list' ? (
        <>
          {/* Patients Listing view */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4">
            <div>
              <h1 className="text-3xl font-extrabold text-slate-800 dark:text-white tracking-tight">
                Patients Directory
              </h1>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Register elderly, manage health records, and run geriatric risk reports.
              </p>
            </div>
            <div className="flex gap-3 self-start md:self-center">
              <button
                onClick={handleExport}
                disabled={isExporting}
                className="flex items-center gap-2 bg-white hover:bg-slate-50 dark:bg-slate-900 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 shadow-sm cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
              >
                <Download className={`h-4.5 w-4.5 ${isExporting ? 'animate-bounce' : ''}`} />
                {isExporting ? 'Exporting...' : 'Export list'}
              </button>
              <button
                onClick={() => {
                  resetForm();
                  setView('register');
                }}
                className="flex items-center gap-2 bg-teal-600 hover:bg-teal-700 text-white px-5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 shadow-md shadow-teal-500/10 cursor-pointer"
              >
                <Plus className="h-4.5 w-4.5" />
                Register Patient
              </button>
            </div>
          </div>

          {/* Filters Block */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm space-y-4">
            <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300 font-bold text-sm">
              <Filter className="h-4 w-4 text-teal-600" />
              Advanced Filters
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">
                  Search Name/NIC/Phone
                </label>
                <input
                  type="text"
                  placeholder="Type name, NIC, phone..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="block w-full px-3 py-2 bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/20"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">
                  Camp
                </label>
                <select
                  value={campId}
                  onChange={(e) => setCampId(e.target.value)}
                  className="block w-full px-3 py-2 bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/20"
                >
                  <option value="">All Camps</option>
                  {camps.map((c: any) => (
                    <option key={c._id} value={c._id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">
                  Gender
                </label>
                <select
                  value={gender}
                  onChange={(e) => setGender(e.target.value)}
                  className="block w-full px-3 py-2 bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/20"
                >
                  <option value="">All Genders</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">
                  Age Range
                </label>
                <select
                  value={ageRange}
                  onChange={(e) => setAgeRange(e.target.value)}
                  className="block w-full px-3 py-2 bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/20"
                >
                  <option value="">All Ages</option>
                  <option value="60-69">60–69 years</option>
                  <option value="70-79">70–79 years</option>
                  <option value="80+">80+ years</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">
                  Medical Condition
                </label>
                <select
                  value={condition}
                  onChange={(e) => setCondition(e.target.value)}
                  className="block w-full px-3 py-2 bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/20"
                >
                  <option value="">All Conditions</option>
                  <option value="Diabetes">Diabetes</option>
                  <option value="Hypertension">Hypertension</option>
                  <option value="Asthma">Asthma</option>
                  <option value="Heart Disease">Heart Disease</option>
                  <option value="Arthritis">Arthritis</option>
                </select>
              </div>
            </div>
            <div className="flex justify-end gap-3 pt-2 border-t border-slate-100 dark:border-slate-800">
              <button
                onClick={clearFilters}
                className="px-4 py-2 hover:bg-slate-50 dark:hover:bg-slate-800/50 text-slate-600 dark:text-slate-400 text-xs font-semibold rounded-xl transition-all duration-200 cursor-pointer"
              >
                Clear Filters
              </button>
            </div>
          </div>

          {/* Directory List Table */}
          {isLoading ? (
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 h-64 animate-pulse"></div>
          ) : patients.length === 0 ? (
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-12 text-center max-w-xl mx-auto space-y-4">
              <div className="inline-flex p-4 bg-teal-50 dark:bg-teal-950/20 text-teal-600 dark:text-teal-400 rounded-full">
                <Users className="h-10 w-10" />
              </div>
              <h2 className="text-xl font-bold text-slate-800 dark:text-white">No Patients Found</h2>
              <p className="text-slate-500 dark:text-slate-400 text-sm">
                No patient records found matching current search or filters. Click Register Patient to add.
              </p>
            </div>
          ) : (
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl overflow-hidden shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full border-collapse text-left">
                  <thead>
                    <tr className="bg-slate-50 dark:bg-slate-800/50 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider border-b border-slate-200 dark:border-slate-800">
                      <th className="px-6 py-4">Full Name</th>
                      <th className="px-6 py-4">Age / Gender</th>
                      <th className="px-6 py-4">NIC</th>
                      <th className="px-6 py-4">Contact</th>
                      <th className="px-6 py-4">Camp Center</th>
                      <th className="px-6 py-4">Conditions</th>
                      <th className="px-6 py-4 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 dark:divide-slate-850 text-sm">
                    {patients.map((p: any) => (
                      <tr
                        key={p._id}
                        className="hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-colors"
                      >
                        <td className="px-6 py-4 font-semibold text-slate-800 dark:text-slate-200">
                          {p.fullName}
                        </td>
                        <td className="px-6 py-4 text-slate-600 dark:text-slate-400">
                          {p.age} yrs / {p.gender}
                        </td>
                        <td className="px-6 py-4 font-mono text-xs text-slate-500 dark:text-slate-400">
                          {p.nic}
                        </td>
                        <td className="px-6 py-4 text-slate-600 dark:text-slate-400">
                          {p.contactNumber}
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-xs font-medium text-slate-700 dark:text-slate-300">
                            {p.campInfo?.center || p.campId?.center || 'N/A'}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex flex-wrap gap-1">
                            {p.medicalConditions.slice(0, 2).map((c: string) => (
                              <span
                                key={c}
                                className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-350 text-[10px] font-semibold px-2 py-0.5 rounded"
                              >
                                {c}
                              </span>
                            ))}
                            {p.medicalConditions.length > 2 && (
                              <span className="text-[10px] text-slate-400">+{p.medicalConditions.length - 2}</span>
                            )}
                            {p.medicalConditions.length === 0 && (
                              <span className="text-xs text-slate-400">—</span>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <Link
                            href={`/patients/${p._id}`}
                            className="inline-flex items-center gap-1 bg-teal-50 dark:bg-teal-950/30 text-teal-700 dark:text-teal-400 border border-teal-100 dark:border-teal-900/35 px-3 py-1.5 rounded-xl text-xs font-semibold hover:bg-teal-100 dark:hover:bg-teal-900/50 transition-colors"
                          >
                            <Eye className="h-4 w-4" />
                            Assess / View
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      ) : (
        /* Patient Registration Stepper Wizard */
        <div className="max-w-4xl mx-auto bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-sm overflow-hidden animate-in fade-in duration-200">
          {/* Header */}
          <div className="px-8 py-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-slate-800 dark:text-white">
                Elderly Registration Wizard
              </h2>
              <p className="text-xs text-slate-400">Step {step} of 5 — Provide comprehensive patient data.</p>
            </div>
            <button
              onClick={() => setView('list')}
              className="px-4 py-1.5 hover:bg-slate-50 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-semibold transition-all duration-200 cursor-pointer"
            >
              Back to List
            </button>
          </div>

          {/* Stepper Progress bar */}
          <div className="bg-slate-50 dark:bg-slate-850 px-8 py-3 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center text-xs font-bold text-slate-400">
            {[1, 2, 3, 4, 5].map((s) => (
              <div key={s} className="flex items-center gap-2">
                <div
                  className={`h-6 w-6 rounded-full flex items-center justify-center border transition-all duration-200 ${
                    s === step
                      ? 'bg-teal-600 border-teal-600 text-white shadow-sm'
                      : s < step
                      ? 'bg-teal-50 border-teal-200 text-teal-700 dark:bg-teal-950/40 dark:border-teal-900'
                      : 'border-slate-200 dark:border-slate-800 text-slate-400'
                  }`}
                >
                  {s < step ? <Check className="h-3.5 w-3.5" /> : s}
                </div>
                <span className={s === step ? 'text-slate-800 dark:text-white' : ''}>
                  {s === 1
                    ? 'Demographics'
                    : s === 2
                    ? 'Habits & Senses'
                    : s === 3
                    ? 'Medical Background'
                    : s === 4
                    ? 'Social & Caregiver'
                    : 'Confirmation'}
                </span>
                {s < 5 && <span className="text-slate-200 dark:text-slate-800 font-normal">|</span>}
              </div>
            ))}
          </div>

          {/* Form Content */}
          <div className="p-8">
            {step === 1 && (
              <div className="space-y-6">
                <div className="flex items-center gap-2 border-b border-slate-100 dark:border-slate-850 pb-2">
                  <span className="bg-teal-50 dark:bg-teal-950/40 p-2 rounded-lg text-teal-600">
                    <Users className="h-5 w-5" />
                  </span>
                  <h3 className="font-bold text-slate-800 dark:text-white">Demographics & Center Assignment</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">
                      Full Name *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Enter patient full name"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      className="block w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/20"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">
                      Medical Camp assignment *
                    </label>
                    <select
                      required
                      value={selectedCampId}
                      onChange={(e) => setSelectedCampId(e.target.value)}
                      className="block w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/20"
                    >
                      <option value="">Select Target Camp</option>
                      {camps.map((c: any) => (
                        <option key={c._id} value={c._id}>
                          {c.name} ({c.code})
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">
                      Date of Birth *
                    </label>
                    <input
                      type="date"
                      required
                      value={dob}
                      onChange={(e) => handleDobChange(e.target.value)}
                      className="block w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/20"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">
                      Age *
                    </label>
                    <input
                      type="number"
                      required
                      value={age}
                      onChange={(e) => setAge(e.target.value)}
                      placeholder="Calculated automatically or type"
                      className="block w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/20"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">
                      Gender *
                    </label>
                    <select
                      required
                      value={patientGender}
                      onChange={(e) => setPatientGender(e.target.value)}
                      className="block w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/20"
                    >
                      <option value="">Select Gender</option>
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">
                      NIC / National Identity Card *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. 195678456V"
                      value={nic}
                      onChange={(e) => setNic(e.target.value)}
                      className="block w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/20"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">
                      Marital Status *
                    </label>
                    <select
                      required
                      value={maritalStatus}
                      onChange={(e) => setMaritalStatus(e.target.value)}
                      className="block w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/20"
                    >
                      <option value="">Select Status</option>
                      <option value="Single">Single</option>
                      <option value="Married">Married</option>
                      <option value="Widowed">Widowed</option>
                      <option value="Divorced">Divorced</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">
                      Contact Phone Number *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. 0771234567"
                      value={contactNumber}
                      onChange={(e) => setContactNumber(e.target.value)}
                      className="block w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/20"
                    />
                  </div>
                </div>
              </div>
            )}

            {step === 2 && (
              <div className="space-y-6">
                <div className="flex items-center gap-2 border-b border-slate-100 dark:border-slate-850 pb-2">
                  <span className="bg-teal-50 dark:bg-teal-950/40 p-2 rounded-lg text-teal-600">
                    <Users className="h-5 w-5" />
                  </span>
                  <h3 className="font-bold text-slate-800 dark:text-white">Lifestyle & Sensory Status</h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Senses and Balance */}
                  <div className="space-y-4">
                    <h4 className="text-sm font-bold text-slate-700 dark:text-slate-300">Sensory & Balance Capabilities</h4>
                    <div>
                      <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">
                        Vision problems
                      </label>
                      <select
                        value={visionProblems}
                        onChange={(e) => setVisionProblems(e.target.value)}
                        className="block w-full px-3 py-2 bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/20"
                      >
                        <option value="Normal">Normal</option>
                        <option value="Refractive Error">Refractive Error / Specs User</option>
                        <option value="Cataract">Cataract</option>
                        <option value="Glaucoma">Glaucoma</option>
                        <option value="Blurred Vision">Blurred Vision</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">
                        Hearing problems
                      </label>
                      <select
                        value={hearingProblems}
                        onChange={(e) => setHearingProblems(e.target.value)}
                        className="block w-full px-3 py-2 bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/20"
                      >
                        <option value="Normal">Normal</option>
                        <option value="Mild">Mild Loss</option>
                        <option value="Moderate">Moderate Loss</option>
                        <option value="Severe">Severe Loss</option>
                        <option value="Hearing Aid User">Hearing Aid User</option>
                      </select>
                    </div>

                    <div className="space-y-2 pt-2">
                      <label className="flex items-center gap-2.5 text-sm text-slate-700 dark:text-slate-350 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={walkIndependently}
                          onChange={(e) => setWalkIndependently(e.target.checked)}
                          className="rounded text-teal-600 focus:ring-teal-500/30 border-slate-300 dark:border-slate-800 h-4 w-4 cursor-pointer"
                        />
                        Able to walk independently without assistance
                      </label>
                      <label className="flex items-center gap-2.5 text-sm text-slate-700 dark:text-slate-350 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={historyOfFalls}
                          onChange={(e) => setHistoryOfFalls(e.target.checked)}
                          className="rounded text-teal-600 focus:ring-teal-500/30 border-slate-300 dark:border-slate-800 h-4 w-4 cursor-pointer"
                        />
                        History of falls in the past 6 months
                      </label>
                      <label className="flex items-center gap-2.5 text-sm text-slate-700 dark:text-slate-350 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={urinaryIncontinence}
                          onChange={(e) => setUrinaryIncontinence(e.target.checked)}
                          className="rounded text-teal-600 focus:ring-teal-500/30 border-slate-300 dark:border-slate-800 h-4 w-4 cursor-pointer"
                        />
                        Has urinary incontinence problems
                      </label>
                      <label className="flex items-center gap-2.5 text-sm text-slate-700 dark:text-slate-350 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={constipation}
                          onChange={(e) => setConstipation(e.target.checked)}
                          className="rounded text-teal-600 focus:ring-teal-500/30 border-slate-300 dark:border-slate-800 h-4 w-4 cursor-pointer"
                        />
                        Suffers from chronic constipation
                      </label>
                    </div>
                  </div>

                  {/* Habits */}
                  <div className="space-y-4">
                    <h4 className="text-sm font-bold text-slate-700 dark:text-slate-300">Habits & Social Environment</h4>
                    <div>
                      <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">
                        Smoking Habits
                      </label>
                      <select
                        value={smokingHistory}
                        onChange={(e) => setSmokingHistory(e.target.value)}
                        className="block w-full px-3 py-2 bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/20"
                      >
                        <option value="Never">Never Smoked</option>
                        <option value="Former">Former Smoker</option>
                        <option value="Current">Current Smoker</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">
                        Alcohol Consumption
                      </label>
                      <select
                        value={alcoholUse}
                        onChange={(e) => setAlcoholUse(e.target.value)}
                        className="block w-full px-3 py-2 bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/20"
                      >
                        <option value="Never">Never / Teetotaler</option>
                        <option value="Occasional">Occasional</option>
                        <option value="Regular">Regular</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">
                        Physical Exercise Habits
                      </label>
                      <select
                        value={exerciseHabits}
                        onChange={(e) => setExerciseHabits(e.target.value)}
                        className="block w-full px-3 py-2 bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/20"
                      >
                        <option value="Sedentary">Sedentary (No exercise)</option>
                        <option value="Moderate">Moderate (Walking occasionally)</option>
                        <option value="Active">Active (Regular walking/exercise)</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">
                        Dietary Habits
                      </label>
                      <select
                        value={dietaryHabits}
                        onChange={(e) => setDietaryHabits(e.target.value)}
                        className="block w-full px-3 py-2 bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/20"
                      >
                        <option value="Mixed">Mixed Diet</option>
                        <option value="Vegetarian">Vegetarian</option>
                        <option value="Vegan">Vegan</option>
                        <option value="Special Diabetic/Cardiac">Special Medical Diet</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Task 2.1 — Current Health Issues */}
                <div className="space-y-2 border-t border-slate-100 dark:border-slate-800 pt-4">
                  <h4 className="text-sm font-bold text-slate-700 dark:text-slate-300">Current Health Issues</h4>
                  {[{state:urinaryIncontinence,set:setUrinaryIncontinence,label:'Urinary incontinence'},{state:constipation,set:setConstipation,label:'Constipation'}].map(({state,set,label})=>(
                    <label key={label} className="flex items-center gap-2.5 text-sm text-slate-700 dark:text-slate-350 cursor-pointer">
                      <input type="checkbox" checked={state} onChange={e=>set(e.target.checked)} className="rounded text-teal-600 h-4 w-4 cursor-pointer" />{label}
                    </label>
                  ))}
                  <input value={currentHealthOther} onChange={e=>setCurrentHealthOther(e.target.value)} placeholder="Other health issue (free text)" className="block w-full px-3 py-2 bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 rounded-xl text-sm focus:outline-none" />
                </div>

                {/* Task 2.2 — Betel chewing */}
                <label className="flex items-center gap-2.5 text-sm text-slate-700 dark:text-slate-350 cursor-pointer">
                  <input type="checkbox" checked={betelChewing} onChange={e=>setBetelChewing(e.target.checked)} className="rounded text-teal-600 h-4 w-4 cursor-pointer" />Betel chewing (habit)
                </label>

                {/* Task 2.7 — Vision structured */}
                <div className="space-y-2 border-t border-slate-100 dark:border-slate-800 pt-4">
                  <h4 className="text-sm font-bold text-slate-700 dark:text-slate-300">Vision</h4>
                  {[{state:visionUsesSpectacles,set:setVisionUsesSpectacles,label:'Uses spectacles'},{state:visionDmHtn,set:setVisionDmHtn,label:'DM/HTN complicated'},{state:visionCataractDone,set:setVisionCataractDone,label:'Cataract surgery done'},{state:visionNotAttended,set:setVisionNotAttended,label:'Not attended / unassessed'}].map(({state,set,label})=>(
                    <label key={label} className="flex items-center gap-2.5 text-sm text-slate-700 dark:text-slate-350 cursor-pointer">
                      <input type="checkbox" checked={state} onChange={e=>set(e.target.checked)} className="rounded text-teal-600 h-4 w-4 cursor-pointer" />{label}
                    </label>
                  ))}
                  <div className="grid grid-cols-2 gap-3">
                    <input value={visionSnellenRight} onChange={e=>setVisionSnellenRight(e.target.value)} placeholder="Snellen R (e.g. 6/6)" className="px-3 py-2 bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 rounded-xl text-sm focus:outline-none" />
                    <input value={visionSnellenLeft} onChange={e=>setVisionSnellenLeft(e.target.value)} placeholder="Snellen L (e.g. 6/12)" className="px-3 py-2 bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 rounded-xl text-sm focus:outline-none" />
                  </div>
                </div>

                {/* Task 2.8 — Hearing structured */}
                <div className="space-y-2 border-t border-slate-100 dark:border-slate-800 pt-4">
                  <h4 className="text-sm font-bold text-slate-700 dark:text-slate-300">Hearing</h4>
                  <label className="flex items-center gap-2.5 text-sm text-slate-700 dark:text-slate-350 cursor-pointer">
                    <input type="checkbox" checked={hearingUsesAid} onChange={e=>setHearingUsesAid(e.target.checked)} className="rounded text-teal-600 h-4 w-4 cursor-pointer" />Uses hearing aid
                  </label>
                  <div className="flex gap-4">
                    {[{v:'normal',l:'Normal'},{v:'impaired',l:'Impaired'},{v:'not_tested',l:'Not tested'}].map(o=>(
                      <label key={o.v} className="flex items-center gap-1.5 text-sm text-slate-700 dark:text-slate-350 cursor-pointer">
                        <input type="radio" name="whisperTest" value={o.v} checked={hearingWhisperTest===o.v} onChange={()=>setHearingWhisperTest(o.v)} className="text-teal-600" />{o.l}
                      </label>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {step === 3 && (
              <div className="space-y-6">
                <div className="flex items-center gap-2 border-b border-slate-100 dark:border-slate-850 pb-2">
                  <span className="bg-teal-50 dark:bg-teal-950/40 p-2 rounded-lg text-teal-600">
                    <Users className="h-5 w-5" />
                  </span>
                  <h3 className="font-bold text-slate-800 dark:text-white">Medical Conditions & Medications</h3>
                </div>

                <div className="space-y-4">
                  <div>
                    <span className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                      Common Geriatric Medical Conditions (Check all that apply)
                    </span>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50 dark:bg-slate-800/35 p-4 border border-slate-250 dark:border-slate-800 rounded-2xl">
                      {['Diabetes', 'Hypertension', 'Asthma', 'Heart Disease', 'Arthritis', 'Osteoporosis', 'Chronic Kidney Disease', 'Stroke'].map((c) => {
                        const checked = selectedConditions.includes(c);
                        return (
                          <button
                            key={c}
                            type="button"
                            onClick={() => toggleCondition(c)}
                            className={`px-3 py-2 rounded-xl text-xs font-semibold border text-left flex items-center justify-between transition-all duration-200 cursor-pointer ${
                              checked
                                ? 'bg-teal-50 border-teal-500 text-teal-700 dark:bg-teal-950/30 dark:text-teal-400'
                                : 'bg-white border-slate-200 text-slate-600 dark:bg-slate-900 dark:border-slate-800 dark:text-slate-300'
                            }`}
                          >
                            {c}
                            {checked && <Check className="h-3.5 w-3.5" />}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Allergies list */}
                    <div className="space-y-3 bg-slate-50 dark:bg-slate-800/20 border border-slate-250/60 dark:border-slate-800/40 p-5 rounded-2xl">
                      <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Allergies</h4>
                      <div className="flex gap-2">
                        <select
                          value={newAllergyType}
                          onChange={(e) => setNewAllergyType(e.target.value)}
                          className="bg-white border border-slate-200 dark:bg-slate-900 dark:border-slate-850 px-2 py-1 rounded text-xs focus:outline-none"
                        >
                          <option value="Drug">Drug</option>
                          <option value="Food">Food</option>
                          <option value="Environmental">Env</option>
                        </select>
                        <input
                          type="text"
                          placeholder="Allergy details (e.g. Penicillin)"
                          value={newAllergyDesc}
                          onChange={(e) => setNewAllergyDesc(e.target.value)}
                          className="flex-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-850 px-2.5 py-1 rounded text-xs focus:outline-none"
                        />
                        <button
                          type="button"
                          onClick={handleAddAllergy}
                          className="px-3 py-1 bg-teal-600 hover:bg-teal-700 text-white rounded font-bold text-xs cursor-pointer"
                        >
                          Add
                        </button>
                      </div>
                      <ul className="space-y-1 max-h-32 overflow-y-auto">
                        {allergies.map((allergy, i) => (
                          <li
                            key={i}
                            className="flex justify-between items-center bg-white dark:bg-slate-900 px-3 py-1.5 rounded-lg border border-slate-100 dark:border-slate-850 text-xs"
                          >
                            <span className="font-semibold text-slate-700 dark:text-slate-350">
                              [{allergy.type}] {allergy.description}
                            </span>
                            <button
                              type="button"
                              onClick={() => handleRemoveAllergy(i)}
                              className="text-red-500 hover:text-red-700 font-bold"
                            >
                              &times;
                            </button>
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* Medications List */}
                    <div className="space-y-3 bg-slate-50 dark:bg-slate-800/20 border border-slate-250/60 dark:border-slate-800/40 p-5 rounded-2xl">
                      <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Current Medications</h4>
                      <div className="space-y-2">
                        <div className="flex gap-2">
                          <input
                            type="text"
                            placeholder="Name (e.g. Metformin)"
                            value={newMedName}
                            onChange={(e) => setNewMedName(e.target.value)}
                            className="w-1/2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-850 px-2.5 py-1 rounded text-xs focus:outline-none"
                          />
                          <input
                            type="text"
                            placeholder="Dosage (500mg)"
                            value={newMedDosage}
                            onChange={(e) => setNewMedDosage(e.target.value)}
                            className="w-1/4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-850 px-2 py-1 rounded text-xs focus:outline-none"
                          />
                          <input
                            type="text"
                            placeholder="Freq (Daily)"
                            value={newMedFreq}
                            onChange={(e) => setNewMedFreq(e.target.value)}
                            className="w-1/4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-850 px-2 py-1 rounded text-xs focus:outline-none"
                          />
                        </div>
                        <button
                          type="button"
                          onClick={handleAddMedication}
                          className="w-full py-1 bg-teal-600 hover:bg-teal-700 text-white rounded font-bold text-xs cursor-pointer"
                        >
                          Add Medication
                        </button>
                      </div>
                      <ul className="space-y-1 max-h-32 overflow-y-auto">
                        {medications.map((med, i) => (
                          <li
                            key={i}
                            className="flex justify-between items-center bg-white dark:bg-slate-900 px-3 py-1.5 rounded-lg border border-slate-100 dark:border-slate-850 text-xs"
                          >
                            <span className="font-semibold text-slate-700 dark:text-slate-350">
                              {med.name} — {med.dosage} ({med.frequency})
                            </span>
                            <button
                              type="button"
                              onClick={() => handleRemoveMedication(i)}
                              className="text-red-500 hover:text-red-700 font-bold"
                            >
                              &times;
                            </button>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  {/* Surgical History */}
                  <div className="space-y-3 bg-slate-50 dark:bg-slate-800/20 border border-slate-250/60 dark:border-slate-800/40 p-5 rounded-2xl">
                    <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Surgical History</h4>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        placeholder="Description (e.g. Bypass surgery)"
                        value={newSurgDesc}
                        onChange={(e) => setNewSurgDesc(e.target.value)}
                        className="flex-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-850 px-2.5 py-1 rounded text-xs focus:outline-none"
                      />
                      <input
                        type="date"
                        value={newSurgDate}
                        onChange={(e) => setNewSurgDate(e.target.value)}
                        className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-850 px-2 py-1 rounded text-xs focus:outline-none"
                      />
                      <button
                        type="button"
                        onClick={handleAddSurgery}
                        className="px-4 py-1 bg-teal-600 hover:bg-teal-700 text-white rounded font-bold text-xs cursor-pointer"
                      >
                        Add Surgery
                      </button>
                    </div>
                    <ul className="space-y-1 max-h-32 overflow-y-auto">
                      {surgeries.map((surg, i) => (
                        <li
                          key={i}
                          className="flex justify-between items-center bg-white dark:bg-slate-900 px-3 py-1.5 rounded-lg border border-slate-100 dark:border-slate-850 text-xs"
                        >
                          <span className="font-semibold text-slate-700 dark:text-slate-350">
                            {surg.description} ({new Date(surg.date).toLocaleDateString()})
                          </span>
                          <button
                            type="button"
                            onClick={() => handleRemoveSurgery(i)}
                            className="text-red-500 hover:text-red-700 font-bold"
                          >
                            &times;
                          </button>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            )}

            {step === 4 && (
              <div className="space-y-6">
                <div className="flex items-center gap-2 border-b border-slate-100 dark:border-slate-850 pb-2">
                  <span className="bg-teal-50 dark:bg-teal-950/40 p-2 rounded-lg text-teal-600">
                    <Users className="h-5 w-5" />
                  </span>
                  <h3 className="font-bold text-slate-800 dark:text-white">Social Profile & Caregiver Info</h3>
                </div>

                <div className="space-y-5">
                  {/* Task 2.3 — Living status */}
                  <div className="space-y-2">
                    <h4 className="text-sm font-bold text-slate-700 dark:text-slate-300">Living Arrangement</h4>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                      {[{v:'with_spouse',l:'With spouse'},{v:'with_family',l:'With family'},{v:'with_caregiver',l:'With caregiver'},{v:'alone',l:'Alone'},{v:'care_home',l:'Care home'},{v:'other',l:'Other'}].map(o=>(
                        <label key={o.v} className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-350 cursor-pointer bg-slate-50 dark:bg-slate-800/40 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700">
                          <input type="radio" name="livingStatus" value={o.v} checked={livingStatus===o.v} onChange={()=>setLivingStatus(o.v)} className="text-teal-600" />{o.l}
                        </label>
                      ))}
                    </div>
                    {livingStatus==='other' && <input value={livingStatusOther} onChange={e=>setLivingStatusOther(e.target.value)} placeholder="Specify living arrangement" className="block w-full px-3 py-2 bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 rounded-xl text-sm focus:outline-none" />}
                  </div>

                  {/* Task 2.4 — Independence + social frequency */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div>
                      <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Independence Level</label>
                      <select value={independenceLevel} onChange={e=>setIndependenceLevel(e.target.value)} className="block w-full px-3 py-2 bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 rounded-xl text-sm focus:outline-none">
                        <option value="">Select…</option>
                        <option value="independent">Independent</option>
                        <option value="dependent">Dependent</option>
                        <option value="bed_bound">Bed-bound</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Outside Visit Frequency</label>
                      <select value={outsideVisitFrequency} onChange={e=>setOutsideVisitFrequency(e.target.value)} className="block w-full px-3 py-2 bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 rounded-xl text-sm focus:outline-none">
                        <option value="">Select…</option>
                        <option value="more_than_3_per_week">&gt;3 times/week</option>
                        <option value="once_per_week">Once a week</option>
                        <option value="once_per_month">Once a month</option>
                        <option value="rarely">Rarely</option>
                        <option value="never">Never</option>
                      </select>
                    </div>
                  </div>

                  {/* Task 2.5 — Spiritual */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5 border-t border-slate-100 dark:border-slate-800 pt-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Religion</label>
                      <input value={spiritualReligion} onChange={e=>setSpiritualReligion(e.target.value)} placeholder="e.g. Buddhism, Hinduism, Islam" className="block w-full px-3 py-2 bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 rounded-xl text-sm focus:outline-none" />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Spiritual Attachment</label>
                      <select value={spiritualAttachment} onChange={e=>setSpiritualAttachment(e.target.value)} className="block w-full px-3 py-2 bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 rounded-xl text-sm focus:outline-none">
                        <option value="">Select…</option>
                        <option value="well">Well</option>
                        <option value="moderate">Moderate</option>
                        <option value="mild">Mild</option>
                        <option value="none">None</option>
                      </select>
                    </div>
                  </div>

                  {/* Task 2.6 — Financial */}
                  <div className="space-y-3 border-t border-slate-100 dark:border-slate-800 pt-4">
                    <h4 className="text-sm font-bold text-slate-700 dark:text-slate-300">Financial</h4>
                    <div>
                      <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Monthly Income Bracket</label>
                      <select value={monthlyIncomeBracket} onChange={e=>setMonthlyIncomeBracket(e.target.value)} className="block w-full px-3 py-2 bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 rounded-xl text-sm focus:outline-none">
                        <option value="">Select…</option>
                        <option value="below_10000">Below Rs. 10,000</option>
                        <option value="10000_25000">Rs. 10,000 – 25,000</option>
                        <option value="25000_50000">Rs. 25,000 – 50,000</option>
                        <option value="above_50000">Above Rs. 50,000</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Income Sources (select all that apply)</label>
                      <div className="grid grid-cols-2 gap-2">
                        {[{v:'employed',l:'Employed'},{v:'self_employed',l:'Self-employed'},{v:'pension',l:'Pension'},{v:'asvesuma',l:'Asvesuma scheme'},{v:'religious_ngo',l:'Religious org / NGO support'},{v:'family_support',l:'Family support'},{v:'dependent_on_family',l:'Dependent on family'}].map(o=>(
                          <label key={o.v} className="flex items-center gap-2 text-xs text-slate-700 dark:text-slate-350 cursor-pointer">
                            <input type="checkbox" checked={incomeSources.includes(o.v)} onChange={e=>setIncomeSources(e.target.checked?[...incomeSources,o.v]:incomeSources.filter(x=>x!==o.v))} className="rounded text-teal-600 h-3.5 w-3.5" />{o.l}
                          </label>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Keep legacy caregiver section */}
                  {!livesAlone && (
                    <div className="space-y-4 bg-slate-50/40 dark:bg-slate-850/20 border border-slate-200 dark:border-slate-800 p-5 rounded-2xl animate-in slide-in-from-top-3 duration-200">
                      <h4 className="text-sm font-bold text-slate-700 dark:text-slate-300">Designated Caregiver Details</h4>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                          <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">Caregiver Name *</label>
                          <input type="text" required placeholder="Full Name" value={caregiverName} onChange={e=>setCaregiverName(e.target.value)} className="block w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-850 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/20" />
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">Contact Phone *</label>
                          <input type="text" required placeholder="Phone Number" value={caregiverContact} onChange={e=>setCaregiverContact(e.target.value)} className="block w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-850 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/20" />
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">Relationship to Patient *</label>
                          <input type="text" required placeholder="e.g. Son, Daughter, Spouse" value={caregiverRelation} onChange={e=>setCaregiverRelation(e.target.value)} className="block w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-850 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/20" />
                        </div>
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">Caregiver Address *</label>
                        <textarea rows={2} required placeholder="Caregiver physical address..." value={caregiverAddress} onChange={e=>setCaregiverAddress(e.target.value)} className="block w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-850 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/20"></textarea>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {step === 5 && (
              <div className="space-y-6">
                <div className="flex items-center gap-2 border-b border-slate-100 dark:border-slate-850 pb-2">
                  <span className="bg-teal-50 dark:bg-teal-950/40 p-2 rounded-lg text-teal-600">
                    <CheckCircle2 className="h-5 w-5" />
                  </span>
                  <h3 className="font-bold text-slate-800 dark:text-white">Review & Registration Finalization</h3>
                </div>

                <div className="bg-slate-50 dark:bg-slate-850/50 p-6 border border-slate-200 dark:border-slate-800 rounded-3xl space-y-4">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
                    <div>
                      <span className="text-slate-400 uppercase">Patient Name</span>
                      <p className="font-bold text-slate-800 dark:text-white">{fullName}</p>
                    </div>
                    <div>
                      <span className="text-slate-400 uppercase">NIC / National ID</span>
                      <p className="font-bold text-slate-800 dark:text-white">{nic}</p>
                    </div>
                    <div>
                      <span className="text-slate-400 uppercase">Age / Gender</span>
                      <p className="font-bold text-slate-800 dark:text-white">{age} yrs / {patientGender}</p>
                    </div>
                    <div>
                      <span className="text-slate-400 uppercase">Contact Phone</span>
                      <p className="font-bold text-slate-800 dark:text-white">{contactNumber}</p>
                    </div>
                  </div>

                  <div className="border-t border-slate-200 dark:border-slate-800 pt-3">
                    <span className="text-slate-400 text-xs uppercase block mb-1">Medical Conditions Assigned</span>
                    <div className="flex flex-wrap gap-1.5">
                      {selectedConditions.map((c) => (
                        <span
                          key={c}
                          className="bg-teal-50 dark:bg-teal-950/30 text-teal-700 dark:text-teal-400 text-xs px-2.5 py-0.5 rounded-full border border-teal-100 dark:border-teal-900/30 font-semibold"
                        >
                          {c}
                        </span>
                      ))}
                      {selectedConditions.length === 0 && (
                        <span className="text-xs text-slate-400 italic">None selected</span>
                      )}
                    </div>
                  </div>

                  <div className="border-t border-slate-200 dark:border-slate-800 pt-3 text-xs grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <span className="text-slate-400 uppercase block">Allergies ({allergies.length})</span>
                      <p className="text-slate-700 dark:text-slate-350">
                        {allergies.map((a) => `${a.type}: ${a.description}`).join(', ') || 'No allergies recorded.'}
                      </p>
                    </div>
                    <div>
                      <span className="text-slate-400 uppercase block">Medications ({medications.length})</span>
                      <p className="text-slate-700 dark:text-slate-350">
                        {medications.map((m) => m.name).join(', ') || 'No medications recorded.'}
                      </p>
                    </div>
                  </div>

                  <div className="border-t border-slate-200 dark:border-slate-800 pt-3 text-xs">
                    <span className="text-slate-400 uppercase block">Social Arrangement</span>
                    <p className="text-slate-700 dark:text-slate-350">
                      {livesAlone ? (
                        <span className="font-bold text-amber-600">Patient lives alone.</span>
                      ) : (
                        <span>
                          Lives with caregiver: <strong>{caregiverName}</strong> ({caregiverRelation}) | Phone: {caregiverContact}
                        </span>
                      )}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Stepper Navigation Buttons */}
          <div className="px-8 py-5 bg-slate-50 dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 flex justify-between">
            <button
              type="button"
              disabled={step === 1}
              onClick={() => setStep(step - 1)}
              className="flex items-center gap-2 px-4 py-2 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400 disabled:opacity-50 text-sm font-semibold rounded-xl cursor-pointer disabled:cursor-not-allowed"
            >
              <ArrowLeft className="h-4.5 w-4.5" />
              Previous
            </button>

            {step < 5 ? (
              <button
                type="button"
                onClick={() => {
                  // Basic validation
                  if (step === 1 && (!fullName || !dob || !age || !patientGender || !nic || !maritalStatus || !contactNumber || !selectedCampId)) {
                    toast.error('Please fill in all demographics fields.');
                    return;
                  }
                  if (step === 4 && !livesAlone && (!caregiverName || !caregiverContact || !caregiverRelation || !caregiverAddress)) {
                    toast.error('Please fill in caregiver details or check lives alone.');
                    return;
                  }
                  setStep(step + 1);
                }}
                className="flex items-center gap-2 bg-teal-600 hover:bg-teal-700 text-white font-semibold px-5 py-2.5 rounded-xl text-sm transition-all duration-200 cursor-pointer shadow-md shadow-teal-500/10"
              >
                Next Step
                <ArrowRight className="h-4.5 w-4.5" />
              </button>
            ) : (
              <button
                type="button"
                onClick={handleRegister}
                disabled={createPatientMutation.isPending}
                className="flex items-center gap-2 bg-teal-600 hover:bg-teal-700 text-white font-semibold px-6 py-2.5 rounded-xl text-sm transition-all duration-200 cursor-pointer shadow-md shadow-teal-500/10"
              >
                {createPatientMutation.isPending ? 'Registering...' : 'Complete Registration'}
                <Check className="h-4.5 w-4.5" />
              </button>
            )}
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
