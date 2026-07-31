import { useState } from 'react';
import './App.css';
import { CaseloadView } from './features/caseload/CaseloadView';
import { CheckInInbox } from './features/checkins/CheckInInbox';
import { ReferralQueue } from './features/facility/ReferralQueue';
import { RoleSwitcher, type Role } from './features/layout/RoleSwitcher';
import { NotificationFeed } from './features/notifications/NotificationFeed';
import { RegistrationForm } from './features/registration/RegistrationForm';
import { SyncControls } from './features/sync/SyncControls';

function App() {
  const [role, setRole] = useState<Role>('caseworker');

  return (
    <div className="app">
      <header className="app-header">
        <h1>AMHOS Prototype</h1>
        <p className="hackathon-note">
          Vibe Code Marathon demo — web prototype standing in for the real offline-first
          mobile client. See SPEC.md for scope.
        </p>
        <RoleSwitcher role={role} onChange={setRole} />
      </header>
      <main>
        {role === 'caseworker' && (
          <div className="caseworker-view">
            <SyncControls />
            <RegistrationForm onRegistered={() => {}} />
            <CaseloadView />
            <CheckInInbox />
          </div>
        )}
        {role === 'facility' && (
          <div className="facility-view">
            <ReferralQueue />
            <NotificationFeed />
          </div>
        )}
        {role === 'district' && (
          <p className="empty-state">District view coming soon.</p>
        )}
      </main>
    </div>
  );
}

export default App;
