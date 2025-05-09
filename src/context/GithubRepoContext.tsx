import React, { createContext, useState, ReactNode } from "react";

export interface GithubRepoContextType {
  githubOwner: string;
  setGithubOwner: (owner: string) => void;
  githubRepo: string;
  setGithubRepo: (repo: string) => void;
}

export const GithubRepoContext = createContext<GithubRepoContextType>({
  githubOwner: "roostergrin",
  setGithubOwner: () => {},
  githubRepo: "",
  setGithubRepo: () => {},
});

interface GithubRepoProviderProps {
  children: ReactNode;
}

const GithubRepoProvider: React.FC<GithubRepoProviderProps> = ({ children }) => {
  const [githubOwner, setGithubOwner] = useState<string>("roostergrin");
  const [githubRepo, setGithubRepo] = useState<string>("");

  return (
    <GithubRepoContext.Provider value={{ githubOwner, setGithubOwner, githubRepo, setGithubRepo }}>
      {children}
    </GithubRepoContext.Provider>
  );
};

export default GithubRepoProvider; 