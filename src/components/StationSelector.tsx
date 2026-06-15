'use client';

import React, { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useSession } from 'next-auth/react';
import { MapPin } from 'lucide-react';
import { getStationContext, setStationContext, StationContext } from '@/lib/stationContext';

export default function StationSelector() {
  const { data: session } = useSession();
  const [selectedCampId, setSelectedCampId] = useState('');
  const [selectedSection, setSelectedSection] = useState('');
  const [context, setContext] = useState<StationContext | null>(null);

  const isEmployee = session?.user?.role === 'employee';

  const { data: camps = [] } = useQuery({
    queryKey: ['camps', 'active'],
    queryFn: async () => {
      const res = await fetch('/api/camps?status=Active');
      if (!res.ok) throw new Error('Failed to fetch camps');
      return res.json();
    },
    enabled: isEmployee,
  });

  useEffect(() => {
    const stored = getStationContext();
    setContext(stored);
    if (stored) {
      setSelectedCampId(stored.campId);
      setSelectedSection(stored.label);
    }
  }, []);

  if (!isEmployee) return null;

  const activeCamp = camps.find((c: any) => c._id === selectedCampId);
  const sections = activeCamp?.sections || [];

  const handleCampChange = (campId: string) => {
    setSelectedCampId(campId);
    setSelectedSection('');
    if (!campId) {
      setStationContext(null);
      setContext(null);
    }
  };

  const handleSectionChange = (sectionLabel: string) => {
    setSelectedSection(sectionLabel);
    const camp = camps.find((c: any) => c._id === selectedCampId);
    const section = camp?.sections?.find((s: any) => s.label === sectionLabel);
    if (section && selectedCampId) {
      const newContext: StationContext = {
        campId: selectedCampId,
        label: section.label,
        modules: section.modules,
      };
      setStationContext(newContext);
      setContext(newContext);
    } else {
      setStationContext(null);
      setContext(null);
    }
  };

  return (
    <div className="px-4 pb-3 border-b border-slate-200 dark:border-slate-800">
      <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">
        <MapPin className="h-3.5 w-3.5 text-teal-600" />
        My Section
      </div>
      <div className="space-y-2">
        <select
          value={selectedCampId}
          onChange={(e) => handleCampChange(e.target.value)}
          className="block w-full px-3 py-2 bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-teal-500/20"
        >
          <option value="">Select camp...</option>
          {camps.map((camp: any) => (
            <option key={camp._id} value={camp._id}>
              {camp.name}
            </option>
          ))}
        </select>
        {sections.length > 0 && (
          <select
            value={selectedSection}
            onChange={(e) => handleSectionChange(e.target.value)}
            className="block w-full px-3 py-2 bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-teal-500/20"
          >
            <option value="">Select section...</option>
            {sections.map((section: any) => (
              <option key={section.label} value={section.label}>
                {section.label} ({section.modules.join(', ')})
              </option>
            ))}
          </select>
        )}
        {context && (
          <p className="text-[10px] text-teal-600 dark:text-teal-400 font-semibold truncate">
            Active: {context.label}
          </p>
        )}
      </div>
    </div>
  );
}
