'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useSession, signOut } from 'next-auth/react';
import {
  LayoutDashboard,
  Users,
  Hospital,
  UserCog,
  FileSpreadsheet,
  ShieldAlert,
  LogOut,
  Menu,
  X,
  User,
  Activity,
} from 'lucide-react';
import StationSelector from '@/components/StationSelector';

interface SidebarItem {
  name: string;
  href: string;
  icon: React.ComponentType<any>;
  adminOnly?: boolean;
}

const sidebarItems: SidebarItem[] = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Patients', href: '/patients', icon: Users },
  { name: 'Medical Camps', href: '/camps', icon: Hospital },
  { name: 'User Management', href: '/users', icon: UserCog, adminOnly: true },
  { name: 'Audit Logs', href: '/audit-logs', icon: FileSpreadsheet, adminOnly: true },
  { name: 'Auth Logs', href: '/auth-logs', icon: ShieldAlert, adminOnly: true },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { data: session } = useSession();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const userRole = session?.user?.role || 'employee';
  const username = session?.user?.name || 'User';

  const filteredItems = sidebarItems.filter((item) => !item.adminOnly || userRole === 'admin');

  return (
    <div className="flex h-screen bg-gray-50/50 dark:bg-slate-950 overflow-hidden">
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex md:flex-shrink-0">
        <div className="flex flex-col w-64 border-r border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
          <div className="flex items-center gap-3 px-6 h-16 border-b border-slate-200 dark:border-slate-800">
            <Activity className="h-6 w-6 text-teal-600 dark:text-teal-400 animate-pulse" />
            <span className="font-bold text-lg text-slate-800 dark:text-white tracking-wide">
              Medical Camp 2026
            </span>
          </div>

          <div className="flex-1 flex flex-col justify-between py-4 overflow-y-auto">
            <nav className="space-y-1.5 px-4">
              {filteredItems.map((item) => {
                const isActive = pathname.startsWith(item.href);
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={`flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
                      isActive
                        ? 'bg-teal-50 text-teal-700 dark:bg-teal-950/50 dark:text-teal-400 shadow-sm shadow-teal-100/50 dark:shadow-none'
                        : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/50 hover:text-slate-900 dark:hover:text-slate-100'
                    }`}
                  >
                    <item.icon className={`h-5 w-5 ${isActive ? 'text-teal-600 dark:text-teal-400' : 'text-slate-400 dark:text-slate-500'}`} />
                    {item.name}
                  </Link>
                );
              })}
            </nav>

            <StationSelector />

            {/* Profile and Logout */}
            <div className="px-4 border-t border-slate-200 dark:border-slate-800 pt-4">
              <div className="flex items-center gap-3 px-3 py-2 bg-slate-50 dark:bg-slate-800/40 rounded-xl mb-3">
                <div className="h-9 w-9 rounded-full bg-teal-100 dark:bg-teal-950/60 flex items-center justify-center text-teal-700 dark:text-teal-400 font-semibold">
                  <User className="h-5 w-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-slate-800 dark:text-slate-200 truncate capitalize">
                    {username}
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 truncate uppercase tracking-wider font-semibold">
                    {userRole}
                  </p>
                </div>
              </div>

              <button
                onClick={() => signOut({ callbackUrl: '/login' })}
                className="flex w-full items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950/30 transition-all duration-200"
              >
                <LogOut className="h-5 w-5 text-red-500 dark:text-red-400" />
                Log Out
              </button>
            </div>
          </div>
        </div>
      </aside>

      {/* Mobile view container */}
      <div className="flex flex-col flex-1 overflow-hidden">
        {/* Mobile Header */}
        <header className="flex md:hidden items-center justify-between px-6 h-16 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 z-10">
          <div className="flex items-center gap-2">
            <Activity className="h-6 w-6 text-teal-600 dark:text-teal-400" />
            <span className="font-bold text-slate-800 dark:text-white">Medical Camp 2026</span>
          </div>
          <button
            onClick={() => setMobileMenuOpen(true)}
            className="p-1 rounded-lg text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <Menu className="h-6 w-6" />
          </button>
        </header>

        {/* Mobile menu overlay */}
        {mobileMenuOpen && (
          <div className="md:hidden fixed inset-0 flex z-40 bg-slate-900/50 backdrop-blur-sm transition-opacity duration-300">
            <div className="relative flex flex-col w-4/5 max-w-sm bg-white dark:bg-slate-900 h-full shadow-2xl transition-transform duration-300 animate-in slide-in-from-left">
              <div className="absolute top-4 right-4">
                <button
                  onClick={() => setMobileMenuOpen(false)}
                  className="p-1.5 rounded-lg text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="flex items-center gap-3 px-6 h-16 border-b border-slate-200 dark:border-slate-800">
                <Activity className="h-6 w-6 text-teal-600 dark:text-teal-400" />
                <span className="font-bold text-slate-800 dark:text-white">Medical Camp 2026</span>
              </div>

              <div className="flex-1 flex flex-col justify-between py-6 overflow-y-auto">
                <nav className="space-y-1.5 px-4">
                  {filteredItems.map((item) => {
                    const isActive = pathname.startsWith(item.href);
                    return (
                      <Link
                        key={item.name}
                        href={item.href}
                        onClick={() => setMobileMenuOpen(false)}
                        className={`flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
                          isActive
                            ? 'bg-teal-50 text-teal-700 dark:bg-teal-950/50 dark:text-teal-400 shadow-sm'
                            : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/50 hover:text-slate-900 dark:hover:text-slate-100'
                        }`}
                      >
                        <item.icon className="h-5 w-5 text-teal-600 dark:text-teal-400" />
                        {item.name}
                      </Link>
                    );
                  })}
                </nav>

                <StationSelector />

                <div className="px-4">
                  <div className="flex items-center gap-3 px-3 py-2 bg-slate-50 dark:bg-slate-800/40 rounded-xl mb-3">
                    <div className="h-9 w-9 rounded-full bg-teal-100 dark:bg-teal-950/60 flex items-center justify-center text-teal-700 dark:text-teal-400">
                      <User className="h-5 w-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-slate-800 dark:text-slate-200 truncate capitalize">
                        {username}
                      </p>
                      <p className="text-xs text-slate-500 dark:text-slate-400 truncate uppercase tracking-wider font-semibold">
                        {userRole}
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={() => signOut({ callbackUrl: '/login' })}
                    className="flex w-full items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950/30 transition-all duration-200"
                  >
                    <LogOut className="h-5 w-5 text-red-500 dark:text-red-400" />
                    Log Out
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Main Content Area */}
        <main className="flex-1 relative overflow-y-auto focus:outline-none p-6 md:p-8">
          <div className="max-w-7xl mx-auto space-y-6">{children}</div>
        </main>
      </div>
    </div>
  );
}
