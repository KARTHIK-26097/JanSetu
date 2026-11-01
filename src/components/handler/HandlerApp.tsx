import React, { useEffect, useState } from 'react';
import type { Report, ThemeMode, UserAccount } from '../../types';
import { getReports, subscribeToReports } from '../../services/storageService';
import { logout } from '../../services/authService';
import { Header } from '../common/Header';
import { HandlerAuthModal } from './HandlerAuthModal';
import { HandlerWorkbench } from './HandlerWorkbench';

export const HandlerApp: React.FC = () => {
  const [theme, setTheme] = useState<ThemeMode>(() => (localStorage.getItem('civicvoice_theme') as ThemeMode) || 'theme-white-orange');
  const [user, setUser] = useState<UserAccount | null>(null);
  const [showAuth, setShowAuth] = useState(true);
  const [reports, setReports] = useState<Report[]>(getReports);
  const loadReports = () => setReports(getReports());

  useEffect(() => subscribeToReports(loadReports), []);
  useEffect(() => {
    document.body.className = theme;
    localStorage.setItem('civicvoice_theme', theme);
  }, [theme]);

  const cancelSignIn = () => {
    logout();
    setUser(null);
    setShowAuth(false);
  };

  const handleLogout = () => {
    logout();
    setUser(null);
    setShowAuth(true);
  };

  const criticalCount = reports.filter((report) => report.severity === 'critical' && !['resolved', 'closed'].includes(report.status)).length;

  return <div className="app-container">
    <Header
      currentView="handler"
      currentLanguage="en"
      onOpenLanguageModal={() => {}}
      currentTheme={theme}
      onThemeChange={setTheme}
      authenticatedUser={user}
      onLogout={handleLogout}
      criticalCount={criticalCount}
      onProfileOpen={() => {}}
    />
    <main className="main-content" role="main">
      {user ? <HandlerWorkbench reports={reports} onReportsUpdated={loadReports} authenticatedUser={user} /> : <section className="card handler-portal-welcome"><h1>Handler Operations</h1><p>Sign in with an approved staff account to review and manage civic reports.</p><button type="button" className="btn btn-primary" onClick={() => setShowAuth(true)}>Staff sign in</button></section>}
    </main>
    <footer className="civic-app-footer"><strong>Civic Voice Operations</strong><span>•</span><span>Restricted staff portal</span></footer>
    {showAuth && <HandlerAuthModal onSuccess={(nextUser) => { setUser(nextUser); setShowAuth(false); }} onCancel={cancelSignIn} />}
  </div>;
};
