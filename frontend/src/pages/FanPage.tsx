import React, { useState } from 'react';
import { ChatWidget } from '../components/chat/ChatWidget';
import { StadiumMap } from '../components/map/StadiumMap';
import { Map, MessageCircle, Accessibility } from 'lucide-react';
import { useAccessibility } from '../contexts/AccessibilityContext';

export function FanPage(): JSX.Element {
  const [activeTab, setActiveTab] = useState<'chat' | 'map'>('chat');
  const [showAccessibleRoutes, setShowAccessibleRoutes] = useState(false);
  const { highContrast, largeText, toggleHighContrast, toggleLargeText } = useAccessibility();

  return (
    <div className="min-h-screen pt-16">
      {/* Hero banner */}
      <div className="relative overflow-hidden bg-hero-gradient border-b border-white/10">
        <div className="absolute inset-0 pitch-lines" aria-hidden="true" />
        <div className="relative max-w-7xl mx-auto px-4 py-8 sm:py-10">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <p className="text-gold-400 text-sm font-medium uppercase tracking-widest mb-1">
                FIFA World Cup 2026™ Stadium
              </p>
              <h1 className="font-headline text-3xl sm:text-5xl text-white">
                FAN ASSISTANT
              </h1>
              <p className="text-white/60 mt-2 text-sm sm:text-base max-w-lg">
                Get real-time wayfinding, queue updates, and answers in your language.
              </p>
            </div>
            {/* Accessibility quick-toggles */}
            <div className="flex items-center gap-2 flex-wrap">
              <button
                onClick={toggleHighContrast}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-all border focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-500 ${
                  highContrast
                    ? 'bg-white text-navy-900 border-white'
                    : 'bg-navy-800/60 text-white/70 border-white/20 hover:text-white'
                }`}
                aria-pressed={highContrast}
                aria-label="Toggle high contrast mode"
              >
                <Accessibility className="w-4 h-4" aria-hidden="true" />
                High Contrast
              </button>
              <button
                onClick={toggleLargeText}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-all border focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-500 ${
                  largeText
                    ? 'bg-white text-navy-900 border-white'
                    : 'bg-navy-800/60 text-white/70 border-white/20 hover:text-white'
                }`}
                aria-pressed={largeText}
                aria-label="Toggle large text mode"
              >
                A+
              </button>
              <button
                onClick={() => setShowAccessibleRoutes((v) => !v)}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-all border focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-500 ${
                  showAccessibleRoutes
                    ? 'bg-pitch-700 text-pitch-200 border-pitch-500'
                    : 'bg-navy-800/60 text-white/70 border-white/20 hover:text-white'
                }`}
                aria-pressed={showAccessibleRoutes}
                aria-label="Toggle accessible route overlay on map"
              >
                ♿ Accessible Routes
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile tab switcher */}
      <div className="lg:hidden flex border-b border-white/10 bg-navy-900/80" role="tablist" aria-label="Fan view tabs">
        {([
          { id: 'chat', label: 'Assistant', icon: MessageCircle },
          { id: 'map', label: 'Map', icon: Map },
        ] as const).map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            role="tab"
            aria-selected={activeTab === id}
            id={`tab-${id}`}
            aria-controls={`panel-${id}`}
            onClick={() => setActiveTab(id)}
            className={`flex-1 flex items-center justify-center gap-2 py-3 text-sm font-medium transition-all border-b-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-500 ${
              activeTab === id
                ? 'border-gold-500 text-gold-400'
                : 'border-transparent text-white/50 hover:text-white'
            }`}
          >
            <Icon className="w-4 h-4" aria-hidden="true" />
            {label}
          </button>
        ))}
      </div>

      {/* Main content */}
      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="lg:grid lg:grid-cols-2 lg:gap-6 h-[calc(100vh-280px)] min-h-[500px]">
          {/* Chat panel */}
          <div
            id="panel-chat"
            role="tabpanel"
            aria-labelledby="tab-chat"
            className={`h-full ${activeTab !== 'chat' ? 'hidden lg:block' : ''}`}
          >
            <ChatWidget className="h-full" />
          </div>

          {/* Map panel */}
          <div
            id="panel-map"
            role="tabpanel"
            aria-labelledby="tab-map"
            className={`h-full ${activeTab !== 'map' ? 'hidden lg:block' : ''}`}
          >
            <StadiumMap
              className="h-full"
              showAccessibleRoutes={showAccessibleRoutes}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
