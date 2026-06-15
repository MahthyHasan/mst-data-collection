'use client';

import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import DashboardLayout from '@/components/DashboardLayout';
import {
  FileSpreadsheet,
  Search,
  Calendar,
  Filter,
  RefreshCw,
  Eye,
  X,
  Database,
  User,
  Activity,
  Terminal,
} from 'lucide-react';

export default function AuditLogsPage() {
  const [username, setUsername] = useState('');
  const [action, setAction] = useState('');
  const [entityType, setEntityType] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [selectedLog, setSelectedLog] = useState<any | null>(null);

  // Fetch logs
  const { data: logs = [], isLoading, refetch } = useQuery({
    queryKey: ['audit-logs', username, action, entityType, startDate, endDate],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (username) params.append('username', username);
      if (action) params.append('action', action);
      if (entityType) params.append('entityType', entityType);
      if (startDate) params.append('startDate', startDate);
      if (endDate) params.append('endDate', endDate);

      const res = await fetch(`/api/audit-logs?${params.toString()}`);
      if (!res.ok) throw new Error('Failed to fetch audit logs');
      return res.json();
    },
  });

  const clearFilters = () => {
    setUsername('');
    setAction('');
    setEntityType('');
    setStartDate('');
    setEndDate('');
  };

  return (
    <DashboardLayout>
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-800 dark:text-white tracking-tight">
            Audit Trails
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Immutable system operation records logs for security compliance & patient data integrity.
          </p>
        </div>
        <button
          onClick={() => refetch()}
          className="flex items-center gap-2 self-start md:self-center bg-white hover:bg-slate-50 dark:bg-slate-900 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 shadow-sm cursor-pointer"
        >
          <RefreshCw className="h-4 w-4" />
          Refresh Logs
        </button>
      </div>

      {/* Filter panel */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm space-y-4">
        <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300 font-bold text-sm">
          <Filter className="h-4 w-4 text-teal-600" />
          Filter Audit Trail
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-4">
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
              Action
            </label>
            <select
              value={action}
              onChange={(e) => setAction(e.target.value)}
              className="block w-full px-3 py-2 bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/20"
            >
              <option value="">All Actions</option>
              <option value="CREATE">CREATE</option>
              <option value="UPDATE">UPDATE</option>
              <option value="DELETE">DELETE</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">
              Resource Type
            </label>
            <select
              value={entityType}
              onChange={(e) => setEntityType(e.target.value)}
              className="block w-full px-3 py-2 bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/20"
            >
              <option value="">All Resources</option>
              <option value="MedicalCamp">Camp</option>
              <option value="Patient">Patient</option>
              <option value="User">User Account</option>
              <option value="MedicalCheckup">Checkup Assessment</option>
              <option value="FallAssessment">Fall Risk Assessment</option>
              <option value="GdsAssessment">GDS Assessment</option>
              <option value="MinicogAssessment">Mini-Cog Assessment</option>
              <option value="AdlAssessment">ADL Assessment</option>
              <option value="IadlAssessment">IADL Assessment</option>
              <option value="Export">Export Action</option>
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

      {/* Logs Table */}
      {isLoading ? (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 h-64 animate-pulse"></div>
      ) : logs.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-12 text-center max-w-xl mx-auto space-y-4">
          <div className="inline-flex p-4 bg-teal-50 dark:bg-teal-950/20 text-teal-600 dark:text-teal-400 rounded-full">
            <FileSpreadsheet className="h-10 w-10" />
          </div>
          <h2 className="text-xl font-bold text-slate-800 dark:text-white">No Logs Found</h2>
          <p className="text-slate-500 dark:text-slate-400 text-sm">
            No system audit logs found matching the filters.
          </p>
        </div>
      ) : (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-800/50 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider border-b border-slate-200 dark:border-slate-800">
                  <th className="px-6 py-4">Timestamp</th>
                  <th className="px-6 py-4">User</th>
                  <th className="px-6 py-4">Action</th>
                  <th className="px-6 py-4">Resource</th>
                  <th className="px-6 py-4">IP Address</th>
                  <th className="px-6 py-4 text-right">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-850 text-sm">
                {logs.map((log: any) => {
                  const actionColor =
                    log.action === 'CREATE'
                      ? 'text-emerald-700 bg-emerald-50 dark:bg-emerald-950/30 dark:text-emerald-400'
                      : log.action === 'UPDATE'
                      ? 'text-amber-700 bg-amber-50 dark:bg-amber-950/30 dark:text-amber-400'
                      : 'text-rose-700 bg-rose-50 dark:bg-rose-950/30 dark:text-rose-400';

                  return (
                    <tr
                      key={log._id}
                      className="hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-colors"
                    >
                      <td className="px-6 py-4 text-slate-500 dark:text-slate-400">
                        {new Date(log.timestamp).toLocaleString()}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4 text-slate-400" />
                          <span className="font-semibold text-slate-800 dark:text-slate-200 capitalize">
                            {log.username}
                          </span>
                          <span className="text-[10px] font-bold text-slate-400 uppercase">
                            ({log.role})
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${actionColor}`}>
                          {log.action}
                        </span>
                      </td>
                      <td className="px-6 py-4 font-mono text-xs text-slate-600 dark:text-slate-400">
                        {log.entityType} ({log.entityId || 'N/A'})
                      </td>
                      <td className="px-6 py-4 text-slate-500 dark:text-slate-400 font-mono text-xs">
                        {log.ipAddress}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button
                          onClick={() => setSelectedLog(log)}
                          className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-850 text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 rounded-xl transition-all duration-200 cursor-pointer"
                        >
                          <Eye className="h-4.5 w-4.5" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* JSON Viewer Modal */}
      {selectedLog && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-3xl max-h-[85vh] overflow-y-auto shadow-2xl animate-in zoom-in-95 flex flex-col">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <Terminal className="h-5 w-5 text-teal-600" />
                <h2 className="text-lg font-bold text-slate-800 dark:text-white">
                  Audit Log Transaction Details
                </h2>
              </div>
              <button
                onClick={() => setSelectedLog(null)}
                className="p-1 rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-6 space-y-4 overflow-y-auto flex-1 font-mono text-xs">
              <div className="grid grid-cols-2 gap-4 text-sm font-sans mb-4 p-4 bg-slate-50 dark:bg-slate-850 rounded-2xl border border-slate-200/60 dark:border-slate-800">
                <div>
                  <span className="text-slate-400 text-xs block">Action Taken</span>
                  <span className="font-bold text-slate-800 dark:text-white">{selectedLog.action}</span>
                </div>
                <div>
                  <span className="text-slate-400 text-xs block">Timestamp</span>
                  <span className="font-bold text-slate-800 dark:text-white">
                    {new Date(selectedLog.timestamp).toLocaleString()}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 text-xs block">Operating User</span>
                  <span className="font-bold text-slate-800 dark:text-white capitalize">
                    {selectedLog.username} ({selectedLog.role})
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 text-xs block">Resource Details</span>
                  <span className="font-bold text-slate-800 dark:text-white">
                    {selectedLog.entityType} ({selectedLog.entityId || 'N/A'})
                  </span>
                </div>
              </div>

              {selectedLog.changedFields && selectedLog.changedFields.length > 0 && (
                <div>
                  <h3 className="font-sans font-bold text-sm text-slate-700 dark:text-slate-300 mb-1">
                    Modified Columns
                  </h3>
                  <div className="flex flex-wrap gap-2 mb-4">
                    {selectedLog.changedFields.map((field: string) => (
                      <span
                        key={field}
                        className="bg-amber-50 dark:bg-amber-950/20 text-amber-700 dark:text-amber-400 border border-amber-200/50 dark:border-amber-900/40 text-xs px-2.5 py-0.5 rounded-full"
                      >
                        {field}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h3 className="font-sans font-bold text-sm text-slate-700 dark:text-slate-300 mb-1">
                    Previous Values
                  </h3>
                  <pre className="bg-slate-50 dark:bg-slate-950 p-4 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-x-auto text-slate-700 dark:text-slate-300 max-h-64">
                    {selectedLog.oldValues
                      ? JSON.stringify(selectedLog.oldValues, null, 2)
                      : 'None (Record Creation)'}
                  </pre>
                </div>

                <div>
                  <h3 className="font-sans font-bold text-sm text-slate-700 dark:text-slate-300 mb-1">
                    Post Transaction Values
                  </h3>
                  <pre className="bg-slate-50 dark:bg-slate-950 p-4 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-x-auto text-slate-700 dark:text-slate-300 max-h-64">
                    {selectedLog.newValues
                      ? JSON.stringify(selectedLog.newValues, null, 2)
                      : 'None (Record Deletion)'}
                  </pre>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
