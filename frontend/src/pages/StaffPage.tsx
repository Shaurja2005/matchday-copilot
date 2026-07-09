import React, { useEffect, useState, useCallback } from 'react';
import { CrowdHeatmap } from '../components/dashboard/CrowdHeatmap';
import { IncidentLog } from '../components/dashboard/IncidentLog';
import { staffApi, chatApi } from '../utils/api';
import { Incident, ShiftBriefing } from '../types';
import {
  RefreshCw, PlusCircle, Loader2, Languages, AlertTriangle,
  FileText, ClipboardList, MessageSquare
} from 'lucide-react';

export function StaffPage(): JSX.Element {
  const [briefing, setBriefing] = useState<ShiftBriefing | null>(null);
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [briefingLoading, setBriefingLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'heatmap' | 'incidents' | 'briefing' | 'quickreply'>('heatmap');

  // Quick-reply state
  const [staffNote, setStaffNote] = useState('');
  const [fanMessage, setFanMessage] = useState('');
  const [targetLang, setTargetLang] = useState('es');
  const [replyResult, setReplyResult] = useState('');
  const [replyLoading, setReplyLoading] = useState(false);

  // Incident form state
  const [showIncidentForm, setShowIncidentForm] = useState(false);
  const [incidentDesc, setIncidentDesc] = useState('');
  const [incidentGate, setIncidentGate] = useState('');
  const [incidentSubmitting, setIncidentSubmitting] = useState(false);

  const fetchBriefing = useCallback(async () => {
    setBriefingLoading(true);
    try {
      const data = await staffApi.getBriefing();
      setBriefing(data);
    } catch { /* silent */ }
    finally { setBriefingLoading(false); }
  }, []);

  const fetchIncidents = useCallback(async () => {
    try {
      const data = await staffApi.getIncidents();
      setIncidents(data.incidents);
    } catch { /* silent */ }
  }, []);

  useEffect(() => {
    void fetchBriefing();
    void fetchIncidents();
  }, [fetchBriefing, fetchIncidents]);

  const handleStatusChange = (id: string, status: Incident['status']): void => {
    setIncidents((prev) => prev.map((i) => (i.id === id ? { ...i, status } : i)));
  };

  const handleSubmitIncident = async (): Promise<void> => {
    if (!incidentDesc.trim()) return;
    setIncidentSubmitting(true);
    try {
      const incident = await staffApi.createIncident({
        description: incidentDesc,
        reportedBy: 'Staff (Demo)',
        gateId: incidentGate || undefined,
      });
      setIncidents((prev) => [incident, ...prev]);
      setIncidentDesc('');
      setIncidentGate('');
      setShowIncidentForm(false);
    } catch { /* silent */ }
    finally { setIncidentSubmitting(false); }
  };

  const handleDraftReply = async (): Promise<void> => {
    if (!staffNote.trim() || !fanMessage.trim()) return;
    setReplyLoading(true);
    setReplyResult('');
    try {
      const { reply } = await chatApi.draftStaffReply(staffNote, targetLang, fanMessage);
      setReplyResult(reply);
    } catch (e) {
      setReplyResult('Error generating reply. Please try again.');
    } finally {
      setReplyLoading(false);
    }
  };

  const TABS = [
    { id: 'heatmap', label: 'Heatmap', icon: ClipboardList },
    { id: 'incidents', label: 'Incidents', icon: AlertTriangle },
    { id: 'briefing', label: 'Briefing', icon: FileText },
    { id: 'quickreply', label: 'Quick Reply', icon: MessageSquare },
  ] as const;

  return (
    <div className="min-h-screen pt-16">
      {/* Header */}
      <div className="relative bg-hero-gradient border-b border-white/10 overflow-hidden">
        <div className="absolute inset-0 pitch-lines" aria-hidden="true" />
        <div className="relative max-w-7xl mx-auto px-4 py-8">
          <p className="text-gold-400 text-sm font-medium uppercase tracking-widest mb-1">
            Staff & Volunteer View
          </p>
          <h1 className="font-headline text-3xl sm:text-5xl text-white">OPERATIONS DASHBOARD</h1>
          <p className="text-white/60 mt-2 text-sm max-w-xl">
            Live crowd density, AI-generated shift briefings, incident management, and multilingual fan response drafts.
          </p>
        </div>
      </div>

      {/* Tab nav */}
      <div className="bg-navy-900/80 border-b border-white/10 sticky top-16 z-40">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex gap-1 overflow-x-auto py-2" role="tablist" aria-label="Staff dashboard sections">
            {TABS.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                role="tab"
                aria-selected={activeTab === id}
                aria-controls={`panel-${id}`}
                id={`tab-${id}`}
                onClick={() => setActiveTab(id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-500 ${
                  activeTab === id
                    ? 'bg-pitch-700/60 text-pitch-300 border border-pitch-600/40'
                    : 'text-white/60 hover:text-white hover:bg-white/10'
                }`}
              >
                <Icon className="w-4 h-4" aria-hidden="true" />
                {label}
                {id === 'incidents' && incidents.filter((i) => i.status !== 'resolved').length > 0 && (
                  <span className="ml-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                    {incidents.filter((i) => i.status !== 'resolved').length}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 py-6">

        {/* Heatmap tab */}
        {activeTab === 'heatmap' && (
          <div id="panel-heatmap" role="tabpanel" aria-labelledby="tab-heatmap">
            <CrowdHeatmap />
          </div>
        )}

        {/* Incidents tab */}
        {activeTab === 'incidents' && (
          <div id="panel-incidents" role="tabpanel" aria-labelledby="tab-incidents">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-display text-xl text-white">Active Incidents</h2>
              <button
                onClick={() => setShowIncidentForm((v) => !v)}
                className="btn-gold text-sm py-2 px-4 flex items-center gap-2"
                aria-expanded={showIncidentForm}
                aria-controls="incident-form"
              >
                <PlusCircle className="w-4 h-4" aria-hidden="true" />
                Report Incident
              </button>
            </div>

            {/* Incident report form */}
            {showIncidentForm && (
              <div id="incident-form" className="glass-card p-4 mb-4 animate-slide-up" role="form" aria-label="Report new incident">
                <h3 className="font-semibold text-white mb-3">Report New Incident</h3>
                <div className="space-y-3">
                  <div>
                    <label htmlFor="incident-desc" className="block text-sm text-white/70 mb-1">
                      Description <span aria-hidden="true">*</span>
                    </label>
                    <textarea
                      id="incident-desc"
                      value={incidentDesc}
                      onChange={(e) => setIncidentDesc(e.target.value)}
                      placeholder="Describe what's happening..."
                      className="w-full bg-navy-700/50 text-white placeholder-white/30 rounded-xl px-4 py-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-gold-500 border border-white/10"
                      rows={3}
                      maxLength={1000}
                      required
                      aria-required="true"
                    />
                  </div>
                  <div>
                    <label htmlFor="incident-gate" className="block text-sm text-white/70 mb-1">Gate / Zone (optional)</label>
                    <select
                      id="incident-gate"
                      value={incidentGate}
                      onChange={(e) => setIncidentGate(e.target.value)}
                      className="w-full bg-navy-700/50 text-white rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-gold-500 border border-white/10"
                    >
                      <option value="">Select gate...</option>
                      {['gate-a', 'gate-b', 'gate-c', 'gate-d', 'gate-e', 'gate-f'].map((g) => (
                        <option key={g} value={g}>{g.toUpperCase().replace('-', ' ')}</option>
                      ))}
                    </select>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => void handleSubmitIncident()}
                      disabled={incidentSubmitting || !incidentDesc.trim()}
                      className="btn-gold text-sm py-2 px-4 flex items-center gap-2 disabled:opacity-40"
                      aria-label="Submit incident report"
                    >
                      {incidentSubmitting ? <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" /> : null}
                      Submit & Triage
                    </button>
                    <button
                      onClick={() => setShowIncidentForm(false)}
                      className="text-sm py-2 px-4 rounded-xl border border-white/20 text-white/60 hover:text-white transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-500"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </div>
            )}

            <IncidentLog incidents={incidents} onStatusChange={handleStatusChange} />
          </div>
        )}

        {/* Briefing tab */}
        {activeTab === 'briefing' && (
          <div id="panel-briefing" role="tabpanel" aria-labelledby="tab-briefing">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-display text-xl text-white">AI Shift Briefing</h2>
              <button
                onClick={() => void fetchBriefing()}
                disabled={briefingLoading}
                className="flex items-center gap-2 text-sm py-2 px-4 rounded-xl border border-white/20 text-white/70 hover:text-white transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-500 disabled:opacity-50"
                aria-label="Refresh shift briefing"
              >
                <RefreshCw className={`w-4 h-4 ${briefingLoading ? 'animate-spin' : ''}`} aria-hidden="true" />
                Refresh
              </button>
            </div>

            {briefingLoading ? (
              <div className="space-y-3" aria-busy="true" aria-label="Loading briefing">
                {[1, 2, 3].map((i) => <div key={i} className="skeleton h-24 rounded-xl" />)}
              </div>
            ) : briefing ? (
              <div className="glass-card p-6 animate-fade-in">
                <div className="flex items-center gap-2 mb-4 text-xs text-white/40">
                  <span>Generated at {new Date(briefing.generatedAt).toLocaleTimeString()}</span>
                  <span className="text-amber-400 border border-amber-500/30 bg-amber-900/20 px-2 py-0.5 rounded-full">
                    AI-Generated — Human Review Required
                  </span>
                </div>
                <div
                  className="text-white/80 text-sm leading-relaxed whitespace-pre-wrap"
                  dangerouslySetInnerHTML={{ __html: briefing.summary.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>').replace(/## (.*)/g, '<h3 class="font-display text-lg text-gold-400 mt-4 mb-2">$1</h3>').replace(/\n/g, '<br/>') }}
                />
                {briefing.hotspots.length > 0 && (
                  <div className="mt-4 border-t border-white/10 pt-4">
                    <h3 className="font-display text-white mb-2">Current Hotspots</h3>
                    <div className="space-y-2">
                      {briefing.hotspots.map((h) => (
                        <div key={h.zoneId} className="flex items-center justify-between text-sm">
                          <span className="text-white/70">{h.zoneName}</span>
                          <span className={h.densityPercent >= 90 ? 'text-red-400' : h.densityPercent >= 70 ? 'text-amber-400' : 'text-pitch-400'}>
                            {h.densityPercent}%
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-8 text-white/40">Failed to load briefing. Please refresh.</div>
            )}
          </div>
        )}

        {/* Quick reply tab */}
        {activeTab === 'quickreply' && (
          <div id="panel-quickreply" role="tabpanel" aria-labelledby="tab-quickreply">
            <div className="max-w-2xl mx-auto">
              <div className="glass-card p-6 space-y-5">
                <div className="flex items-center gap-2 mb-2">
                  <Languages className="w-5 h-5 text-gold-400" aria-hidden="true" />
                  <h2 className="font-display text-xl text-white">Multilingual Quick Reply</h2>
                </div>
                <p className="text-sm text-white/50">
                  Type your note in English — AI will draft a polished reply in the fan&apos;s language.
                </p>

                <div>
                  <label htmlFor="fan-msg" className="block text-sm text-white/70 mb-1">Fan&apos;s original message</label>
                  <textarea
                    id="fan-msg"
                    value={fanMessage}
                    onChange={(e) => setFanMessage(e.target.value)}
                    placeholder="Paste the fan's question here..."
                    className="w-full bg-navy-700/50 text-white placeholder-white/30 rounded-xl px-4 py-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-gold-500 border border-white/10"
                    rows={2}
                    maxLength={1000}
                    aria-required="true"
                  />
                </div>

                <div>
                  <label htmlFor="staff-note" className="block text-sm text-white/70 mb-1">Your note (in English)</label>
                  <textarea
                    id="staff-note"
                    value={staffNote}
                    onChange={(e) => setStaffNote(e.target.value)}
                    placeholder="E.g. Tell them Gate C is clear, 5 min wait, turn right after entry..."
                    className="w-full bg-navy-700/50 text-white placeholder-white/30 rounded-xl px-4 py-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-gold-500 border border-white/10"
                    rows={3}
                    maxLength={500}
                    aria-required="true"
                  />
                </div>

                <div>
                  <label htmlFor="target-lang" className="block text-sm text-white/70 mb-1">Reply language</label>
                  <select
                    id="target-lang"
                    value={targetLang}
                    onChange={(e) => setTargetLang(e.target.value)}
                    className="w-full bg-navy-700/50 text-white rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-gold-500 border border-white/10"
                  >
                    <option value="es">Español</option>
                    <option value="fr">Français</option>
                    <option value="pt">Português</option>
                    <option value="ar">العربية</option>
                    <option value="en">English</option>
                  </select>
                </div>

                <button
                  onClick={() => void handleDraftReply()}
                  disabled={replyLoading || !staffNote.trim() || !fanMessage.trim()}
                  className="btn-gold w-full flex items-center justify-center gap-2 disabled:opacity-40"
                  aria-label="Generate fan reply"
                >
                  {replyLoading
                    ? <><Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" /> Generating...</>
                    : <><Languages className="w-4 h-4" aria-hidden="true" /> Draft Reply</>
                  }
                </button>

                {replyResult && (
                  <div
                    className="p-4 bg-pitch-900/30 border border-pitch-600/30 rounded-xl animate-slide-up"
                    dir={targetLang === 'ar' ? 'rtl' : 'ltr'}
                    aria-live="polite"
                    aria-label="Generated reply"
                  >
                    <p className="text-xs text-pitch-400 mb-2 font-semibold uppercase tracking-wider">
                      ✓ Generated Reply
                    </p>
                    <p className="text-white/90 text-sm leading-relaxed">{replyResult}</p>
                    <button
                      onClick={() => void navigator.clipboard.writeText(replyResult)}
                      className="mt-3 text-xs text-white/40 hover:text-white transition-colors"
                      aria-label="Copy reply to clipboard"
                    >
                      📋 Copy to clipboard
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
