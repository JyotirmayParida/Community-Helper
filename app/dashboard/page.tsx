'use client';

import React from 'react';
import { useAuth } from '@/hooks/use-auth';
import { BarChart3, Info } from 'lucide-react';

export default function DashboardPage() {
  const { user, signInWithGoogle, loading } = useAuth();

  if (loading) {
    return (
      <div className="py-24 flex flex-col items-center justify-center gap-2">
        <div className="w-8 h-8 rounded-full border-2 border-stone-400 border-t-stone-800 animate-spin" />
        <span className="text-xs font-mono tracking-wider text-stone-500 uppercase">Synchronizing Live Logs...</span>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="max-w-md mx-auto my-12 border border-[#1C1A17] p-8 bg-[#F4F3EF] text-center rounded-sm shadow-[4px_4px_0px_0px_#1C1A17]">
        <h3 className="font-serif text-2xl font-black uppercase tracking-wide mb-4">Access Denied</h3>
        <p className="text-sm text-stone-600 mb-6 font-serif italic">
          &ldquo;The state board metrics require a validated citizen profile.&rdquo;
        </p>
        <button
          onClick={signInWithGoogle}
          className="w-full py-3 font-serif text-sm border border-[#1C1A17] bg-[#1C1A17] text-[#FAF9F6] rounded-sm hover:bg-[#1C1A17]/90 active:translate-y-px transition-all shadow-[4px_4px_0px_0px_#D6D3D1] uppercase tracking-wider font-bold"
        >
          Sign In with Google
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      {/* Page Title Plaque */}
      <div className="border-b border-[#1C1A17] pb-4 space-y-2">
        <div className="flex items-center gap-2 text-stone-600">
          <BarChart3 className="w-5 h-5 text-[#1C1A17]" />
          <span className="font-mono text-xs uppercase tracking-widest">Live Ledger</span>
        </div>
        <h2 className="font-serif text-3xl sm:text-4xl font-black uppercase tracking-tight">
          Municipal Status Board
        </h2>
      </div>

      {/* Editorial Announcement Style Placeholder */}
      <div className="border border-[#1C1A17] p-8 bg-[#FAF9F6] space-y-6 relative rounded-sm shadow-[3px_3px_0px_0px_#1C1A17]">
        <div className="space-y-4">
          <h3 className="font-serif text-xl font-bold italic text-stone-800">
            Municipal Ledgers Synchronized
          </h3>
          <p className="text-stone-700 text-sm leading-relaxed font-sans">
            You are authorized to view active dispatches. This board will serve as the live ledger 
            for the whole platform, detailing category distributions, SLA compliance metrics, and interactive 
            gemini-driven AI insights on local reporting patterns.
          </p>
        </div>

        <div className="border-t border-[#1C1A17]/10 pt-4 flex items-start gap-2.5 font-mono text-[11px] text-stone-500 uppercase tracking-wider">
          <Info className="w-4 h-4 text-[#1C1A17] shrink-0" />
          <span>STAGED MODULE — LEDGER SYNC ACTIVE</span>
        </div>
      </div>
    </div>
  );
}
