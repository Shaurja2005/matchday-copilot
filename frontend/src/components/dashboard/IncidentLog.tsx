import React, { useState } from 'react';
import { AlertTriangle, CheckCircle, Clock, XCircle } from 'lucide-react';
import { Incident } from '../../types';
import { staffApi } from '../../utils/api';

interface IncidentLogProps {
  incidents: Incident[];
  onStatusChange: (id: string, status: Incident['status']) => void;
}

const SEVERITY_CONFIG: Record<Incident['severity'], { label: string; color: string; bgColor: string }> = {
  low: { label: 'LOW', color: 'text-pitch-300', bgColor: 'bg-pitch-900/30 border-pitch-600/30' },
  medium: { label: 'MED', color: 'text-amber-300', bgColor: 'bg-amber-900/30 border-amber-600/30' },
  high: { label: 'HIGH', color: 'text-orange-300', bgColor: 'bg-orange-900/30 border-orange-600/30' },
  critical: { label: 'CRIT', color: 'text-red-300', bgColor: 'bg-red-900/30 border-red-600/30' },
};

const STATUS_ICONS: Record<Incident['status'], JSX.Element> = {
  open: <AlertTriangle className="w-4 h-4 text-amber-400" aria-label="Open" />,
  in_progress: <Clock className="w-4 h-4 text-blue-400" aria-label="In progress" />,
  resolved: <CheckCircle className="w-4 h-4 text-pitch-400" aria-label="Resolved" />,
};

export function IncidentLog({ incidents, onStatusChange }: IncidentLogProps): JSX.Element {
  const [updating, setUpdating] = useState<string | null>(null);

  const handleStatusChange = async (id: string, status: Incident['status']): Promise<void> => {
    setUpdating(id);
    try {
      await staffApi.updateIncidentStatus(id, status);
      onStatusChange(id, status);
    } finally {
      setUpdating(null);
    }
  };

  if (incidents.length === 0) {
    return (
      <div className="text-center py-8 text-white/40">
        <CheckCircle className="w-12 h-12 mx-auto mb-2 text-pitch-500" aria-hidden="true" />
        <p>No active incidents</p>
      </div>
    );
  }

  return (
    <div className="space-y-3" role="list" aria-label="Incident log">
      {incidents.map((incident) => {
        const sevConfig = SEVERITY_CONFIG[incident.severity];
        return (
          <article
            key={incident.id}
            className="glass-card p-4 space-y-3"
            role="listitem"
            aria-label={`${incident.severity} severity incident: ${incident.description}`}
          >
            {/* Header */}
            <div className="flex items-start gap-3">
              {STATUS_ICONS[incident.status]}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className={`status-badge text-xs border ${sevConfig.bgColor} ${sevConfig.color}`}>
                    {sevConfig.label}
                  </span>
                  {incident.gateId && (
                    <span className="text-xs text-white/40">{incident.gateId}</span>
                  )}
                  <span className="text-xs text-white/30 ml-auto">
                    {new Date(incident.reportedAt).toLocaleTimeString()}
                  </span>
                </div>
                <p className="text-sm text-white mt-1 line-clamp-2">{incident.description}</p>
              </div>
            </div>

            {/* AI Triage */}
            <div className="bg-navy-900/50 rounded-lg p-3 border border-gold-500/10">
              <div className="flex items-center gap-1.5 mb-1">
                <span className="text-xs font-semibold text-gold-400">AI Suggestion</span>
                <span className="text-xs text-white/30">(human approval required)</span>
              </div>
              <p className="text-xs text-white/70">{incident.aiRecommendedNextStep}</p>
            </div>

            {/* Actions */}
            {incident.status !== 'resolved' && (
              <div className="flex gap-2">
                {incident.status === 'open' && (
                  <button
                    onClick={() => void handleStatusChange(incident.id, 'in_progress')}
                    disabled={updating === incident.id}
                    className="flex-1 text-xs py-1.5 px-3 rounded-lg bg-blue-900/30 text-blue-300 border border-blue-600/30 hover:bg-blue-900/50 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-500 disabled:opacity-50"
                    aria-label="Mark incident as in progress"
                  >
                    In Progress
                  </button>
                )}
                <button
                  onClick={() => void handleStatusChange(incident.id, 'resolved')}
                  disabled={updating === incident.id}
                  className="flex-1 text-xs py-1.5 px-3 rounded-lg bg-pitch-900/30 text-pitch-300 border border-pitch-600/30 hover:bg-pitch-900/50 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-500 disabled:opacity-50"
                  aria-label="Mark incident as resolved"
                >
                  <CheckCircle className="w-3.5 h-3.5 inline mr-1" aria-hidden="true" />
                  Resolve
                </button>
              </div>
            )}
          </article>
        );
      })}
    </div>
  );
}
