import { createContext, useContext, useState, type ReactNode } from 'react';

export type Role = 'viewer' | 'editor';

type RoleContextValue = {
  role: Role;
  setRole: (r: Role) => void;
  isEditor: boolean;
};

const RoleContext = createContext<RoleContextValue | null>(null);

export function RoleProvider({ children }: { children: ReactNode }) {
  const [role, setRole] = useState<Role>('viewer');
  return (
    <RoleContext.Provider value={{ role, setRole, isEditor: role === 'editor' }}>
      {children}
    </RoleContext.Provider>
  );
}

export function useRole() {
  const ctx = useContext(RoleContext);
  if (!ctx) throw new Error('useRole must be used within RoleProvider');
  return ctx;
}
