'use client';

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/use-auth';
import {
  BarChart3,
  Info,
  Clock,
  Calendar,
  Shield,
  Award,
  AlertTriangle,
  CheckCircle2,
  MapPin,
  FileText,
  User,
  Users,
  Image as ImageIcon,
  ArrowRight,
  RefreshCw
} from 'lucide-react';
import Link from 'next/link';
import { Report } from '@/lib/types';
import { SEVERITY_COLORS } from '@/lib/constants';

export default function DashboardPage() {
  const { user, profile, signInWithGoogle, loading: authLoading } = useAuth();
  const [reports, setReports] = useState<Report[]>([]);
  const [globalReports, setGlobalReports] = useState<Report[]>([]);
  const [loadingData, setLoadingData] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState<'my-reports' | 'community-impact'>('my-reports');

  // Escalation and Insight states
  const [checkingEscalations, setCheckingEscalations] = useState<boolean>(false);
  const [escalationSummary, setEscalationSummary] = useState<string | null>(null);
  const [predictiveInsight, setPredictiveInsight] = useState<string>('');
  const [loadingInsight, setLoadingInsight] = useState<boolean>(false);

  const fetchData = React.useCallback(async () => {
    if (!user) return;
    // defer state change to prevent synchronous setState inside useEffect warnings
    await new Promise((resolve) => setTimeout(resolve, 0));
    setLoadingData(true);
    try {
      // Fetch both my reports specifically and all platform reports for context
      const [myRes, globalRes] = await Promise.all([
        fetch(`/api/reports?citizenId=${user.uid}`),
        fetch('/api/reports')
      ]);

      if (myRes.ok) {
        const myData = await myRes.json();
        setReports(myData || []);
      }

      if (globalRes.ok) {
        const globalData = await globalRes.json();
        setGlobalReports(globalData || []);
      }
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
    } finally {
      setLoadingData(false);
    }
  }, [user]);

  const fetchInsight = React.useCallback(async () => {
    setLoadingInsight(true);
    try {
      const res = await fetch('/api/insights');
      if (res.ok) {
        const data = await res.json();
        setPredictiveInsight(data.insight || 'No insights available.');
      } else {
        setPredictiveInsight('Insights are temporarily unavailable');
      }
    } catch (err) {
      console.error('Error fetching predictive insights:', err);
      setPredictiveInsight('Insights are temporarily unavailable');
    } finally {
      setLoadingInsight(false);
    }
  }, []);

  useEffect(() => {
    if (user) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      fetchData();
      fetchInsight();
    }
  }, [user, fetchData, fetchInsight]);

  const handleCheckEscalations = async () => {
    setCheckingEscalations(true);
    setEscalationSummary(null);
    try {
      const res = await fetch('/api/escalations/check', { method: 'POST' });
      if (res.ok) {
        const data = await res.json();
        setEscalationSummary(data.message || 'Escalations checked successfully.');
        await fetchData();
        setTimeout(() => setEscalationSummary(null), 6000);
      } else {
        const data = await res.json();
        setEscalationSummary(`Error: ${data.error || 'Check failed'}`);
      }
    } catch (err) {
      console.error('Failed to check escalations:', err);
      setEscalationSummary('Failed to contact escalation checker.');
    } finally {
      setCheckingEscalations(false);
    }
  };

  if (authLoading) {
    return (
      <div className="py-24 flex flex-col items-center justify-center gap-2 bg-[#FAF9F6]">
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
          className="w-full py-3 font-serif text-sm border border-[#1C1A17] bg-[#1C1A17] text-[#FAF9F6] rounded-sm hover:bg-[#1C1A17]/90 active:translate-y-px transition-all shadow-[4px_4px_0px_0px_#D6D3D1] uppercase tracking-wider font-bold cursor-pointer"
        >
          Sign In with Google
        </button>
      </div>
    );
  }

  // Personal statistics
  const totalUserReports = reports.length;
  const highSeverityUserReports = reports.filter((r) => r.severity === 'HIGH' || r.severity === 'SEVERE').length;
  const resolvedUserReports = reports.filter((r) => r.status === 'resolved').length;

  // Community-wide aggregate statistics
  const totalGlobalReports = globalReports.length;
  const resolvedGlobalReports = globalReports.filter((r) => r.status === 'resolved').length;
  const resolutionRate = totalGlobalReports > 0
    ? Math.round((resolvedGlobalReports / totalGlobalReports) * 100)
    : 0;

  // Breakdown of open reports by category and department
  const openGlobalReports = globalReports.filter((r) => r.status !== 'resolved');
  
  const categoryBreakdown: Record<string, number> = {};
  const departmentBreakdown: Record<string, number> = {};

  openGlobalReports.forEach((r) => {
    const cat = r.category || 'Uncategorized';
    categoryBreakdown[cat] = (categoryBreakdown[cat] || 0) + 1;

    const dept = r.department || 'AWAITING DISPATCH';
    departmentBreakdown[dept] = (departmentBreakdown[dept] || 0) + 1;
  });

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      {/* Page Title Plaque */}
      <div className="border-b border-[#1C1A17] pb-4 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-stone-600">
            <BarChart3 className="w-5 h-5 text-[#1C1A17]" />
            <span className="font-mono text-xs uppercase tracking-widest">Live Ledger</span>
          </div>
          <h2 className="font-serif text-3xl sm:text-4xl font-black uppercase tracking-tight">
            Municipal Status Board
          </h2>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {escalationSummary && (
            <div className="px-3 py-1.5 bg-[#F4F3EF] border border-[#1C1A17] font-mono text-[9px] uppercase text-[#1C1A17] rounded-sm animate-pulse">
              {escalationSummary}
            </div>
          )}
          <button
            onClick={handleCheckEscalations}
            disabled={checkingEscalations}
            className="px-4 py-2 font-mono text-xs border border-[#1C1A17] bg-[#1C1A17] text-[#FAF9F6] hover:bg-stone-800 rounded-sm active:translate-y-px transition-all shadow-[2px_2px_0px_0px_#1C1A17] flex items-center gap-1.5 uppercase cursor-pointer"
          >
            <Shield className={`w-3.5 h-3.5 ${checkingEscalations ? 'animate-pulse' : ''}`} />
            <span>{checkingEscalations ? 'Checking...' : 'Check for Escalations'}</span>
          </button>
          <button
            onClick={fetchData}
            disabled={loadingData}
            className="px-4 py-2 font-mono text-xs border border-[#1C1A17] bg-[#FAF9F6] text-[#1C1A17] hover:bg-stone-100 rounded-sm active:translate-y-px transition-all shadow-[2px_2px_0px_0px_#1C1A17] flex items-center gap-1.5 uppercase cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loadingData ? 'animate-spin' : ''}`} />
            <span>Refresh Ledger</span>
          </button>
        </div>
      </div>

      {/* Editorial Overview Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="border border-[#1C1A17] p-4 bg-[#FAF9F6] rounded-sm shadow-[3px_3px_0px_0px_#1C1A17] flex items-center justify-between">
          <div className="space-y-1">
            <span className="font-mono text-[10px] uppercase text-stone-500 tracking-wider block">My Total Reports</span>
            <span className="font-serif text-3xl font-black">{totalUserReports}</span>
          </div>
          <div className="p-2.5 bg-stone-100 border border-stone-200 rounded-sm">
            <FileText className="w-5 h-5 text-stone-800" />
          </div>
        </div>

        <div className="border border-[#1C1A17] p-4 bg-[#FAF9F6] rounded-sm shadow-[3px_3px_0px_0px_#1C1A17] flex items-center justify-between">
          <div className="space-y-1">
            <span className="font-mono text-[10px] uppercase text-stone-500 tracking-wider block">Honorary Points</span>
            <span className="font-serif text-3xl font-black text-amber-600">{profile?.points || 0}</span>
          </div>
          <div className="p-2.5 bg-amber-50 border border-amber-200 rounded-sm">
            <Award className="w-5 h-5 text-amber-600" />
          </div>
        </div>

        <div className="border border-[#1C1A17] p-4 bg-[#FAF9F6] rounded-sm shadow-[3px_3px_0px_0px_#1C1A17] flex items-center justify-between">
          <div className="space-y-1">
            <span className="font-mono text-[10px] uppercase text-stone-500 tracking-wider block">Critical Dispatches</span>
            <span className="font-serif text-3xl font-black text-rose-600">{highSeverityUserReports}</span>
          </div>
          <div className="p-2.5 bg-rose-50 border border-rose-200 rounded-sm">
            <AlertTriangle className="w-5 h-5 text-rose-600" />
          </div>
        </div>

        <div className="border border-[#1C1A17] p-4 bg-[#FAF9F6] rounded-sm shadow-[3px_3px_0px_0px_#1C1A17] flex items-center justify-between">
          <div className="space-y-1">
            <span className="font-mono text-[10px] uppercase text-stone-500 tracking-wider block">Resolved Issues</span>
            <span className="font-serif text-3xl font-black text-emerald-600">{resolvedUserReports}</span>
          </div>
          <div className="p-2.5 bg-emerald-50 border border-emerald-200 rounded-sm">
            <CheckCircle2 className="w-5 h-5 text-emerald-600" />
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-[#1C1A17] flex gap-2">
        <button
          onClick={() => setActiveTab('my-reports')}
          className={`px-4 py-2 font-mono text-xs uppercase tracking-wider border border-[#1C1A17] border-b-0 rounded-t-sm transition-all cursor-pointer ${
            activeTab === 'my-reports'
              ? 'bg-[#FAF9F6] font-bold text-[#1C1A17] translate-y-px z-10'
              : 'bg-stone-200/60 text-stone-500 hover:bg-stone-100 hover:text-stone-800'
          }`}
        >
          My Reports Timeline ({totalUserReports})
        </button>
        <button
          onClick={() => setActiveTab('community-impact')}
          className={`px-4 py-2 font-mono text-xs uppercase tracking-wider border border-[#1C1A17] border-b-0 rounded-t-sm transition-all cursor-pointer ${
            activeTab === 'community-impact'
              ? 'bg-[#FAF9F6] font-bold text-[#1C1A17] translate-y-px z-10'
              : 'bg-stone-200/60 text-stone-500 hover:bg-stone-100 hover:text-stone-800'
          }`}
        >
          Community Impact Dashboard
        </button>
      </div>

      {activeTab === 'my-reports' ? (
        <div className="space-y-6">
          {loadingData ? (
            <div className="border border-[#1C1A17] p-12 bg-[#FAF9F6] text-center rounded-sm">
              <div className="w-8 h-8 rounded-full border-2 border-stone-400 border-t-stone-800 animate-spin mx-auto mb-4" />
              <span className="text-xs font-mono tracking-wider text-stone-500 uppercase">Collating Personal Records...</span>
            </div>
          ) : reports.length === 0 ? (
            <div className="border border-[#1C1A17] p-12 bg-[#FAF9F6] text-center rounded-sm space-y-4">
              <p className="font-serif italic text-stone-600 text-lg">
                &ldquo;Your portfolio does not currently contain any logged municipal reports.&rdquo;
              </p>
              <p className="text-xs font-mono text-stone-500 uppercase max-w-md mx-auto">
                Once you file local hazards, trash piles, or public safety issues via the reporter, their live processing and auditing details will populate here.
              </p>
              <Link
                href="/report"
                className="inline-block px-5 py-2.5 font-serif text-xs uppercase tracking-wider bg-[#1C1A17] text-[#FAF9F6] hover:bg-[#1C1A17]/90 active:translate-y-px transition-all rounded-sm shadow-[3px_3px_0px_0px_#D6D3D1]"
              >
                Submit Your First Report
              </Link>
            </div>
          ) : (
            <div className="space-y-6">
              {reports.map((report) => {
                const color = SEVERITY_COLORS[report.severity as keyof typeof SEVERITY_COLORS] || '#10B981';
                const confirmCount = report.confirmations?.length || 0;

                return (
                  <div
                    key={report.id}
                    className="border border-[#1C1A17] bg-[#FAF9F6] rounded-sm p-6 shadow-[4px_4px_0px_0px_#1C1A17] space-y-6 transition-all hover:-translate-y-0.5 duration-200"
                  >
                    {/* Report Header Block */}
                    <div className="border-b border-[#1C1A17]/10 pb-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
                      <div className="space-y-1.5">
                        <div className="flex items-center flex-wrap gap-2">
                          <span className="font-mono text-[10px] text-stone-500 uppercase tracking-widest">
                            ID: {report.id.substring(0, 8)}...
                          </span>
                          <span className="font-mono text-[10px] text-stone-400">•</span>
                          <span className="font-mono text-[10px] text-stone-500 flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {new Date(report.createdAt).toLocaleDateString('en-US', {
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </span>
                        </div>
                        <h3 className="font-serif text-2xl font-black uppercase tracking-tight leading-tight">
                          {report.category}
                        </h3>
                      </div>

                      {/* Status and Severity Badges */}
                      <div className="flex flex-wrap items-center gap-2">
                        <span
                          className="px-2.5 py-1 text-xs font-mono uppercase font-bold tracking-wider rounded-sm border"
                          style={{
                            backgroundColor: `${color}15`,
                            color: color,
                            borderColor: `${color}40`,
                          }}
                        >
                          Severity: {report.severity}
                        </span>
                        <span className="px-2.5 py-1 text-xs font-mono uppercase bg-stone-100 text-stone-800 border border-stone-200 rounded-sm">
                          {report.status}
                        </span>
                        {confirmCount > 0 && (
                          <span className="px-2.5 py-1 text-xs font-mono uppercase bg-stone-800 text-[#FAF9F6] border border-stone-800 rounded-sm">
                            ✓ {confirmCount} Confirmations
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Report Details Body */}
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                      {/* Photo Container */}
                      <div className="lg:col-span-4 space-y-2">
                        <div className="border border-[#1C1A17] bg-stone-100 rounded-sm overflow-hidden aspect-video sm:aspect-[4/3] relative shadow-[2px_2px_0px_0px_#1C1A17]">
                          {report.mediaUrl ? (
                            <img
                              src={report.mediaUrl}
                              alt={report.category}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex flex-col items-center justify-center text-stone-400">
                              <ImageIcon className="w-8 h-8 mb-1" />
                              <span className="text-xs font-mono uppercase">No image file</span>
                            </div>
                          )}
                        </div>
                        <div className="flex items-center gap-1.5 font-mono text-[10px] text-stone-500 uppercase">
                          <MapPin className="w-3.5 h-3.5 text-stone-600 shrink-0" />
                          <span>
                            {report.geo?.lat?.toFixed(5)}, {report.geo?.lng?.toFixed(5)}
                          </span>
                        </div>
                      </div>

                      {/* Description & Metadata */}
                      <div className="lg:col-span-8 space-y-4">
                        {report.description && (
                          <div className="space-y-1">
                            <span className="font-mono text-[10px] uppercase tracking-wider text-stone-500 block">
                              Citizen Notes:
                            </span>
                            <p className="text-stone-800 font-serif italic text-sm leading-relaxed border-l-2 border-stone-300 pl-3">
                              &ldquo;{report.description}&rdquo;
                            </p>
                          </div>
                        )}

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-[#F4F3EF] p-4 border border-[#1C1A17]/10 rounded-sm font-mono text-xs">
                          <div>
                            <span className="text-stone-500 uppercase block text-[9px] tracking-wider">Assigned Department</span>
                            <span className="font-serif font-bold text-stone-800 uppercase text-sm">
                              {report.department || 'AWAITING DISPATCH'}
                            </span>
                          </div>
                          <div>
                            <span className="text-stone-500 uppercase block text-[9px] tracking-wider">SLA Urgency Level</span>
                            <span className="font-bold text-stone-800 uppercase">
                              {report.priority || 'EVALUATING'}
                            </span>
                          </div>
                        </div>

                        {/* Status History Timeline */}
                        <div className="space-y-3">
                          <div className="flex items-center gap-1.5 border-b border-[#1C1A17]/10 pb-1.5">
                            <Clock className="w-3.5 h-3.5 text-stone-800" />
                            <span className="font-mono text-[10px] uppercase tracking-wider text-stone-800 font-bold">
                              Status Audit Timeline
                            </span>
                          </div>

                          <div className="relative pl-4 space-y-4 border-l border-[#1C1A17]/20">
                            {report.history && report.history.length > 0 ? (
                              report.history.map((log, index) => (
                                <div key={index} className="relative space-y-1">
                                  {/* Timeline Node dot */}
                                  <div className="absolute -left-[20.5px] top-1 w-2 h-2 rounded-full border border-stone-800 bg-[#FAF9F6]" />
                                  
                                  <div className="flex items-baseline justify-between gap-4">
                                    <span className="font-mono text-[10px] uppercase tracking-wider font-bold text-stone-700">
                                      {log.status}
                                    </span>
                                    <span className="font-mono text-[9px] text-stone-400">
                                      {new Date(log.timestamp).toLocaleDateString('en-US', {
                                        month: 'short',
                                        day: 'numeric',
                                        hour: '2-digit',
                                        minute: '2-digit',
                                      })}
                                    </span>
                                  </div>
                                  <p className="text-xs text-stone-600 font-sans leading-relaxed">
                                    {log.note}
                                  </p>
                                </div>
                              ))
                            ) : (
                              <div className="relative">
                                <div className="absolute -left-[20.5px] top-1 w-2 h-2 rounded-full border border-stone-800 bg-[#FAF9F6]" />
                                <span className="font-mono text-[10px] text-stone-400 uppercase">No logs indexed yet.</span>
                              </div>
                            )}
                          </div>

                          <p className="font-mono text-[10px] text-stone-500 uppercase tracking-wide leading-relaxed pt-2 border-t border-[#1C1A17]/5">
                            Reports are reviewed and routed automatically &mdash; confirmations from neighbors help show how many people are affected by the same issue.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      ) : (
        /* Community Impact Tab Content */
        <div className="space-y-8 animate-fadeIn">
          {/* Predictive Insight Box */}
          <div className="border border-[#1C1A17] p-6 bg-[#F4F3EF] rounded-sm shadow-[4px_4px_0px_0px_#1C1A17] space-y-3">
            <div className="flex items-center gap-2 border-b border-[#1C1A17]/10 pb-2">
              <Info className="w-4.5 h-4.5 text-[#1C1A17]" />
              <h4 className="font-mono text-xs uppercase font-bold tracking-widest text-[#1C1A17]">
                Predictive AI Civic Insight
              </h4>
            </div>
            {loadingInsight ? (
              <div className="flex items-center gap-2.5 py-1.5">
                <div className="w-4 h-4 rounded-full border-2 border-stone-400 border-t-stone-800 animate-spin" />
                <span className="text-xs font-mono uppercase tracking-widest text-stone-500 animate-pulse">Running municipal intelligence core...</span>
              </div>
            ) : (
              <p className="font-serif italic text-sm sm:text-base text-stone-800 leading-relaxed">
                &ldquo;{predictiveInsight || 'No critical trend patterns identified in recent civic metrics.'}&rdquo;
              </p>
            )}
          </div>

          {/* Citywide Aggregate Stats Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="border border-[#1C1A17] p-5 bg-[#FAF9F6] rounded-sm shadow-[3px_3px_0px_0px_#1C1A17] space-y-1">
              <span className="font-mono text-[10px] uppercase text-stone-500 tracking-wider">Citywide Reports Filed</span>
              <div className="flex items-baseline justify-between">
                <span className="font-serif text-3xl font-black">{totalGlobalReports}</span>
                <span className="text-xs font-mono text-stone-400 uppercase">all-time</span>
              </div>
            </div>

            <div className="border border-[#1C1A17] p-5 bg-[#FAF9F6] rounded-sm shadow-[3px_3px_0px_0px_#1C1A17] space-y-1">
              <span className="font-mono text-[10px] uppercase text-stone-500 tracking-wider">Resolved Incidents</span>
              <div className="flex items-baseline justify-between">
                <span className="font-serif text-3xl font-black text-emerald-700">{resolvedGlobalReports}</span>
                <span className="text-xs font-mono text-emerald-600 uppercase">dispatched</span>
              </div>
            </div>

            <div className="border border-[#1C1A17] p-5 bg-[#FAF9F6] rounded-sm shadow-[3px_3px_0px_0px_#1C1A17] space-y-1">
              <span className="font-mono text-[10px] uppercase text-stone-500 tracking-wider">Overall Resolution Rate</span>
              <div className="flex items-baseline justify-between">
                <span className="font-serif text-3xl font-black text-amber-700">{resolutionRate}%</span>
                <span className="text-xs font-mono text-amber-600 uppercase">efficiency</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* Category Breakdown Card */}
            <div className="lg:col-span-6 border border-[#1C1A17] p-6 bg-[#FAF9F6] rounded-sm shadow-[3px_3px_0px_0px_#1C1A17] space-y-4">
              <h3 className="font-serif text-lg font-black uppercase tracking-tight border-b border-[#1C1A17]/10 pb-2">
                Open Reports by Category
              </h3>
              {Object.keys(categoryBreakdown).length === 0 ? (
                <p className="text-xs font-mono text-stone-400 uppercase italic py-4">All registered categories are clear.</p>
              ) : (
                <div className="space-y-4">
                  {Object.entries(categoryBreakdown).map(([category, count]) => {
                    const totalOpen = openGlobalReports.length;
                    const percent = totalOpen > 0 ? Math.round((count / totalOpen) * 100) : 0;
                    return (
                      <div key={category} className="space-y-1.5">
                        <div className="flex justify-between text-xs font-mono">
                          <span className="uppercase font-bold text-stone-700">{category}</span>
                          <span className="text-stone-500">{count} open ({percent}%)</span>
                        </div>
                        <div className="w-full bg-stone-100 h-2 border border-[#1C1A17]/10 rounded-sm overflow-hidden">
                          <div className="bg-[#1C1A17] h-full transition-all duration-300" style={{ width: `${percent}%` }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Department Breakdown Card */}
            <div className="lg:col-span-6 border border-[#1C1A17] p-6 bg-[#FAF9F6] rounded-sm shadow-[3px_3px_0px_0px_#1C1A17] space-y-4">
              <h3 className="font-serif text-lg font-black uppercase tracking-tight border-b border-[#1C1A17]/10 pb-2">
                Open Reports by Department
              </h3>
              {Object.keys(departmentBreakdown).length === 0 ? (
                <p className="text-xs font-mono text-stone-400 uppercase italic py-4">All municipal departments are currently clear.</p>
              ) : (
                <div className="space-y-4">
                  {Object.entries(departmentBreakdown).map(([dept, count]) => {
                    const totalOpen = openGlobalReports.length;
                    const percent = totalOpen > 0 ? Math.round((count / totalOpen) * 100) : 0;
                    return (
                      <div key={dept} className="space-y-1.5">
                        <div className="flex justify-between text-xs font-mono">
                          <span className="uppercase font-bold text-stone-700">{dept}</span>
                          <span className="text-stone-500">{count} open ({percent}%)</span>
                        </div>
                        <div className="w-full bg-stone-100 h-2 border border-[#1C1A17]/10 rounded-sm overflow-hidden">
                          <div className="bg-stone-600 h-full transition-all duration-300" style={{ width: `${percent}%` }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Active dispatches logs */}
          <div className="border border-[#1C1A17] bg-[#FAF9F6] rounded-sm p-6 shadow-[4px_4px_0px_0px_#1C1A17] space-y-4">
            <h3 className="font-serif text-xl font-black uppercase tracking-tight border-b border-[#1C1A17]/10 pb-3">
              Active Municipal Dispatches
            </h3>

            {loadingData ? (
              <div className="py-12 text-center font-mono text-xs text-stone-400">Loading platforms logs...</div>
            ) : globalReports.length === 0 ? (
              <p className="text-center py-12 text-stone-400 font-serif italic text-sm">No active municipal dispatches registered.</p>
            ) : (
              <div className="divide-y divide-stone-100 font-sans">
                {globalReports.slice(0, 10).map((report) => {
                  const color = SEVERITY_COLORS[report.severity as keyof typeof SEVERITY_COLORS] || '#10B981';
                  return (
                    <div key={report.id} className="py-3 flex items-center justify-between gap-4 text-xs">
                      <div className="space-y-0.5">
                        <span className="font-mono text-[9px] uppercase text-stone-400">
                          {report.category} • ID {report.id.substring(0, 5)}...
                        </span>
                        <p className="font-bold text-[#1C1A17] uppercase">{report.description || 'No descriptive notes'}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span
                          className="px-1.5 py-0.5 text-[9px] font-mono rounded-[2px]"
                          style={{
                            backgroundColor: `${color}15`,
                            color,
                            border: `1px solid ${color}40`,
                          }}
                        >
                          {report.severity}
                        </span>
                        <span className="px-1.5 py-0.5 text-[9px] font-mono bg-stone-100 border border-stone-200 rounded-[2px] uppercase">
                          {report.status}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

