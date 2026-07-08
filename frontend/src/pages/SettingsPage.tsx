import React from 'react';
import { useAccessibility } from '../contexts/AccessibilityContext';
import { Eye, Type, Zap, MonitorSpeaker } from 'lucide-react';

function ToggleRow({
  label,
  description,
  pressed,
  onToggle,
  icon: Icon,
  id,
}: {
  label: string;
  description: string;
  pressed: boolean;
  onToggle: () => void;
  icon: React.FC<{ className?: string }>;
  id: string;
}): JSX.Element {
  return (
    <div className="glass-card p-4 flex items-center justify-between">
      <div className="flex items-start gap-4">
        <div className="w-10 h-10 rounded-lg bg-navy-700 flex items-center justify-center flex-shrink-0">
          <Icon className="w-5 h-5 text-gold-400" aria-hidden="true" />
        </div>
        <div>
          <label htmlFor={id} className="block font-medium text-white cursor-pointer">{label}</label>
          <p className="text-sm text-white/50 mt-0.5">{description}</p>
        </div>
      </div>
      <button
        id={id}
        role="switch"
        aria-checked={pressed}
        onClick={onToggle}
        className={`relative w-12 h-6 rounded-full transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-500 ${
          pressed ? 'bg-pitch-600' : 'bg-navy-600'
        }`}
        aria-label={`${pressed ? 'Disable' : 'Enable'} ${label}`}
      >
        <span
          className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full shadow transition-transform duration-300 ${
            pressed ? 'translate-x-6' : 'translate-x-0'
          }`}
          aria-hidden="true"
        />
      </button>
    </div>
  );
}

export function SettingsPage(): JSX.Element {
  const { highContrast, largeText, reduceMotion, screenReaderMode,
          toggleHighContrast, toggleLargeText, toggleReduceMotion, toggleScreenReaderMode } = useAccessibility();

  return (
    <div className="min-h-screen pt-16">
      <div className="max-w-2xl mx-auto px-4 py-12">
        <h1 className="font-headline text-4xl text-white mb-2">ACCESSIBILITY</h1>
        <p className="text-white/50 mb-8">Customize your viewing experience for better accessibility.</p>

        <div className="space-y-3" role="group" aria-labelledby="accessibility-settings">
          <h2 id="accessibility-settings" className="sr-only">Accessibility settings</h2>

          <ToggleRow
            id="toggle-high-contrast"
            label="High Contrast Mode"
            description="Increases color contrast for better visibility."
            pressed={highContrast}
            onToggle={toggleHighContrast}
            icon={Eye}
          />
          <ToggleRow
            id="toggle-large-text"
            label="Large Text Mode"
            description="Increases font sizes throughout the application."
            pressed={largeText}
            onToggle={toggleLargeText}
            icon={Type}
          />
          <ToggleRow
            id="toggle-reduce-motion"
            label="Reduce Motion"
            description="Disables animations and transitions."
            pressed={reduceMotion}
            onToggle={toggleReduceMotion}
            icon={Zap}
          />
          <ToggleRow
            id="toggle-screen-reader"
            label="Screen Reader Mode"
            description="Optimizes content structure for screen readers."
            pressed={screenReaderMode}
            onToggle={toggleScreenReaderMode}
            icon={MonitorSpeaker}
          />
        </div>

        <div className="mt-8 p-4 bg-navy-800/50 border border-white/10 rounded-xl text-sm text-white/40">
          <strong className="text-white/60">Note:</strong> These settings are stored for your session only.
          No personal data is saved. Settings reset on page reload.
        </div>
      </div>
    </div>
  );
}
