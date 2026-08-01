import { useState } from 'react';
import { loadDemoScenario, resetDemo } from './demoData';

export function DemoControls() {
  const [confirmingReset, setConfirmingReset] = useState(false);

  return (
    <div className="demo-controls">
      <span className="demo-label">Demo</span>
      {confirmingReset ? (
        <>
          <span className="demo-confirm-prompt">Clear all data?</span>
          <button
            type="button"
            className="demo-danger"
            onClick={() => {
              resetDemo();
              setConfirmingReset(false);
            }}
          >
            Confirm
          </button>
          <button type="button" onClick={() => setConfirmingReset(false)}>
            Cancel
          </button>
        </>
      ) : (
        <>
          <button type="button" onClick={() => loadDemoScenario()}>
            Load demo data
          </button>
          <button type="button" onClick={() => setConfirmingReset(true)}>
            Reset
          </button>
        </>
      )}
    </div>
  );
}
