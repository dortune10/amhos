import { useState } from 'react';
import './App.css';
import { CaseloadView } from './features/caseload/CaseloadView';
import { CheckInInbox } from './features/checkins/CheckInInbox';
import { DemoControls } from './features/demo/DemoControls';
import { DistrictView } from './features/district/DistrictView';
import { ReferralQueue } from './features/facility/ReferralQueue';
import { RoleSwitcher, type Role } from './features/layout/RoleSwitcher';
import { NotificationFeed } from './features/notifications/NotificationFeed';
import { PatientDetail } from './features/patient/PatientDetail';
import { RegistrationForm } from './features/registration/RegistrationForm';
import { SyncControls } from './features/sync/SyncControls';
import { VisitTaskList } from './features/visits/VisitTaskList';

function App() {
  const [role, setRole] = useState<Role>('caseworker');
  const [selectedPatientId, setSelectedPatientId] = useState<string | null>(null);

  return (
    <div className="app">
      <header className="app-header">
        <h1>AMHOS</h1>
        <p className="hackathon-note">
          Offline-first maternal care coordination — caseworkers, mothers, and partner
          hospitals on one pathway.
        </p>
        <div className="header-controls">
          <RoleSwitcher
            role={role}
            onChange={(next) => {
              setRole(next);
              setSelectedPatientId(null);
            }}
          />
          <DemoControls />
        </div>
      </header>
      <main>
        {role === 'caseworker' && (
          <div className="caseworker-view">
            <SyncControls />
            {selectedPatientId ? (
              <PatientDetail
                registrationId={selectedPatientId}
                onClose={() => setSelectedPatientId(null)}
              />
            ) : (
              <>
                <RegistrationForm onRegistered={() => {}} />
                <VisitTaskList />
                <CaseloadView onSelectPatient={setSelectedPatientId} />
                <CheckInInbox />
              </>
            )}
          </div>
        )}
        {role === 'facility' && (
          <div className="facility-view">
            <ReferralQueue />
            <NotificationFeed />
          </div>
        )}
        {role === 'district' && <DistrictView />}
      </main>
    </div>
  );
}

export default App;
