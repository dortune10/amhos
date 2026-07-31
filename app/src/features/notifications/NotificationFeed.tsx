import { cloudStore } from '../../data/store';
import { useStoreVersion } from '../../data/useStoreVersion';

export function NotificationFeed() {
  useStoreVersion();
  const { notifications } = cloudStore.getAll();
  // Notifications are always appended in creation order, so reversing gives
  // newest-first reliably -- sorting by createdAt alone is unsafe here since
  // two syncs can land the same millisecond timestamp.
  const facilityNotifications = notifications
    .filter((n) => n.targetRole === 'facility')
    .slice()
    .reverse();

  if (facilityNotifications.length === 0) {
    return <p className="empty-state">No notifications yet.</p>;
  }

  return (
    <div className="notification-feed">
      <h2>WhatsApp-style alerts</h2>
      <p className="mock-disclaimer">Simulated for the prototype — not a real WhatsApp integration.</p>
      <ul>
        {facilityNotifications.map((n) => (
          <li key={n.id} data-testid="notification-bubble" className="notification-bubble">
            {n.message}
          </li>
        ))}
      </ul>
    </div>
  );
}
