'use client';

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useSession } from 'next-auth/react';
import DashboardLayout from '@/components/DashboardLayout';
import {
  Plus,
  Search,
  MapPin,
  Calendar,
  Building2,
  Trash2,
  Edit2,
  RefreshCw,
  FolderOpen,
  X,
  FileText,
  AlertCircle,
} from 'lucide-react';
import { toast } from 'sonner';

export default function CampsPage() {
  const { data: session } = useSession();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCamp, setEditingCamp] = useState<any | null>(null);

  // Form states
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [center, setCenter] = useState('');
  const [district, setDistrict] = useState('');
  const [mohArea, setMohArea] = useState('');
  const [address, setAddress] = useState('');
  const [campDate, setCampDate] = useState('');
  const [organizedBy, setOrganizedBy] = useState('');
  const [campStatus, setCampStatus] = useState<'Planned' | 'Active' | 'Completed' | 'Cancelled'>('Planned');
  const [notes, setNotes] = useState('');

  const isAdmin = session?.user?.role === 'admin';

  // Fetch camps
  const { data: camps = [], isLoading, refetch } = useQuery({
    queryKey: ['camps', search, status],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (search) params.append('search', search);
      if (status) params.append('status', status);
      const res = await fetch(`/api/camps?${params.toString()}`);
      if (!res.ok) throw new Error('Failed to load camps');
      return res.json();
    },
  });

  // Create mutation
  const createMutation = useMutation({
    mutationFn: async (newCamp: any) => {
      const res = await fetch('/api/camps', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newCamp),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to create camp');
      }
      return res.json();
    },
    onSuccess: () => {
      toast.success('Medical camp created successfully!');
      queryClient.invalidateQueries({ queryKey: ['camps'] });
      closeModal();
    },
    onError: (error: any) => {
      toast.error(error.message);
    },
  });

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      const res = await fetch(`/api/camps/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to update camp');
      }
      return res.json();
    },
    onSuccess: () => {
      toast.success('Medical camp updated successfully!');
      queryClient.invalidateQueries({ queryKey: ['camps'] });
      closeModal();
    },
    onError: (error: any) => {
      toast.error(error.message);
    },
  });

  // Soft Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/camps/${id}`, {
        method: 'DELETE',
      });
      if (!res.ok) throw new Error('Failed to delete camp');
      return res.json();
    },
    onSuccess: () => {
      toast.success('Camp archived successfully.');
      queryClient.invalidateQueries({ queryKey: ['camps'] });
    },
  });

  const openCreateModal = () => {
    setEditingCamp(null);
    setName('');
    setCode('');
    setCenter('');
    setDistrict('');
    setMohArea('');
    setAddress('');
    setCampDate('');
    setOrganizedBy('');
    setCampStatus('Planned');
    setNotes('');
    setIsModalOpen(true);
  };

  const openEditModal = (camp: any) => {
    setEditingCamp(camp);
    setName(camp.name);
    setCode(camp.code);
    setCenter(camp.center);
    setDistrict(camp.district);
    setMohArea(camp.mohArea);
    setAddress(camp.address);
    setCampDate(new Date(camp.campDate).toISOString().split('T')[0]);
    setOrganizedBy(camp.organizedBy);
    setCampStatus(camp.status);
    setNotes(camp.notes || '');
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingCamp(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !code || !center || !district || !mohArea || !address || !campDate || !organizedBy) {
      toast.error('Please fill in all required fields.');
      return;
    }

    const payload = {
      name,
      code,
      center,
      district,
      mohArea,
      address,
      campDate: new Date(campDate),
      organizedBy,
      status: campStatus,
      notes,
    };

    if (editingCamp) {
      updateMutation.mutate({ id: editingCamp._id, data: payload });
    } else {
      createMutation.mutate(payload);
    }
  };

  const handleDelete = (id: string) => {
    if (confirm('Are you sure you want to archive this medical camp?')) {
      deleteMutation.mutate(id);
    }
  };

  return (
    <DashboardLayout>
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-800 dark:text-white tracking-tight">
            Medical Camps
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Configure, manage, and coordinate the active elderly medical camp centers.
          </p>
        </div>
        {isAdmin && (
          <button
            onClick={openCreateModal}
            className="flex items-center gap-2 self-start md:self-center bg-teal-600 hover:bg-teal-700 text-white px-5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 shadow-md shadow-teal-500/10 cursor-pointer"
          >
            <Plus className="h-5 w-5" />
            Create Camp
          </button>
        )}
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 shadow-sm flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="relative w-full md:max-w-md">
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
            <Search className="h-5 w-5" />
          </div>
          <input
            type="text"
            placeholder="Search camp by name, code, center, district..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="block w-full pl-11 pr-4 py-2.5 bg-slate-50/50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/20 transition-all duration-200"
          />
        </div>

        <div className="flex gap-4 w-full md:w-auto">
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="block w-full md:w-48 px-3 py-2 bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/20"
          >
            <option value="">All Statuses</option>
            <option value="Planned">Planned</option>
            <option value="Active">Active</option>
            <option value="Completed">Completed</option>
            <option value="Cancelled">Cancelled</option>
          </select>
        </div>
      </div>

      {/* Camps Listing Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-pulse">
          {[1, 2, 3].map((n) => (
            <div key={n} className="h-64 bg-slate-200 dark:bg-slate-800 rounded-3xl"></div>
          ))}
        </div>
      ) : camps.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-12 text-center max-w-xl mx-auto space-y-4">
          <div className="inline-flex p-4 bg-teal-50 dark:bg-teal-950/20 text-teal-600 dark:text-teal-400 rounded-full">
            <FolderOpen className="h-10 w-10" />
          </div>
          <h2 className="text-xl font-bold text-slate-800 dark:text-white">No Camps Found</h2>
          <p className="text-slate-500 dark:text-slate-400 text-sm">
            There are currently no medical camps matching your search or filters. Create one to get started.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {camps.map((camp: any) => {
            const statusColors = {
              Planned: 'bg-indigo-50 text-indigo-700 dark:bg-indigo-950/30 dark:text-indigo-400 border-indigo-100 dark:border-indigo-900/30',
              Active: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400 border-emerald-100 dark:border-emerald-900/30',
              Completed: 'bg-slate-50 text-slate-700 dark:bg-slate-850 dark:text-slate-400 border-slate-200 dark:border-slate-800',
              Cancelled: 'bg-rose-50 text-rose-700 dark:bg-rose-950/30 dark:text-rose-400 border-rose-100 dark:border-rose-900/30',
            };

            return (
              <div
                key={camp._id}
                className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm flex flex-col justify-between hover:shadow-md transition-all duration-200"
              >
                <div className="space-y-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 block mb-0.5">
                        Code: {camp.code}
                      </span>
                      <h2 className="text-lg font-bold text-slate-800 dark:text-white leading-tight">
                        {camp.name}
                      </h2>
                    </div>
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-semibold border ${
                        statusColors[camp.status as keyof typeof statusColors] || 'bg-gray-100'
                      }`}
                    >
                      {camp.status}
                    </span>
                  </div>

                  <div className="space-y-2 text-sm text-slate-600 dark:text-slate-400">
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4.5 w-4.5 text-slate-400 flex-shrink-0" />
                      <span className="truncate">{camp.center}, {camp.district}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4.5 w-4.5 text-slate-400 flex-shrink-0" />
                      <span>{new Date(camp.campDate).toLocaleDateString()}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Building2 className="h-4.5 w-4.5 text-slate-400 flex-shrink-0" />
                      <span className="truncate">Organized by: {camp.organizedBy}</span>
                    </div>
                  </div>

                  {camp.notes && (
                    <div className="bg-slate-50 dark:bg-slate-800/30 border border-slate-100 dark:border-slate-800 rounded-2xl p-3 flex gap-2">
                      <FileText className="h-4 w-4 text-slate-400 flex-shrink-0 mt-0.5" />
                      <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2">
                        {camp.notes}
                      </p>
                    </div>
                  )}
                </div>

                {isAdmin && (
                  <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-slate-100 dark:border-slate-800">
                    <button
                      onClick={() => openEditModal(camp)}
                      className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-xl transition-all duration-200 cursor-pointer"
                      title="Edit Camp"
                    >
                      <Edit2 className="h-4.5 w-4.5" />
                    </button>
                    <button
                      onClick={() => handleDelete(camp._id)}
                      className="p-2 hover:bg-red-50 dark:hover:bg-red-950/20 text-red-600 dark:text-red-400 rounded-xl transition-all duration-200 cursor-pointer"
                      title="Archive Camp"
                    >
                      <Trash2 className="h-4.5 w-4.5" />
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Modal Dialog for Create/Edit */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl animate-in zoom-in-95">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800">
              <h2 className="text-lg font-bold text-slate-800 dark:text-white">
                {editingCamp ? 'Edit Medical Camp' : 'Create New Medical Camp'}
              </h2>
              <button
                onClick={closeModal}
                className="p-1 rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">
                    Camp Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Colombo Elders Outreach"
                    className="block w-full px-3 py-2 bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/20"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">
                    Camp Code *
                  </label>
                  <input
                    type="text"
                    required
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    placeholder="e.g. CAMP003"
                    className="block w-full px-3 py-2 bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/20"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">
                    Camp Center / Venue *
                  </label>
                  <input
                    type="text"
                    required
                    value={center}
                    onChange={(e) => setCenter(e.target.value)}
                    placeholder="e.g. Community Center Hall"
                    className="block w-full px-3 py-2 bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/20"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">
                    District *
                  </label>
                  <input
                    type="text"
                    required
                    value={district}
                    onChange={(e) => setDistrict(e.target.value)}
                    placeholder="e.g. Colombo"
                    className="block w-full px-3 py-2 bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/20"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">
                    MOH Area *
                  </label>
                  <input
                    type="text"
                    required
                    value={mohArea}
                    onChange={(e) => setMohArea(e.target.value)}
                    placeholder="e.g. Colombo Municipal Council"
                    className="block w-full px-3 py-2 bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/20"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">
                    Camp Date *
                  </label>
                  <input
                    type="date"
                    required
                    value={campDate}
                    onChange={(e) => setCampDate(e.target.value)}
                    className="block w-full px-3 py-2 bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/20"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">
                    Organized By *
                  </label>
                  <input
                    type="text"
                    required
                    value={organizedBy}
                    onChange={(e) => setOrganizedBy(e.target.value)}
                    placeholder="e.g. Elders Care Society"
                    className="block w-full px-3 py-2 bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/20"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">
                    Camp Status *
                  </label>
                  <select
                    value={campStatus}
                    onChange={(e) => setCampStatus(e.target.value as any)}
                    className="block w-full px-3 py-2 bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/20"
                  >
                    <option value="Planned">Planned</option>
                    <option value="Active">Active</option>
                    <option value="Completed">Completed</option>
                    <option value="Cancelled">Cancelled</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">
                  Camp Address *
                </label>
                <textarea
                  required
                  rows={2}
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="Full physical address of the venue..."
                  className="block w-full px-3 py-2 bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/20"
                ></textarea>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">
                  Notes / Description
                </label>
                <textarea
                  rows={3}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Any extra details or descriptions regarding this medical camp..."
                  className="block w-full px-3 py-2 bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/20"
                ></textarea>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={closeModal}
                  className="px-4 py-2.5 hover:bg-slate-50 dark:hover:bg-slate-800/50 text-slate-600 dark:text-slate-400 text-sm font-semibold rounded-xl transition-all duration-200 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createMutation.isPending || updateMutation.isPending}
                  className="bg-teal-600 hover:bg-teal-700 text-white font-semibold rounded-xl text-sm px-5 py-2.5 transition-all duration-200 cursor-pointer shadow-md shadow-teal-500/10"
                >
                  {createMutation.isPending || updateMutation.isPending ? 'Saving...' : 'Save Camp'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
