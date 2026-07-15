import React, { useEffect, useState, useCallback } from 'react';
import { organizerApi, crowdApi } from '../utils/api';
import { OrganizerSummaryResponse, SustainabilityResponse } from '../utils/api';
import { Queue } from '../types';
import {
  RefreshCw, Loader2, TrendingUp, TrendingDown, Minus,
  Leaf, Search, AlertCircle, CheckCircle, Radio
} from 'lucide-react';

function StatusDot({ status }: { status: 'green' | 'amber' | 'red' }): JSX.Element {
  const config = {
    green: 'bg-pitch-500',
    amber: 'bg-amber-500',
    red: 'bg-red-500 animate-pulse',
  };
  return (
    <span
      role="img"
      className={`inline-block w-3 h-3 rounded-full ${config[status]}`}
      aria-label={`Status: ${status}`}
    />
  );
}

export function OrganizerPage(): JSX.Element {
  const [summary, setSummary] = useState<OrganizerSummaryResponse | null>(null);
  const [sustainability, setSustainability] = useState<SustainabilityResponse | null>(null);
  const [queues, setQueues] = useState<Queue[]>([]);
  const [summaryLoading, setSummaryLoading] = useState(true);
  const [sustainabilityLoading, setSustainabilityLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'summary' | 'query' | 'sustainability'>('summary');

  // NL query state
  const [queryText, setQueryText] = useState('');
  const [queryResult, setQueryResult] = useState('');
  const [queryLoading, setQueryLoading] = useState(false);

  const fetchSummary = useCallback(async () => {
    setSummaryLoading(true);
    try {
      const data = await organizerApi.getSummary();
      setSummary(data);
    } catch { /* silent */ }
    finally { setSummaryLoading(false); }
  }, []);

  const fetchSustainability = useCallback(async () => {
    setSustainabilityLoading(true);
    try {
      const data = await organizerApi.getSustainability();
      setSustainability(data);
    } catch { /* silent */ }
    finally { setSustainabilityLoading(false); }
  }, []);

  const fetchQueues = useCallback(async () => {
    try {
      const data = await crowdApi.getQueues();
      setQueues(data.queues);
    } catch { /* silent */ }
  }, []);

  useEffect(() => {
    void fetchSummary();
    void fetchSustainability();
    void fetchQueues();
    const interval = setInterval(() => {
      void fetchSummary();
      void fetchQueues();
    }, 60_000);
    return () => clearInterval(interval);
  }, [fetchSummary, fetchSustainability, fetchQueues]);

  const handleQuery = async (): Promise<void> => {
    if (!queryText.trim()) return;
    setQueryLoading(true);
    setQueryResult('');
    try {
      const res = await organizerApi.query(queryText);
      setQueryResult(res.answer);
    } catch {
      setQueryResult('Unable to process query. Please try again.');
    } finally {
      setQueryLoading(false);
    }
  };

  const SUGGESTED_QUERIES = [
    "Which gates need extra staff in the next 30 minutes?",
    "What's the overall crowd status right now?",
    "Which transport option should we promote?",
    "Are there any critical zones approaching capacity?",
  ];

  const TABS = [
    { id: 'summary', label: 'Situation Summary', icon: Radio },
    { id: 'query', label: 'NL Query', icon: Search },
    { id: 'sustainability', label: 'Sustainability', icon: Leaf },
  ] as const;

  return (
    <div className="min-h-screen pt-16">
      {/* Header */}
      <div className="relative bg-hero-gradient border-b border-white/10 overflow-hidden">
        <div className="absolute inset-0 pitch-lines" aria-hidden="true" />
        <div className="relative max-w-7xl mx-auto px-4 py-8">
          <div className="inline-flex items-center gap-2 bg-amber-500/20 border border-amber-500/40 rounded-full px-3 py-1 mb-2">
            <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" aria-hidden="true" />
            <span className="text-amber-300 text-xs font-semibold uppercase tracking-widest">Organizer Control Room</span>
          </div>
          <p className="text-gold-400 text-sm font-medium uppercase tracking-widest mb-1">
            Senior Organizer View
          </p>
          <h1 className="font-headline text-3xl sm:text-5xl text-white">CONTROL ROOM</h1>
          <p className="text-white/60 mt-2 text-sm max-w-xl">
            AI-generated situation reports, natural-language queries over live data, and sustainability analytics.
          </p>
        </div>

      </div>

      {/* Live queue scoreboard strip */}
      <div className="bg-navy-800/60 border-b border-white/10 overflow-x-auto">
        <div className="max-w-7xl mx-auto px-4 py-2 flex gap-4">
          {queues.map((q) => (
            <div key={q.id} className="flex-shrink-0 flex items-center gap-2 text-sm">
              <span className="text-white/50">{q.gateName}:</span>
              <span className={`font-bold ${q.waitTimeMinutes >= 20 ? 'text-red-400' : q.waitTimeMinutes >= 10 ? 'text-amber-400' : 'text-pitch-400'}`}>
                {q.waitTimeMinutes}m
              </span>
              {q.trend === 'increasing'
                ? <TrendingUp className="w-3.5 h-3.5 text-red-400" aria-label="Increasing" />
                : q.trend === 'decreasing'
                ? <TrendingDown className="w-3.5 h-3.5 text-pitch-400" aria-label="Decreasing" />
                : <Minus className="w-3.5 h-3.5 text-white/30" aria-label="Stable" />
              }
            </div>
          ))}
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-navy-900/80 border-b border-white/10 sticky top-16 z-40">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex gap-1 py-2" role="tablist" aria-label="Organizer dashboard sections">
            {TABS.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                role="tab"
                aria-selected={activeTab === id}
                id={`org-tab-${id}`}
                aria-controls={`org-panel-${id}`}
                onClick={() => setActiveTab(id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-500 ${
                  activeTab === id
                    ? 'bg-pitch-700/60 text-pitch-300 border border-pitch-600/40'
                    : 'text-white/60 hover:text-white hover:bg-white/10'
                }`}
              >
                <Icon className="w-4 h-4" aria-hidden="true" />
                {label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 py-6">

        {/* SUMMARY TAB */}
        {activeTab === 'summary' && (
          <div id="org-panel-summary" role="tabpanel" aria-labelledby="org-tab-summary">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-display text-xl text-white">AI Situation Summary</h2>
              <button
                onClick={() => void fetchSummary()}
                disabled={summaryLoading}
                className="flex items-center gap-2 text-sm py-2 px-4 rounded-xl border border-white/20 text-white/70 hover:text-white transition-all disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-500"
                aria-label="Refresh situation summary"
              >
                <RefreshCw className={`w-4 h-4 ${summaryLoading ? 'animate-spin' : ''}`} aria-hidden="true" />
                Refresh
              </button>
            </div>

            {summaryLoading ? (
              <div role="status" aria-busy="true" aria-label="Loading summary" className="space-y-4">
                <div className="skeleton h-32 rounded-2xl" />
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {[1,2,3,4].map(i => <div key={i} className="skeleton h-20 rounded-xl" />)}
                </div>
              </div>

            ) : summary ? (
              <div className="space-y-4 animate-fade-in">
                {/* Status banner */}
                <div className={`glass-card p-5 border ${
                  summary.overallStatus === 'red' ? 'border-red-500/30' :
                  summary.overallStatus === 'amber' ? 'border-amber-500/30' :
                  'border-pitch-500/30'
                }`}>
                  <div className="flex items-center gap-3 mb-3">
                    <StatusDot status={summary.overallStatus} />
                    <span className={`font-display text-lg uppercase tracking-wide ${
                      summary.overallStatus === 'red' ? 'text-red-400' :
                      summary.overallStatus === 'amber' ? 'text-amber-400' :
                      'text-pitch-400'
                    }`}>
                      Status: {summary.overallStatus.toUpperCase()}
                    </span>
                    <span className="text-xs text-white/30 ml-auto">
                      {new Date(summary.generatedAt).toLocaleTimeString()}
                    </span>
                  </div>
                  <div
                    className="text-white/80 text-sm leading-relaxed"
                    dangerouslySetInnerHTML={{
                      __html: summary.summary
                        .replace(/\*\*(.*?)\*\*/g, '<strong class="text-white">$1</strong>')
                        .replace(/## (.*)/g, '<h3 class="font-display text-base text-gold-400 mt-4 mb-1">$1</h3>')
                        .replace(/\n/g, '<br/>')
                    }}
                  />
                </div>

                {/* Key metrics scoreboard */}
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
                  {summary.keyMetrics.map((metric, i) => (
                    <div
                      key={i}
                      className={`stat-card ${
                        metric.status === 'critical' ? 'border border-red-500/30' :
                        metric.status === 'warning' ? 'border border-amber-500/30' :
                        ''
                      }`}
                      aria-label={`${metric.label}: ${metric.value}${metric.unit ? ' ' + metric.unit : ''}`}
                    >
                      <p className="text-xs text-white/40 uppercase tracking-wider mb-1 truncate">{metric.label}</p>
                      <div className="flex items-end gap-1">
                        <span className={`font-headline text-2xl ${
                          metric.status === 'critical' ? 'text-red-400' :
                          metric.status === 'warning' ? 'text-amber-400' :
                          'text-gold-gradient'
                        }`}>
                          {typeof metric.value === 'number' ? metric.value : metric.value}
                        </span>
                        {metric.unit && <span className="text-xs text-white/40 mb-0.5">{metric.unit}</span>}
                      </div>
                      {metric.trend && (
                        <div className="mt-1">
                          {metric.trend === 'up' ? <TrendingUp className="w-3.5 h-3.5 text-red-400" aria-label="Trending up" /> :
                           metric.trend === 'down' ? <TrendingDown className="w-3.5 h-3.5 text-pitch-400" aria-label="Trending down" /> :
                           <Minus className="w-3.5 h-3.5 text-white/30" aria-label="Stable" />}
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                {/* AI Disclaimer */}
                <div className="flex items-center gap-2 p-3 bg-amber-900/20 border border-amber-500/20 rounded-xl text-xs text-amber-300">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" aria-hidden="true" />
                  All AI recommendations require human review and approval before any action is taken.
                </div>
              </div>
            ) : null}
          </div>
        )}

        {/* NL QUERY TAB */}
        {activeTab === 'query' && (
          <div id="org-panel-query" role="tabpanel" aria-labelledby="org-tab-query">
            <div className="max-w-3xl mx-auto">
              <h2 className="font-display text-xl text-white mb-2">Natural Language Query</h2>
              <p className="text-sm text-white/50 mb-6">
                Ask any question in plain English — the AI will reason over live stadium data to answer it.
              </p>

              {/* Query bar */}
              <div className="glass-card p-4 mb-4">
                <div className="flex gap-3">
                  <Search className="w-5 h-5 text-gold-400 mt-3 flex-shrink-0" aria-hidden="true" />
                  <textarea
                    id="org-query"
                    value={queryText}
                    onChange={(e) => setQueryText(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); void handleQuery(); } }}
                    placeholder="Which gates need extra staff in the next 30 minutes?"
                    className="flex-1 bg-transparent text-white placeholder-white/30 outline-none resize-none text-sm py-2"
                    rows={2}
                    maxLength={500}
                    aria-label="Enter your question about stadium operations"
                  />
                  <button
                    onClick={() => void handleQuery()}
                    disabled={queryLoading || !queryText.trim()}
                    className="btn-gold py-2 px-4 self-start disabled:opacity-40 flex items-center gap-2"
                    aria-label="Submit query"
                  >
                    {queryLoading
                      ? <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
                      : <Search className="w-4 h-4" aria-hidden="true" />
                    }
                    Ask
                  </button>
                </div>
              </div>

              {/* Suggested queries */}
              <div className="mb-6">
                <p className="text-xs text-white/40 mb-2">Suggested queries:</p>
                <div className="flex flex-wrap gap-2">
                  {SUGGESTED_QUERIES.map((q) => (
                    <button
                      key={q}
                      onClick={() => setQueryText(q)}
                      className="text-xs px-3 py-1.5 rounded-lg bg-navy-700 text-white/60 hover:text-white border border-white/10 hover:border-white/30 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-500"
                    >
                      {q}
                    </button>
                  ))}
                </div>
              </div>

              {/* Query result */}
              {queryResult && (
                <div className="glass-card p-5 animate-slide-up" aria-live="polite" aria-label="Query answer">
                  <div className="flex items-center gap-2 mb-3">
                    <CheckCircle className="w-4 h-4 text-pitch-400" aria-hidden="true" />
                    <span className="text-xs font-semibold text-pitch-400 uppercase tracking-wider">AI Response</span>
                  </div>
                  <p className="text-white/80 text-sm leading-relaxed whitespace-pre-wrap">{queryResult}</p>
                  <p className="text-xs text-white/30 mt-3">
                    ⚠️ This is an AI-generated recommendation. All decisions require human approval.
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* SUSTAINABILITY TAB */}
        {activeTab === 'sustainability' && (
          <div id="org-panel-sustainability" role="tabpanel" aria-labelledby="org-tab-sustainability">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-display text-xl text-white flex items-center gap-2">
                <Leaf className="w-5 h-5 text-pitch-400" aria-hidden="true" />
                Sustainability Panel
              </h2>
              <button
                onClick={() => void fetchSustainability()}
                disabled={sustainabilityLoading}
                className="flex items-center gap-2 text-sm py-2 px-4 rounded-xl border border-white/20 text-white/70 hover:text-white transition-all disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-500"
                aria-label="Refresh sustainability data"
              >
                <RefreshCw className={`w-4 h-4 ${sustainabilityLoading ? 'animate-spin' : ''}`} aria-hidden="true" />
                Refresh
              </button>
            </div>

            {sustainabilityLoading ? (
              <div role="status" aria-busy="true" aria-label="Loading sustainability data" className="space-y-4">
                <div className="skeleton h-40 rounded-2xl" />
                <div className="skeleton h-24 rounded-xl" />
              </div>
            ) : sustainability ? (
              <div className="space-y-4 animate-fade-in">
                {/* Transport carbon breakdown */}
                <div className="glass-card p-5">
                  <h3 className="font-display text-lg text-white mb-4">Carbon Footprint by Transport Mode</h3>
                  <div className="space-y-3">
                    {Object.entries(sustainability.byTransportMode)
                      .sort(([, a], [, b]) => b - a)
                      .map(([mode, kg]) => {
                        const total = Object.values(sustainability.byTransportMode).reduce((a, b) => a + b, 0);
                        const pct = total > 0 ? Math.round((kg / total) * 100) : 0;
                        return (
                          <div key={mode}>
                            <div className="flex justify-between text-sm mb-1">
                              <span className="text-white/70 capitalize">{mode}</span>
                              <span className="text-white/50">{kg.toFixed(0)} kg CO₂ ({pct}%)</span>
                            </div>
                            <div className="density-bar" role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100} aria-label={`${mode}: ${pct}%`}>
                              <div
                                className="h-full rounded-full bg-gradient-to-r from-pitch-700 to-gold-500 transition-all duration-700"
                                style={{ width: `${pct}%` }}
                              />
                            </div>
                          </div>
                        );
                      })}
                  </div>
                  <p className="text-xs text-white/30 mt-3">
                    Est. attendance: {sustainability.estimatedAttendance.toLocaleString()} fans •
                    Note: {' '}<em>Estimates based on simulated transport usage data</em>
                  </p>
                </div>

                {/* AI Analysis */}
                <div className="glass-card p-5">
                  <div className="flex items-center gap-2 mb-3">
                    <Leaf className="w-4 h-4 text-pitch-400" aria-hidden="true" />
                    <span className="font-display text-white">AI Sustainability Recommendations</span>
                    <span className="text-xs text-amber-400 border border-amber-500/30 bg-amber-900/20 px-2 py-0.5 rounded-full ml-auto">
                      Human Review Required
                    </span>
                  </div>
                  <div
                    className="text-white/70 text-sm leading-relaxed"
                    dangerouslySetInnerHTML={{
                      __html: sustainability.aiAnalysis
                        .replace(/\*\*(.*?)\*\*/g, '<strong class="text-white">$1</strong>')
                        .replace(/\n/g, '<br/>')
                    }}
                  />
                </div>
              </div>
            ) : null}
          </div>
        )}
      </div>
    </div>
  );
}
