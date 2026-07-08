import React, { createContext, useContext, useState, ReactNode } from 'react';
import { Persona, UserContext } from '../types';

interface PersonaState {
  persona: Persona;
  userContext: UserContext;
  setPersona: (p: Persona) => void;
  setUserContext: (ctx: UserContext) => void;
  updateUserContext: (updates: Partial<UserContext>) => void;
}

const PersonaContext = createContext<PersonaState | null>(null);

export function PersonaProvider({ children }: { children: ReactNode }): JSX.Element {
  const [persona, setPersona] = useState<Persona>('fan');
  const [userContext, setUserContext] = useState<UserContext>({});

  return (
    <PersonaContext.Provider
      value={{
        persona,
        userContext,
        setPersona,
        setUserContext,
        updateUserContext: (updates) =>
          setUserContext((prev) => ({ ...prev, ...updates })),
      }}
    >
      {children}
    </PersonaContext.Provider>
  );
}

export function usePersona(): PersonaState {
  const ctx = useContext(PersonaContext);
  if (!ctx) throw new Error('usePersona must be used within PersonaProvider');
  return ctx;
}
