import { useState } from 'react';
import { useStoreVersion } from '../../data/useStoreVersion';
import { getPendingCount, syncNow } from './syncService';

export function SyncControls() {
  useStoreVersion();
  const [airplaneMode, setAirplaneMode] = useState(true);
  const pendingCount = getPendingCount();

  return (
    <div className="sync-controls">
      <label className="airplane-toggle">
        <input
          type="checkbox"
          checked={airplaneMode}
          onChange={() => setAirplaneMode((v) => !v)}
        />
        Airplane Mode
      </label>
      {airplaneMode && (
        <p className="offline-banner" role="status">
          Airplane Mode is on — registrations still save locally, but sync is paused.
        </p>
      )}
      <div className="sync-actions">
        <button type="button" onClick={() => syncNow()} disabled={airplaneMode || pendingCount === 0}>
          Sync Now
        </button>
        <span className="pending-count">{pendingCount} pending</span>
      </div>
    </div>
  );
}
