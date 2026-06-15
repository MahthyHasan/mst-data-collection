'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Search, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

export default function NicQuickLookup() {
  const router = useRouter();
  const [nic, setNic] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLookup = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = nic.trim().toUpperCase();
    if (!trimmed) {
      toast.error('Please enter a National ID Number (NIC).');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`/api/patients/lookup?nic=${encodeURIComponent(trimmed)}`);
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Patient not found');
      }
      const data = await res.json();
      toast.success(`Found: ${data.fullName}`);
      router.push(`/patients/${data.id}`);
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-gradient-to-r from-teal-600 to-teal-700 dark:from-teal-800 dark:to-teal-900 rounded-3xl p-6 shadow-lg shadow-teal-500/10">
      <div className="mb-3">
        <h2 className="text-lg font-bold text-white">Quick Patient Lookup</h2>
        <p className="text-sm text-teal-100">
          Enter a NIC to go directly to the patient profile — primary workflow for Sections 02–N.
        </p>
      </div>
      <form onSubmit={handleLookup} className="flex gap-3">
        <div className="relative flex-1">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-teal-300">
            <Search className="h-5 w-5" />
          </div>
          <input
            type="text"
            value={nic}
            onChange={(e) => setNic(e.target.value)}
            placeholder="Enter NIC (e.g. 541029384V)"
            disabled={loading}
            className="block w-full pl-12 pr-4 py-3.5 bg-white/95 dark:bg-slate-900/90 border-0 rounded-xl text-sm font-medium text-slate-800 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-white/50"
          />
        </div>
        <button
          type="submit"
          disabled={loading}
          className="flex items-center gap-2 px-6 py-3.5 bg-white hover:bg-teal-50 text-teal-700 font-bold rounded-xl text-sm transition-all duration-200 shadow-sm cursor-pointer disabled:opacity-70 disabled:cursor-not-allowed"
        >
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Searching...
            </>
          ) : (
            'Find Patient'
          )}
        </button>
      </form>
    </div>
  );
}
