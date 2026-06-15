'use client';

import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import DashboardLayout from '@/components/DashboardLayout';
import {
  ShieldAlert,
  Search,
  Filter,
  RefreshCw,
  User,
  CheckCircle,
  XCircle,
  Clock,
  Globe,
} from 'lucide-react';

export default function AuthLogsPage() {
  const [username, setUsername] = useState('');
  const [success, setSuccess] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Fetch logs
  const { data: logs = [], isLoading, refetch } = useQuery({
    queryKey: ['auth-logs', username, success, startDate, endDate],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (username) params.append('username', username);
      if (success) params.append('success', success);
      if (startDate) params.append('startDate', startDate);
      if (endDate) params.append('endDate', endDate);

      const res = await fetch(`/api/auth-logs?${params.toString()}`);
      if (!res.ok) throw new Error('Failed to fetch auth logs');
      return res.json();
    },
  });

  const clearFilters = () => {
    setUsername('');
    setSuccess('');
    setStartDate('');
    setEndDate('');
  };

  return (
    <DashboardLayout>
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-800 dark:text-white tracking-tight">
            Security & Login Auditing
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Real-time tracking of platform access authorizations, logins, and threat alerts.
          </p>
        </div>
        <button
          onClick={() => refetch()}
          className="flex items-center gap-2 self-start md:self-center bg-white hover:bg-slate-50 dark:bg-slate-900 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 shadow-sm cursor-pointer"
        >
          <RefreshCw className="h-4 w-4" />
          Refresh Access Logs
        </button>
      </div>

      {/* Filter panel */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm space-y-4">
        <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300 font-bold text-sm">
          <Filter className="h-4 w-4 text-teal-600" />
          Filter Security Logs
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">
              Username
            </label>
            <input
              type="text"
              placeholder="Filter by username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="block w-full px-3 py-2 bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/20"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">
              Authorization Status
            </label>
            <select
              value={success}
              onChange={(e) => setSuccess(e.target.value)}
              className="block w-full px-3 py-2 bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/20"
            >
              <option value="">All Authorizations</option>
              <option value="true">Successful Logins</option>
              <option value="false">Failed Attempts</option>
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

      {/* Logs Listing Table */}
      {isLoading ? (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 h-64 animate-pulse"></div>
      ) : logs.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-12 text-center max-w-xl mx-auto space-y-4">
          <div className="inline-flex p-4 bg-teal-50 dark:bg-teal-950/20 text-teal-600 dark:text-teal-400 rounded-full">
            <ShieldAlert className="h-10 w-10" />
          </div>
          <h2 className="text-xl font-bold text-slate-800 dark:text-white">No Login Logs Found</h2>
          <p className="text-slate-500 dark:text-slate-400 text-sm">
            No system authorization records match current filters.
          </p>
        </div>
      ) : (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-800/50 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider border-b border-slate-200 dark:border-slate-800">
                  <th className="px-6 py-4">Event Timestamp</th>
                  <th className="px-6 py-4">Username Submitted</th>
                  <th className="px-6 py-4">Authentication Outcome</th>
                  <th className="px-6 py-4">IP Address</th>
                  <th className="px-6 py-4">Access User Agent</th>
                  <th className="px-6 py-4">Failure Reason</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-850 text-sm">
                {logs.map((log: any) => (
                  <tr
                    key={log._id}
                    className="hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-colors"
                  >
                    <td className="px-6 py-4 text-slate-500 dark:text-slate-400 flex items-center gap-2">
                      <Clock className="h-4 w-4 text-slate-400" />
                      {new Date(log.loginTimestamp).toLocaleString()}
                    </td>
                    <td className="px-6 py-4 font-semibold text-slate-800 dark:text-slate-200 capitalize">
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4 text-slate-400" />
                        {log.username}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {log.success ? (
                        <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-700 bg-emerald-50 dark:bg-emerald-950/30 dark:text-emerald-400 px-2.5 py-0.5 rounded-full">
                          <CheckCircle className="h-3.5 w-3.5" />
                          Authorized
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-rose-700 bg-rose-50 dark:bg-rose-950/30 dark:text-rose-400 px-2.5 py-0.5 rounded-full">
                          <XCircle className="h-3.5 w-3.5" />
                          Denied
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-slate-500 dark:text-slate-400 font-mono text-xs">
                      <div className="flex items-center gap-1.5">
                        <Globe className="h-3.5 w-3.5 text-slate-450" />
                        {log.ipAddress}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-slate-500 dark:text-slate-400 text-xs truncate max-w-[200px]">
                      {log.userAgent}
                    </td>
                    <td className="px-6 py-4">
                      {log.failureReason ? (
                        <span className="text-xs text-rose-600 dark:text-rose-450 font-medium">
                          {log.failureReason}
                        </span>
                      ) : (
                        <span className="text-xs text-slate-400">—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
