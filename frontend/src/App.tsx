import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { NavBar } from './components/shared/NavBar';
import { AccessibilityProvider } from './contexts/AccessibilityContext';
import { PersonaProvider } from './contexts/PersonaContext';
import { HomePage } from './pages/HomePage';
import { FanPage } from './pages/FanPage';
import { StaffPage } from './pages/StaffPage';
import { OrganizerPage } from './pages/OrganizerPage';
import { SettingsPage } from './pages/SettingsPage';

export default function App(): JSX.Element {
  return (
    <AccessibilityProvider>
      <PersonaProvider>
        <BrowserRouter>
          <a
            href="#main-content"
            className="sr-only focus:not-sr-only focus:fixed focus:top-20 focus:left-4 focus:z-[100] focus:bg-gold-500 focus:text-navy-900 focus:px-4 focus:py-2 focus:rounded-lg focus:font-semibold"
          >
            Skip to main content
          </a>
          <NavBar />
          <main id="main-content" tabIndex={-1}>
            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route path="/fan" element={<FanPage />} />
              <Route path="/staff" element={<StaffPage />} />
              <Route path="/organizer" element={<OrganizerPage />} />
              <Route path="/settings" element={<SettingsPage />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </main>
        </BrowserRouter>
      </PersonaProvider>
    </AccessibilityProvider>
  );
}
