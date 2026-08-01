import { useEffect, useState } from 'react';
import { subscribeToStoreChanges } from './store';

/**
 * Re-renders the calling component whenever either store is written to.
 * Components should read fresh data from the store on every render rather
 * than caching it in state — this hook only supplies the "please re-render"
 * signal.
 */
export function useStoreVersion(): number {
  const [version, setVersion] = useState(0);
  useEffect(() => subscribeToStoreChanges(() => setVersion((v) => v + 1)), []);
  return version;
}
