import React, { createContext, useContext, useState, useCallback, ReactNode, useMemo } from "react";

// Context State Types
interface GithubRepoContextState {
  githubOwner: string;
  githubRepo: string;
}

// Context Actions
interface GithubRepoContextActions {
  setGithubOwner: (owner: string) => void;
  setGithubRepo: (repo: string) => void;
}

interface GithubRepoContextValue {
  state: GithubRepoContextState;
  actions: GithubRepoContextActions;
}

// Context
const GithubRepoContext = createContext<GithubRepoContextValue | undefined>(undefined);

// Backward compatibility context
const LegacyGithubRepoContext = createContext<GithubRepoContextType | undefined>(undefined);

// Provider Props
interface GithubRepoProviderProps {
  children: ReactNode;
  initialState?: Partial<GithubRepoContextState>;
}

// Provider Component
const GithubRepoProvider: React.FC<GithubRepoProviderProps> = ({
  children,
  initialState: providedInitialState
}) => {
  // Simple useState hooks instead of complex reducer
  const [githubOwner, setGithubOwnerState] = useState<string>(
    providedInitialState?.githubOwner || "roostergrin"
  );
  const [githubRepo, setGithubRepoState] = useState<string>(
    providedInitialState?.githubRepo || ""
  );

  // Action Creators with useCallback for performance
  const setGithubOwner = useCallback((owner: string) => {
    setGithubOwnerState(owner);
  }, []);

  const setGithubRepo = useCallback((repo: string) => {
    setGithubRepoState(repo);
  }, []);

  // Compose state and actions using useMemo for performance
  const state = useMemo((): GithubRepoContextState => ({
    githubOwner,
    githubRepo
  }), [githubOwner, githubRepo]);

  const actions = useMemo((): GithubRepoContextActions => ({
    setGithubOwner,
    setGithubRepo
  }), [setGithubOwner, setGithubRepo]);

  const value: GithubRepoContextValue = useMemo(() => ({
    state,
    actions
  }), [state, actions]);

  // Legacy value for backward compatibility
  const legacyValue: GithubRepoContextType = useMemo(() => ({
    githubOwner: state.githubOwner,
    setGithubOwner,
    githubRepo: state.githubRepo,
    setGithubRepo
  }), [state.githubOwner, state.githubRepo, setGithubOwner, setGithubRepo]);

  return (
    <GithubRepoContext.Provider value={value}>
      <LegacyGithubRepoContext.Provider value={legacyValue}>
        {children}
      </LegacyGithubRepoContext.Provider>
    </GithubRepoContext.Provider>
  );
};

// Custom Hook
export const useGithubRepo = (): GithubRepoContextValue => {
  const context = useContext(GithubRepoContext);
  if (context === undefined) {
    throw new Error('useGithubRepo must be used within a GithubRepoProvider');
  }
  return context;
};

// Legacy interface for backward compatibility
export interface GithubRepoContextType {
  githubOwner: string;
  setGithubOwner: (owner: string) => void;
  githubRepo: string;
  setGithubRepo: (repo: string) => void;
}

// Legacy context export for backward compatibility - this maintains old behavior
export { LegacyGithubRepoContext as GithubRepoContext };

export default GithubRepoProvider; 