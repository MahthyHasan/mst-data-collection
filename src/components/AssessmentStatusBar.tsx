'use client';

import React from 'react';
import { CheckCircle2, Circle } from 'lucide-react';
import { MODULE_LABELS, AssessmentModule } from '@/lib/schemas';

interface AssessmentStatusBarProps {
  status: Record<AssessmentModule, boolean>;
}

const MODULE_ORDER: AssessmentModule[] = ['checkup', 'fall', 'gds', 'minicog', 'adl', 'iadl'];

export default function AssessmentStatusBar({ status }: AssessmentStatusBarProps) {
  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 shadow-sm">
      <h2 className="text-sm font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-3">
        Assessment Completion Status
      </h2>
      <div className="flex flex-wrap gap-2">
        {MODULE_ORDER.map((module) => {
          const done = status[module];
          return (
            <div
              key={module}
              className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold border ${
                done
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-400 dark:border-emerald-900/40'
                  : 'bg-slate-50 text-slate-500 border-slate-200 dark:bg-slate-850 dark:text-slate-400 dark:border-slate-800'
              }`}
            >
              {done ? (
                <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
              ) : (
                <Circle className="h-4 w-4 text-slate-400" />
              )}
              <span>{MODULE_LABELS[module]}</span>
              <span className={`ml-1 ${done ? 'text-emerald-600' : 'text-slate-400'}`}>
                {done ? 'Done' : 'Pending'}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
