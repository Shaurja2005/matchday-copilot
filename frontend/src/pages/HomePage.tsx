import React from 'react';
import { Link } from 'react-router-dom';
import { Users, LayoutDashboard, Radio, Zap, Globe, Shield } from 'lucide-react';

const PERSONA_CARDS = [
  {
    to: '/fan',
    icon: Users,
    label: 'Fan Assistant',
    description: 'Real-time wayfinding, queue updates, and multilingual answers for stadium visitors.',
    gradient: 'from-pitch-800 to-pitch-600',
    border: 'border-pitch-600/40',
    accent: 'text-pitch-300',
  },
  {
    to: '/staff',
    icon: LayoutDashboard,
    label: 'Staff Dashboard',
    description: 'Live heatmap, AI shift briefings, incident triage, and multilingual reply drafts.',
    gradient: 'from-navy-700 to-navy-600',
    border: 'border-gold-500/30',
    accent: 'text-gold-400',
  },
  {
    to: '/organizer',
    icon: Radio,
    label: 'Control Room',
    description: 'Situation summaries, natural-language queries, and sustainability analytics.',
    gradient: 'from-navy-800 to-pitch-900',
    border: 'border-white/20',
    accent: 'text-white',
  },
];

export function HomePage(): JSX.Element {
  return (
    <div className="min-h-screen pt-16">
      {/* Hero */}
      <section className="relative overflow-hidden bg-hero-gradient" aria-labelledby="hero-heading">
        <div className="absolute inset-0 pitch-lines" aria-hidden="true" />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent to-navy-900/60" aria-hidden="true" />
        <div className="relative max-w-7xl mx-auto px-4 py-20 text-center">
          <div className="inline-flex items-center gap-2 bg-gold-500/10 border border-gold-500/30 rounded-full px-4 py-2 mb-6">
            <span className="text-gold-400 text-sm font-medium">⚽ FIFA World Cup 2026 • GenAI Stadium Operations</span>
          </div>
          <h1 id="hero-heading" className="font-headline text-5xl sm:text-7xl md:text-8xl text-white leading-none mb-6">
            MATCHDAY<br />
            <span className="text-gold-gradient">COPILOT</span>
          </h1>
          <p className="text-white/60 text-lg max-w-2xl mx-auto mb-10">
            A GenAI-powered stadium assistant for fan navigation, crowd management,
            and real-time multilingual support — across three personas.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link to="/fan" className="btn-gold text-base px-8 py-4">
              Fan Assistant →
            </Link>
            <Link to="/staff" className="btn-pitch text-base px-8 py-4">
              Staff Dashboard
            </Link>
          </div>
        </div>
      </section>

      {/* Persona cards */}
      <section className="max-w-7xl mx-auto px-4 py-16" aria-labelledby="personas-heading">
        <h2 id="personas-heading" className="font-headline text-3xl text-center text-white mb-10">
          THREE PERSONAS. ONE PLATFORM.
        </h2>
        <div className="grid sm:grid-cols-3 gap-6">
          {PERSONA_CARDS.map(({ to, icon: Icon, label, description, gradient, border, accent }) => (
            <Link
              key={to}
              to={to}
              className={`glass-card p-6 group border ${border} hover:scale-[1.02] transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-500`}
              aria-label={`Go to ${label}`}
            >
              <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${gradient} flex items-center justify-center mb-4 group-hover:glow-gold transition-all`}>
                <Icon className="w-6 h-6 text-white" aria-hidden="true" />
              </div>
              <h3 className={`font-display text-xl mb-2 ${accent}`}>{label}</h3>
              <p className="text-white/50 text-sm leading-relaxed">{description}</p>
              <div className={`mt-4 text-sm font-medium ${accent} flex items-center gap-1`}>
                Open <span aria-hidden="true">→</span>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Feature highlights */}
      <section className="border-t border-white/10 bg-navy-800/30 py-16" aria-labelledby="features-heading">
        <div className="max-w-7xl mx-auto px-4">
          <h2 id="features-heading" className="font-headline text-3xl text-center text-white mb-12">
            BUILT FOR MATCHDAY
          </h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              { icon: Globe, title: '5-Language Support', desc: 'English, Español, Français, Português, العربية — detects and responds in your language.' },
              { icon: Shield, title: 'Rules + AI Hybrid', desc: 'Deterministic thresholds trigger GenAI recommendations. Human approval always required.' },
              { icon: Zap, title: 'Live Crowd Signals', desc: 'Simulated real-time density and queue data updated every 30 seconds.' },
            ].map(({ icon: Icon, title, desc }) => (
              <div key={title} className="flex gap-4">
                <div className="w-10 h-10 rounded-lg bg-gold-500/10 border border-gold-500/20 flex items-center justify-center flex-shrink-0">
                  <Icon className="w-5 h-5 text-gold-400" aria-hidden="true" />
                </div>
                <div>
                  <h3 className="font-semibold text-white mb-1">{title}</h3>
                  <p className="text-white/50 text-sm">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
