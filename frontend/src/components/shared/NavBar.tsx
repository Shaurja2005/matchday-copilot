import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Users, LayoutDashboard, Radio, Settings } from 'lucide-react';
import { usePersona } from '../../contexts/PersonaContext';
import { Persona } from '../../types';

const NAV_ITEMS: { label: string; path: string; persona: Persona; icon: React.FC<{ className?: string }> }[] = [
  { label: 'Fan Assistant', path: '/fan', persona: 'fan', icon: Users },
  { label: 'Staff Dashboard', path: '/staff', persona: 'staff', icon: LayoutDashboard },
  { label: 'Control Room', path: '/organizer', persona: 'organizer', icon: Radio },
];

export function NavBar(): JSX.Element {
  const location = useLocation();
  const { setPersona } = usePersona();

  return (
    <nav
      className="fixed top-0 left-0 right-0 z-50 bg-navy-900/95 backdrop-blur-glass border-b border-white/10"
      role="navigation"
      aria-label="Main navigation"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link
            to="/"
            className="flex items-center gap-3 group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-500 rounded-lg p-1"
            aria-label="MatchDay Copilot home"
          >
            <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-gold-500 to-gold-600 flex items-center justify-center text-navy-900 font-headline text-lg shadow-gold">
              ⚽
            </div>
            <div className="hidden sm:block">
              <span className="font-headline text-xl text-gold-gradient tracking-wide">
                MatchDay
              </span>
              <span className="font-headline text-xl text-white tracking-wide ml-1.5">
                Copilot
              </span>
            </div>
          </Link>

          {/* Navigation links */}
          <div className="flex items-center gap-1" role="list">
            {NAV_ITEMS.map(({ label, path, persona, icon: Icon }) => {
              const isActive = location.pathname === path;
              return (
                <Link
                  key={path}
                  to={path}
                  role="listitem"
                  onClick={() => setPersona(persona)}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-500 ${
                    isActive
                      ? 'bg-pitch-700/60 text-pitch-300 border border-pitch-600/40'
                      : 'text-white/70 hover:text-white hover:bg-white/10'
                  }`}
                  aria-current={isActive ? 'page' : undefined}
                >
                  <Icon className="w-4 h-4" aria-hidden="true" />
                  <span className="hidden md:inline">{label}</span>
                </Link>
              );
            })}
          </div>

          {/* Settings link */}
          <Link
            to="/settings"
            className="p-2 rounded-lg text-white/60 hover:text-white hover:bg-white/10 transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-500"
            aria-label="Accessibility settings"
          >
            <Settings className="w-5 h-5" aria-hidden="true" />
          </Link>
        </div>
      </div>
    </nav>
  );
}
