'use client';

import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import DashboardLayout from '@/components/DashboardLayout';
import {
  Users,
  Hospital,
  Activity,
  UserCheck,
  ShieldAlert,
  Frown,
  Brain,
  Filter,
  RefreshCw,
  TrendingUp,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
} from 'recharts';

const COLORS = ['#0d9488', '#0ea5e9', '#f43f5e', '#eab308', '#8b5cf6', '#ec4899'];

export default function DashboardPage() {
  const [campId, setCampId] = useState('');
  const [gender, setGender] = useState('');
  const [ageGroup, setAgeGroup] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Fetch camps for filter
  const { data: camps = [] } = useQuery({
    queryKey: ['camps'],
    queryFn: async () => {
      const res = await fetch('/api/camps');
      if (!res.ok) throw new Error('Failed to fetch camps');
      return res.json();
    },
  });

  // Fetch dashboard stats with filters
  const { data: dashboardData, isLoading, refetch } = useQuery({
    queryKey: ['dashboard', campId, gender, ageGroup, startDate, endDate],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (campId) params.append('campId', campId);
      if (gender) params.append('gender', gender);
      if (ageGroup) params.append('ageGroup', ageGroup);
      if (startDate) params.append('startDate', startDate);
      if (endDate) params.append('endDate', endDate);

      const res = await fetch(`/api/dashboard?${params.toString()}`);
      if (!res.ok) throw new Error('Failed to fetch dashboard data');
      return res.json();
    },
  });

  const clearFilters = () => {
    setCampId('');
    setGender('');
    setAgeGroup('');
    setStartDate('');
    setEndDate('');
  };

  const summary = dashboardData?.summary || {
    totalPatients: 0,
    todayRegistrations: 0,
    totalCamps: 0,
    activeEmployees: 0,
    highFallRiskPatients: 0,
    possibleDepressionCases: 0,
    cognitiveImpairmentCases: 0,
  };

  const cards = [
    { name: 'Total Registered', value: summary.totalPatients, icon: Users, color: 'bg-teal-50 text-teal-600 dark:bg-teal-950/30 dark:text-teal-400 border-teal-100 dark:border-teal-900/40' },
    { name: "Today's New Registrations", value: summary.todayRegistrations, icon: TrendingUp, color: 'bg-sky-50 text-sky-600 dark:bg-sky-950/30 dark:text-sky-400 border-sky-100 dark:border-sky-900/40' },
    { name: 'Total Camps', value: summary.totalCamps, icon: Hospital, color: 'bg-indigo-50 text-indigo-600 dark:bg-indigo-950/30 dark:text-indigo-400 border-indigo-100 dark:border-indigo-900/40' },
    { name: 'Active Employees', value: summary.activeEmployees, icon: UserCheck, color: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/30 dark:text-emerald-400 border-emerald-100 dark:border-emerald-900/40' },
    { name: 'High Fall Risk Cases', value: summary.highFallRiskPatients, icon: ShieldAlert, color: 'bg-rose-50 text-rose-600 dark:bg-rose-950/30 dark:text-rose-400 border-rose-100 dark:border-rose-900/40' },
    { name: 'Depression Indicator Cases', value: summary.possibleDepressionCases, icon: Frown, color: 'bg-amber-50 text-amber-600 dark:bg-amber-950/30 dark:text-amber-400 border-amber-100 dark:border-amber-900/40' },
    { name: 'Cognitive Impairment Cases', value: summary.cognitiveImpairmentCases, icon: Brain, color: 'bg-purple-50 text-purple-600 dark:bg-purple-950/30 dark:text-purple-400 border-purple-100 dark:border-purple-900/40' },
  ];

  return (
    <DashboardLayout>
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-800 dark:text-white tracking-tight">
            Dashboard Analytics
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Real-time insights and screenings overview of Elderly Health Camp 2026.
          </p>
        </div>
        <button
          onClick={() => refetch()}
          className="flex items-center gap-2 self-start md:self-center bg-white hover:bg-slate-50 dark:bg-slate-900 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 shadow-sm cursor-pointer"
        >
          <RefreshCw className="h-4 w-4" />
          Refresh Stats
        </button>
      </div>

      {/* Filter panel */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm space-y-4">
        <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300 font-bold text-sm">
          <Filter className="h-4 w-4 text-teal-600" />
          Filter Data Overview
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">
              Medical Camp
            </label>
            <select
              value={campId}
              onChange={(e) => setCampId(e.target.value)}
              className="block w-full px-3 py-2 bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/20"
            >
              <option value="">All Camps</option>
              {camps.map((camp: any) => (
                <option key={camp._id} value={camp._id}>
                  {camp.name} ({camp.code})
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
              Age Group
            </label>
            <select
              value={ageGroup}
              onChange={(e) => setAgeGroup(e.target.value)}
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
              Start Date
            </label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="block w-full px-3 py-2 bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/20"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">
              End Date
            </label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="block w-full px-3 py-2 bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/20"
            />
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

      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 animate-pulse">
          {[1, 2, 3, 4, 5, 6, 7].map((n) => (
            <div key={n} className="h-28 bg-slate-200 dark:bg-slate-800 rounded-2xl"></div>
          ))}
        </div>
      ) : (
        <>
          {/* Stats Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {cards.map((card) => (
              <div
                key={card.name}
                className={`bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm flex items-center justify-between transition-all duration-200 hover:shadow-md`}
              >
                <div className="space-y-1">
                  <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    {card.name}
                  </p>
                  <p className="text-3xl font-extrabold text-slate-800 dark:text-white tracking-tight">
                    {card.value}
                  </p>
                </div>
                <div className={`p-3.5 rounded-2xl border ${card.color}`}>
                  <card.icon className="h-6 w-6" />
                </div>
              </div>
            ))}
          </div>

          {/* Visualizations Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Demographics Card */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm flex flex-col h-[350px]">
              <h2 className="text-base font-bold text-slate-800 dark:text-slate-100 mb-4 flex items-center gap-2">
                <Activity className="h-4 w-4 text-teal-600" />
                Gender & Age Profile
              </h2>
              <div className="flex-1 flex gap-4">
                <div className="w-1/2 h-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={dashboardData?.demographics?.gender || []}
                        cx="50%"
                        cy="50%"
                        innerRadius={50}
                        outerRadius={75}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {(dashboardData?.demographics?.gender || []).map((entry: any, index: number) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="w-1/2 h-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={dashboardData?.demographics?.age || []}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                      <XAxis dataKey="name" fontSize={11} stroke="#94a3b8" />
                      <YAxis fontSize={11} stroke="#94a3b8" />
                      <Tooltip />
                      <Bar dataKey="value" fill="#0ea5e9" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>

            {/* Medical Prevalence & BMI Chart */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm flex flex-col h-[350px]">
              <h2 className="text-base font-bold text-slate-800 dark:text-slate-100 mb-4 flex items-center gap-2">
                <Activity className="h-4 w-4 text-indigo-600" />
                Diabetic, Hypertensive & BMI Profiles
              </h2>
              <div className="flex-1 flex gap-4">
                <div className="w-1/2 h-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={dashboardData?.clinical?.prevalence || []}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                      <XAxis dataKey="name" fontSize={10} stroke="#94a3b8" />
                      <YAxis fontSize={11} stroke="#94a3b8" />
                      <Tooltip />
                      <Bar dataKey="value" fill="#0d9488" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
                <div className="w-1/2 h-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={dashboardData?.clinical?.bmi || []}
                        cx="50%"
                        cy="50%"
                        innerRadius={50}
                        outerRadius={75}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {(dashboardData?.clinical?.bmi || []).map((entry: any, index: number) => (
                          <Cell key={`cell-${index}`} fill={COLORS[(index + 2) % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>

            {/* Fall Risk, Depression & Cognitive Status */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm flex flex-col h-[350px]">
              <h2 className="text-base font-bold text-slate-800 dark:text-slate-100 mb-4 flex items-center gap-2">
                <Activity className="h-4 w-4 text-rose-600" />
                Geriatric Screening Indicators
              </h2>
              <div className="flex-1 grid grid-cols-3 gap-2 h-full">
                <div className="h-full">
                  <p className="text-xs text-center font-bold text-slate-500 uppercase tracking-wider mb-1">
                    Fall Risk
                  </p>
                  <ResponsiveContainer width="100%" height="90%">
                    <PieChart>
                      <Pie
                        data={dashboardData?.risk?.fallRisk || []}
                        cx="50%"
                        cy="50%"
                        outerRadius={55}
                        dataKey="value"
                      >
                        {(dashboardData?.risk?.fallRisk || []).map((entry: any, index: number) => (
                          <Cell key={`cell-${index}`} fill={entry.name === 'High Risk' ? '#f43f5e' : entry.name === 'Moderate Risk' ? '#eab308' : '#0d9488'} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="h-full">
                  <p className="text-xs text-center font-bold text-slate-500 uppercase tracking-wider mb-1">
                    Depression (GDS)
                  </p>
                  <ResponsiveContainer width="100%" height="90%">
                    <PieChart>
                      <Pie
                        data={dashboardData?.risk?.gds || []}
                        cx="50%"
                        cy="50%"
                        outerRadius={55}
                        dataKey="value"
                      >
                        {(dashboardData?.risk?.gds || []).map((entry: any, index: number) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="h-full">
                  <p className="text-xs text-center font-bold text-slate-500 uppercase tracking-wider mb-1">
                    Cognitive (Mini-Cog)
                  </p>
                  <ResponsiveContainer width="100%" height="90%">
                    <PieChart>
                      <Pie
                        data={dashboardData?.risk?.minicog || []}
                        cx="50%"
                        cy="50%"
                        outerRadius={55}
                        dataKey="value"
                      >
                        {(dashboardData?.risk?.minicog || []).map((entry: any, index: number) => (
                          <Cell key={`cell-${index}`} fill={entry.name === 'Normal Screening' ? '#0d9488' : '#a855f7'} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>

            {/* Registrations Trend over Time */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm flex flex-col h-[350px]">
              <h2 className="text-base font-bold text-slate-800 dark:text-slate-100 mb-4 flex items-center gap-2">
                <Activity className="h-4 w-4 text-emerald-600" />
                Registrations Trend Over Time
              </h2>
              <div className="flex-1 h-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={dashboardData?.operational?.registrationsOverTime || []}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="date" fontSize={11} stroke="#94a3b8" />
                    <YAxis fontSize={11} stroke="#94a3b8" />
                    <Tooltip />
                    <Line type="monotone" dataKey="count" stroke="#10b981" strokeWidth={2.5} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </>
      )}
    </DashboardLayout>
  );
}
