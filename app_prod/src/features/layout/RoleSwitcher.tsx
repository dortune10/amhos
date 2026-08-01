export type Role = 'caseworker' | 'facility' | 'district';

interface RoleSwitcherProps {
  role: Role;
  onChange: (role: Role) => void;
}

const ROLES: { id: Role; label: string }[] = [
  { id: 'caseworker', label: 'Caseworker' },
  { id: 'facility', label: 'Facility' },
  { id: 'district', label: 'District' },
];

export function RoleSwitcher({ role, onChange }: RoleSwitcherProps) {
  return (
    <nav className="role-switcher" role="tablist" aria-label="Role">
      {ROLES.map((r) => (
        <button
          key={r.id}
          type="button"
          role="tab"
          aria-selected={role === r.id}
          className={role === r.id ? 'active' : ''}
          onClick={() => onChange(r.id)}
        >
          {r.label}
        </button>
      ))}
    </nav>
  );
}
